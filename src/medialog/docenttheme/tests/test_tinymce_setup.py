# -*- coding: utf-8 -*-
"""What fix_mentions_plugin does to a site's existing editor settings.

No Plone layer: the function only reads and writes one registry record,
so a dict standing in for the registry exercises the whole of it and the
tests stay fast.
"""
from medialog.docenttheme.tinymce_setup import EXTRAS_URL
from medialog.docenttheme.tinymce_setup import MENTIONS_URL
from medialog.docenttheme.tinymce_setup import fix_mentions_plugin

import json
import unittest


class FakeRecord(object):
    def __init__(self, value):
        self.value = value


class FakeRegistry(object):
    """Enough of plone.registry for this: records[name].value and [name] = x."""

    def __init__(self, other_settings=None):
        self.records = {}
        if other_settings is not None:
            self.records['plone.other_settings'] = FakeRecord(other_settings)

    def __getitem__(self, name):
        return self.records[name].value

    def __setitem__(self, name, value):
        self.records[name].value = value

    def plugins(self):
        return json.loads(
            self.records['plone.other_settings'].value)['external_plugins']


class TestFixMentionsPlugin(unittest.TestCase):

    def test_replaces_the_plugin_that_left_the_build(self):
        registry = FakeRegistry(json.dumps({'external_plugins': {
            'mentions_autocomplete':
                '/++plone++medialog.notifications/tiny_mce/plugins/index.js',
        }}))
        fix_mentions_plugin(registry)
        self.assertEqual(registry.plugins(),
                         {'DocentIMS_Mentions': MENTIONS_URL})

    def test_leaves_the_admins_other_settings_alone(self):
        registry = FakeRegistry(json.dumps({
            'external_plugins': {'docentextras': EXTRAS_URL},
            'browser_spellcheck': True,
        }))
        fix_mentions_plugin(registry)
        data = json.loads(registry.records['plone.other_settings'].value)
        self.assertTrue(data['browser_spellcheck'])
        self.assertEqual(data['external_plugins']['docentextras'], EXTRAS_URL)
        self.assertEqual(data['external_plugins']['DocentIMS_Mentions'],
                         MENTIONS_URL)

    def test_runs_twice_without_changing_anything_the_second_time(self):
        registry = FakeRegistry(json.dumps({'external_plugins': {}}))
        fix_mentions_plugin(registry)
        once = registry.records['plone.other_settings'].value
        fix_mentions_plugin(registry)
        self.assertEqual(registry.records['plone.other_settings'].value, once)

    def test_copes_with_a_site_that_has_no_other_settings_yet(self):
        registry = FakeRegistry()
        fix_mentions_plugin(registry)  # must not raise
        self.assertEqual(registry.records, {})

    def test_copes_with_a_record_holding_something_that_is_not_json(self):
        registry = FakeRegistry('not json at all')
        fix_mentions_plugin(registry)
        self.assertEqual(registry.plugins(),
                         {'DocentIMS_Mentions': MENTIONS_URL})


class TestCssVersionParameter(unittest.TestCase):
    """The theme parameter that puts a token in the stylesheet URL."""

    def _registry(self, params):
        reg = FakeRegistry()
        reg.records['plone.app.theming.interfaces.IThemeSettings'
                    '.parameterExpressions'] = FakeRecord(params)
        return reg

    def _params(self, reg):
        return reg.records['plone.app.theming.interfaces.IThemeSettings'
                           '.parameterExpressions'].value

    def test_adds_the_parameter(self):
        from medialog.docenttheme.upgrades import add_css_version_parameter
        reg = self._registry({'portal_url': 'python: portal.absolute_url()'})
        add_css_version_parameter(reg)
        self.assertIn('css_version', self._params(reg))

    def test_keeps_the_parameters_a_site_already_has(self):
        # A registry reimport cost a tenant its settings earlier this month.
        # This merges; it does not replace.
        from medialog.docenttheme.upgrades import add_css_version_parameter
        reg = self._registry({'portal_url': 'python: portal.absolute_url()',
                              'something_a_site_added': 'python: 1'})
        add_css_version_parameter(reg)
        params = self._params(reg)
        self.assertEqual(params['portal_url'],
                         'python: portal.absolute_url()')
        self.assertEqual(params['something_a_site_added'], 'python: 1')

    def test_running_it_twice_changes_nothing(self):
        from medialog.docenttheme.upgrades import add_css_version_parameter
        reg = self._registry({})
        add_css_version_parameter(reg)
        once = dict(self._params(reg))
        add_css_version_parameter(reg)
        self.assertEqual(self._params(reg), once)

    def test_a_site_without_the_record_is_left_alone(self):
        from medialog.docenttheme.upgrades import add_css_version_parameter
        reg = FakeRegistry()
        add_css_version_parameter(reg)   # must not raise
        self.assertEqual(reg.records, {})

    def test_the_token_changes_when_a_stylesheet_changes(self):
        # The whole point: same file, same token; touched file, new token.
        import os
        import time
        from medialog.docenttheme.browser.css_version import (
            THEME_STYLES, CssVersion)
        view = CssVersion(None, None)
        before = view()
        target = os.path.join(THEME_STYLES, 'add_form.css')
        os.utime(target, (time.time() + 5, time.time() + 5))
        try:
            self.assertNotEqual(view(), before)
        finally:
            os.utime(target, None)
