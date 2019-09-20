# -*- coding: utf-8 -*-
from datetime import datetime
import calendar
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT

class staff_utils():

    # Get the first day of month of date passed in parameter
    def get_first_day_month(self, date):
        day = date
        start_date = datetime(day.year, day.month, 1)
        return start_date.strftime(DEFAULT_SERVER_DATE_FORMAT)

    # Get the last day of month of date passed in parameter
    def get_last_day_month(self, date):
        day = date
        last_day = calendar.monthrange(day.year, day.month)[1]
        end_date = datetime(day.year, day.month, last_day)
        return end_date.strftime(DEFAULT_SERVER_DATE_FORMAT)
