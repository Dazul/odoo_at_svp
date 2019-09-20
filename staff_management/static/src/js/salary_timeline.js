odoo.define('staff_management.SalaryTimeline', function (require) {
"use strict";
	
	var core = require('web.core');
	var time = require('web.time');
	var _t = core._t;
	var QWeb = core.qweb;
	var config = require('web.config');
	var Timeline = require('staff_management.TimelineBase');
	var TimelineRenderer = require('staff_management.TimelineRenderer');
	var Tooltip = require('staff_management.Tooltip');
	var AbstractModel = require('web.AbstractModel');
	var viewDialogs = require('web.view_dialogs');
	
	var CalendarController = require("web.CalendarController");
	
	function dateToServer (date) {
		
	    return date.clone().utc().locale('en').format('YYYY-MM-DD HH:mm:ss');
	}
	
	var SalaryTimeLineController = CalendarController.extend({
		custom_events: _.extend({}, CalendarController.prototype.custom_events, {
			reload: 'reload',
		}),
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
		renderButtons: function ($node) {
	        var self = this;
	        this.$buttons = $(QWeb.render('staff_timeline_buttons', {
	            isMobile: config.device.isMobile,
	        }));
	        this.$buttons.find('.fc-export-buttons').css({'display': 'none'});
	        this.$buttons.find('.fc-button-prev-week').css({'display': 'none'});
	        this.$buttons.find('.fc-button-next-week').css({'display': 'none'});
	        
	        
	        this.$buttons.on('click', '.fc-button-prev-month', function () {
	        	self.model.move_prev_month();
	        	self.reload();
	        });
	        this.$buttons.on('click', '.fc-button-next-month', function () {
	        	self.model.move_next_month();
	        	self.reload();
	        });
	        
	        this.$buttons.on('click', '.fc-button-today', function () {
	        	if(!$(this).hasClass('fc-state-disabled')){
		        	self.model.move_today();
		        	self.reload();
	        	}
	        });
	        
	        if ($node) {
	            this.$buttons.appendTo($node);
	        } else {
	            this.$('.o_calendar_buttons').replaceWith(this.$buttons);
	        }
	        
	    },
	});
	
	var SalaryTimeLineModel = AbstractModel.extend({
		load: function (params) {
			this.preload_def = $.Deferred();
			this.modelName = params.modelName;
	        this.fields = params.fields;
	        this.fieldNames = params.fieldNames;
	        this.fieldsInfo = params.fieldsInfo;
	        this.mapping = params.mapping;
	        this.date_field = this.mapping.date_start;
	        var now = new Date();
	        var firstday = new Date(now.getFullYear(), now.getMonth(), 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth() + 1, 0);
	
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
		get_week_start: function(date){
			
			var week_start = _t.database.parameters.week_start || 0;
			var d = new Date(date);
			if(d.getDay() == 0 && week_start > 0){
				d.setDate(d.getDate()-7);
			}
			return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); // + week_start
		},
		
		move_prev_month: function(){
			var firstday = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth() - 1, 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
			this.set_range_dates(firstday, lastday);
		},
		move_next_month: function(){
			var firstday = new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth() + 1, 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
			this.set_range_dates(firstday, lastday);
		},
		
		move_today: function(){
			var now = new Date();
			var firstday = new Date(now.getFullYear(), now.getMonth(), 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth() + 1, 0);
			this.set_range_dates(firstday, lastday);
		},
		get: function () {
	        return _.extend({}, this.data, {
	            fields: this.fields,
	            model: this.modelName,
	        });
	    },
		get_range_domain: function(start, end) {
	//		var format = time.date_to_str;
	//		
			var extend_domain = [[this.date_field, '>=', start.format('YYYYY-MM-DD')],
				 [this.date_field, '<=', end.format('YYYY-MM-DD')]];
		
		return extend_domain; 
		},
		
		
		_loadCalendar: function () {
	        var self = this;
	        
	        return this._rpc({
	                model: this.modelName,
	                method: 'get_month_salaries',
	                context: this.data.context,
	                args: [this.get_range_domain(this.range_start, this.range_stop)]
	        })
	        .then(function (datas) {
	        	
	        	self.datas_loaded(datas);
	        });
	        
	    },
	    
		datas_loaded: function(datas){
			var lines = {};
			for(var uid in datas){
				var eventist = [];
				for(var day in datas[uid]){
					eventist.push({
						'date': new Date(this.range_start.toDate().getFullYear(), this.range_start.toDate().getMonth(), day),
						'event': datas[uid][day],
					});
				}
				lines[uid] = {
					'cells': eventist,
					'lineID': uid,
					'username': datas[uid].name,
				};
			}
			this.update_datas(lines);
		},
	
	
		update_datas: function(datas){
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
	        }).then(function(res){
				self.data['user_information'] = res;
			});
			
		},
	
//		load_all_users: function(lines, domain){
//			var self = this;
//			var user_domain = new Array();			
//			for(var i=0 ; i<domain.length ; i++){
//				if(domain[i][0] == 'user_id'){
//					if($.isNumeric(domain[i][2])){
//						user_domain.push(['id', domain[i][1], domain[i][2]]);
//					}
//					else{
//						user_domain.push(['name', domain[i][1], domain[i][2]]);
//					}
//				}
//			}
//			user_domain.push(['active', '=', true]);
//			
//			return this._rpc({
//	            model: "res.users",
//	            method: 'search_read',
//	            domain: user_domain,
//	            fields: ['id', 'name'],
//	        })
//	        .then(function (users) {
//	        	for(var i=0 ; i<users.length ; i++){
//					var u = users[i];
//					if(!(u.id in lines)){
//						lines[u.id] = {
//							'cells': [],
//							'lineID': u.id,
//							'username': u.name,
//						};
//					}
//				}
//				return self.update_datas(lines);
//	        });
//			
//	
//	
//		},
	});

	var SalaryTimeLineRenderer = TimelineRenderer.extend({
		
		init: function (parent, state, params) {
			this._super.apply(this, arguments);

			this.displayName = params.displayName;
			this.set_interval('day', 1);
			this.set_nbrOfHeaderLines(1);
			this.set_nbrOfRightCells(2);
			this.set_nbrOfFooterLines(1);
			this.sumCols = {};
			
		},
		 _render: function () {
		    	
	    	//return this._super.apply(this, arguments);
	    	var self = this;
	    	return this._super.apply(this, arguments).then(function(){
	    		self.sumCols = {};
	    	});
		 },
		
		renderTitle: function(date_start, date_stop){
			
			var txt = this.format_date(date_start, "MMMM YYYY");
			
			
			this.trigger_up('viewUpdated', {
				mode: 'month',
                title: txt,
            });
			
		},
		renderHeaderCellLeft: function(th, lineID){
			return th.text('Utilisateur');
		},
		renderCellLeft: function(th, data){
			return th.append(data['username']);
		},

		renderHeaderCell: function(th, lineID, cdate){
			if(lineID == 1){
				th.append(this.format_date(cdate, "DD"));
			}
			return th;
		},
		addColSum: function(key, sumPositive, sumNegative, sumTimework){
			if(key in this.sumCols){
				this.sumCols[key]['sumPositive'] += sumPositive;
				this.sumCols[key]['sumNegative'] += sumNegative;
				this.sumCols[key]['sumTimework'] += sumTimework;
			}else{
				this.sumCols[key] = {
					'sumPositive': sumPositive,
					'sumNegative': sumNegative,
					'sumTimework': sumTimework,
				};
			}
		},
		
		renderCell: function(td, cellDataList, date){
			var self = this;
			if(cellDataList.length == 1){
				var data = cellDataList[0].event;
				
				var sumPositive = 0;
				var sumNegative = 0;
				var sumTimework = 0;
	
				for(var i in data.amounts){
					var amount = data.amounts[i];
					if(amount > 0){
						sumPositive += amount;
					}
					else{
						sumNegative += amount;
					}
				}
				for(var i in data.timework){
					sumTimework += parseFloat(data.timework[i]);
				}
	
				this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
				td.addClass('staff_available');
				this.addColSum(date, sumPositive, sumNegative, sumTimework);
			}
			return td;
		},
		renderHeaderCellRight: function(th, lineID, colID){
			return th.text('Solde');
		},
	
		renderCellRight: function(td, colID, lineData){
			var self = this;
			var sumPositive = 0;
			var sumNegative = 0;
			var sumTimework = 0;
			var cells = lineData.cells;
			for(var i in cells){
				var evt = cells[i].event;
				for(var j in evt.amounts){
					var amount = parseFloat(evt.amounts[j]);
					if(amount > 0){
						sumPositive += amount;
					}
					else{
						sumNegative += amount;
					}
				}
				for(i in evt.timework){
					sumTimework += parseFloat(evt.timework[i]);
				}
			}
			if(colID == 1){
				this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
				this.addColSum(colID, sumPositive, sumNegative, sumTimework);
			}
			else if(colID == 2){
				var sumLine = sumPositive + sumNegative;
				var clazz = (sumLine > 0) ? 'red' : (sumLine == 0) ? 'black' : 'green';
				var sumLineText = _.str.sprintf("%.2f", Math.abs(sumLine));
				td.append($('<span>').addClass(clazz).text(sumLineText));
				td.addClass('lightCell clickable text_link');
				td.bind('click', {lineData: lineData}, function(e){
					var data = e.data.lineData;
					var userID = data.lineID;
					self.open_popup(userID);
				});
	
				this.addColSum(colID, sumLine, sumLine, sumTimework);
			}
			return td;
		},
	
		renderFooterCellLeft: function(th, lineID){
			return th.text('Total');
		},
	
		renderFooterCell: function(td, lineID, cdate){
			
			if(cdate in this.sumCols){
				var sumPositive = this.sumCols[cdate]['sumPositive'];
				var sumNegative = this.sumCols[cdate]['sumNegative'];
				var sumTimework = this.sumCols[cdate]['sumTimework'];
	
				this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
			}
			return td;
		},
	
		renderFooterCellRight: function(td, lineID, colID){
			if(colID in this.sumCols){
				var sumPositive = this.sumCols[colID]['sumPositive'];
				var sumNegative = this.sumCols[colID]['sumNegative'];
				var sumTimework = this.sumCols[colID]['sumTimework'];
	
				if(colID == 1){
					this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
				}
				else if(colID == 2){
					var sumTotal = sumPositive;
					var clazz = (sumTotal > 0) ? 'red' : (sumTotal == 0) ? 'black' : 'green';
					var sumTotalText = _.str.sprintf("%.2f", Math.abs(sumTotal));
					td.append($('<span>').addClass(clazz).text(sumTotalText));
				}
			}
			else if(colID == 2){
				td.append($('<span>').addClass('black').text(0));
			}
			return td;
		},
	
		renderSalaryCell: function(td, sumPositive, sumNegative, sumTimework){
			var self = this;
			if(sumPositive > 0){
				td.append($('<span>').addClass('red').text(_.str.sprintf("%.0f", Math.abs(sumPositive))));
			}
			if(sumPositive > 0 && sumNegative < 0){
				td.append($('<br>'));
			}
			if(sumNegative < 0){
				td.append($('<span>').addClass('green').text(_.str.sprintf("%.0f", Math.abs(sumNegative))));
			}
	
			var tooltip_data = {
				'sumPositive': sumPositive,
				'sumNegative': sumNegative,
				'sumTimework': sumTimework,
			};
	
			td.mouseenter(tooltip_data, function(evt){
				Tooltip.show($(this), self.get_tooltip_content(evt.data));
			}).mouseleave(Tooltip.hide);
	
		},
	
		cellClicked: function(lineID, date, cellDataList){
			// nothing
		},
		get_tooltip_content: function(data){
			var div = $('<div>');
	
			if(data.sumPositive > 0){
				div.append($('<div>').append($('<span>').text(_t('Amount due:')+' ')).append($('<span>').addClass('red').text(_.str.sprintf("%.2f", Math.abs(data.sumPositive)))));
			}
			if(data.sumNegative < 0){
				div.append($('<div>').append($('<span>').text(_t('Versed amount:')+' ')).append($('<span>').addClass('green').text(_.str.sprintf("%.2f", Math.abs(data.sumNegative)))));
			}
	
			// TODO - add working time
	
			if(data.sumTimework > 0){
				div.append($('<div>').append($('<span>').text(_t('Working time:')+' ')).append($('<span>').text(this.format_hour(data.sumTimework))));
			}
	
			return div;
		},
		
//		set_button_actions: function() {
//			var self = this;
//			
//		},
//
		// TODO: To Convert
		open_popup: function(userID){
			var self = this;

			var format = time.date_to_str;
			var date = this.range_stop;
			if(this.range_stop > moment()){
				date = moment();
			}

			this._rpc({
				model: this.state.model,
				method: 'get_form_context',
				args: [userID, format(new Date(date))],
				context: this.state.context,
			}).then(function (context) {
				var defaults = {};
				_.each(context, function(val, field_name) {
					defaults['default_' + field_name] = val;
				});
				
				var ctx = _.extend(self.state.context, defaults);
				return self.loadViews(self.state.model, ctx, [[false, 'form']]).then(function (fields_view) {
					var pop = new viewDialogs.FormViewDialog(self, {
						res_model: self.state.model,
						context: ctx,
						fields_view: fields_view['form'],
						disable_multiple_selection: true,
						title: _t("Create: ") + self.displayName,
						on_saved: function () {
							// self.refresh_events();
							self.trigger_up('reload');
						},
					}).open();
				})
			});
		},
	});	
	var SalaryTimeline = Timeline.extend({
		config: _.extend({}, Timeline.prototype.config, {
			Renderer: SalaryTimeLineRenderer,
			Model: SalaryTimeLineModel,
			Controller: SalaryTimeLineController,
		}),
		init: function () {
			this._super.apply(this, arguments);
			this.rendererParams.displayName = this.controllerParams.displayName;
		},
	});
return SalaryTimeline;
});
