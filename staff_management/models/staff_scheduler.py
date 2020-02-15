# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError, UserError
from datetime import datetime
from .staff_utils import staff_utils
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT


class staff_scheduler(models.Model):
    _name = "staff.scheduler"

    user_id = fields.Many2one('res.users', 'User', readonly=True, relate=True)
    task_id = fields.Many2one('account.analytic.account', 'Task', readonly=False)
    date = fields.Date('Date', readonly=True)
    hour_from = fields.Float('Start Hour', readonly=False)
    hour_to = fields.Float('End Hour', readonly=False)
    comment = fields.Char('Comment', size=512, required=False)
    work_time = fields.Float('Worked time', readonly=False)
    confirm = fields.Boolean('Confirm', readonly=False)
    replaceable = fields.Boolean('Replaceable', readonly=False, default=False)

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

    # Update elements
    # Make a control to ensure that the user can do the task.
    @api.multi
    def write(self, vals):
        context = dict(self.env.context)
        if context:
            # If write_worked_time on context,
            # write the wirked time on te timesheet
            if 'write_worked_time' in context:
                if 'work_time' in vals:
                    worked_time = vals['work_time']
                else:
                    worked_time = None
                for s in self:
                    s.writeTimesheet(worked_time)
                return True
        # Records is a list of dictonary. Each dictionary is in this form: [key:(int_id, string_name)]
        records = super(staff_scheduler, self.with_context(context)).read([])
        # Control if the availability exits when the write is performed
        if len(records) == 0:
            raise ValidationError(_("The user removed this availability."))
        # Control if the work time is entered.
        if records[0]['confirm']:
            if context:
                raise ValidationError(_("Work time already entered."))
        # Get the authorizations. If the auth list is empty, the authorization don't exist.
        if 'task_id' in vals and vals['task_id'] != False:
            obj = self.env['staff.authorization']
            auth = obj.search([('user_id', '=', records[0]['user_id'][0]), ('task_id', '=', vals['task_id'])])
            if len(auth) == 0:
                raise ValidationError(_("This user can not do this task"))
        # Control if the work time is possible.
        if ('hour_from' in vals) and ('hour_to' in vals):
            if vals['hour_to'] < vals['hour_from']:
                raise ValidationError(_("You need to specify a correct work time."))
        elif ('hour_from' in vals) and not ('hour_to' in vals):
            for event in self:
                if(event.hour_to < vals['hour_from']):
                    raise ValidationError(_("You need to specify a correct work time."))
        elif not ('hour_from' in vals) and ('hour_to' in vals):
            for event in self:
                if(vals['hour_to'] < event.hour_from):
                    raise ValidationError(_("You need to specify a correct work time."))
        # Knowned bug. Need to change the two hours to update the worked time.
        if ('hour_from' in vals) and ('hour_to' in vals):
            # get the break time to substract to the worked time
            time = vals['hour_to'] - vals['hour_from']
            break_management = self.env['staff.break.management']
            breaks = break_management.search([('work_time_min', '<=', time), ('work_time_max', '>=', time)])
            if len(breaks) != 0:
                break_length = breaks[0].break_time
                time = time - break_length
            vals['work_time'] = time
        raise UserError(str(self.env.context) + str(vals))
        return super(staff_scheduler, self.with_context(context)).write(vals)

    # push the time worked into timesheet
    def writeTimesheet(self, worked_time):
        utils = staff_utils()
        user_id = self.user_id.id
        employee = self.env["hr.employee"].search([("user_id", "=", user_id)], limit=1)
        timesheet_cost = employee.timesheet_cost
        task_id = self.task_id.id
        # Check if the worked time entry is in the future.
        if self.checkFutureDay(datetime.strptime(self.date.strftime(DEFAULT_SERVER_DATE_FORMAT), DEFAULT_SERVER_DATE_FORMAT)):
            raise ValidationError(_("You cannot enter worked time in the future."))
        # check if the worked time has been changed.
        if worked_time is None:
            work_time_entry = self.work_time
        else:
            work_time_entry = worked_time
        amount = work_time_entry * timesheet_cost

        timeLines = self.env["account.analytic.line"]
        timesheets = timeLines.search([('user_id', '=', user_id), ('employee_id', '=', employee.id), ('date', '=', self.date), ('account_id', '=', task_id)], limit=1)

        if not timesheets:
            timeLines.create({
                'name': '/',
                'employee_id': employee.id,
                'account_id': task_id,
                'date': self.date,
                'amount': amount,
                'user_id': user_id,
                'general_account_id': 6,
                'unit_amount': work_time_entry,
            })
        else:
            timesheets.write({
                'amount': amount,
                'unit_amount': work_time_entry,
            })
        self.with_context({}).write({'work_time': work_time_entry, 'confirm': True})

    # check if past day. Return true if day is in the past
    def checkPastDay(self, dayDate):
        stamp = datetime.now()
        today = datetime(stamp.year, stamp.month, stamp.day)
        return dayDate < today

    # check if past day. Return true if day is in the past
    def checkFutureDay(self, dayDate):
        stamp = datetime.now()
        today = datetime(stamp.year, stamp.month, stamp.day)
        return dayDate > today
    
    
    @api.model
    def countActivitie(self,  users_id, start, end):
        ret = {}
        for user in users_id:
            listGet = self.search([('user_id', '=', user), ('date', '>=', start), ('date', '<=', end), ('task_id', '!=', False)])
            listTot = self.search([('user_id', '=', user), ('date', '>=', start), ('date', '<=', end)])
            ret[user] = [len(listGet), len(listTot)]
        return ret

    # Get user informations
    @api.model
    def getPersonalInfo(self, users_id):
        ret = {}
        authorizations = self.env["staff.authorization"]
        users = self.env["res.users"].search([("id", "in", users_id)])
        for user in users:
