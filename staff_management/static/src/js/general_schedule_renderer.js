odoo.define('staff_management.GeneralScheduleRenderer', function (require) {
"use strict";	
	var time = require('web.time');
	var core = require('web.core');
	var _t = core._t;
	var QWeb = core.qweb;
	var TimelineRenderer = require('staff_management.TimelineRenderer');
	var Tooltip = require('staff_management.Tooltip');

	
	var GeneralScheduleRenderer = TimelineRenderer.extend({
		init: function (parent, state, params) {
			this._super.apply(this, arguments);
			this.dateFormat = time.getLangDateFormat();
			this.user_information = state.user_information;		
			this.set_interval('day', 1);
			this.set_nbrOfHeaderLines(1);
		},
		updateState: function (state, params) {
			this.user_information = state.user_information;
			return this._super.apply(this, arguments);
		},
		 get_week_start: function(date){
			var week_start = _t.database.parameters.week_start || 0;
			var d = new Date(date);
			if(d.getDay() == 0 && week_start > 0){
				d.setDate(d.getDate()-7);
			}
			return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); // + week_start
		},
		
		renderHeaderCellLeft: function(th, lineID){
			return th.text('Utilisateur');
		},
		renderHeaderCell: function(th, lineID, cdate){
			th.text(this.format_date(cdate, "ddd DD MMM"));
			return th;
		},
		renderTitle: function(date_start, date_stop){
		
			var txt = this.format_date(date_start, "DD MMM YYYY");
			txt += ' - ' + this.format_date(date_stop, "DD MMM YYYY");
			
			this.trigger_up('viewUpdated', {
				mode: 'month',
				title: txt,
			});
			
		},
		renderCell: function(td, cellDataList){
			var self = this;
			
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;
				
				if(evt.task_id) {
					td.addClass('staff_assigned');
					td.text(this.format_hour(evt.hour_from)+' '+evt.task_id[1]);
					td.mouseenter(evt, function(evt){
						Tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(Tooltip.hide);
				}
				else{
					td.addClass('staff_available');
				}
	
			}
			return td;
		},
//		set_button_actions: function(){
//			this._super.apply(this, arguments);
//			var self = this;
//	
//			this.$('.fc-export-buttons').css({'display': 'inline'});
//		},
		
		get_tooltip_content: function(event){
			
			var div = $('<div>');
			div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)));
			div.append($('<div>').text(event.task_id[1]));
			if(event.comment){
				div.append($('<div>').text(event.comment));
			}

			return div;
		},

		cellClicked: function(lineID, date, cellDataList){
			// no click action
		},
	
		render_timeline: function(){
			var self = this;
			this._super.apply(this, arguments);
			var today = new Date();
			today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			if(this.range_start <= today && today <= this.range_stop){
				$('.fc-button-export-pdf-today').css({'display': 'inline-block'});
				$('.fc-button-export-print-today').css({'display': 'inline-block'});
			}
			else{
				$('.fc-button-export-pdf-today').css({'display': 'none'});
				$('.fc-button-export-print-today').css({'display': 'none'});
			}
		},
		
		renderCellLeft: function(th, data){
			var self = this;

			th.mouseenter(data, function(evt){
				
				var userID = evt.data.lineID;

				if(self.user_information[userID]){
					var info = self.user_information[userID];

					var mobile = info.mobile;
					if(mobile == false || mobile == 'false'){
						mobile = '-';
					}
					var auths = info.auths.join(', ');
					if(info.auths.length == 0){
						auths = '-';
					}

					Tooltip.show_left($(this), '<div><span style="font-weight: bold;">'+info.name+'</span>'+'</div><div style="height: 130px;"><img src="data:image/png;base64,'+info.image+'"/></div>'+'<div>'+mobile+'</div><div>'+auths+'</div>');
				}

			}).mouseleave(Tooltip.hide);

			return th.text(data['username']);
		},
	});
	
	return GeneralScheduleRenderer;
});