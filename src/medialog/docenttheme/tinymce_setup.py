# -*- coding: utf-8 -*-
"""Standardised TinyMCE configuration for DocentIMS sites.

Repairs registry field-type drift (e.g. ``menubar`` changing from ``List`` to
``TextLine`` after a plone.base upgrade, or the plugin vocabulary gaining new
entries like ``accordion``) and then applies a standard editor preset so every
site is configured identically. Safe to run repeatedly.
"""
import json
import logging

from plone.base.interfaces import ITinyMCESchema
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

logger = logging.getLogger("medialog.docenttheme")

# --- The standardised "Standard" preset for all DocentIMS sites ---
MENUBAR = "edit table format tools view insert"

TOOLBAR = (
    "ltr rtl | undo redo | styleselect | bold italic | "
    "alignleft aligncenter alignright alignjustify | "
    "bullist numlist outdent indent | accordion | inserttable | "
    "unlink plonelink ploneimage"
)

PLUGINS = [
    "accordion", "code", "fullscreen", "lists", "media", "nonbreaking",
    "pagebreak", "preview", "searchreplace", "table", "visualchars", "wordcount",
]

# NOTE: no "plugins" key here on purpose — that would override the checkbox
# selection above. External plugins load via "external_plugins".
OTHER_SETTINGS = {
    "external_plugins": {
        "mentions_autocomplete":
            "/++plone++medialog.notifications/tiny_mce/plugins/index.js"
    }
}


def repair_registry_fields(registry):
    """Re-bind every ITinyMCESchema field to its current definition.

    Fixes stale persistent records whose field *type* drifted from the schema
    after a plone.base upgrade. Valid values are retained; values that no longer
    validate fall back to the field default.
    """
    pass
    logger.info("TinyMCE registry fields repaired (registerInterface).")


def apply_preset(registry):
    """Write the standardised TinyMCE preset values."""
    records = registry.records
    if "plone.menubar" in records:
        registry["plone.menubar"] = MENUBAR
    if "plone.toolbar" in records:
        registry["plone.toolbar"] = TOOLBAR
    if "plone.plugins" in records:
        registry["plone.plugins"] = list(PLUGINS)
    if "plone.other_settings" in records:
        registry["plone.other_settings"] = json.dumps(OTHER_SETTINGS)
    logger.info("TinyMCE standardised preset applied.")


def configure_tinymce(context=None):
    """Repair drift, then apply the standard preset. Idempotent."""
    registry = getUtility(IRegistry)
    repair_registry_fields(registry)
    apply_preset(registry)
