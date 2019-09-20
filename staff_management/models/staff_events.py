# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError


class staff_events(models.Model):
    _name = "staff.events"
    _rec_name = 'event_name'

    event_name = fields.Char('Event', size=32, required=True)
    date = fields.Date('Date', readonly=False)
    hour_from = fields.Float('Start Hour', readonly=False)
    hour_to = fields.Float('End Hour', readonly=False)

    _sql_constraints = [
        ('unique_date', 'unique(date)', "Only one event per day!"),
    ]

    # Check if the hour from is between 0 and 24
    @api.constrains('hour_to')
    def _check_hour_to(self):
        for event in self:
            if(event.hour_to < 0 or event.hour_to > 24):
                raise UserError(_("End hour must be between 0 and 24."))
        return True

    # Check if the hour to is between 0 and 24
    @api.constrains('hour_from')
    def _check_hour_from(self):
        for event in self:
            if(event.hour_from < 0 or event.hour_from > 24):
                raise UserError(_("Start hour must be between 0 and 24."))
        return True
