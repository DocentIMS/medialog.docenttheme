Changelog
=========


1.0a1 (unreleased)
------------------

- Put ``production-css`` back. It is Products.CMFPlone, not plone.app.theming,
  that adds it to every page (last in ``<head>``): without it the toolbar and
  the page frame lose their stylesheet. The TinyMCE toolbar and menubar inside
  ``#content-core`` get their own measurements back instead of the Editorial
  3.5em outlined-button treatment. [docentims]

- Stop linking ``styles/theme.min.css`` on every page. Plone 6 never loaded
  it (``production-css`` is read by plone.app.theming 7 and then unused),
  so the site has always been styled by DocentIMS.ActionItems'
  ``action_items.css`` plus ``add_form.css`` and ``docent_dialogs.css``;
  linking the theme stylesheet drew every button inside ``#content-core``
  as a 3.5em outlined box, TinyMCE's toolbar included. ``theme.min.css``
  remains the editor's content stylesheet (``tinymce-content-css``), and
  its editing area is white again rather than the page ground. [docentims]
  The still-needed tint on add and edit forms is the pale rose it was
  (``--docent-needed``), not the error red.

- The standard Docent theme. Inter for all text (self-hosted variable
  webfont, served from ``++plone++DocentIMS.ActionItems/fonts/``), in place
  of Roboto Slab, Open Sans, Bitter, Encode Sans and the Helvetica stack; a
  ``--docent-*`` token set in ``theme.css`` (page, surfaces, borders, ink,
  brand, action teal, state colours, radii, shadows); the ``#d54545`` navbar
  red becomes the brand crimson, the Editorial coral and the three link blues
  become the action teal, Editorial's cool greys become the warm ink and
  border tokens, the footer sits on the warm surface under a brand rule, and
  the page ground is ``--docent-page``. The uppercase-and-tracked eyebrows,
  menus and outline buttons, the coral h2 underline and the coral header rule
  are gone. ``add_form.css`` and ``docent_dialogs.css`` read the same tokens.
  [docentims]

- Delete everything in the theme that nothing loads: the html5up-editorial
  template source (3.6 MB of sass, js, Font Awesome copies and webfonts), the
  dead SCSS build chain and its maps, ``package.json``, the Sass cache,
  ``rules-kopi.xml``, the TinyMCE templates, the local Barceloneta touch
  icons, ``fontawesome-all.min.css`` (no page linked it and no webfonts were
  shipped, so the Font Awesome glyph rules in ``theme.css`` drew nothing;
  those rules go too) and every ``.DS_Store``. ``src/`` goes from 6.7 MB to
  under 1 MB. ``theme.css`` is the source now; ``scripts/minify_theme.py``
  regenerates ``theme.min.css`` from it (``theme/README.rst``). [docentims]

- Drop the Editorial template's layout CSS that matched nothing on the site:
  ``#sidebar``, ``#menu``, ``#banner``, ``#main``, ``#search``, ``#wrapper``,
  ``#footer``, ``.features``, ``.posts`` article grid, ``.mini-posts``,
  ``.box``, ``.contact``, ``.inner``, ``.toggle``, the ``.gtr-*`` / ``.aln-*``
  / ``.off-*`` / ``.col-N-{size}`` / ``.imp-*`` grid variants and the
  ``is-preload`` / ``is-resizing`` hooks - 1,660 lines whose ids and classes
  appear in no template, rule, script or Python of this theme or of
  DocentIMS.ActionItems. ``theme.css`` goes from 17,037 lines to 15,160.
  [docentims]

- The theme stylesheet URL now carries the ``css_version`` cache token:
  ``rules.xml`` links ``styles/theme.min.css?v=...`` in place of
  ``manifest.cfg``'s ``production-css`` (which cannot carry one), so a deploy
  reaches browsers without a hard refresh - the same mechanism
  ``add_form.css`` and ``docent_dialogs.css`` already use. The TinyMCE
  content stylesheet still comes from ``manifest.cfg``. [docentims]

