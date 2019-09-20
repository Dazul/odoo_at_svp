odoo.define('staff_management.GeneralScheduleModel', function (require) {
"use strict";	
	var core = require('web.core');
	var time = require('web.time');
	var _t = core._t;
	var QWeb = core.qweb;
	var config = require('web.config');
	var Context = require('web.Context');

	var AbstractModel = require('web.AbstractModel');
	
	function dateToServer (date) {
		
	    return date.clone().utc().locale('en').format('YYYY-MM-DD HH:mm:ss');
	};
	
	var GeneralScheduleModel = AbstractModel.extend({
		load: function (params) {
			this.preload_def = $.Deferred();
			this.modelName = params.modelName;
	        this.fields = params.fields;
	        this.fieldNames = params.fieldNames;
	        this.fieldsInfo = params.fieldsInfo;
	        this.mapping = params.mapping;
	        this.date_field = this.mapping.date_start;
	        var now = new Date();
			var firstday = this.get_week_start(now);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
	
			this.set_range_dates(firstday, lastday);
			
			this.data = {
	            domain: params.domain,
	            context: params.context,
	            range_start: this.range_start,
	            range_stop: this.range_stop,
	            // get in arch the filter to display in the sidebar and the field to read
	            filters: params.filters,
	        };
			
			return this._loadCalendar();
		},
		get_view_form_timecheck:function(){
			var self = this;
			return this._rpc({
	            model: 'ir.ui.view',
	            method: 'search_read',
                domain: [['model', '=', 'staff.scheduler'], ['name', '=', 'timecheck_popup']],
                fields: ['id', 'name'],
	        }).then(function(result){
				self.form_timecheck_id = result[0].id;
			});	
//			var views = new Model('ir.ui.view'); //TODO
//			views.query('id').filter([]).first().then(function(result){
//				self.form_timecheck_id = result.id;
//			});	
		},
		updateRecord: function (record_id, data) {
	        // var context = new Context(this.data.context, {from_ui: true});
			var context = _.extend(this.data.context, {from_ui: true});
	        return this._rpc({
	            model: this.modelName,
	            method: 'write',
	            args: [[record_id], data],
	            context: context
	        });
	    },
		reload: function (handle, params) {
	        if (params.domain) {
	            this.data.domain = params.domain;
	        }
	        if (params.context) {
	            this.data.context = params.context;
	        }
	        return this._loadCalendar();
	    },
		set_range_dates: function(date_start, date_stop) {
			this.range_start = moment(date_start);
			this.range_stop = moment(date_stop);
			if (this.data){
				this.data.range_start = this.range_start;
				this.data.range_stop = this.range_stop;
			};
		},
		get_week_start: function(date) {
			var week_start = _t.database.parameters.week_start || 0;
			var d = new Date(date);
			if(d.getDay() == 0 && week_start < 7) {
				d.setDate(d.getDate()-7);
			}
			return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); // + week_start
		},
		replace_task: function(task_id){
			return this._rpc({
                model: this.modelName,
                method: 'swapUidTask',
                args: [task_id]
			});
			
		},
		move_prev_month: function() {
			var firstday = new Date(this.range_stop.toDate().getFullYear(), this.range_stop.toDate().getMonth() - 1, 1);
			firstday = this.get_week_start(firstday);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			this.set_range_dates(firstday, lastday);
		},
		move_next_month: function() {
			var range_stop = _.clone(this.range_stop);
			range_stop.startOf('month').add(1, 'month');
			var firstday = new Date(range_stop);
			firstday = this.get_week_start(firstday);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			this.set_range_dates(firstday, lastday);
		},
		move_next_week: function(){
			var firstday = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth(), this.range_start.toDate().getDate() + 7);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			this.set_range_dates(firstday, lastday);
		},
		move_prev_week: function(){
			var firstday = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth(), this.range_start.toDate().getDate() - 7);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			this.set_range_dates(firstday, lastday);
			
		},
		move_today: function(){
			var now = new Date();
			var firstday = this.get_week_start(now);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			this.set_range_dates(firstday, lastday);
		},
		get: function () {
	        return _.extend({}, this.data, {
	            fields: this.fields
	        });
	    },
		get_range_domain: function(start, end) {
//			var format = time.date_to_str;
//			
			var extend_domain = [[this.date_field, '>=', start.format('YYYY-MM-DD')],
					 [this.date_field, '<=', end.format('YYYY-MM-DD')]];
			return extend_domain; 
		},
		
		_loadCalendar: function () {
	        var self = this;
	        return this._rpc({
                    model: this.modelName,
                    method: 'search_read',
                    context: this.data.context,
                    fields: this.fieldNames,
                    domain: this.data.domain.concat(this.get_range_domain(this.range_start, this.range_stop)),
            })
            .then(function (events) {
                //self._parseServerData(events);
            	var lines = {};
            	self.data['data'] = {};
            	self.data['user_information'] = {};
				_.each(events, function(e){
	
					var event_date = moment(time.auto_str_to_date(e[self.date_field]));
					
					var event_data = {
						'date': event_date,
						'event': e,
					};
					
					var lid = e['user_id'][0];
					if(lid in lines){
						lines[lid]['cells'].push(event_data);
					}
					else{
						lines[lid] = {
							'cells': [event_data],
							'lineID': lid,
							'username': e['user_id'][1],
						};
					}
					
				});

				if(!self.data.context['usershow'] && !self.data.context['default_task_id']){
					return self.load_all_users(lines, self.data.domain);	
				}
				else{			 
					return self.update_datas(lines);
					
				}
//                self.data.data = _.map(events, self._recordToCalendarEvent.bind(self));
//                return $.when(
//                    self._loadColors(self.data, self.data.data),
//                    self._loadRecordsToFilters(self.data, self.data.data)
//                );
            });
	        
	    },
	
		update_datas: function(datas) {
			var users_id = [];
			for(var k in datas){
				users_id.push(parseInt(k));
			}
			var self = this;
			this.data['data'] = datas;
			return this._rpc({
                model: "staff.scheduler",
                method: 'getPersonalInfo',
                args: [users_id],
            }).then(function(res) {
				self.data['user_information'] = res;
			});
			
		},
	
		load_all_users: function(lines, domain){
			var self = this;
			var user_domain = new Array();			
			for(var i=0 ; i<domain.length ; i++){
				if(domain[i][0] == 'user_id'){
					if($.isNumeric(domain[i][2])){
						user_domain.push(['id', domain[i][1], domain[i][2]]);
					}
					else{
						user_domain.push(['name', domain[i][1], domain[i][2]]);
					}
				}
			}
			user_domain.push(['active', '=', true]);
			return this._rpc({
                model: "res.users",
                method: 'search_read',
                domain: user_domain,
                fields: ['id', 'name'],
                order: 'name',
            })
            .then(function (users) {
            	for(var i=0 ; i<users.length ; i++){
					var u = users[i];
					if(!(u.id in lines)){
						lines[u.id] = {
							'cells': [],
							'lineID': u.id,
							'username': u.name,
						};
					}
				}
				return self.update_datas(lines);
            });
		},
	});
	return GeneralScheduleModel;
});