#!/usr/bin/env python
"""Regenerate theme.min.css from theme.css.

theme.css is the hand-edited source; manifest.cfg serves theme.min.css. Run
this after every edit to theme.css, from anywhere::

    python scripts/minify_theme.py

Uses rcssmin (``pip install rcssmin``), a pure-Python minifier, so no node is
needed. If it is not installed the script falls back to a conservative
minifier of its own: comments out, whitespace collapsed outside strings and
url(), ``@charset`` kept first. Either way the output is checked against the
source with comments and whitespace stripped before it is written, so a
minifier bug cannot ship a different stylesheet.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STYLES = os.path.join(HERE, os.pardir, 'src', 'medialog', 'docenttheme',
                      'theme', 'styles')
SOURCE = os.path.join(STYLES, 'theme.css')
TARGET = os.path.join(STYLES, 'theme.min.css')

COMMENT = re.compile(r'/\*.*?\*/', re.S)
# A string or a url() token: left exactly as written.
PROTECTED = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|url\([^)]*\)')


def fallback_minify(css):
    css = COMMENT.sub('', css)
    out = []
    pos = 0
    for match in PROTECTED.finditer(css):
        out.append(_squeeze(css[pos:match.start()]))
        out.append(match.group(0))
        pos = match.end()
    out.append(_squeeze(css[pos:]))
    return ''.join(out).strip()


def _squeeze(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r' ?([{};:,>~]) ?', r'\1', text)
    text = text.replace(';}', '}')
    return text


def normalised(css):
    """The stylesheet with nothing in it but tokens, for comparing."""
    css = COMMENT.sub('', css)
    out = []
    pos = 0
    for match in PROTECTED.finditer(css):
        out.append(re.sub(r'\s+', '', css[pos:match.start()]))
        out.append(match.group(0))
        pos = match.end()
    out.append(re.sub(r'\s+', '', css[pos:]))
    text = ''.join(out)
    # The two things a minifier is allowed to change: a redundant final
    # semicolon, and a leading zero / trailing zero in a number.
    text = text.replace(';}', '}')
    text = re.sub(r'(?<![\d.])0\.(\d)', r'.\1', text)
    text = re.sub(r'(\d)\.0+(?![\d])', r'\1', text)
    text = re.sub(r'(?<![\d.])0(?:px|em|rem|%)', '0', text)
    return text


def main():
    with open(SOURCE, encoding='utf-8') as handle:
        source = handle.read()
    try:
        import rcssmin
    except ImportError:
        print('rcssmin not installed, using the built-in minifier')
        minified = fallback_minify(source)
    else:
        minified = rcssmin.cssmin(source)
    if not minified.startswith('@charset'):
        minified = '@charset "UTF-8";' + minified
    if normalised(source) != normalised(minified):
        sys.exit('minified output does not match the source; not written')
    with open(TARGET, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(minified)
    print('wrote %s: %d -> %d bytes' % (
        os.path.relpath(TARGET), len(source.encode('utf-8')),
        len(minified.encode('utf-8'))))


if __name__ == '__main__':
    main()