#             
            partner = user.partner_id
#             partners = self.env["res.partner"]
#             partner = partners.browse(partner_id)
            
            user_auth = authorizations.search([("user_id", "=", user.id)])
            auths = []
            
            for auth_obj in user_auth:
                #auth_obj = authorizations.browse(auth_id)
                #task = tasks.browse(auth_obj.task_id.id)
                auths.append(auth_obj.task_id.name)
            ret[user.id] = {"name": partner.name, "mobile": partner.mobile, "auths": auths, 'image': partner.image_medium}
        return ret

    # Swap activities for replacement
    @api.model
    def swapUidTask(self, task_id):
        # Check if task_id can is replaceable.
        task = self.browse(task_id)
        if not task.replaceable:
            raise ValidationError(_("This task is not replaceable."))
        # Check if user has the right authorization. No -> raise error. Yes -> continue.
        auths = self.env["staff.authorization"]
        auth = auths.search([("user_id", "=", self.env.uid), ("task_id", "=", task.task_id.id)])
        if len(auth) < 1:
            raise ValidationError(_("You do not have the authorization to replace this task."))
        # Check if uid has empty task_id. No task -> create one, Task defined -> raise error.
        task_self = self.search([("user_id", "=", self.env.uid), ("date", "=", task.date)])
        if len(task_self) < 1:
            self.create({"date": task.date})
            task_self = self.search([("user_id", "=", self.env.uid), ("date", "=", task.date)])
        task_s = self.browse(task_self[0])
        if task_s.task_id.id is not False:
            raise ValidationError(_("You have already a task. You can not replace."))
        # Swap user_ids
        self.write([task_s.id], {"user_id": task.user_id.id, "replaceable": False})
        self.write([task.id], {"user_id": self.env.uid, "replaceable": False})

    # add user_id to create the elements
    @api.model
    def create(self, vals):
        vals['user_id'] = self.env.uid
        vals['task_id'] = False
        # Control if an event is set this day.
        if 'date' in vals: #TOFIX
            listTasks = self.search([('date', '=', vals['date']), ('user_id', '=', self.env.uid)])
            if len(listTasks) >= 1:
                raise UserError(_("You have already an availability this day."))
        # Control if the changed date is in the future.
        # datetime.strptime(vals['date'], "%Y-%m-%d") < datetime.now():
            if self.checkPastDay(datetime.strptime(vals['date'], "%Y-%m-%d %H:%M:%S")):
                raise UserError(_("Only future dates can be changed."))
        return super(staff_scheduler, self).create(vals)

    # Remove an availability with assignement check.
    @api.multi
    def unlink(self):
        records = super(staff_scheduler, self).read(['id', 'task_id'])
        # raise Exception(records) if a user want remove an availibility with a task
        if(len(records) and records[0]['task_id']):
            raise UserError(_("You can't delete this availability because there is an assigned task on it."))
        # Check the unlink date.
        date = super(staff_scheduler, self).read(['date'])
        
        if self.checkPastDay(datetime.combine(date[0]['date'], datetime.min.time())):
            raise UserError(_("Only future dates can be changed."))
        return super(staff_scheduler, self).unlink()
