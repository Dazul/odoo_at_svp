odoo.define('staff_management.GeneralScheduleController', function (require) {
"use strict";	
	var core = require('web.core');
	var time = require('web.time');
	var _t = core._t;
	var QWeb = core.qweb;
	var config = require('web.config');
	var Widget = require('web.Widget');
	var Dialog = require('web.Dialog');

	var dialogs = require('web.view_dialogs');
	var CalendarController = require("web.CalendarController");
	var ScheduleQuickCreate = require("staff_management.ScheduleQuickCreate");
	
	function dateToServer (date) {
		
	    return date.clone().utc().locale('en').format('YYYY-MM-DD HH:mm:ss');
	}
	
	var TimecheckQuickCreate = Widget.extend({
		template: 'staff_timeline_quick_create_timecheck',
		quick_create_on: false,
		start: function () {
	        this._super();
	        var self = this;
	        this.$el.on('click', '.quickassignCheckbox', function(){
				if($(this).is(':checked')){
					self.$el.find('.qa_hide').removeClass('o_hidden');
					self.quick_create_on = true;
				}
				else{
					self.$el.find('.qa_hide').addClass('o_hidden');
					self.quick_create_on = false;
					//self.quick_asign.set_value(""); // reset task selection when quit quick assign
				}
			
	        });
		}
	});
	
	var GeneralScheduleController = CalendarController.extend({
		custom_events: _.extend({}, CalendarController.prototype.custom_events, {
			replace_task: '_onReplaceTask',
			hide_export_buttons: '_onHideExportButtons',
			openScheduleEvent: '_onOpenScheduleEvent',
			openTimecheckEvent: '_onOpenTimecheckEvent',
			get_view_form_timecheck: '_onGetViewFormTimecheck',
			load_quick_create: '_onLoadQuickCreate',
			load_quick_create_timecheck: '_onLoadQuickCreateTimecheck'
	    }),
	    _onGetViewFormTimecheck: function(){
	    	
	    	return this.model.get_view_form_timecheck();
	    },
		isQuickAssignEnabled: function() {
			return this.scheduleQuickCreate.quick_create_on;
		},
		apply_quickAssignToEvent: function(event){
			var self = this;
			var $start_hour = this.scheduleQuickCreate.$el.find('.start_hour');
			var $end_hour = this.scheduleQuickCreate.$el.find('.end_hour');
			var data = {
				'task_id': this.scheduleQuickCreate.many2one.value.res_id || false,
				// 'hour_from': parseFloat($start_hour.val()) || 0.0,
				// 'hour_to': parseFloat($end_hour.val()) || 0.0,
				'hour_from': parseFloat(this.scheduleQuickCreate.starthour.value) || 0.0,
				'hour_to': parseFloat(this.scheduleQuickCreate.endhour.value) || 0.0,
			};
			this.model.updateRecord(event.id, data).done(function() {
				self.reload().then(function () {
					self.scheduleQuickCreate.many2one.applyQuickAssign();
				});
			});
		},
		apply_quickAssignToEvent_timecheck: function(event) {
			var self = this;
			var $work_hour = this.scheduleQuickCreate.$el.find('.work_hour');
			var data = {
				'work_time': parseFloat($work_hour.val()),
				'confirm': true,
			};
			this.model.updateRecord(event.data.id, data).done(function() {
				self.reload();
			});
		},
		_onLoadQuickCreate: function(event){
			this.$quick_create_bar = this.$buttons.find('.quick_create_bar');

			this.scheduleQuickCreate = new ScheduleQuickCreate(this, event.data.options);
			this.scheduleQuickCreate.title = _("Task");
			this.scheduleQuickCreate.appendTo(this.$quick_create_bar);
			
		},
		_onLoadQuickCreateTimecheck: function(event) {
			this.$quick_create_bar = this.$buttons.find('.quick_create_bar');
			
			this.scheduleQuickCreate = new TimecheckQuickCreate(this, event.data.options);
			
			this.scheduleQuickCreate.appendTo(this.$quick_create_bar);
		},
		
	    _onOpenTimecheckEvent: function(event){
			
			if(this.isQuickAssignEnabled()){
				this.apply_quickAssignToEvent_timecheck(event);
				return;
			}
	    	var self = this;
	        var id = event.data.id;
	        id = id && parseInt(id).toString() === id ? parseInt(id) : id;

	        var open_dialog = function (readonly) {
	            var options = {
	                res_model: self.modelName,
	                res_id: id || null,
	                context: event.context || self.context,
	                readonly: readonly,
	                view_id: self.model.form_timecheck_id,
	                title:  _t("Edit working time"),
	                on_saved: function () {
	                    if (event.data.on_save) {
	                        event.data.on_save();
	                    }
	                    self.reload();
	                },
	            };
	            if (!readonly){
	            	options.buttons = [
		            	
		                {
			                text: _t("Save"),
		                    classes: "btn-primary",
		                    click: function () {
		                        this._save().then(function () {
	                                self.dialog.destroy();
	                                self.reload();
	                            });
		                    }
		                },
		                {text: _t("Close"), close: true}
		               ]
	            }
	            
	            self.dialog = new dialogs.FormViewDialog(self, options).open();
	        };
	        open_dialog(false);
	    	
	    },
	    _onOpenScheduleEvent: function (event) {
	    	if (this.isQuickAssignEnabled()) {
				if (this.scheduleQuickCreate.many2one.isUserIDAuthorized(event.data.user_id[0]) == true) {
					this.apply_quickAssignToEvent(event.data);
				}
				return;
			}
	    	var self = this;
	        var id = event.data.id;
	        id = id && parseInt(id).toString() === id ? parseInt(id) : id;

	        var open_dialog = function (readonly) {
	            var options = {
	                res_model: self.modelName,
	                res_id: id || null,
	                context: event.context || self.context,
	                readonly: readonly,
	                title:  _t("Edit Assignment"),
	                on_saved: function () {
	                    if (event.data.on_save) {
	                        event.data.on_save();
	                    }
	                    self.reload();
	                },
	            };
	            if (!readonly){
	            	options.buttons = [
		            	{
		                    text: _t("Remove"),
		                    click: function () {
		                    	self.model.updateRecord(id, {'task_id': false})
                                .then(function () {
                                    self.dialog.destroy();
                                    self.reload();
                                });
		                    },
		                }, 
		                {
			                text: _t("Save"),
		                    classes: "btn-primary",
		                    click: function () {
		                        this._save().then(function () {
	                                self.dialog.destroy();
	                                self.reload();
	                            });
		                    }
		                },
		                {text: _t("Close"), close: true}
		               ]
	            }
	            
	            self.dialog = new dialogs.FormViewDialog(self, options).open();
	        };
	        open_dialog(false);
	    	
	    },
	    _onHideExportButtons: function(){
	    	this.$buttons.find('.fc-export-buttons').css({'display': 'none'});
	    },
	    _onReplaceTask: function(event){
	    	var self = this;
	    	this.model.replace_task(event.data.task_id).then(function(){
	    		self.reload();
	    	});
	    },
		_onViewUpdated: function (event) {
	        this.mode = event.data.mode;
	        if (this.$buttons) {
		        var today = new Date();
				today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				if(this.model.range_start <= moment(today) && moment(today) <= this.model.range_stop){
					this.$buttons.find('.fc-button-today').addClass('fc-state-disabled');
				}
				else{
					this.$buttons.find('.fc-button-today').removeClass('fc-state-disabled');
				}
	        }
	        this.set({title: this.displayName + ' (' + event.data.title + ')'});
	    },
//	    reload: function (params) {
//	    	this.renderer.user_information
//	    },
		renderButtons: function ($node) {
	        var self = this;
	        this.$buttons = $(QWeb.render('staff_timeline_buttons', {
	            isMobile: config.device.isMobile,
	        }));
	        
	        this.$buttons.on('click', '.fc-button-prev-month', function () {
	        	self.model.move_prev_month();
	        	self.reload();
	        });
	        this.$buttons.on('click', '.fc-button-next-month', function () {
	        	self.model.move_next_month();
	        	self.reload();
	        });
	        this.$buttons.on('click', '.fc-button-prev-week', function () {
	        	self.model.move_prev_week();
	        	self.reload();
	        });
	        this.$buttons.on('click', '.fc-button-next-week', function () {
	        	self.model.move_next_week();
	        	self.reload();
	        });
	        this.$buttons.on('click', '.fc-button-today', function () {
	        	if(!$(this).hasClass('fc-state-disabled')){
		        	self.model.move_today();
		        	self.reload();
	        	}
	        });
	        
	        this.$buttons.on('click', '.fc-button-export-pdf', function () {
	        	self.renderer.export_pdf();
			});
	        this.$buttons.on('click', '.fc-button-export-pdf-today', function () {
	        	self.renderer.export_pdf_today();
			});
	        this.$buttons.on('click', '.fc-button-export-print', function () {
				window.print();
			});
	        this.$buttons.on('click', '.fc-button-export-print-today', function () {
	        	self.renderer.export_print_today();
			});
			
	        if ($node) {
	            this.$buttons.appendTo($node);
	        } else {
	            this.$('.o_calendar_buttons').replaceWith(this.$buttons);
	        }
	    },
	});
	
	return GeneralScheduleController;
});