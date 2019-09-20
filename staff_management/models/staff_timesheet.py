# -*- coding: utf-8 -*-
from api import api, models, fields


class staff_timesheet(models.Model):
    _name = "staff.timesheet"

    user_id = fields.Many2one('res.users', 'User', readonly=True, relate=True)

    # Update elements
    # Make a control to ensure that the user can do the task.
    @api.multi
    def write(self, vals):
        return super(staff_timesheet, self).write(vals)

    # add user_id to create the elements
    @api.model
    def create(self, vals):
        return super(staff_timesheet, self).create(vals)

    # Remove an availability with assignement check.
    @api.multi
    def unlink(self):
        return super(staff_timesheet, self).unlink()
