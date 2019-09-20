odoo.define('staff_management.CalendarRenderer', function (require) {
"use strict"; 

var CalanderRenderer = require('web.CalendarRenderer');
var core = require('web.core');

var _t = core._t;

var MyCalendarRenderer = CalanderRenderer.extend({
	color_palette: [
		'#804040',
		'#008080',
		'#004080',
		'#8080FF',
		'#800040',
		'#FF0080',
		'#804000',
		'#FF8000',
		'#008000',
		'#008040',
		'#0000FF',
		'#000040',
		'#800080',
		'#8000FF',
		'#400040',
		'#808000',
		'#004040',
		'#800000'
	],
    	_initCalendar: function () {
            var self = this;

            this.$calendar = this.$(".o_calendar_widget");

            // This seems like a workaround but apparently passing the locale
            // in the options is not enough. We should initialize it beforehand
            var locale = moment.locale();
            $.fullCalendar.locale(locale);

            //Documentation here : http://arshaw.com/fullcalendar/docs/
            var fc_options = $.extend({}, self.get_fc_init_options(), {
                
                eventResize: function (event) {
                    self.trigger_up('updateRecord', event);
                },
                
                // Dirty hack to ensure a correct first render
                eventAfterAllRender: function () {
                    $(window).trigger('resize');
                },
                viewRender: function (view) {
                    // compute mode from view.name which is either 'month', 'agendaWeek' or 'agendaDay'
                    var mode = view.name === 'month' ? 'month' : (view.name === 'agendaWeek' ? 'week' : 'day');
                    self.trigger_up('viewUpdated', {
                        mode: mode,
                        title: view.title,
                    });
                },
                height: 'parent',
                unselectAuto: false,
                isRTL: _t.database.parameters.direction === "rtl",
                locale: locale, // reset locale when fullcalendar has already been instanciated before now
            });

            this.$calendar.fullCalendar(fc_options);
        },
        
        get_fc_init_options: function () { 
			//Documentation here : http://arshaw.com/fullcalendar/docs/
			var self = this;
			return _.extend({}, self.state.fc_options, {
				
				defaultView: "month",
//				header: {
//					left: 'prev,today,next',
//					center: 'title',
//					right: '' // 'month' Nothing, only one view
//				},
				//selectable: !this.options.read_only_mode && this.create_right,
				//selectHelper: true,
				//editable: !this.options.read_only_mode,
				droppable: false,
				eventStartEditable: false,
				unselectAuto: false,

				// callbacks
				
				eventRender: function (event, element) {
                	
                    var $render = $(self._eventRender(event));
                    event.title = $render.find('.o_field_type_char:first').text();
                    element.find('.fc-content').html($render.html());
                    element.addClass($render.attr('class'));
                    var display_hour = '';
                    if (!event.allDay) {
                        var start = event.r_start || event.start;
                        var end = event.r_end || event.end;
                        var timeFormat = _t.database.parameters.time_format.search("%H") != -1 ? 'HH:mm': 'h:mma';
                        display_hour = start.format(timeFormat) + ' - ' + end.format(timeFormat);
                        if (display_hour === '00:00 - 00:00') {
                            display_hour = _t('All day');
                        }
                    }
                    element.find('.fc-content .fc-time').text(display_hour);
                },

				eventDrop: function (event) {
                    self.trigger_up('updateRecord', event);
                },
                eventClick: function (event) {
                    self.trigger_up('openEvent', event);
                    self.$calendar.fullCalendar('unselect');
                },
                
                select: function (target_date, end_date, event, _js_event, _view) {
                    var data = {'start': target_date, 'end': end_date};
                    if (self.state.context.default_name) {
                        data.title = self.state.context.default_name;
                    }
                    self.trigger_up('openCreate', data);
                    self.$calendar.fullCalendar('unselect');
                },
                
                eventAfterRender: function(event, element, view){
                	if ((view.name !== 'month') && (((event.end - event.start)/60000)<=30)) {
						//if duration is too small, we see the html code of img
						var current_title = $(element.find('.fc-time')).text();
						var new_title = current_title.substr(0, current_title.indexOf("<img") > 0 ? current_title.indexOf("<img"):current_title.length);
						element.find('.fc-time').html(new_title);
					} 
                	
                },
                fixedWeekCount: false,
//				eventResize: function (event, _day_delta, _minute_delta, _revertFunc) {
//					var data = self.get_event_data(event);
//					self.proxy('update_record')(event._id, data);
//				},
//				eventRender: function (event, element, view) {
//					element.find('.fc-event-title').html(event.title);
//				},
//				eventAfterRender: function (event, element, view) { 
//					if ((view.name !== 'month') && (((event.end-event.start)/60000)<=30)) {
//						//if duration is too small, we see the html code of img
//						var current_title = $(element.find('.fc-event-time')).text();
//						var new_title = current_title.substr(0,current_title.indexOf("<img")>0?current_title.indexOf("<img"):current_title.length);
//						element.find('.fc-event-time').html(new_title);
//					}
//				},
//				eventClick: function (event) { self.open_event(event._id,event.title); },
//				select: function (start_date, end_date, all_day, _js_event, _view) {
//					var data_template = self.get_event_data({
//						start: start_date,
//						end: end_date,
//						allDay: all_day,
//					});
//					self.open_quick_create(data_template);
//
//				},
				
				//height: $('.oe_view_manager_body').height() - 5, TODO set parent - 5
				//handleWindowResize: true,
//				windowResize: function(view) { TODO
//					self.$calendar.fullCalendar('option', 'height', $('.oe_view_manager_body').height() - 5);
//				}

			});
		},
		// Format number for hour
		FormatNumberLength: function(num, length) {
			var r = "" + num;
			while (r.length < length) {
				r = "0" + r;
			}
			return r;
		},
	
		// convert hour from 9.5 to 09:30
		format_hour: function(hour){
			hour = parseFloat(hour);
			if(hour == undefined || isNaN(hour)){
				return '00:00';
			}
			var h = Math.floor(hour);          
			var m = Math.round((hour-h) * 60);
			return this.FormatNumberLength(h, 2)+':'+this.FormatNumberLength(m, 2);
		},
    	
    });
return MyCalendarRenderer;
});