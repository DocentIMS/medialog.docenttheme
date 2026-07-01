# -*- coding: utf-8 -*-
from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import (
    applyProfile,
    FunctionalTesting,
    IntegrationTesting,
    PLONE_FIXTURE,
    PloneSandboxLayer,
)
from plone.testing import z2

import medialog.docenttheme


class MedialogDocentthemeLayer(PloneSandboxLayer):

    defaultBases = (PLONE_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        # Load any other ZCML that is required for your tests.
        # The z3c.autoinclude feature is disabled in the Plone fixture base
        # layer.
        import plone.app.dexterity
        self.loadZCML(package=plone.app.dexterity)
        import plone.restapi
        self.loadZCML(package=plone.restapi)
        self.loadZCML(package=medialog.docenttheme)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'medialog.docenttheme:default')


MEDIALOG_DOCENTTHEME_FIXTURE = MedialogDocentthemeLayer()


MEDIALOG_DOCENTTHEME_INTEGRATION_TESTING = IntegrationTesting(
    bases=(MEDIALOG_DOCENTTHEME_FIXTURE,),
    name='MedialogDocentthemeLayer:IntegrationTesting',
)


MEDIALOG_DOCENTTHEME_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(MEDIALOG_DOCENTTHEME_FIXTURE,),
    name='MedialogDocentthemeLayer:FunctionalTesting',
)


MEDIALOG_DOCENTTHEME_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        MEDIALOG_DOCENTTHEME_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        z2.ZSERVER_FIXTURE,
    ),
    name='MedialogDocentthemeLayer:AcceptanceTesting',
)
