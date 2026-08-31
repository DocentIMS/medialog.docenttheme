# -*- coding: utf-8 -*-
"""A token for the theme stylesheet's URL, so a changed file reaches people.

The Diazo rules inject the add/edit form stylesheet with a plain URL:

    {$portal_url}/++theme++docent-ims-theme/styles/add_form.css

Plone serves ++theme++ resources with a Last-Modified header and no
Cache-Control and no ETag. With no cache directives a browser falls back to
*heuristic* freshness - commonly a tenth of the file's age - so a stylesheet
that has not changed for a fortnight is held for a day or more. The file
then changes, the deploy is correct, the server serves the new one, and
users keep seeing the old one with nothing to tell them why.

That is not theory: a tenant deployed a form layout, got the old stylesheet
from cache, and saw a form with none of its layout - the icon in it grew to
fill the page. Everything was deployed correctly. The fix was a hard
refresh, which is not something to ask of every user on every change.

So the URL carries the file's own modification time. Change the file and
the URL changes with it; leave it alone and the URL is stable and the
browser's copy stays good. Nothing to bump by hand, nothing to remember.
"""
import os

from Products.Five.browser import BrowserView


THEME_STYLES = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'theme', 'styles')


class CssVersion(BrowserView):
    """Return a short token that changes when the theme's CSS changes.

    Every stylesheet in the theme's styles/ directory counts towards it, so
    one token covers the lot and a change to any of them busts the cache
    for all of them. There are only a handful of files and the answer is a
    stat apiece, which is cheap enough to do per request; caching it in the
    process would only reintroduce staleness on the servers where two
    instances disagree.
    """

    def __call__(self):
        newest = 0
        try:
            for name in os.listdir(THEME_STYLES):
                if not name.endswith('.css'):
                    continue
                stamp = os.path.getmtime(os.path.join(THEME_STYLES, name))
                if stamp > newest:
                    newest = stamp
        except OSError:
            # No styles directory: fall back to a constant rather than
            # breaking the theme. A missing token means the URL is the one
            # it always was, which is exactly today's behaviour.
            return '0'
        return str(int(newest))
