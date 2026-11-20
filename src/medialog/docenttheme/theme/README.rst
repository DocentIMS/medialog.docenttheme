=====
Theme
=====

``styles/theme.css`` is the source. Edit it by hand; there is no SCSS and no
node build any more.

The site loads ``styles/theme.min.css`` (``manifest.cfg``, ``production-css``
and ``tinymce-content-css``), so after every edit regenerate it from the
repo root::

    pip install rcssmin        # once
    python scripts/minify_theme.py

The script refuses to write if the minified file does not match the source
once comments and whitespace are stripped. Without ``rcssmin`` it falls back
to a simpler minifier of its own.

``styles/add_form.css`` and ``styles/docent_dialogs.css`` are linked by
``rules.xml`` as they are, with a cache token from
``browser/css_version.py``; they are not minified.

The form title bar (``h1.documentFirstHeading`` on add and edit forms) is
styled in ``add_form.css`` by body class, so every form gets it without
any markup of its own: Inter, 1.05rem, weight 400, ``#8B6914`` on
``--docent-surface-cream``. Those three text properties carry ``!important``
from inside ``#content`` because a site's Style Settings
(``@@docent-content.css``) set every ``#content h1`` with ``!important``.
Do not restyle the bar per form; a new form needs nothing.

Colours and the font come from the ``--docent-*`` custom properties in the
``:root`` block near the top of ``theme.css``. Use those rather than new hex
values.
