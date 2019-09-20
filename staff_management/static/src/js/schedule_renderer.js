odoo.define('staff_management.ScheduleRenderer', function (require) {
"use strict";

	var time = require("web.time");
	var GeneralScheduleRenderer = require('staff_management.GeneralScheduleRenderer');
	
	var ScheduleRenderer = GeneralScheduleRenderer.extend({
		schedule: true,
		init: function (parent, state, params) {
			this._super.apply(this, arguments);
			
			this.set_nbrOfHeaderLines(2);
		},
		 _render: function () {
	    	var self = this;
	    	this.booking_numbers = this.state.booking_numbers;
	    	this.work_ratio = this.state.work_ratio;
	    	return this._super.apply(this, arguments).then(function(){
	    		self.trigger_up('hide_export_buttons');
	    		
	    	});
		 },
		 start: function () {
			 if (this.schedule){
				 this.trigger_up('load_quick_create');
			 }
			 return this._super();
		 },
		renderHeaderCellLeft: function(th, lineID){
			if(lineID == 1){
				return th.text('Utilisateur');
			}
			else if(lineID == 2){
				return th.text('Réservations');
			}
		},

		renderHeaderCell: function(th, lineID, cdate) {
			if(lineID == 1) {
				th.text(this.format_date(cdate, "ddd DD MMM"));
			}
			else if(lineID == 2) {
				return th.addClass('light-weight').text(this.booking_numbers[time.date_to_str(cdate.toDate())] || 0);
			}
			return th;
		},

		renderCellLeft: function(th, data){
			var userID = data.lineID;
			return th.append($('<span>').text(data['username'])).append($('<span>').addClass('light-weight').text(' '+this.work_ratio[userID][0]+'/'+this.work_ratio[userID][1]));
		},

		renderCell: function(td, cellDataList){
			var td = this._super.apply(this,arguments);
			if(cellDataList.length == 1){
				var userID = cellDataList[0].event.user_id[0];
				td.addClass('clickable evt_user_'+userID);
			}
			return td;
		},

		cellClicked: function(lineID, date, cellDataList){
			var self = this;
			if(cellDataList.length == 1) {
				var evt = cellDataList[0]['event'];
				self.trigger_up('openScheduleEvent', evt);

			}
		},
	});
	
	return ScheduleRenderer;
});