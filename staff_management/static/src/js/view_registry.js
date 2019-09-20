odoo.define('staff_registry.view_registry', function (require) {
"use strict";

var view_registry = require('web.view_registry');

var CalendarBooking = require('staff_management.CalendarBooking');
var PersonalSchedule = require('staff_management.PersonalSchedule');
var GeneralSchedule = require('staff_management.GeneralSchedule');
var Replacement = require('staff_management.Replacement');
var SalaryTimeline = require('staff_management.SalaryTimeline');
var Scheduler = require('staff_management.Scheduler');
var TimeCheck = require('staff_management.TimeCheck');

view_registry
    .add('calendar_booking', CalendarBooking)
    .add('calendar_personal', PersonalSchedule)
    .add('calendar_general', GeneralSchedule)
    .add('replacement', Replacement)
    .add('salary_timeline', SalaryTimeline)
    .add('calendar_scheduler', Scheduler)
    .add('calendar_timecheck',TimeCheck)
    
});