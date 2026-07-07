# -*- coding: utf-8 -*-

from plone.app.layout.viewlets import ViewletBase
from plone import api


class HeaderViewlet(ViewletBase):

    def update(self):
        self.message = self.get_message()
        self.color = self.get_color()

    def get_message(self):
        return api.portal.get_registry_record(
            'DocentIMS.ActionItems.interfaces.IDocentimsSettings.project_title',
            default=None)

    def get_color(self):
        return api.portal.get_registry_record(
            'DocentIMS.ActionItems.interfaces.IDocentimsSettings.color1',
            default=None)
                   
    def index(self):
        return super(HeaderViewlet, self).render()
