odoo.define('staff_management.Calendar', function (require) {
"use strict";

    var CalendarView = require('web.CalendarView');
    var CalendarModel = require('web.CalendarModel');
    
    var MyCalendarRender = require('staff_management.CalendarRenderer');
    
    var MyCalanderModel = CalendarModel.extend({
    	_getFullCalendarOptions: function () {
    		//shortTimeformat = Date.CultureInfo.formatPatterns.shortTime;
    		return  _.extend({}, this._super(), {
    			buttonText : {
    				today:	_t("Today"),
    				month:	_t("Month"),
    				week:	_t("Week"),
    				day:	_t("Day")
    			},
    			weekNumbers: false,
    			//axisFormat : shortTimeformat.replace(/:mm/,'(:mm)'), deprecated. use slotLabelFormat
    			//slotLabelFormat: _t.database.parameters.time_format.search("%H") != -1 ? 'H:mm': 'h(:mm)a',
    				
//    			views : {
//    				agenda: {
//    					// for agendaWeek and agendaDay
//    					timeFormat: shortTimeformat + '{ - ' + shortTimeformat + '}', // 5:00 - 6:30
//    				}
//    			},
//    			// for all other views
//    			timeFormat : shortTimeformat.replace(/:mm/,'(:mm)'),  // 7pm
    			
    			//weekMode : 'liquid', deprecated
    			aspectRatio: 1.8,
    			snapMinutes: 15
    		});
        },
    	
    });
    
	var Calendar = CalendarView.extend({
		config: _.extend({}, CalendarView.prototype.config, {
			Renderer: MyCalendarRender,
	        Model: MyCalanderModel,
		}),

//		init:function(){
//			this._super.apply(this,arguments);
//						var self = this;
//			
//			self.$calendar.fullCalendar(self.get_fc_init_options());
//
//			$('.fc-button-next').empty().text('Mois').append($('<span>').addClass('fc-text-arrow').text('»')); TODO
//			$('.fc-button-prev').empty().append($('<span>').addClass('fc-text-arrow').text('«')).append('Mois'); TODO
//			
//			return $.when();
//		},
		
//		init: function (viewInfo, params) {
//	        this._super.apply(this, arguments);
//		}
//		
		// No slidebar
//		init_calendar: function() {
//			var self = this;
//			
//			self.$calendar.fullCalendar(self.get_fc_init_options());
//
//			$('.fc-button-next').empty().text('Mois').append($('<span>').addClass('fc-text-arrow').text('»'));
//			$('.fc-button-prev').empty().append($('<span>').addClass('fc-text-arrow').text('«')).append('Mois');
//			
//			return $.when();
//		},
		
		format_hour_duration: function(hour_start, hour_end){
			hour_start = parseFloat(hour_start);
			hour_end = parseFloat(hour_end);
			if(isNaN(hour_start)){
				hour_start = 0;
			}
			if(isNaN(hour_end)){
				hour_end = 0;
			}
			return this.convert_hour(hour_end-hour_start);
		},
		
		zeroPad: function(num, places) {
			var zero = places - num.toString().length + 1;
			return Array(+(zero > 0 && zero)).join("0") + num;
		}
		
	});

return Calendar

});
