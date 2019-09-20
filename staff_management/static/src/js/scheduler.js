odoo.define('staff_management.Scheduler', function (require) {
"use strict";	
	var time = require("web.time");
	var GeneralSchedule = require('staff_management.GeneralSchedule');
	var ScheduleRenderer = require('staff_management.ScheduleRenderer');
	var GeneralSchedule = require('staff_management.GeneralSchedule');
	var GeneralScheduleController = require('staff_management.GeneralScheduleController');
	var GeneralScheduleModel = require('staff_management.GeneralScheduleModel');

	var ScheduleModel = require('staff_management.ScheduleModel');
		
	var Scheduler = GeneralSchedule.extend({
		config: _.extend({}, GeneralSchedule.prototype.config, {
			Renderer: ScheduleRenderer,
			Model: ScheduleModel,
		}),
		init: function () {
			this._super.apply(this, arguments);
			this.set_interval('day', 1);
			this.loadParams.interval_mode = this.interval_mode;
			this.loadParams.interval_nbr = this.interval_nbr;

			this.rendererParams.interval_mode = this.interval_mode;
			this.rendererParams.interval_nbr = this.interval_nbr;
		},
		set_interval: function(interval_mode, interval_nbr){
			this.interval_mode = interval_mode;
			this.interval_nbr = interval_nbr;
		},

//		view_loading: function (fv) {
//		this._super.apply(this, arguments);
//		this.load_quickAssign();
//	},     		
//
//		apply_quickAssignToEvent: function(event){
//			var self = this;			
//			var data = {
//				'task_id': this.quick_asign.get_value(),
//				'hour_from': this.quick_asign_hour_start.get_value(),
//				'hour_to': this.quick_asign_hour_stop.get_value(),
//			};
//			this.dataset.write(event.id, data, {}).done(function() {
//				Tooltip.hide();
//				self.refresh_events();
//			});
//			
//		},
//
//		isQuickAssignEnabled: function(){
//			return $('.quickassignCheckbox').is(':checked');
//		},
//
//		load_quickAssign: function(){
//			var self = this;
//
//			var table = $('<table>').addClass('quickassign');
//			var tr = $('<tr>');
//
//			var input = $('<input>').attr('type', 'checkbox').attr('id', 'quickassignInput').addClass('quickassignCheckbox');
//			var td = $('<td>').append(input);
//			td.append($('<label>').attr('for', 'quickassignInput').text(_t('Quick assign')));
//			tr.append(td);
//
//			dfm_mine = new DefaultFieldManager(this);
//			dfm_mine.extend_field_desc({
//				quicktask: {
//					relation: "account.analytic.account",
//				},
//			});
//			this.quick_asign = new QuickAssign(dfm_mine, // task select
//				{
//				attrs: {
//					name: "quicktask",
//					type: "many2one",
//					widget: "many2one",
//					domain: [],
//					context: {},
//					modifiers: '',
//					},
//				}
//			);
//
//			var td_task_title = $('<td>').addClass('text hidden qa_hide').text(_t('Task'));
//			tr.append(td_task_title);
//			var td_task = $('<td>').addClass('taskcell hidden qa_hide');
//			this.quick_asign.prependTo(td_task);
//			tr.append(td_task);
//
//			this.quick_asign_hour_start = new FieldFloat(dfm_mine, // start hour
//				{
//				attrs: {
//					name: "hour_start",
//					type: "char",
//					widget: "float_time",
//					domain: [],
//					context: {},
//					modifiers: '',
//					},
//				}
//			);
//
//			var td_start_title = $('<td>').addClass('text hidden qa_hide').text(_t('Start hour'));
//			tr.append(td_start_title);
//			var td_start = $('<td>').addClass('hidden qa_hide');
//			this.quick_asign_hour_start.prependTo(td_start);
//			tr.append(td_start);
//
//			this.quick_asign_hour_stop = new FieldFloat(dfm_mine, // end hour
//				{
//				attrs: {
//					name: "hour_start",
//					type: "char",
//					widget: "float_time",
//					domain: [],
//					context: {},
//					modifiers: '',
//					},
//				}
//			);
//
//			var td_end_title = $('<td>').addClass('text hidden qa_hide').text(_t('End hour'));
//			tr.append(td_end_title);
//			var td_end = $('<td>').addClass('hidden qa_hide');
//			this.quick_asign_hour_stop.prependTo(td_end);
//			tr.append(td_end);
//
//
//
//			input.click(function(){
//				if($(this).is(':checked')){
//					$('.quickassign .qa_hide').removeClass('hidden');
//				}
//				else{
//					$('.quickassign .qa_hide').addClass('hidden');
//					self.quick_asign.set_value(""); // reset task selection when quit quick assign
//				}
//			});
//
//			table.append(tr);
//			$('.stimeline_header').append(table);
//		},
//
//	});
//
//	// extend a FieldMany2One for the quick assign function
//	QuickAssign = FieldMany2One.extend({
//		// color the cells
//		applyQuickAssign: function(){
//			if(this.quickAssignAuth && this.get_value() !== false){
//				$('.staff_assigned,.staff_available').addClass('unselectable');
//				
//				for(var i=0 ; i<this.quickAssignAuth.length ; i++){
//					auth_class = 'evt_user_'+this.quickAssignAuth[i].user_id;
//					$('.'+auth_class).removeClass('unselectable');
//				}
//			}
//		},
//		
//		isUserIDAuthorized: function(userID){
//			var ret = false;
//			if(this.quickAssignAuth && this.get_value() !== false){
//				for(var i in this.quickAssignAuth){
//					if(this.quickAssignAuth[i].user_id[0] == userID){
//						ret = true;
//						break;
//					}
//				}
//			}
//			else{
//				ret = true; // Allow to remove an assignation quickly.
//			}
//			return ret;
//		},
//		
//		// change value, reload autorisations
//		internal_set_value: function(value_) {
//			this._super.apply(this, arguments);
//			if(value_ === false){
//				$('.unselectable').removeClass('unselectable');
//				return;
//			}
//			var authorization = new Model('staff.authorization');		
//			var filter = new Array();
//			filter.push(['task_id', '=', this.get_value()]);
//			var self = this;			
//			authorization.query(['task_id', 'user_id']).filter(filter).all().then(function(auth){
//				self.quickAssignAuth = auth;
//				self.applyQuickAssign();
//			});
//		},
//		
//		// instanciation
//		initialize_field: function() {
//			this.is_started = true;
//			ReinitializeFieldMixin.initialize_field.call(this);
//		},
//		
	});

return Scheduler;
});
