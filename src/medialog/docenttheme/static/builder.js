/* TinyMCE builder — DocentIMS / medialog.docenttheme
 *
 * Self-hosted, dependency-free. Two jobs:
 *  A) On ANY page where TinyMCE is already open (content edit pages), read the
 *     real button/menu-item/icon registry once and cache it (localStorage),
 *     re-reading only if the plugin set changed. No extra editor is spawned.
 *  B) On @@tinymce-controlpanel, enhance the Toolbar / Menubar / Menu fields
 *     into drag-and-drop builders, using the cached real catalog (real icons,
 *     exactly the site's buttons incl. custom plugins). Falls back to a curated
 *     list if nothing has been captured yet — never broken.
 */
(function () {
  "use strict";
  var SEP = "~|~";
  var CACHE_KEY = "tmceBuilderCatalog";

  function el(tag, cls, text){ var e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }
  function getDragAfter(zone, x){
    var chips=[].slice.call(zone.querySelectorAll(".tmce-chip:not(.dragging)")), closest={dist:-Infinity,el:null};
    chips.forEach(function(c){ var b=c.getBoundingClientRect(); var off=x-b.left-b.width/2; if(off<0&&off>closest.dist){closest={dist:off,el:c};} });
    return closest.el;
  }
  function tidy(tokens){ var c=[]; tokens.forEach(function(t){ if(t==="|"&&(c.length===0||c[c.length-1]==="|"))return; c.push(t); }); while(c.length&&c[c.length-1]==="|")c.pop(); return c; }

  /* ---- curated fallback (labels only) + grouping + plugin map ---- */
  var TOOLBAR = {
    undo:["Undo","History"], redo:["Redo","History"],
    styles:["Styles","Formatting"], blocks:["Paragraph format","Formatting"], fontfamily:["Font","Formatting"], fontsize:["Font size","Formatting"],
    bold:["Bold","Formatting"], italic:["Italic","Formatting"], underline:["Underline","Formatting"], strikethrough:["Strikethrough","Formatting"],
    superscript:["Superscript","Formatting"], subscript:["Subscript","Formatting"], forecolor:["Text colour","Formatting"], backcolor:["Highlight","Formatting"], removeformat:["Clear formatting","Formatting"],
    alignleft:["Align left","Paragraph"], aligncenter:["Align centre","Paragraph"], alignright:["Align right","Paragraph"], alignjustify:["Justify","Paragraph"],
    bullist:["Bullet list","Paragraph"], numlist:["Numbered list","Paragraph"], outdent:["Decrease indent","Paragraph"], indent:["Increase indent","Paragraph"],
    blockquote:["Blockquote","Paragraph"], ltr:["Left-to-right","Paragraph"], rtl:["Right-to-left","Paragraph"],
    plonelink:["Link (Plone)","Insert"], ploneimage:["Image (Plone)","Insert"], link:["Link","Insert"], unlink:["Unlink","Insert"], image:["Image","Insert"],
    media:["Media","Insert"], inserttable:["Table","Insert"], accordion:["Accordion","Insert"], charmap:["Special character","Insert"], emoticons:["Emoji","Insert"],
    hr:["Horizontal rule","Insert"], pagebreak:["Page break","Insert"], insertdatetime:["Date/time","Insert"], anchor:["Anchor","Insert"],
    searchreplace:["Find & replace","Tools"], code:["Source code","Tools"], preview:["Preview","Tools"], fullscreen:["Fullscreen","Tools"],
    visualblocks:["Show blocks","Tools"], visualchars:["Show invisibles","Tools"], wordcount:["Word count","Tools"], help:["Help","Tools"],
    print:["Print","Tools"], save:["Save","Tools"]
  };
  var MENUITEMS_FB = {
    undo:"Undo", redo:"Redo", cut:"Cut", copy:"Copy", paste:"Paste", pastetext:"Paste as text", selectall:"Select all",
    searchreplace:"Find & replace", link:"Link", openlink:"Open link", media:"Media", image:"Image", hr:"Horizontal rule",
    accordion:"Accordion", charmap:"Special character", emoticons:"Emoji", insertdatetime:"Date/time", anchor:"Anchor",
    pagebreak:"Page break", nonbreaking:"Nonbreaking space", visualaid:"Visual aids", visualchars:"Show invisibles",
    visualblocks:"Show blocks", preview:"Preview", fullscreen:"Fullscreen", code:"Source code",
    bold:"Bold", italic:"Italic", underline:"Underline", strikethrough:"Strikethrough", superscript:"Superscript",
    subscript:"Subscript", formats:"Formats", removeformat:"Clear formatting", forecolor:"Text colour", backcolor:"Highlight",
    lineheight:"Line height", inserttable:"Insert table", tableprops:"Table properties", deletetable:"Delete table",
    cell:"Cell", row:"Row", column:"Column", wordcount:"Word count", spellchecker:"Spell check",
    print:"Print", save:"Save"
  };
  var MENUS=["edit","insert","view","format","table","tools","help"];
  var TITLES={edit:"Edit",insert:"Insert",view:"View",format:"Format",table:"Table",tools:"Tools",help:"Help"};
  function groupOf(t){ return TOOLBAR[t] ? TOOLBAR[t][1] : "More"; }

  var PLUGIN_OF = {
    bullist:"lists", numlist:"lists", ltr:"directionality", rtl:"directionality",
    link:"link", unlink:"link", openlink:"link", image:"image", media:"media",
    inserttable:"table", tableprops:"table", deletetable:"table", cell:"table", row:"table", column:"table",
    accordion:"accordion", charmap:"charmap", emoticons:"emoticons", pagebreak:"pagebreak",
    insertdatetime:"insertdatetime", anchor:"anchor", nonbreaking:"nonbreaking",
    searchreplace:"searchreplace", code:"code", preview:"preview", fullscreen:"fullscreen",
    visualblocks:"visualblocks", visualchars:"visualchars", wordcount:"wordcount", help:"help"
  };
  function enabledPlugins(){ var s={}; [].forEach.call(document.querySelectorAll('input[type="checkbox"][name*="plugins" i]'), function(c){ if(c.checked) s[c.value]=true; }); return s; }
  function pluginEnabled(token){ var p=PLUGIN_OF[token]; if(!p) return true; return !!enabledPlugins()[p]; }

  /* ---- A) capture the real registry from an already-open editor ---- */
  function signatureOf(reg){ return Object.keys(reg.buttons||{}).sort().join(","); }
  function editorsList(){
    var t=window.tinymce; if(!t) return [];
    try { if(typeof t.get==="function"){ var g=t.get(); if(g && g.length) return [].slice.call(g); } } catch(e){}
    if(t.editors && t.editors.length) return [].slice.call(t.editors);
    if(t.activeEditor) return [t.activeEditor];
    return [];
  }
  function captureFrom(ed){
    if(!ed || !ed.ui || !ed.ui.registry || typeof ed.ui.registry.getAll!=="function") return false;
    var reg=ed.ui.registry.getAll(); if(!reg || !reg.buttons) return false;
    var sig=signatureOf(reg);
    try { var ex=JSON.parse(localStorage.getItem(CACHE_KEY)||"null"); if(ex && ex.sig===sig) return true; } catch(e){}
    var data={sig:sig, buttons:{}, menuItems:{}, icons:reg.icons||{}};
    Object.keys(reg.buttons||{}).forEach(function(n){ var b=reg.buttons[n]||{}; data.buttons[n]={label:b.tooltip||b.text||n, icon:b.icon||n}; });
    Object.keys(reg.menuItems||{}).forEach(function(n){ var m=reg.menuItems[n]||{}; data.menuItems[n]={label:m.text||m.tooltip||n, icon:m.icon||n}; });
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(e){}
    return true;
  }
  function capture(){ var eds=editorsList(); for(var i=0;i<eds.length;i++){ if(captureFrom(eds[i])) return true; } return false; }
  var _hooked=false;
  function hookInit(){
    var t=window.tinymce; if(!t || _hooked || typeof t.on!=="function") return; _hooked=true;
    try { t.on("AddEditor", function(e){ var ed=e&&e.editor; if(ed && typeof ed.on==="function") ed.on("init", function(){ capture(); }); }); } catch(err){}
  }
  function pollCapture(n){ n=n||0; hookInit(); if(capture()) return; if(n<60) setTimeout(function(){ pollCapture(n+1); }, 500); }
  function discovered(){ try { return JSON.parse(localStorage.getItem(CACHE_KEY)||"null"); } catch(e){ return null; } }
  function haveDiscovery(){ var d=discovered(); return !!(d && d.buttons && Object.keys(d.buttons).length); }

  /* catalog used by the palette: prefer discovered (real label+icon), else curated */
  /* Palettes are driven by the CURATED lists (clean, each token once, sensible
     grouping). Real icons are pulled from the discovered registry by the
     button/menu-item's icon name; falls back to no icon until discovery runs. */
  /* Palettes are driven by the CURATED lists, but once we've captured the real
     registry we ALSO hide any curated token the editor doesn't actually register
     (dead tokens like spellchecker, or toolbar-only items in the menu palette).
     Our own custom buttons (print/save) are always offered. */
  var CUSTOM = { print:1, save:1 };
  // Bespoke selects (Styles, Paragraph format, Font, Font size, Line height,
  // Align) register as nested menu items, NOT registry.buttons — so never
  // filter them out of the toolbar palette.
  var ALWAYS_TB = { print:1, save:1, styles:1, blocks:1, fontfamily:1, fontsize:1, align:1, lineheight:1 };
  function toolbarItems(){
    var d=discovered(), icons=(d&&d.icons)||{}, dbtn=(d&&d.buttons)||{}, dmi=(d&&d.menuItems)||{}, out={};
    var filter = !!(d && (d.buttons || d.menuItems));
    Object.keys(TOOLBAR).forEach(function(t){
      if(filter && !dbtn[t] && !dmi[t] && !ALWAYS_TB[t]) return;
      var iname=(dbtn[t]&&dbtn[t].icon)||(dmi[t]&&dmi[t].icon)||t;
      out[t]={label:TOOLBAR[t][0], group:TOOLBAR[t][1], icon:icons[iname]||icons[t]||""};
    });
    return out;
  }
  function menuItems(){
    var d=discovered(), icons=(d&&d.icons)||{}, dmi=(d&&d.menuItems)||{}, out={};
    var filter = !!(d && d.menuItems);
    Object.keys(MENUITEMS_FB).forEach(function(t){
      if(filter && !dmi[t] && !CUSTOM[t]) return;
      var iname=dmi[t]?dmi[t].icon:t;
      out[t]={label:MENUITEMS_FB[t], icon:icons[iname]||icons[t]||""};
    });
    return out;
  }

  function chip(token, info, removable){
    info=info||{label:token,icon:""};
    var ch=el("div","tmce-chip"+(token==="|"?" tmce-chip--sep":"")); ch.setAttribute("draggable","true"); ch.dataset.token=token;
    if(token==="|"){ ch.appendChild(el("span",null,"|")); }
    else { if(info.icon){ var ic=el("span","tmce-chip__ic"); ic.innerHTML=info.icon; ch.appendChild(ic); } ch.appendChild(el("span",null,info.label||token)); }
    if(removable){ var x=el("span","tmce-chip__x","×"); x.addEventListener("click",function(){ var z=ch.parentNode; ch.remove(); if(z&&z.__sync)z.__sync(); }); ch.appendChild(x); }
    return ch;
  }
  function zoneChip(zone, token){ var ch=chip(token, zone.__cat?zone.__cat()[token]:null, true);
    ch.addEventListener("dragstart", function(ev){ ch.classList.add("dragging"); ev.dataTransfer.effectAllowed="move"; zone.__moving=ch; });
    ch.addEventListener("dragend", function(){ ch.classList.remove("dragging"); zone.__moving=null; zone.__sync(); });
    return ch;
  }
  function paletteChip(token, info){ var ch=chip(token, info, false);
    ch.addEventListener("dragstart", function(ev){ ev.dataTransfer.setData("text/tmce-add", token); ev.dataTransfer.effectAllowed="copy"; });
    return ch;
  }
  function wireZone(zone, catFn, sync){
    zone.__cat=catFn; zone.__sync=sync;
    zone.addEventListener("dragover", function(ev){ ev.preventDefault(); zone.classList.add("over"); var a=getDragAfter(zone,ev.clientX), m=zone.__moving; if(m){ if(a==null)zone.appendChild(m); else zone.insertBefore(m,a); } });
    zone.addEventListener("dragleave", function(){ zone.classList.remove("over"); });
    zone.addEventListener("drop", function(ev){ ev.preventDefault(); zone.classList.remove("over"); var t=ev.dataTransfer.getData("text/tmce-add"); if(t){ var ch=zoneChip(zone,t); var a=getDragAfter(zone,ev.clientX); if(a==null)zone.appendChild(ch); else zone.insertBefore(ch,a); } zone.__sync(); });
  }
  function buildPalette(container, items, grouped, exclude){
    exclude=exclude||{};
    container.innerHTML="";
    if(grouped){
      var groups={}; Object.keys(items).forEach(function(t){ if(!pluginEnabled(t)||exclude[t])return; (groups[items[t].group]=groups[items[t].group]||[]).push(t); });
      ["History","Formatting","Paragraph","Insert","Tools","More"].forEach(function(g){
        if(!groups[g])return; container.appendChild(el("div","tmce-pal__group",g));
        var row=el("div","tmce-pal__row"); groups[g].sort().forEach(function(t){ row.appendChild(paletteChip(t, items[t])); }); container.appendChild(row);
      });
    } else {
      var row=el("div","tmce-pal__row");
      Object.keys(items).filter(function(t){ return pluginEnabled(t)&&!exclude[t]; }).sort(function(a,b){ return items[a].label<items[b].label?-1:1; }).forEach(function(t){ row.appendChild(paletteChip(t, items[t])); });
      container.appendChild(row);
    }
  }
  function zoneTokenSet(zone){ var s={}; [].forEach.call(zone.children,function(c){ if(c.dataset.token!=="|") s[c.dataset.token]=true; }); return s; }

  function head(root, text){
    var note = haveDiscovery() ? "" : " (icons load after you open a content editor once)";
    var h=el("div","tmce-builder__head", text+note);
    var r=el("span","tmce-refresh","↻ refresh"); r.title="Re-read icons next time you open a content editor";
    r.addEventListener("click", function(){ try{ localStorage.removeItem(CACHE_KEY); }catch(e){} location.reload(); });
    h.appendChild(r); root.appendChild(h);
  }

  /* ---- B) control-panel field enhancers ---- */
  function enhanceToolbar(ta){
    if(ta.__tmceMounted)return; ta.__tmceMounted=true; ta.style.display="none";
    var root=el("div","tmce-builder"); head(root,"Toolbar — drag buttons in, reorder, × to remove");
    var body=el("div","tmce-builder__body"); root.appendChild(body);
    var pal=el("div","tmce-pal"); body.appendChild(pal);
    var right=el("div"); var zone=el("div","tmce-zone"); right.appendChild(zone);
    var actions=el("div","tmce-actions"); var bSep=el("button",null,"+ Separator"); bSep.type="button"; var bClr=el("button",null,"Clear"); bClr.type="button";
    actions.appendChild(bSep); actions.appendChild(bClr); right.appendChild(actions); body.appendChild(right);
    ta.parentNode.insertBefore(root, ta.nextSibling);
    function refreshPal(){ buildPalette(pal, toolbarItems(), true, zoneTokenSet(zone)); }
    wireZone(zone, toolbarItems, function(){ ta.value=tidy([].map.call(zone.children,function(c){return c.dataset.token;})).join(" "); refreshPal(); });
    (ta.value||"").split(/\s+/).filter(Boolean).forEach(function(t){ zone.appendChild(zoneChip(zone, t)); });
    bSep.addEventListener("click",function(){ zone.appendChild(zoneChip(zone,"|")); zone.__sync(); });
    bClr.addEventListener("click",function(){ zone.innerHTML=""; zone.__sync(); });
    document.addEventListener("tmce:plugins", function(){
      [].slice.call(zone.children).forEach(function(c){ var t=c.dataset.token; if(t!=="|" && !pluginEnabled(t)) c.remove(); });
      zone.__sync();
    });
    zone.__sync();
  }

  function enhanceMenubar(input){
    if(input.__tmceMounted)return; input.__tmceMounted=true; input.style.display="none";
    var have=(input.value||"").split(/\s+/).filter(Boolean);
    var root=el("div","tmce-builder"); root.appendChild(el("div","tmce-builder__head","Menubar — which top menus appear"));
    var body=el("div","tmce-builder__body tmce-builder__body--plain"); root.appendChild(body);
    var checks=el("div","tmce-checks"); body.appendChild(checks);
    input.parentNode.insertBefore(root, input.nextSibling);
    function sync(){ input.value=MENUS.filter(function(m){return document.getElementById("tmce_mb_"+m).checked;}).join(" "); document.dispatchEvent(new CustomEvent("tmce:menubar")); }
    MENUS.forEach(function(m){ var l=el("label"); var c=el("input"); c.type="checkbox"; c.id="tmce_mb_"+m; c.checked=have.indexOf(m)>-1; c.addEventListener("change",sync); l.appendChild(c); l.appendChild(document.createTextNode(" "+TITLES[m])); checks.appendChild(l); });
    sync();
  }

  function enhanceMenu(ta){
    if(ta.__tmceMounted)return; ta.__tmceMounted=true; ta.style.display="none";
    var model={};
    try { var data=JSON.parse(ta.value||"{}"); Object.keys(data).forEach(function(k){ model[k]={title:(data[k]&&data[k].title)||TITLES[k]||k, items:((data[k]&&data[k].items)||"").split(/\s+/).filter(Boolean)}; }); } catch(e){ model={}; }
    var active=null;
    var root=el("div","tmce-builder"); head(root,"Menus — pick a menu, drag items into it");
    var body=el("div","tmce-builder__body"); root.appendChild(body);
    var pal=el("div","tmce-pal"); body.appendChild(pal);
    var right=el("div"); var tabs=el("div","tmce-menutabs"); right.appendChild(tabs);
    var zone=el("div","tmce-zone"); right.appendChild(zone);
    var actions=el("div","tmce-actions"); var bSep=el("button",null,"+ Separator"); bSep.type="button"; var bClr=el("button",null,"Clear menu"); bClr.type="button";
    actions.appendChild(bSep); actions.appendChild(bClr); right.appendChild(actions); body.appendChild(right);
    ta.parentNode.insertBefore(root, ta.nextSibling);

    function refreshPal(){ buildPalette(pal, menuItems(), false, zoneTokenSet(zone)); }
    function saveZone(){ if(active){ model[active]=model[active]||{title:TITLES[active],items:[]}; model[active].items=tidy([].map.call(zone.children,function(c){return c.dataset.token;})); } }
    function serialize(){ saveZone(); var out={}; MENUS.forEach(function(m){ if(model[m]) out[m]={title:model[m].title||TITLES[m], items:tidy(model[m].items||[]).join(" ")}; }); ta.value=JSON.stringify(out,null,2); refreshPal(); }
    function loadZone(){ zone.innerHTML=""; ((model[active]&&model[active].items)||[]).forEach(function(t){ zone.appendChild(zoneChip(zone, t)); }); refreshPal(); }
    wireZone(zone, menuItems, serialize);

    function enabledMenus(){ var mb=document.querySelector('input[id*="menubar" i], input[name*="menubar" i]'); var v=mb?(mb.value||"").split(/\s+/).filter(Boolean):[]; var l=MENUS.filter(function(m){return v.indexOf(m)>-1;}); return l.length?l:MENUS.slice(); }
    function buildTabs(){ tabs.innerHTML=""; enabledMenus().forEach(function(m){ var t=el("div","tmce-menutab"+(m===active?" active":""), TITLES[m]); t.addEventListener("click", function(){ saveZone(); active=m; if(!model[m])model[m]={title:TITLES[m],items:[]}; buildTabs(); loadZone(); serialize(); }); tabs.appendChild(t); }); }
    active = enabledMenus()[0] || "tools"; if(!model[active]) model[active]={title:TITLES[active],items:[]};
    buildTabs(); loadZone();
    document.addEventListener("tmce:menubar", function(){ var en=enabledMenus(); if(en.indexOf(active)<0){ saveZone(); active=en[0]||"tools"; if(!model[active])model[active]={title:TITLES[active],items:[]}; loadZone(); serialize(); } buildTabs(); });
    document.addEventListener("tmce:plugins", function(){ Object.keys(model).forEach(function(m){ model[m].items=(model[m].items||[]).filter(function(t){ return t==="|" || pluginEnabled(t); }); }); loadZone(); serialize(); });
    bSep.addEventListener("click",function(){ zone.appendChild(zoneChip(zone,"|")); serialize(); });
    bClr.addEventListener("click",function(){ zone.innerHTML=""; serialize(); });
    serialize();
  }

  function boot(){
    pollCapture();                                  // job A — runs on any page; cheap, cached
    if(!/tinymce-controlpanel/.test(location.href)) return;   // job B — control panel only
    var tb=document.querySelector('textarea[id*="toolbar" i], textarea[name*="toolbar" i]'); if(tb) enhanceToolbar(tb);
    var mb=document.querySelector('input[id*="menubar" i], input[name*="menubar" i]'); if(mb) enhanceMenubar(mb);
    var menu=null;
    [].forEach.call(document.querySelectorAll('textarea'), function(t){ var id=(t.id||"")+" "+(t.name||""); if(/menu/i.test(id) && !/menubar/i.test(id) && !menu) menu=t; });
    if(menu) enhanceMenu(menu);
    [].forEach.call(document.querySelectorAll('input[type="checkbox"][name*="plugins" i]'), function(c){ c.addEventListener("change", function(){ document.dispatchEvent(new CustomEvent("tmce:plugins")); }); });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
