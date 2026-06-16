/* DocentIMS extra TinyMCE buttons — loaded via external_plugins as "docentextras".
 * Adds Print and a Plone-wired Save button + matching menu items. No premium deps. */
(function () {
  "use strict";
  if (!window.tinymce || !tinymce.PluginManager) { return; }

  tinymce.PluginManager.add("docentextras", function (editor) {

    /* ---- Print: render the editor content in a popup and print it ---- */
    function doPrint() {
      editor.save();
      var html = editor.getContent();
      var w = window.open("", "_blank", "width=900,height=700");
      if (!w) { window.print(); return; }   // popup blocked -> print the page
      w.document.write(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" +
        (document.title || "Print") + "</title></head><body>" + html + "</body></html>"
      );
      w.document.close(); w.focus();
      setTimeout(function () { try { w.print(); } catch (e) {} }, 250);
    }
    editor.ui.registry.addButton("print", { icon: "print", tooltip: "Print", onAction: doPrint });
    editor.ui.registry.addMenuItem("print", { icon: "print", text: "Print", onAction: doPrint });

    /* ---- Save: push content to the field, then trigger Plone's form save ---- */
    function doSave() {
      editor.save();   // sync editor HTML back into the underlying textarea
      var el = editor.getElement();
      var form = (el && el.closest) ? el.closest("form") : null;
      if (!form && el) { var p = el; while (p && p.tagName !== "FORM") { p = p.parentNode; } form = p; }
      if (!form) { return; }
      var btn = form.querySelector(
        '[name="form.buttons.save"], #form-buttons-save, [name="form.button.save"], button[name$=".save"]'
      );
      if (btn) { btn.click(); return; }
      if (typeof form.requestSubmit === "function") { form.requestSubmit(); } else { form.submit(); }
    }
    editor.ui.registry.addButton("save", { icon: "save", tooltip: "Save", onAction: doSave });
    editor.ui.registry.addMenuItem("save", { icon: "save", text: "Save", onAction: doSave });

    return { getMetadata: function () { return { name: "DocentIMS Extras" }; } };
  });
})();
