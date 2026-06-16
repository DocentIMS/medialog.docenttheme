# -*- coding: utf-8 -*-
"""Standardised TinyMCE configuration for DocentIMS sites.

Rebinds the managed TinyMCE registry fields to their current schema
definition (fixing type drift such as menubar List->TextLine, and stale
vocabularies such as plugins gaining accordion), then applies a standard
editor preset. Safe to run repeatedly.

We deliberately rebind only the fields this preset writes, rather than
calling registry.registerInterface(ITinyMCESchema). A full-schema refresh
iterates every field in the schema and can trip on the persistent-field
adapter of an unrelated field; the targeted approach below avoids that.
"""
import json
import logging

from plone.base.interfaces import ITinyMCESchema
from plone.registry.interfaces import IPersistentField
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

logger = logging.getLogger("medialog.docenttheme")

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

# URL of our extra-buttons plugin (Print + Plone-wired Save), served from the
# package's static directory and loaded via external_plugins.
EXTRAS_URL = "/++plone++medialog.docenttheme/tiny-extras.js"

# No "plugins" key here on purpose - that would override the checkbox
# selection above. External plugins load via "external_plugins".
OTHER_SETTINGS = {
    "external_plugins": {
        "mentions_autocomplete":
            "/++plone++medialog.notifications/tiny_mce/plugins/index.js",
        "docentextras": EXTRAS_URL,
    }
}

MANAGED_FIELDS = ("menubar", "toolbar", "plugins", "other_settings")


def add_extras_plugin(registry):
    """Merge the docentextras external plugin into the existing other_settings.

    Unlike apply_preset() this preserves the admin's toolbar/menu/plugins and
    any other other_settings keys - it only ensures the Print/Save plugin URL
    is registered. Used by the upgrade step so existing sites gain the buttons
    without losing their customisations.
    """
    rec = registry.records.get("plone.other_settings")
    if rec is None:
        return
    try:
        data = json.loads(rec.value or "{}")
    except (ValueError, TypeError):
        data = {}
    if not isinstance(data, dict):
        data = {}
    ext = data.get("external_plugins") or {}
    ext["docentextras"] = EXTRAS_URL
    data["external_plugins"] = ext
    registry["plone.other_settings"] = json.dumps(data)
    logger.info("Registered docentextras (Print/Save) external plugin.")


def repair_registry_fields(registry):
    """Rebind each managed field to its current (correct) schema definition."""
    for fname in MANAGED_FIELDS:
        rec_name = "plone." + fname
        if rec_name not in registry.records:
            continue
        new_field = IPersistentField(ITinyMCESchema[fname])
        new_field.interfaceName = "plone.base.interfaces.ITinyMCESchema"
        new_field.fieldName = fname
        registry.records[rec_name].field = new_field
        logger.info("Repaired TinyMCE registry field %s.", rec_name)


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
    """Repair drift on the managed fields, then apply the preset. Idempotent."""
    registry = getUtility(IRegistry)
    repair_registry_fields(registry)
    apply_preset(registry)
