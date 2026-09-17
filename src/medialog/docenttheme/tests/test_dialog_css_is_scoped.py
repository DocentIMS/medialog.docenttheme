# -*- coding: utf-8 -*-
"""The dialog stylesheet is on every page, so it must only style dialogs.

rules.xml links styles/docent_dialogs.css unconditionally, and has to: the
Assign form is fetched and injected into a <dialog> on whatever page you are
already looking at, so a stylesheet linked from the form's own response is
thrown away with that response's <head>. Only the parent page's stylesheet
reaches it.

The price is that every rule in the file applies to every page on the site -
the task list, the calendar, the control panel. A selector in there that does
not name a dialog is a site-wide restyle nobody asked for, and it would show
up somewhere far from the form it was written for.

Read from the file, so a rule that breaks it fails on the commit that adds it.
"""

import medialog.docenttheme

import os
import re
import unittest


STYLES = os.path.join(
    os.path.dirname(os.path.abspath(medialog.docenttheme.__file__)),
    'theme', 'styles')
DIALOG_CSS = os.path.join(STYLES, 'docent_dialogs.css')
RULES = os.path.join(
    os.path.dirname(os.path.abspath(medialog.docenttheme.__file__)),
    'theme', 'rules.xml')

#: What counts as naming a dialog. The classes the product's own dialog
#: templates carry.
OURS = ('docent-dialog', 'transition-note', 'assign-')

COMMENT = re.compile(r'/\*.*?\*/', re.S)
SELECTOR = re.compile(r'([^{}]+)\{')


def selectors(path):
    with open(path, encoding='utf-8') as handle:
        css = COMMENT.sub('', handle.read())
    found = []
    for match in SELECTOR.finditer(css):
        text = match.group(1).strip()
        if not text or text.startswith('@'):
            continue
        for one in text.split(','):
            one = ' '.join(one.split())
            if one:
                found.append(one)
    return found


class TestDialogCssIsScoped(unittest.TestCase):
    """No Plone needed: the invariant is in the file."""

    def test_the_file_is_there(self):
        self.assertTrue(os.path.isfile(DIALOG_CSS), DIALOG_CSS)

    def test_it_is_linked_on_every_page(self):
        """If this stops being unconditional the Assign dialog loses its
        styling, which is the bug the unconditional link exists to fix."""
        with open(RULES, encoding='utf-8') as handle:
            rules = handle.read()
        # The link, and the line before it, outside any <rules> condition.
        self.assertIn('docent_dialogs.css', rules)
        before = rules.split('docent_dialogs.css')[0]
        # One <rules> is open at that point and must be: the root element.
        # Any more and the link is inside a condition.
        depth = before.count('<rules ') - before.count('</rules>')
        self.assertEqual(
            1, depth,
            'the docent_dialogs.css link sits inside a conditional <rules> '
            'block; it has to be unconditional, because the Assign form is '
            'injected into a page it did not render')

    def test_every_rule_names_a_dialog(self):
        strays = [one for one in selectors(DIALOG_CSS)
                  if one != ':root' and not any(k in one for k in OURS)]
        self.assertEqual(
            [], strays,
            'these are on every page of the site, not just the dialogs: '
            '{0}'.format(strays))
