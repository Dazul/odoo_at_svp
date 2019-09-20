odoo.define('staff_management.Replacement', function (require) {
"use strict";	

var GeneralSchedule = require('staff_management.GeneralSchedule');
var GeneralScheduleModel = require('staff_management.GeneralScheduleModel');
var GeneralScheduleRenderer = require('staff_management.GeneralScheduleRenderer');

var time = require('web.time');

var ReplacementModel = GeneralScheduleModel.extend({
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
			var lines = {};
			
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
			return self.update_datas(lines);
        });
    },
});

var ReplacementRenderer = GeneralScheduleRenderer.extend({
//		set_button_actions: function(){
//		this._super.apply(this, arguments);
//		$('.fc-export-buttons').css({'display': 'none'});
//	},
//
	 _render: function () {
		var self = this;
		return this._super.apply(this, arguments).then(function(){
			self.trigger_up('hide_export_buttons');
		});
	 },

	renderCell: function (td, cellDataList) {
		var td = this._super.apply(this, arguments);
		if (cellDataList.length == 1) {
			td.addClass('clickable');
		}
		return td;
	},
	cellClicked: function (lineID, date, cellDataList) {
		var self = this;
		if (cellDataList.length == 1) {
			if (confirm(_t("Do you really want to replace this task ?"))) {
				var task_id = cellDataList[0].event.id;
				self.trigger_up('replace_task', {
					task_id: task_id
				});
			}
		}
	},
});
	
	
var Replacement = GeneralSchedule.extend({
	config: _.extend({}, GeneralSchedule.prototype.config, {
		Renderer: ReplacementRenderer,
		Model: ReplacementModel,
		//Controller: CalendarBookingController,
	}),
});

return Replacement;
});