- Shape the Docent dialog card like the Add Task card, which is the card it
  was meant to match: the same 980px measure, the same whitesmoke body, a
  border and the same drop shadow (``add_form.css``,
  ``.pat-formunloadalert``). The follow-up answer page in particular stood as
  an unshadowed, unbordered 480px box with a white body - the add-on's
  ``max-width: 480px``, written for a bare no-JS fallback page, was squeezing
  a card - and read as an unfinished panel rather than a form. Inside the
  popup the modal is still the frame, so the card drops those there.
  [docentims]

- Paint the dialog buttons, in the pill shape ``add_form.css`` gives Create
  and Cancel. Outside ``.formControls`` they fell through to the theme's page
  buttons and came out as uppercase crimson outlines - the toolbar's
  language, not a form's. [docentims]

- One title per standalone dialog page. Plone printed the content's own
  heading above the card and the card named the same thing again two lines
  lower ("can i set days" over "Will you meet this date?" about that very
  task). Keyed on ``.transition-note-wrapper``, which exists only on the
  standalone page, so it can never hide the heading of a task page a popup
  is opened over; the Alert page keeps its heading, which carries the due
  date the card does not repeat. [docentims]

- Fix the days pulldown on the Assign dialog, which could not be clicked
  however the "Yes" box was set. The rule that greys it shared a block with
  the one for the follow-up answer page, and the answer page's control
  (``#answer-more-time``) does not exist on the Assign form - so
  ``:not(:has(#answer-more-time:checked))`` was true there for the simple
  reason that it was not there at all, and matched always. Each rule is now
  guarded by ``:has()`` on the control it depends on. The answer page's date
  picker was greyed the same way and is fixed with it. [docentims]

- Give the Docent dialogs one header instead of four. Assign, the workflow
  note, the follow-up question and the Alert page each carried their own copy
  of the Add Task header in an inline ``<style>``, and the copies had drifted.
  ``styles/docent_dialogs.css`` now owns that band, using the same numbers
  ``add_form.css`` uses on ``h1.documentFirstHeading``, and ``rules.xml``
  links it on every page -- not on the dialogs' own URLs, because the Assign
  form is fetched and injected into a ``<dialog>`` on the page you are
  already looking at, so a stylesheet linked in its own response's ``<head>``
  is discarded with it. Also removes the white gutter that showed around the
  Assign form: the shell padded by 26px while the header bled by 1rem.
  [docentims]

- Drop the two external Google Fonts ``@import`` lines from the production
  stylesheet (Open Sans, Roboto Slab, Bitter, Encode Sans). They pulled ~76 KiB
  of webfonts from ``fonts.gstatic.com`` and, being ``@import`` rules inside the
  stylesheet, were render-blocking. The theme's own font is Roboto (already on
  the system-font stack), so affected elements fall back to that stack. [docentims]

- Fix the ``++plone++medialog.docenttheme`` static resource directory. The
  ``<plone:static>`` registration in ``browser/configure.zcml`` used
  ``directory="static"``, which resolves relative to ``browser/`` (an empty
  folder), so ``builder.css``, ``builder.js`` and ``tiny-extras.js`` -- which
  live in the package-root ``static/`` -- 404'd on every page. Point it at
  ``../static``. [docentims]

- Serve a minified production stylesheet. ``manifest.cfg`` now points
  ``production-css``/``tinymce-content-css`` at ``styles/theme.min.css``
  (~287 KiB) instead of the expanded ``styles/theme.css`` (~1.05 MB),
  cutting CSS transfer substantially. [docentims]

- Remove the broken self-hosted Roboto ``@font-face`` blocks from
  ``styles/theme.css``. They referenced ``../roboto/*`` files that the theme
  does not ship (the theme sets ``$enable-roboto-webfont: false``), so every
  page load produced 404s for ``roboto-*.woff2/.woff/.ttf``. Text now uses the
  existing Helvetica/Arial fallback stack, matching the theme's intent. [docentims]

- Prefill and lock the "My user name is" field on the password-reset /
  "set your password" form when the invite link carries a ``?userid=``
  query parameter, so a newly-added member does not have to know or retype
  their own username. Self-service "forgot password" links (which carry no
  ``userid``) keep an empty, editable field. Implemented as a z3c.jbot
  override of ``Products.CMFPlone``'s ``pwreset_form`` template.
  [docentims]

- Initial release.
  [espenmn]
