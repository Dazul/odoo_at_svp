odoo.define('staff_management.ScheduleQuickCreate', function (require) {
"use strict";	
	var core = require('web.core');
	var time = require('web.time');
	var relational_fields = require('web.relational_fields');
	var basic_fields = require('web.basic_fields');
	var StandaloneFieldManagerMixin = require('web.StandaloneFieldManagerMixin');
	var Widget = require('web.Widget');


// extend a FieldMany2One for the quick assign function
	var QuickAssign = relational_fields.FieldMany2One.extend({
		// color the cells
		applyQuickAssign: function(){
			if(this.quickAssignAuth && this.value.res_id !== false){
				$('.staff_assigned,.staff_available').addClass('unselectable');
				
				for(var i=0 ; i<this.quickAssignAuth.length ; i++){
					var auth_class = 'evt_user_'+this.quickAssignAuth[i].user_id;
					$('.'+auth_class).removeClass('unselectable');
				}
			}
		},
		
		isUserIDAuthorized: function(userID){
			var ret = false;
			if(this.quickAssignAuth && this.value.res_id !== false){
				for(var i in this.quickAssignAuth){
					if(this.quickAssignAuth[i].user_id[0] == userID){
						ret = true;
						break;
					}
				}
			}
			else{
				ret = true; // Allow to remove an assignation quickly.
			}
			return ret;
		},
		
		// change value, reload autorisations
		_setValue: function(value_) {
			var self = this;
			this._super.apply(this, arguments);
			if(value_ === false){
				$('.unselectable').removeClass('unselectable');
				return;
			}
			return this._rpc({
				model: 'staff.authorization',
				method: 'search_read',
				fields: ['task_id', 'user_id'],
				domain: [['task_id', '=', this.value.res_id]],
			}).then(function (auth) {
				self.quickAssignAuth = auth;
				self.applyQuickAssign();
			});
		},
	});
	
	var ScheduleQuickCreate = Widget.extend(StandaloneFieldManagerMixin, {
		template: 'staff_timeline_quick_create',
		custom_events: _.extend({}, StandaloneFieldManagerMixin.custom_events, {
	        field_changed: '_onFieldChanged',
	    }),
	    init: function (parent, options) {
	        this._super.apply(this, arguments);
	        StandaloneFieldManagerMixin.init.call(this);
	        this.quick_create_on = false;
	        this.quick_task_id = false;
	    },
	    willStart: function () {
	        var self = this;
	        var defs = [this._super.apply(this, arguments)];

	        
            var def = this.model.makeRecord('staff.scheduler', [{
                name: 'task_id',
                relation: 'account.analytic.account',
                type: 'many2one',
            }, {
            	type: 'float',
                name: 'hour_from',
                attrs: {string: "Start Hour"},
            }, {
            	type: 'float',
                name: 'hour_to',
                attrs: {string: "End Hour"},
            }]).then(function (recordID) {
                self.many2one = new QuickAssign(self,
                   'task_id',
                    self.model.get(recordID),
                    {
                        mode: 'edit',
                        attrs: {
                            placeholder: _.str.sprintf(_t("Add %s"), self.title),
                            can_create: false,
                            options: {'no_open': true},
                        },
                    });
               self._registerWidget(recordID, 'task_id', self.many2one);
               self.starthour = new basic_fields.FieldFloatTime(self,
            		'hour_from',
            		self.model.get(recordID),
            		{
                        mode: 'edit',
                        attrs: {},
                    },
            	);
               self._registerWidget(recordID, 'hour_from', self.starthour);
               self.endhour = new basic_fields.FieldFloatTime(self,
               		'hour_to',
               		self.model.get(recordID),
               		{
                           mode: 'edit',
                           attrs: {},
                       },
               	);
               self._registerWidget(recordID, 'hour_to', self.endhour);
            });
            defs.push(def);
	        
	        return $.when.apply($, defs);

	    },
	    
	    _onFieldChanged: function (event) {
	    	event.stopPropagation();
	    	// this.quick_task_id = event.data.changes && event.data.changes.task_id.id;
	    	StandaloneFieldManagerMixin._onFieldChanged.apply(this, arguments);
	    	
	    },
	    start: function () {
	        this._super();
	        var self = this;
	        if (this.many2one) {
	            this.many2one.appendTo(this.$el.find(".task_id"));
	        }
	        if (this.starthour) {
	        	this.starthour.appendTo(this.$el.find(".start_hour"));
	        }
	        if (this.endhour) {
	        	this.endhour.appendTo(this.$el.find(".end_hour"));
	        }
	        this.$el.on('click', '.quickassignCheckbox', function(){
				if($(this).is(':checked')){
					self.$el.find('.qa_hide').removeClass('o_hidden');
					self.quick_create_on = true;
				}
				else{
					self.$el.find('.qa_hide').addClass('o_hidden');
					self.quick_create_on = false;
					// TODO: fix following line, do not call private method, instead set false value in input box and call change event
					self.many2one._setValue(false); // reset task selection when quit quick assign
				}
			
	        });

	    },

	});
	return ScheduleQuickCreate
});