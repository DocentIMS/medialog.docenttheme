# -*- coding: utf-8 -*-
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer


@implementer(INonInstallable)
class HiddenProfiles(object):

    def getNonInstallableProfiles(self):
        """Hide uninstall profile from site-creation and quickinstaller."""
        return [
            "medialog.docenttheme:uninstall",
        ]

    def getNonInstallableProducts(self):
        """Hide the upgrades package from site-creation and quickinstaller."""
        return ["medialog.docenttheme.upgrades"]


def post_install(context):
    """Post install script"""
    from medialog.docenttheme.tinymce_setup import configure_tinymce
    from medialog.docenttheme.upgrades import register_builder_bundle
    configure_tinymce(context)
    register_builder_bundle(context)


def uninstall(context):
    """Uninstall script"""
    # Do something at the end of the uninstallation of this package.
