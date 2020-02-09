odoo.define('staff_management.PersonalSchedule', function (require) {
"use strict";	

var Calendar = require('staff_management.Calendar');
var CalendarController = require('web.CalendarController');
var MyCalendarRenderer = require('staff_management.CalendarRenderer');


var Tooltip = require('staff_management.Tooltip');

var PersonalScheduleController = CalendarController.extend({
	custom_events: _.extend({}, CalendarController.prototype.custom_events, {
		removeAvailability: '_onRemoveAvailability',
		onAddEvent: '_onAddEvent',
        
    }),
    renderButtons: function($node) {
        var self = this;
    	this._super.apply(this, arguments);

        this.$buttons.find('.o_calendar_button_day').css({'display': 'none'});
        this.$buttons.find('.o_calendar_button_week').css({'display': 'none'});
        this.$buttons.find('.o_calendar_button_month').css({'display': 'none'});
    	
        this.$buttons.find(".o_calendar_button_prev").replaceWith($("<span class='fc-button fc-button-prev fc-state-default fc-corner-left o_calendar_button_prev' unselectable='on'><span class='fc-text-arrow'>«</span>Mois</span>"));
        this.$buttons.find(".o_calendar_button_today").replaceWith($("<span class='fc-button fc-button-today fc-state-default fc-state-disabled o_calendar_button_today' unselectable='on'>Today</span>"));
        this.$buttons.find(".o_calendar_button_next").replaceWith($("<span class='fc-button fc-button-next fc-state-default fc-corner-right o_calendar_button_next' unselectable='on'>Mois<span class='fc-text-arrow'>»</span></span>"));
     },
     reload: function () {
         var self = this;
         return this._super.apply(this, arguments).then(function () {
             // TODO: Enable disable code should be here, but we don't have start_date and end_date
//             var today = new Date();
//             today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//             if(self.range_start <= today && today <= self.range_stop) {
//                 $('.fc-button-today').addClass('fc-state-disabled');
//             }
//             else{
//                 $('.fc-button-today').removeClass('fc-state-disabled');
//             }
         });
     },
    
    _onAddEvent: function(event){
    	var self = this;
    	this.model.createRecord(event).then(function() {
			//self.renderer.refresh_event(id);
			//self.renderer.$calendar.fullCalendar('unselect');
    		self.reload();
		}).fail(function(r, event) {				
			if(self.quick_create_error){
				event.preventDefault(); // don't show multiple warning messages
			}
			else{
				self.quick_create_error = true;
				setTimeout(function(){self.quick_create_error = false},200);
			}
			self.renderer.$calendar.fullCalendar('unselect');
			
		});
    },
    
    _onRemoveAvailability: function(event) {
		var self = this;
		var eventData = event.data;
		
		self.model.deleteRecords([eventData.id], self.modelName).then(function() {
			self.reload();
			self.renderer.$calendar.fullCalendar('removeEvents', eventData.id);
			var strDate = moment(eventData.start, 'DD.MM.YYYY').format('YYYY-MM-DD');
			self.renderer.$calendar.fullCalendar('unselect');
			self.renderer.$calendar.find('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
		}).fail(function(r, event) {				
			if(self.quick_create_error){
				event.preventDefault(); // don't show multiple warning messages
			}
			else{
				self.quick_create_error = true;
				setTimeout(function(){self.quick_create_error = false},200);
			}
			self.renderer.$calendar.fullCalendar('unselect');
		});
	},
});
var PersonalScheduleRenderer = MyCalendarRenderer.extend({

	template: "PersonalScheduleView",
		
//		init:function() { TODO
//			this._super.apply(this,arguments);
//			this.options.confirm_on_delete = false;
//		},
//		
//		// destroy, restore scheduler fonctions
//		destroy:function(){
//			this._super();
//		},

	get_tooltip_content: function(event){

		var div = $('<div>');
		div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)));
		div.append($('<div>').text(event.task_id[1]));
		if(event.comment){
			div.append($('<div>').text(event.comment));
		}
		if(event.confirm){
			div.append($('<div>').text(_t("Entered working time:")+' '+this.format_hour(event.work_time)));
		}

		return div;
	},
	
	toggle_replacement: function(event){
		event.replaceable = !event.replaceable;
		this.trigger_up('updateRecord', event);
		
	},
	
	toggle_availabilities: function(start_date, end_date){
		var start_day = start_date;
		var stop_day = end_date;
		if (end_date == null || _.isUndefined(end_date)) {
			stop_day = start_day;
		}
		
		
		for (var d=start_day; d<stop_day; d=d.add(1, 'days')){
			this.toggle_availability(d);
		}
	},

	toggle_availability: function(date){
		
		var self = this;
	    	var eventg = {};
		var isAlreadyAnEvent = false;
		var eventData = {};
		var emptyEvent = true
		this.$calendar.fullCalendar('clientEvents', function(event) {
			var d1 = moment(event.start, 'DD.MM.YYYY').format('YYYY-MM-DD');
			var d2 =  moment(date, 'DD.MM.YYYY').format('YYYY-MM-DD');
			if(d1 == d2){
				if(emptyEvent){
					eventData = event.record;
					eventg = event;
					emptyEvent = false;
				}
				isAlreadyAnEvent = true;		
			}
		});
		
		if(isAlreadyAnEvent){
			if(eventData.task_id){
				this.toggle_replacement(eventg);
				return;
			}
			this.trigger_up("removeAvailability", eventg);
			return;  
		}
		eventg.data = {
			//date : moment(date, 'DD.MM.YYYY').format('YYYY-MM-DD'),
			name : _t("Available"),
			start : date,
			allDay: true,
		}
		
		eventg.options = {context: {}};
		this.trigger_up("onAddEvent", eventg);
	},
	
	get_fc_init_options: function () {
		//Documentation here : http://arshaw.com/fullcalendar/docs/
		var self = this;
		return  _.extend({}, this._super(), {
			
			eventClick: function(event){
				self.toggle_replacement(event);
			},
			select: function (start_date, end_date, all_day, _js_event, _view) {
				self.toggle_availabilities(start_date, end_date);
			},
			eventDestroy: function(event, element, view){
				var strDate = moment(event.start, 'DD.MM.YYYY').format('YYYY-MM-DD');
				self.$calendar.find('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
			},
			eventRender: function(event, element) {	
				var record = event.record;
				var strDate = moment(event.start, 'DD.MM.YYYY').format('YYYY-MM-DD');
				self.$calendar.find('.fc-day[data-date|="'+strDate+'"]').addClass('staff_available');
				if(record.task_id){
					
					
					var color = self.color_palette[record.task_id[0] % self.color_palette.length];
	
					var replacementText = '';
					if(record.replaceable){
						replacementText = _t('Waiting replacement');
					}
	
					element.html('<div>'+self.format_hour(record.hour_from)+' '+record.task_id[1]+'</div>'+'<div>'+replacementText+'</div>');
					element.css({'background': color});
					element.css({'border-color': color});
					element.mouseenter(event, function(evt){
						Tooltip.show($(this), self.get_tooltip_content(evt.data.record));
					}).mouseleave(Tooltip.hide);
				}else{
					element.css({'display': 'none'});
				}
			},
			fixedWeekCount : false,
		});
	},
});
		
// //TODO
//		event_data_transform: function(evt) {
//			var r = this._super.apply(this,arguments);
//			r.task_id = evt.task_id;
//			r.comment = evt.comment;
//			r.hour_from = evt.hour_from;
//			r.hour_to = evt.hour_to;
//			r.replaceable = evt.replaceable;
//			r.work_time = evt.work_time;
//			r.confirm = evt.confirm;
//			return r;
//		},
//

var PersonalSchedule = Calendar.extend({

	config: _.extend({}, Calendar.prototype.config, {
		Renderer: PersonalScheduleRenderer,
		Controller: PersonalScheduleController,
	}),

});
return PersonalSchedule;

});
