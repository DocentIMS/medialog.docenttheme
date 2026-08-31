# -*- coding: utf-8 -*-
from medialog.docenttheme.tinymce_setup import add_extras_plugin
from medialog.docenttheme.tinymce_setup import fix_mentions_plugin
from medialog.docenttheme.tinymce_setup import configure_tinymce
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

import logging

logger = logging.getLogger('medialog.docenttheme')

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


def upgrade_extras_1003(setup_context):
    """Register the Print/Save extras plugin (preserves toolbar/menu/plugins)."""
    registry = getUtility(IRegistry)
    add_extras_plugin(registry)


def upgrade_mentions_1004(setup_context):
    """Point the @-mention dropdown at a plugin that exists.

    Every editor was asking for it from medialog.notifications, which left
    the build, so TinyMCE logged a failed plugin load on every form and
    typing @ offered nobody.
    """
    registry = getUtility(IRegistry)
    fix_mentions_plugin(registry)


CSS_VERSION_PARAM = "python: portal.restrictedTraverse('@@docent-css-version')()"


def add_css_version_parameter(registry):
    """Let the Diazo rules put a cache-busting token in the stylesheet URL.

    The theme's parameters live in the registry, copied there when the theme
    was activated - manifest.cfg is not read on each request. So adding a
    parameter to manifest.cfg only reaches a site that is themed afresh; an
    existing site keeps whatever it was activated with, and a rules.xml that
    uses the new parameter fails with "Undefined variable" and the whole
    theme transform dies.

    Merges rather than replaces, for the reason a registry reimport cost a
    tenant its settings earlier this month: whatever else a site has in
    there is none of this step's business.
    """
    name = 'plone.app.theming.interfaces.IThemeSettings.parameterExpressions'
    if name not in registry.records:
        return
    params = dict(registry[name] or {})
    if params.get('css_version') == CSS_VERSION_PARAM:
        logger.info('Theme already has the css_version parameter.')
        return
    params['css_version'] = CSS_VERSION_PARAM
    registry[name] = params
    logger.info('Added the css_version theme parameter.')


def upgrade_css_version_1005(setup_context):
    """Stop a changed stylesheet waiting out the browser cache.

    ++theme++ resources are served with Last-Modified and no Cache-Control
    and no ETag, so browsers fall back to heuristic freshness and hold a
    rarely-changed stylesheet for a day or more. A tenant deployed a form
    layout, got the old stylesheet from cache, and saw a form with none of
    its layout. The URL now carries the stylesheet's own modification time.
    """
    registry = getUtility(IRegistry)
    add_css_version_parameter(registry)
