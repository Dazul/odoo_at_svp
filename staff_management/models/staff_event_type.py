# -*- coding: utf-8 -*-
from odoo import fields, models


class staff_event_type(models.Model):
    _name = "staff.event.type"
    _rec_name = 'event_type'

    event_type = fields.Char('Event Type', size=32, required=True)
