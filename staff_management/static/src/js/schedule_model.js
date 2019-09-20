odoo.define('staff_management.ScheduleModel', function (require) {
"use strict";	
	var time = require("web.time");
	var GeneralSchedule = require('staff_management.GeneralSchedule');
	var ScheduleRenderer = require('staff_management.ScheduleRenderer');
	var GeneralSchedule = require('staff_management.GeneralSchedule');
	var GeneralScheduleController = require('staff_management.GeneralScheduleController');
	var GeneralScheduleModel = require('staff_management.GeneralScheduleModel');
	
	
	var ScheduleModel = GeneralScheduleModel.extend({
		loadSchedulerData : true,
		load: function (params) {
			this.interval_nbr = params.interval_nbr;
			this.interval_mode = params.interval_mode;
			return this._super.apply(this, arguments);
		},
		getNextDate: function(date, index){
			var index = (typeof index === "undefined") ? 1 : index;
			var d = new Date(date.toDate().getTime());
			d.setDate(d.getDate() + this.interval_nbr * index);
			return moment(d);
		},
		
		update_datas: function(datas, original){
			
			if(!this.loadSchedulerData || original){
				var ret = this._super.apply(this, arguments);
//				if(this.isQuickAssignEnabled() && this.quick_asign){
//					this.quick_asign.applyQuickAssign();
//				}
				return ret;
			}
	
			var self = this;
			var def_workratio = $.Deferred();
			var def_booking = $.Deferred();
	
			// Get number of assigned on number of availabilities for the month of this.range_start
			
			var list_userID = [];
			this.data.work_ratio = {};
			for(var i in datas){
				list_userID.push(datas[i].lineID);
				this.data.work_ratio[i] = [5,10];
			}
			var date_from = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth(), 1);
			var date_to = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth() + 1, 0);

			
			this._rpc({
                model: "staff.scheduler",
                method: 'countActivitie',
                args: [list_userID, time.date_to_str(date_from), time.date_to_str(date_to)],
            }).then(function(res){
            	self.data.work_ratio = {};
				for(var i in res){
					self.data.work_ratio[i] = res[i];
				}
				def_workratio.resolve();
			});
	
			// Get the number of people in reservation for each days between this.range_start and this.range_stop
			var list_dates = [];
			this.data.booking_numbers = {};
			for(var d = this.range_start ; d<=this.range_stop ; d = this.getNextDate(d)){
				list_dates.push(time.date_to_str(d.toDate()));
				this.data.booking_numbers[d.toDate()] = 10;
			}
			
			this._rpc({
                model: "staff.booking",
                method: 'count_nbr_people',
                args: [list_dates],
            }).then(function(res) {
            	self.data.booking_numbers = {};
            	for(var d = self.range_start ; d<=self.range_stop ; d = self.getNextDate(d)) {
					self.data.booking_numbers[time.date_to_str(d.toDate())] = res[time.date_to_str(d.toDate())];
				}
            	def_booking.resolve();
            });
			// Call the super method when all new data are loaded
			return $.when(def_workratio, def_booking).then(function() {
				return self.update_datas(datas, true);
			});
		},
	});
	return ScheduleModel;
});
