odoo.define('staff_management.TimelineBase', function (require) {
"use strict";
	var core = require('web.core');

	var _t = core._t;
	var QWeb = core.qweb;
	var config = require('web.config');

	var CalendarView = require('web.CalendarView');
	var TimelineRenderer = require('staff_management.TimelineRenderer');
	
	var AbstractController = require("web.AbstractController");
	
	var Timeline =  CalendarView.extend({
		
		config: _.extend({}, CalendarView.prototype.config, {
			Renderer: TimelineRenderer,
			
		}),
//		// ODOO
//		init:function(parent, dataset, view_id, options){
//			this._super.apply(this, arguments);
//
//			this.before_print_generated = false;
//			var self = this;
//			if (window.matchMedia) {
//				var mediaQueryList = window.matchMedia('print');
//				mediaQueryList.addListener(function(mql) {
//					if (mql.matches) {
//						self.beforePrint();
//					}
//				});
//			}
//			window.onbeforeprint = function(){
//				self.beforePrint();
//			};
//		},
//		
//		destroy:function(){
//			this._super();
//		},
		
		// NOT ODOO
		/*
//		datas = [{
//			 'cells': [event_data],
//			 'lineID': lid,
//			 'username': e['user_id'][1],
//		 };
//	*/
//	update_datas: function(datas){
//		this.datas = datas;
//		this.render_timeline();
//	},
		
//		refresh_events: function(){
//			this.do_search(this.lastSearch.domain, this.lastSearch.context, this.lastSearch._group_by);
//		},
		
//		format_date: function(date, format){
//			return $.fullCalendar.formatDate(date, format, {
//				monthNames: Date.CultureInfo.monthNames,
//				monthNamesShort: Date.CultureInfo.abbreviatedMonthNames,
//				dayNames: Date.CultureInfo.dayNames,
//				dayNamesShort: Date.CultureInfo.abbreviatedDayNames,
//			});
//		},

//		do_search: function(domain, context, _group_by) {
//			this.lastSearch = {
//				'domain': domain,
//				'context': context,
//				'_group_by': _group_by
//			};
//		},
//		/*
//		refresh_event: function(lineID, eventList, date){
//			// replace eventlist in datas
//			var data = this.datas[i];
//			var colNumber = 0;
//			for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
//				colNumber ++;
//				for(var j=0 ; j<data['cells'].length ; j++){
//					if(this.isSameDate(data['cells'][j]['date'], cdate)){
//						this.datas[i]['cells'][j] = eventList;
//					}
//				}
//			}
//
//			// refresh event view
//			var lineNumber = this.lineIndex.indexOf(lineID);
//			var tr = $('.stimeline_table table tbody tr').item(lineNumber);
//			var td = tr.find('td').item(colNumber);
//
//			td.empty();
//			td.append('BOOM');
//		},
//		*/
	});

return Timeline
});