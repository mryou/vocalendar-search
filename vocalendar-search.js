// body.onloadイベントと同時にクラス定義やらなにやらを実行
jQuery( function($new){

	if (typeof (exDate) != 'undefined') {
		// 2重読み込み防止（ありえないけどｗ
		return;
	};
	exDate = function(){};

	exDate.RFC3339 = function( _date ){
		if ( !_date ) {
			_date = new Date();
		}
		this.date = _date;
	};
	$.extend(exDate.RFC3339, {
	
		parse : function( str ) {
			var m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
			if ( m ) {
				return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), 0, 0, 0);
			}
			
			var offset = (new Date()).getTimezoneOffset() * 60 * 1000;
			var year = null;
			var mon = null;
			var day = null;
			var hour = 0;
			var min = 0;
			var sec = 0;
			
			var m = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|([+-])(\d{2}):(\d{2}))$/);
			if ( m ) {
				year = parseInt(m[1]);
				mon = parseInt(m[2]);
				day = parseInt(m[3]);
				hour = parseInt(m[4]);
				min = parseInt(m[5]);
				sec = parseInt(m[6]);
				if ( m[7] != 'Z' ) {
					offset += ( m[8] == '+' ? 1 : -1 ) * (parseInt(m[9], 10) * 60 + parseInt(m[10], 10)) * 1000 * 60;
				}
			} else {
				return new Date(1970, 1, 1, 0, 0, 0);
			}
			
			return new Date(new Date(year, mon - 1, day, hour, min, sec).getTime() - offset);
		},
		
		dummy : 'dummy'
	
	});

	$.extend(exDate.RFC3339.prototype, {
	
		toString : function() {
		
			filZero = function( str ) {
				return str.length == 1 ? str : '0' + str;
			};
		
			var str = this.date.getFullYear();
			str += '-';
			str += filZero(this.date.getMonth() + 1 );
			str += '-';
			str += filZero(this.date.getDate());
			str += 'T';
			str += filZero(this.date.getHours());
			str += ':';
			str += filZero(this.date.getMinutes());
			str += ':';
			str += filZero(this.date.getSeconds());
			str += 'Z';
			return  str; 
		},
		
		addDays : function(num) {
			this.date.setTime(this.date.getTime() + num * 86400000);
		},
		
		dummy : 'dummy'
	
	});

	/**
	 * Vocalendarクラス定義
	 * ボカレンダー全般の管理クラス
	 */
	if (typeof (Vocalendar) != 'undefined') {
		// 2重読み込み防止（ありえないけどｗ
		return;
	};
	/**
	 * コンストラクター
	 */
	Vocalendar = function() {};
	/**
	 * 継承によるクラスメソッド、変数の定義
	 */
	$.extend(Vocalendar, {
		// Calendarクラスの配列
		_calendars : [],

		/**
		 * カレンダー（カテゴリ）オブジェクトの追加
		 * @param calendar カレンダーオブジェクト
		 */
		addCalendar : function( calendar ) {
			Vocalendar._calendars.push(calendar);
		},

		/**
		 * カレンダー（カテゴリ）オブジェクトの取得
		 * @param i カレンダーオブジェクトの添え字
		 */
		getCalendar : function(i) {
			return Vocalendar._calendars[i];
		},
		dummy : 'dummy'
	});
	
	/**
	 * Calendarクラス定義
	 * カレンダー操作用クラス
	 */
	/**
	 * コンストラクター
	 */
	Vocalendar.Calendar = function( _calendarId ) {
		this.calendarId = _calendarId;
		this.eventList = [];
		this.lastUpdated = '';
	};
	/**
	 * 継承による（prototypeなので）インスタンスメソッド、変数の定義
	 */
	$.extend(Vocalendar.Calendar.prototype, {

		//url : 'https://www.googleapis.com/calendar/v3/calendars/',
		url : 'https://www.google.com/calendar/feeds/',

		// 検索パラメータ
		param : {},

		// 検索結果のクリア
		empty : function() {
			this.eventList = [];
		},

		/**
		 * イベントリストの取得
		 * @param param 検索条件
		 * @param _completeFunc 検索終了時のコールバックメソッド
		 */
		getEvents : function(param, _completeFunc) {
			if ( _completeFunc ) {
				this.completeFunc = _completeFunc;
			}
			param['alt'] = 'json-in-script'
			param['singleevents'] = true;
			param['orderby'] = 'starttime';
			param['sortorder'] = 'ascending';
			// 設定しても反映されない・・・謎。
			//param['recurrence-expansion-end'] = '2013-12-31T23:59:59Z';
			param['start-max'] = '2015-12-31T23:59:59Z';
			request = $.ajax({
								//url: this.url + this.calendarId + '/events',
								url: this.url + this.calendarId + '/public/full',
								type : 'GET',
								data : param,
								dataType: 'jsonp',
								context: this,
								success : function(json) {
													this.result = json;
													// 結果が0件
													if ( !json.feed.entry ) {
														this.completeFunc();
														return;
													}
													$.merge( this.eventList, json.feed.entry);

													// 次ページがあるか？
													var isNext = false;
													jQuery.each( json.feed.link, function( i, link ) {
														if ( link.rel == 'next' ) {
															isNext = true;
														}
													});
													if ( isNext ) {
														// 次ページがあったら繰り返し取得する
														var startindex = json.feed.openSearch$startIndex.$t + 25;
														param['start-index'] = startindex;
														this.getEvents(param);
													} else {
														// 次ページがなければ完了メソッドを呼び出す
														this.completeFunc( this.eventList );
													}
												},
								error : function(data) {
											this.result = data;
											alert('データが取得できませんでした.')
										},
			});
			
		},

		result : null,

		// ディフォルトの完了メソッド
		completeFunc : function( eventList ){},

		dummy : 'dummy'
	}
	);

	/**
	 * SearchUIクラス定義
	 * ユーザーインターフェースクラス
	 */
	/**
	 * コンストラクター
	 */
	Vocalendar.SearchUI = function(){};
	$.extend(Vocalendar.SearchUI, {
	
		STRING : 'VS_searchstring',
		EXECUTE : 'VS_execute',
		CONDITION_CONTAINER : 'VS_conditionContainer',
		RESULT_CONTAINER : 'VS_resultContainer',
		
		// 初期化
		init : function() {
			// イベントハンドラの登録
			// 検索ボタン
			$('#' + Vocalendar.SearchUI.EXECUTE).bind('click', Vocalendar.SearchUI.getEvents );
			// フォーム（エンターキーで検索を走らせるため）
			$('#' + Vocalendar.SearchUI.CONDITION_CONTAINER)
				.bind('submit', function() {
					Vocalendar.SearchUI.getEvents();
					return false;
					}
				);
		},

		// 検索開始
		getEvents : function() {
			var resultContainer = $('#' + Vocalendar.SearchUI.RESULT_CONTAINER);
			resultContainer.empty();
			resultContainer.append('検索中');
			
			var param = {
				// バグ対応？半角スペースを全角に変換することでand検索を可能にする。
				q : $('#' + Vocalendar.SearchUI.STRING).val().split(' ').join('　')
			};
			target = Vocalendar.getCalendar( $('#VS_selectCalendar').get(0).value );
			target.empty();
			target.getEvents(param, Vocalendar.SearchUI.writeResult);	
		},

		/**
		 * 検索結果生成
		 * @param eventList イベントオブジェクトのリスト（json形式）
		 */
		writeResult : function( eventList ) {

			var resultContainer = $('#' + Vocalendar.SearchUI.RESULT_CONTAINER);
			resultContainer.empty();

			// ツリールート
			var events = $('<ul>').addClass('events');
			jQuery.each( this.eventList, function( i, eventData) {
				
				// イベント
				var event = $('<li>').addClass('event').addClass( i % 2 == 0 ? 'even': 'odd' );
				event.attr( 'id', 'event_' + i);
				
				// イベント属性
				var title = $('<p>').addClass('title').add('shadeTrigger').text(eventData.title.$t);
				var shadeContainer = $('<div>').addClass('shadeContainer').addClass('none');
				var where = $('<p>').addClass('where').text(eventData.gd$where[0].valueString);
				var content = $('<p>').addClass('content').text(eventData.content.$t);
				var start = '';
				var end   = '';
				if ( eventData.gd$when ) {
					var time  = eventData.gd$when[0];
					var start = $('<p>').addClass('time start').text(time.startTime);
					var end   = $('<p>').addClass('time end').text(time.endTime);
				}
				
				// UIイベントを追加
				title.click(function(event) {
					var shadeTarget = jQuery(event.target).parent().find('.shadeContainer');
					shadeTarget.toggleClass('none');
				
				});
				
				// 属性をイベントに追加
				event.append(title);
				event.append(shadeContainer);
				shadeContainer.append(start);
				shadeContainer.append(end);
				shadeContainer.append(where);
				shadeContainer.append(content);

				// ルートにイベントを追加
				events.append(event);
				
			});
				
			resultContainer.append(events);
			
		},
		
		dummy : 'dummy'
	});

	// ---- クラス定義終了 -----
	/**
	 * 初期処理
	 */
	// カレンダー（カテゴリ）のID一覧
	var calendarIds = [	'0mprpb041vjq02lk80vtu6ajgo@group.calendar.google.com',
						'5fsoru1dfaga56mcleu5mp76kk@group.calendar.google.com'
						];
	jQuery.each( calendarIds, function( i, id ) {
		Vocalendar.addCalendar( new Vocalendar.Calendar(id) );
	});
	Vocalendar.SearchUI.init();


});
