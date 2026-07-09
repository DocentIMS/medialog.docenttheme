Changelog
=========


1.0a1 (unreleased)
------------------

- Fix the personal-tools user icon drifting off the toolbar on wide screens.
  ``#portal-top`` (which holds the logged-in user's icon/name) is right-aligned
  inside the full-width header, so without a max-width it slid to the far right
  edge on large monitors and detached from the grey toolbar; on smaller screens
  it overlapped the "Select Doc Type" block. Restore the
  ``#portal-top {max-width: 1680px; margin: auto}`` / ``#toolbar {margin: auto}``
  rules (present in the source ``styles/custom.scss`` and appended to the
  compiled ``styles/theme.css`` / ``styles/theme.min.css``) so both stay within
  the content column. [docentims]

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
