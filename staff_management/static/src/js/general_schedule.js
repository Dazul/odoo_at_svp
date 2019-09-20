odoo.define('staff_management.GeneralSchedule', function (require) {
"use strict";	
	
	var Timeline = require('staff_management.TimelineBase');
	var GeneralScheduleRenderer = require('staff_management.GeneralScheduleRenderer');
	var GeneralScheduleController = require('staff_management.GeneralScheduleController');
	var GeneralScheduleModel = require('staff_management.GeneralScheduleModel');
	
	var GeneralSchedule = Timeline.extend({	
		config: _.extend({}, Timeline.prototype.config, {
			Renderer: GeneralScheduleRenderer,
			Model: GeneralScheduleModel,
			Controller: GeneralScheduleController,
		}),
	});

return GeneralSchedule;

});