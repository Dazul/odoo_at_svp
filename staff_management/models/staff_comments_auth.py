# -*- coding: utf-8 -*-
from odoo import fields, models


class staff_comments_authorization(models.Model):
    _name = "staff.comments.authorization"

    comment_type = fields.Many2one('staff.comment.type', 'Task', readonly=False)
    user_id = fields.Many2one('res.users', 'User', readonly=False, relate=True)
    create_uid = fields.Many2one('res.users', 'Author', readonly=True)
    write_date = fields.Date('Date of formation', readonly=True)
