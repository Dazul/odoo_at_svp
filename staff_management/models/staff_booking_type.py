# -*- coding: utf-8 -*-
from odoo import fields, models


class staff_booking_type(models.Model):
    _name = "staff.booking.type"
    _rec_name = 'booking_type'

    booking_type = fields.Char('Booking Type', size=32, required=True)
