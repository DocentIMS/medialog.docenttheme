Changelog
=========


1.0a1 (unreleased)
------------------

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
