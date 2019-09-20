# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class staff_booking(models.Model):
    _name = "staff.booking"
    _rec_name = 'booking_name'

    booking_name = fields.Char('Booking', size=40, required=True)
    booking_type = fields.Many2one('staff.booking.type', 'Event Type', readonly=False, relate=True)
    date = fields.Date('Date', readonly=False, required=True)
    date_report = fields.Date('Date Report', readonly=False, required=False)
    come_all_weather = fields.Boolean('Come with all weather', readonly=False, required=False)
    hour_from = fields.Float('Start Hour', readonly=False)
    hour_to = fields.Float('End Hour', readonly=False)
    group_leader_name = fields.Char('Group leader name', size=255, required=True)
    group_leader_address = fields.Text('Group leader address')
    group_leader_email = fields.Char('Group leader email', size=255)
    group_leader_tel = fields.Char('Group leader Tel', size=50, required=True)
    nbr_adult = fields.Integer('Number of adults', readonly=False, required=True)
    nbr_child = fields.Integer('Number of children', readonly=False, required=True)
    price_adult = fields.Float('Price per adult', readonly=False, required=True)
    price_child = fields.Float('Price per child', readonly=False, required=True)
    nbr_wheelchair = fields.Integer('Number of wheelchair', readonly=False)
    price_wheelchair = fields.Float('Price per wheelchair', readonly=False)
    meal_included = fields.Boolean('Meal included', readonly=False)
    meal_price_adult = fields.Float('Price per adult meal', readonly=False)
    meal_price_child = fields.Float('Price per child meal', readonly=False)
    total_price = fields.Float('Total price', readonly=False)
    observation = fields.Text('Observation')
    meal_observation = fields.Text('Meal observation')
    create_uid = fields.Many2one('res.users', 'Created by', readonly=True)
    write_uid = fields.Many2one('res.users', 'Last modification by', readonly=True)

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

    # Return a dictionary from the list of date received.
    # Dic is: {key, total_people}
    @api.model
    def count_nbr_people(self, args):
        ret = {}
        for d in args:
            bookings = self.search([('date', '=', str(d))])
            total_people = 0
            for booking in bookings:
                total_people += booking.nbr_adult
                total_people += booking.nbr_child
                total_people += booking.nbr_wheelchair
            ret[d] = total_people
        return ret

    @api.onchange('meal_included', 'meal_price_child', 'meal_price_adult')
    def update_meal_include(self):
        self.total = 0.0
        if self.meal_included:
            total_price =  self.nbr_adult * self.price_adult + self.nbr_child * self.price_child + self.nbr_wheelchair * self.price_wheelchair
            total_price  += self.nbr_child * self.meal_price_child
            total_price += self.nbr_adult * self.meal_price_adult
            self.total_price = total_price
        else:
            self.total_price -= self.nbr_child * self.meal_price_child
            self.total_price -= self.nbr_adult * self.meal_price_adult

    @api.onchange('nbr_adult', 'price_adult', 'nbr_child', 'price_child', 'nbr_wheelchair', 'price_wheelchair')
    def update_total_price(self):
        total_price = 0
        total_price += self.nbr_adult * self.price_adult + self.nbr_child * self.price_child + self.nbr_wheelchair * self.price_wheelchair

        self.total_price = total_price
