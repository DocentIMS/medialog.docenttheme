/* TinyMCE builder — DocentIMS / medialog.docenttheme
 *
 * Self-hosted, dependency-free. On @@tinymce-controlpanel it enhances:
 *   - the Toolbar field  -> drag-and-drop button builder
 *   - the Menubar field  -> checkboxes (which top menus appear)
 *   - the Menu field     -> per-menu drag-and-drop item builder
 * Each underlying form field stays the source of truth; every change writes
 * the same string/JSON Plone already expects, so the server side is unchanged.
 */
(function () {
  "use strict";

  var SEP = "~|~"; // payload delimiter for drag data (never in a label)

  function el(tag, cls, text){ var e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }
  function getDragAfter(zone, x){
    var chips = [].slice.call(zone.querySelectorAll(".tmce-chip:not(.dragging)"));
    var closest = { dist:-Infinity, el:null };
    chips.forEach(function(c){ var b=c.getBoundingClientRect(); var off=x-b.left-b.width/2; if(off<0&&off>closest.dist){closest={dist:off,el:c};} });
    return closest.el;
  }
  function tidy(tokens){
    var c=[]; tokens.forEach(function(t){ if(t==="|"&&(c.length===0||c[c.length-1]==="|"))return; c.push(t); });
    while(c.length&&c[c.length-1]==="|")c.pop(); return c;
  }
  function chip(token, label, removable){
    var ch=el("div","tmce-chip"+(token==="|"?" tmce-chip--sep":"")); ch.setAttribute("draggable","true"); ch.dataset.token=token;
    ch.appendChild(el("span",null,token==="|"?"|":label));
    if(removable){ var x=el("span","tmce-chip__x","×"); x.addEventListener("click",function(){var z=ch.parentNode; ch.remove(); if(z&&z.__sync)z.__sync();}); ch.appendChild(x); }
    return ch;
  }
  function wireZone(zone, sync){
    zone.__sync = sync;
    zone.addEventListener("dragover", function(ev){
      ev.preventDefault(); zone.classList.add("over");
      var after=getDragAfter(zone, ev.clientX), m=zone.__moving;
      if(m){ if(after==null) zone.appendChild(m); else zone.insertBefore(m, after); }
    });
    zone.addEventListener("dragleave", function(){ zone.classList.remove("over"); });
    zone.addEventListener("drop", function(ev){
      ev.preventDefault(); zone.classList.remove("over");
      var add=ev.dataTransfer.getData("text/tmce-add");
      if(add){ var parts=add.split(SEP); var ch=zoneChip(zone, parts[0], parts[1]); var after=getDragAfter(zone, ev.clientX); if(after==null)zone.appendChild(ch); else zone.insertBefore(ch, after); }
      zone.__sync();
    });
  }
  function zoneChip(zone, token, label){
    var ch=chip(token, label, true);
    ch.addEventListener("dragstart", function(ev){ ch.classList.add("dragging"); ev.dataTransfer.effectAllowed="move"; zone.__moving=ch; });
    ch.addEventListener("dragend", function(){ ch.classList.remove("dragging"); zone.__moving=null; zone.__sync(); });
    return ch;
  }
  function paletteChip(token, label){
    var ch=chip(token, label, false);
    ch.addEventListener("dragstart", function(ev){ ev.dataTransfer.setData("text/tmce-add", token+SEP+label); ev.dataTransfer.effectAllowed="copy"; });
    return ch;
  }
  function buildPalette(container, items, grouped){
    container.innerHTML="";
    if(grouped){
      var groups={}; Object.keys(items).forEach(function(t){ if(!pluginEnabled(t))return; var g=items[t][1]; (groups[g]=groups[g]||[]).push(t); });
      ["History","Formatting","Paragraph","Insert","Tools","More"].forEach(function(g){
        if(!groups[g])return; container.appendChild(el("div","tmce-pal__group",g));
        var row=el("div","tmce-pal__row"); groups[g].forEach(function(t){ row.appendChild(paletteChip(t, items[t][0])); }); container.appendChild(row);
      });
    } else {
      var row=el("div","tmce-pal__row");
      Object.keys(items).filter(pluginEnabled).sort(function(a,b){return items[a]<items[b]?-1:1;}).forEach(function(t){ row.appendChild(paletteChip(t, items[t])); });
      container.appendChild(row);
    }
  }

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
    visualblocks:["Show blocks","Tools"], visualchars:["Show invisibles","Tools"], wordcount:["Word count","Tools"], help:["Help","Tools"]
  };
  var MENUITEMS = {
    undo:"Undo", redo:"Redo", cut:"Cut", copy:"Copy", paste:"Paste", pastetext:"Paste as text", selectall:"Select all",
    searchreplace:"Find & replace", link:"Link", openlink:"Open link", media:"Media", image:"Image", hr:"Horizontal rule",
    accordion:"Accordion", charmap:"Special character", emoticons:"Emoji", insertdatetime:"Date/time", anchor:"Anchor",
    pagebreak:"Page break", nonbreaking:"Nonbreaking space", visualaid:"Visual aids", visualchars:"Show invisibles",
    visualblocks:"Show blocks", preview:"Preview", fullscreen:"Fullscreen", code:"Source code",
    bold:"Bold", italic:"Italic", underline:"Underline", strikethrough:"Strikethrough", superscript:"Superscript",
    subscript:"Subscript", formats:"Formats", removeformat:"Clear formatting", forecolor:"Text colour", backcolor:"Highlight",
    lineheight:"Line height", inserttable:"Insert table", tableprops:"Table properties", deletetable:"Delete table",
    cell:"Cell", row:"Row", column:"Column", wordcount:"Word count", spellchecker:"Spell check"
  };
  var MENUS=["edit","insert","view","format","table","tools","help"];
  var TITLES={edit:"Edit",insert:"Insert",view:"View",format:"Format",table:"Table",tools:"Tools",help:"Help"};

  /* Which plugin provides each token. null/undefined => core or Plone-custom
     (always available). A token mapped to a plugin only appears in the palette
     when that plugin is ticked in the "Editor plugins" list. */
  var PLUGIN_OF = {
    bullist:"lists", numlist:"lists", ltr:"directionality", rtl:"directionality",
    link:"link", unlink:"link", openlink:"link", image:"image", media:"media",
    inserttable:"table", tableprops:"table", deletetable:"table", cell:"table", row:"table", column:"table",
    accordion:"accordion", charmap:"charmap", emoticons:"emoticons", pagebreak:"pagebreak",
    insertdatetime:"insertdatetime", anchor:"anchor", nonbreaking:"nonbreaking",
    searchreplace:"searchreplace", code:"code", preview:"preview", fullscreen:"fullscreen",
    visualblocks:"visualblocks", visualchars:"visualchars", wordcount:"wordcount", help:"help"
  };
  function enabledPlugins(){
    var set={};
    [].forEach.call(document.querySelectorAll('input[type="checkbox"][name*="plugins" i]'),
      function(c){ if(c.checked) set[c.value]=true; });
    return set;
  }
  function pluginEnabled(token){
    var p=PLUGIN_OF[token];
    if(!p) return true;              // core / Plone-custom -> always offered
    return !!enabledPlugins()[p];
  }

  /* 1) Toolbar field */
  function enhanceToolbar(ta){
    if(ta.__tmceMounted)return; ta.__tmceMounted=true; ta.style.display="none";
    var root=el("div","tmce-builder"); root.appendChild(el("div","tmce-builder__head","Toolbar — drag buttons in, reorder, × to remove"));
    var body=el("div","tmce-builder__body"); root.appendChild(body);
    var pal=el("div","tmce-pal"); body.appendChild(pal);
    var right=el("div"); var zone=el("div","tmce-zone"); right.appendChild(zone);
    var actions=el("div","tmce-actions"); var bSep=el("button",null,"+ Separator"); bSep.type="button"; var bClr=el("button",null,"Clear"); bClr.type="button";
    actions.appendChild(bSep); actions.appendChild(bClr); right.appendChild(actions); body.appendChild(right);
    ta.parentNode.insertBefore(root, ta.nextSibling);
    wireZone(zone, function(){ ta.value=tidy([].map.call(zone.children,function(c){return c.dataset.token;})).join(" "); });
    buildPalette(pal, TOOLBAR, true);
    document.addEventListener("tmce:plugins", function(){
      buildPalette(pal, TOOLBAR, true);
      [].slice.call(zone.children).forEach(function(c){ var t=c.dataset.token; if(t!=="|" && !pluginEnabled(t)) c.remove(); });
      zone.__sync();
    });
    (ta.value||"").split(/\s+/).filter(Boolean).forEach(function(t){ zone.appendChild(zoneChip(zone, t, (TOOLBAR[t]&&TOOLBAR[t][0])||t)); });
    bSep.addEventListener("click",function(){ zone.appendChild(zoneChip(zone,"|","|")); zone.__sync(); });
    bClr.addEventListener("click",function(){ zone.innerHTML=""; zone.__sync(); });
    zone.__sync();
  }

  /* 2) Menubar field (text input) -> checkboxes */
  function enhanceMenubar(input){
    if(input.__tmceMounted)return; input.__tmceMounted=true; input.style.display="none";
    var have=(input.value||"").split(/\s+/).filter(Boolean);
    var root=el("div","tmce-builder"); root.appendChild(el("div","tmce-builder__head","Menubar — which top menus appear"));
    var body=el("div","tmce-builder__body tmce-builder__body--plain"); root.appendChild(body);
    var checks=el("div","tmce-checks"); body.appendChild(checks);
    input.parentNode.insertBefore(root, input.nextSibling);
    function sync(){ input.value=MENUS.filter(function(m){return document.getElementById("tmce_mb_"+m).checked;}).join(" "); document.dispatchEvent(new CustomEvent("tmce:menubar")); }
    MENUS.forEach(function(m){
      var l=el("label"); var c=el("input"); c.type="checkbox"; c.id="tmce_mb_"+m; c.checked=have.indexOf(m)>-1; c.addEventListener("change",sync);
      l.appendChild(c); l.appendChild(document.createTextNode(" "+TITLES[m])); checks.appendChild(l);
    });
    sync();
  }

  /* 3) Menu field (JSON textarea) -> per-menu builder */
  function enhanceMenu(ta){
    if(ta.__tmceMounted)return; ta.__tmceMounted=true; ta.style.display="none";
    var model={};
    try { var data=JSON.parse(ta.value||"{}"); Object.keys(data).forEach(function(k){ model[k]={title:(data[k]&&data[k].title)||TITLES[k]||k, items:((data[k]&&data[k].items)||"").split(/\s+/).filter(Boolean)}; }); } catch(e){ model={}; }
    var active=null;
    var root=el("div","tmce-builder"); root.appendChild(el("div","tmce-builder__head","Menus — pick a menu, drag items into it"));
    var body=el("div","tmce-builder__body"); root.appendChild(body);
    var pal=el("div","tmce-pal"); body.appendChild(pal);
    var right=el("div");
    var tabs=el("div","tmce-menutabs"); right.appendChild(tabs);
    var zone=el("div","tmce-zone"); right.appendChild(zone);
    var actions=el("div","tmce-actions"); var bSep=el("button",null,"+ Separator"); bSep.type="button"; var bClr=el("button",null,"Clear menu"); bClr.type="button";
    actions.appendChild(bSep); actions.appendChild(bClr); right.appendChild(actions);
    body.appendChild(right);
    ta.parentNode.insertBefore(root, ta.nextSibling);

    buildPalette(pal, MENUITEMS, false);
    document.addEventListener("tmce:plugins", function(){
      buildPalette(pal, MENUITEMS, false);
      Object.keys(model).forEach(function(m){ model[m].items=(model[m].items||[]).filter(function(t){ return t==="|" || pluginEnabled(t); }); });
      loadZone(); serialize();
    });

    function saveZone(){ if(active){ model[active]=model[active]||{title:TITLES[active],items:[]}; model[active].items=tidy([].map.call(zone.children,function(c){return c.dataset.token;})); } }
    function serialize(){ saveZone(); var out={}; MENUS.forEach(function(m){ if(model[m]) out[m]={title:model[m].title||TITLES[m], items:tidy(model[m].items||[]).join(" ")}; }); ta.value=JSON.stringify(out,null,2); }
    function loadZone(){ zone.innerHTML=""; ((model[active]&&model[active].items)||[]).forEach(function(t){ zone.appendChild(zoneChip(zone, t, MENUITEMS[t]||t)); }); }
    wireZone(zone, serialize);

    function enabledMenus(){
      var mb=document.querySelector('input[id*="menubar" i], input[name*="menubar" i]');
      var vals=mb?(mb.value||"").split(/\s+/).filter(Boolean):[];
      var list=MENUS.filter(function(m){return vals.indexOf(m)>-1;});
      return list.length?list:MENUS.slice();
    }
    function buildTabs(){
      tabs.innerHTML="";
      enabledMenus().forEach(function(m){
        var t=el("div","tmce-menutab"+(m===active?" active":""), TITLES[m]);
        t.addEventListener("click", function(){ saveZone(); active=m; if(!model[m])model[m]={title:TITLES[m],items:[]}; buildTabs(); loadZone(); serialize(); });
        tabs.appendChild(t);
      });
    }
    active = enabledMenus()[0] || "tools";
    if(!model[active]) model[active]={title:TITLES[active],items:[]};
    buildTabs(); loadZone();
    document.addEventListener("tmce:menubar", function(){
      var en=enabledMenus();
      if(en.indexOf(active)<0){ saveZone(); active=en[0]||"tools"; if(!model[active])model[active]={title:TITLES[active],items:[]}; loadZone(); serialize(); }
      buildTabs();
    });
    bSep.addEventListener("click",function(){ zone.appendChild(zoneChip(zone,"|","|")); serialize(); });
    bClr.addEventListener("click",function(){ zone.innerHTML=""; serialize(); });
    serialize();
  }

  function boot(){
    if(!/tinymce-controlpanel/.test(location.href)) return;
    var tb=document.querySelector('textarea[id*="toolbar" i], textarea[name*="toolbar" i]'); if(tb) enhanceToolbar(tb);
    var mb=document.querySelector('input[id*="menubar" i], input[name*="menubar" i]'); if(mb) enhanceMenubar(mb);
    var menu=null;
    [].forEach.call(document.querySelectorAll('textarea'), function(t){ var id=(t.id||"")+" "+(t.name||""); if(/menu/i.test(id) && !/menubar/i.test(id) && !menu) menu=t; });
    if(menu) enhanceMenu(menu);
    // When an Editor-plugins checkbox is toggled, refresh the palettes.
    [].forEach.call(document.querySelectorAll('input[type="checkbox"][name*="plugins" i]'), function(c){
      c.addEventListener("change", function(){ document.dispatchEvent(new CustomEvent("tmce:plugins")); });
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
