# -*- coding: utf-8 -*-
from odoo import api, models


class staff_task_accounts(models.Model):
    _name = "account.analytic.account"
    _inherit = "account.analytic.account"
    _rec_name = 'name'

    # Search the datas in database.
    @api.model
    def name_search(self, name='', args=None, operator='ilike', limit=100):
        user_id = None
        # Control if the domain user_id_for_task is set
        for arg in args:
            if arg[0] == 'user_id_for_task':
                user_id = arg[2]
                break
        # If user_id is none, the domain is not set. So return the parent without changes.
        if user_id is None:
            return super(staff_task_accounts, self).name_search(name, args, operator, limit)
        # Read the datas, and do the filter befor send it to JavaScript
        records = super(staff_task_accounts, self).name_search(name, None, operator, limit)
        goodValues = []
        # Get the authorizations
        obj = self.env['staff.authorization']
        # If the user is authorized to do a task, add it to the return list
        for record in records:
            ids = obj.search([('user_id', '=', user_id), ('task_id', '=', record[0])])
            if len(ids) != 0:
                goodValues.append(record)
        return goodValues
