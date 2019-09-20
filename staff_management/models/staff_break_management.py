# -*- coding: utf-8 -*-
from odoo import fields, models


class staff_break_management(models.Model):
    _name = "staff.break.management"
    _rec_name = 'break_time'

    work_time_min = fields.Float('Minimum work time', readonly=False)
    work_time_max = fields.Float('Maximum work time', readonly=False)
    break_time = fields.Float('Break time', readonly=False)
