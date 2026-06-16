# -*- coding: utf-8 -*-
from medialog.docenttheme.tinymce_setup import configure_tinymce


def upgrade_tinymce_1001(setup_context):
    """Repair registry drift and apply the standard TinyMCE preset."""
    configure_tinymce(setup_context)
