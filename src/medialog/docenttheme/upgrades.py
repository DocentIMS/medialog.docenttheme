# -*- coding: utf-8 -*-
from medialog.docenttheme.tinymce_setup import configure_tinymce
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

BUNDLE = "docenttheme-tinymce-builder"


def upgrade_tinymce_1001(setup_context):
    """Repair registry drift and apply the standard TinyMCE preset."""
    configure_tinymce(setup_context)


def register_builder_bundle(setup_context=None):
    """Register the self-hosted toolbar-builder JS/CSS as a Plone bundle.

    Loads ++plone++medialog.docenttheme/builder.{js,css} site-wide; the JS
    only acts on the @@tinymce-controlpanel page, so it is otherwise inert.
    """
    from Products.CMFPlone.interfaces import IBundleRegistry
    registry = getUtility(IRegistry)
    records = registry.collectionOfInterface(
        IBundleRegistry, prefix="plone.bundles", check=False)
    bundle = records.setdefault(BUNDLE)
    bundle.jscompilation = "++plone++medialog.docenttheme/builder.js"
    bundle.csscompilation = "++plone++medialog.docenttheme/builder.css"
    bundle.depends = "plone"
    bundle.enabled = True
    bundle.compile = False


def upgrade_builder_1002(setup_context):
    """Register the toolbar-builder bundle."""
    register_builder_bundle(setup_context)
