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
