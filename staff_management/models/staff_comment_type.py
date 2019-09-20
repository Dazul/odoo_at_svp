# -*- coding: utf-8 -*-
from odoo import fields, models


class staff_comment_type(models.Model):
    _name = "staff.comment.type"
    _rec_name = 'comment_type'

    comment_type = fields.Char('Comment Type', size=32, required=True)
