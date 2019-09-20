# -*- coding: utf-8 -*-
from odoo import api, models, fields
from datetime import datetime
from . import staff_utils


class staff_pay_push(models.TransientModel):
    _name = "staff.pay.push"

    user_id = fields.Many2one('res.users', 'User', relate=True)
    user_id_read = fields.Many2one('res.users', 'User', relate=True)
    amount = fields.Float('Amount', readonly=False)
    creditTotal = fields.Float('Balance total', readonly=False)
    creditMonth = fields.Float('Balance month', readonly=False)
    comment = fields.Char('Comment', size=255, required=True)
    journal = fields.Many2one('account.journal', 'Analytic Journal', relate=True)
    analytic_account = fields.Many2one('account.analytic.account', 'Analytic Account', relate=True)
    account = fields.Many2one('account.account', 'General account', relate=True)
    date = fields.Date('Date')
    state = fields.Selection([('init', 'init'), ('defineAmount', 'defineAmount')])

    def getDif(self, user_id):
        cr = self._cr
        account_lines = self.env['account.analytic.line']
        user_lines = account_lines.search([('user_id', '=', user_id)])
        # Excecute SQL for optimization! "For" loop will take too long on future.
        cr.execute('Select sum(amount) from account_analytic_line where user_id = ' + str(user_id))
        ammount = cr.fetchone()
        return ammount[0]

    def getDifMonth(self, user_id, date):
        cr = self._cr
        utils = staff_utils.staff_utils()
        account_lines = self.env['account.analytic.line']
        user_lines = account_lines.search([('user_id', '=', user_id)])
        # Excecute SQL for optimization! "For" loop will take too long on future.
        first = utils.get_first_day_month(date)
        last = utils.get_last_day_month(date)
        cr.execute('Select sum(amount) from account_analytic_line where user_id = ' + str(user_id) + ' and date::date <= \'' + last + '\' and date::date >= \'' + first + '\'')
        ammount = cr.fetchone()
        return ammount[0]

    @api.model
    def get_form_context(self, user_id, date_str):
        user_id = int(user_id)
        creditTotal = self.getDif(user_id)
        date = datetime.strptime(date_str, "%Y-%m-%d")
        creditMonth = self.getDifMonth(user_id, date)
        # Hard coded. TODO some better code on next releases.
        account = [0]
        account_lines = self.env['account.analytic.account']
        account = account_lines.search([('name', '=', 'Salaires')])
        if len(account) == 0:
            accoundId = 0
        else:
            accoundId = account[0].id
        return {'user_id_read': user_id,
                'creditTotal': creditTotal,
                'creditMonth': creditMonth,
                'date': str(date),
                'journal': 2,
                'account': 1,
                'analytic_account': accoundId, }

    @api.model
    def create(self, vals):
        context = dict(self.env.context)
        if 'default_user_id_read' in context:
            user_id = context['default_user_id_read']
            if 'journal' in vals:
                journal = vals['journal']
            else:
                journal = 2
            if 'account' in vals:
                account = vals['account']
            else:
                account = 1
            account_lines = self.env['account.analytic.line']
            account_lines.with_context(context).create({'name': vals['comment'], 'account_id': vals['analytic_account'],
                                                                            'journal_id': journal, 'user_id': user_id, 'date': vals['date'],
                                                                            'amount': -vals['amount'], 'general_account_id': account})
        return super(staff_pay_push, self.with_context(context)).create(vals)

    @api.model
    def get_month_salaries(self, domain):
        account = self.env['account.analytic.line']
       
        dic = {}
        for record in account.search(domain):
            dayInMonth = record.date.strftime('%d') #[8:10]
            dayAmount = record.amount  # TODO, add information, creator, ...
            dayWorkTime = record.unit_amount
            if record.user_id.id in dic:
                userDic = dic[record.user_id.id]
                if dayInMonth in userDic:
                    listAmount = userDic[dayInMonth]['amounts']
                    listAmount.append(dayAmount)
                    listWorkTime = userDic[dayInMonth]['timework']
                    listWorkTime.append(dayWorkTime)
                else:
                    userDic[dayInMonth] = {'timework': [dayWorkTime], 'amounts': [dayAmount]}
            else:
                dic[record.user_id.id] = {'name': record.user_id.name, dayInMonth: {'timework': [dayWorkTime], 'amounts': [dayAmount]}}

        return dic
