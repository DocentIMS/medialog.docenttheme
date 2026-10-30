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

Colours and the font come from the ``--docent-*`` custom properties in the
``:root`` block near the top of ``theme.css``. Use those rather than new hex
values.
