# -*- coding: utf-8 -*-
"""Guardrail for the TinyMCE 'Other settings' field.

Gives a readable error on invalid JSON, and blocks the silent-override footgun
where keys like ``plugins``/``toolbar``/``menu`` in 'Other settings' overwrite
the managed Plugins/Toolbar/Menu configuration.
"""
import json

from plone.base import PloneMessageFactory as _
from plone.base.interfaces import ITinyMCEAdvancedSchema
from z3c.form import validator
from zope.interface import Invalid

# Keys that would override the managed fields if placed in 'Other settings'.
CONFLICT_KEYS = ("plugins", "toolbar", "menubar", "menu")


class OtherSettingsValidator(validator.SimpleFieldValidator):
    def validate(self, value, force=False):
        super().validate(value, force)
        if not value:
            return
        try:
            data = json.loads(value)
        except (ValueError, TypeError) as exc:
            raise Invalid(
                _("Other settings must be valid JSON. Error: ${err}",
                  mapping={"err": str(exc)}))
        if not isinstance(data, dict):
            raise Invalid(_("Other settings must be a JSON object, e.g. { ... }."))
        conflicts = [k for k in CONFLICT_KEYS if k in data]
        if conflicts:
            raise Invalid(_(
                "These keys in Other settings would override the "
                "Plugins/Toolbar/Menu settings configured above: ${keys}. "
                "Remove them here and use the fields above instead. "
                "(To load an external plugin, use \"external_plugins\".)",
                mapping={"keys": ", ".join(conflicts)}))


validator.WidgetValidatorDiscriminators(
    OtherSettingsValidator,
    field=ITinyMCEAdvancedSchema["other_settings"],
)
