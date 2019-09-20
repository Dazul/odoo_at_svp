odoo.define('staff_management.TimeCheck', function (require) {
"use strict";	
	var Tooltip = require('staff_management.Tooltip');
	var Scheduler = require ('staff_management.Scheduler');
	var ScheduleRenderer = require('staff_management.ScheduleRenderer');
	
	var ScheduleModel = require('staff_management.ScheduleModel');
	
	var TimeCheckModel = ScheduleModel.extend({
		loadSchedulerData : false,
		get_range_domain: function(domain, start, end) {
			
			var extend_domain = this._super.apply(this, arguments);
			extend_domain.push(['task_id', '!=', null]);
	
			return extend_domain;
		},
	});
	
	var TimeCheckRenderer = ScheduleRenderer.extend({
		init: function (parent, state, params) {
			var self = this;
			
			this._super.apply(this, arguments);
			this.schedule = false;
			this.set_nbrOfHeaderLines(1);
			
		},
		start: function () {
			 
			this.trigger_up('load_quick_create_timecheck');
			return this._super();
		 },
		_render: function () {
	    	var self = this;
	    	return this._super.apply(this, arguments).then(function(){
	    		self.trigger_up('get_view_form_timecheck');
	    		
	    	});
		},
		renderCellLeft: function(th, data){
			return th.append($('<span>').text(data['username']));
		},
	
		renderCell: function(td, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;
				if(evt.confirm){
					td.addClass('staff_assigned');
					td.text(self.format_hour(evt.work_time));
					td.addClass('clickable');
					td.mouseenter(evt, function(evt){
						Tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(Tooltip.hide);
				}
				else if(evt.task_id){
					td.addClass('staff_available');
					td.text(self.format_hour(evt.hour_from)+' à '+self.format_hour(evt.hour_to));
					td.addClass('clickable');
					td.mouseenter(evt, function(evt){
						Tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(Tooltip.hide);
				}
			}
			return td;
		},
		format_hour_duration: function(hour_start, hour_end){
			hour_start = parseFloat(hour_start);
			hour_end = parseFloat(hour_end);
			if(isNaN(hour_start)){
				hour_start = 0;
			}
			if(isNaN(hour_end)){
				hour_end = 0;
			}
			return this.format_hour(hour_end-hour_start);
		},
	
		get_tooltip_content: function(event){
			var div = $('<div>');
			div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)+' ('+_t('duration')+' '+this.format_hour_duration(event.hour_from, event.hour_to)+')'));
			div.append($('<div>').text(event.task_id[1]));
			if(event.confirm){
				div.append($('<div>').text(_t("Entered:")+' '+this.format_hour(event.work_time)));
			}
			else{
				div.append($('<div>').text(_t("No hour entered")+' ('+this.format_hour(event.work_time)+')'));
			}
			if(event.comment){
				div.append($('<div>').text(event.comment));
			}
			return div;
		},
		cellClicked: function(lineID, date, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;
				
//				if(this.isQuickAssignEnabled()){
//					this.apply_quickAssignToEvent(evt);
//					return;
//				}
				
				
				if(evt.task_id){
					this.trigger_up('openTimecheckEvent', evt);

				}
			}
		},
		
//	apply_quickAssignToEvent: function(event){
//		var self = this;
//		var data = {
//			'work_time': this.quick_asign_work_time.get_value(),
//			'confirm': true,
//		};
//		this.dataset.write(event.id, data, {}).done(function() {
//			Tooltip.hide();
//			self.refresh_events();
//		});
//		
//	},
//	
//	load_quickAssign: function(){
//		var self = this;
//		
//		dfm_mine = new DefaultFieldManager(this);
//		dfm_mine.extend_field_desc({
//			quicktask: {
//				relation: "account.analytic.account",
//			},
//		});
//
//		var table = $('<table>').addClass('quickassign');
//		var tr = $('<tr>');
//
//		var input = $('<input>').attr('type', 'checkbox').attr('id', 'quickassignInput').addClass('quickassignCheckbox');
//		var td = $('<td>').append(input);
//		td.append($('<label>').attr('for', 'quickassignInput').text(_t('Quick assign')));
//		tr.append(td);
//
//		this.quick_asign_work_time = new FieldFloat(dfm_mine, // start hour
//			{
//			attrs: {
//				name: "work_time",
//				type: "char",
//				widget: "float_time",
//				domain: [],
//				context: {},
//				modifiers: '',
//				},
//			}
//		);
//
//		var td_start_title = $('<td>').addClass('text hidden qa_hide').text(_t('Worked time'));
//		tr.append(td_start_title);
//		var td_start = $('<td>').addClass('hidden qa_hide');
//		this.quick_asign_work_time.prependTo(td_start);
//		tr.append(td_start);
//		
//		tr.append($('<td>').css({'width': '50%'}));
//
//		input.click(function(){
//			if($(this).is(':checked')){
//				$('.quickassign .qa_hide').removeClass('hidden');
//			}
//			else{
//				$('.quickassign .qa_hide').addClass('hidden');
//				self.quick_asign_work_time.set_value(""); // reset task selection when quit quick assign
//			}
//		});
//
//		table.append(tr);
//		$('.stimeline_header').append(table);
//
//	},
	});
	
//	var Tooltip = require('staff_management.Tooltip');
//
//	var FormOpenPopup = require('web.FormOpenPopup');
//	var time = require('web.time');
//	var Model = require('web.Model')
//	var CompoundDomain = require('web.CompoundDomain')
//	var FormOpenPopup = require('web.FormOpenPopup');
//	var DefaultFieldManager = require('web.DefaultFieldManager');
//	var FieldFloat = ('web.FieldFloat');
	
	var TimeCheck = Scheduler.extend({	
		config: _.extend({}, Scheduler.prototype.config, {
			Renderer: TimeCheckRenderer,
			Model: TimeCheckModel,
			//Controller: CalendarBookingController,
		}),
	});
return TimeCheck
});

