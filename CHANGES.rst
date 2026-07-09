Changelog
=========


1.0a1 (unreleased)
------------------

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
