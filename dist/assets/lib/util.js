(function (window, $, undefined) {
	var zq = {};

	zq.onServerError = function (errMsg) {
		alert(errMsg || 'unknown error');
	};

	var ServerFn = function (url, name) {
		if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) this.url = url;
		else this.url = zq.apiServer + url.replace(/^['/']/, '');

		this.unlimited = false;
		this.accessable = true;
		this.type = 'text';
		this.timeout = 10000;
		this.name = name.split('$')[0];
		this.method = name.indexOf('$') > 0 ? 'POST' : 'GET';
	};
	ServerFn.prototype = {
		toString: function () {
			return this.url;
		},
		handleError: function (json, callback, unauthorizedException) {
			zq.onServerError.call(this, json);
		},
		invoke: function (data, callback) {
			var that = this;

			if (this.accessable || this.unlimited) {
				this.accessable = false;
				//return $[this.method].apply(this, makeParam.call(this, data, callback, type || 'json'));
				if ($.isFunction(data)) {
					callback = data;
					data = null;
				}

				return $.ajax({
					url: this.url,
					data: data,
					dataType: this.type,
					timeout: this.timeout,
					type: this.method,
					beforeSend: function (jqXHR, settings) {

					},
					complete: function () {
						that.accessable = true;
						that = null;
					},
					error: function (jqXHR, textStatus, errorThrown) {
						zq.onServerError.call(that, errorThrown);
					},
					success: function (data, statusText, xhr) {
						var json = JSON.parse(decodeURIComponent(decodeURIComponent(data)));
						console.log(that.name, json);
						if (json.statu === 'success') {
							if (callback && typeof callback === 'function')
								callback(json, statusText, xhr);
						}
						else
							zq.onServerError.call(that, json.statu);
					}
				});

				//return $.get(this.url , data, callback , 'jsonp') ;
			}
			//else throw new Error('Server function unusable now, may be you should set property "unlimited" to true.');
		}
	};

	zq.api = function (obj) {

		for (var key in obj) {
			var name = key.split('$')[0];
			if (!zq.api[name]) {
				zq.api[name] = (function (srvFn) {
					function fn(data, callback) {
						return srvFn.invoke.call(srvFn, data, callback);
					}

					fn.set = function (key, value) {
						srvFn[key] = value;
						return srvFn;
					};

					fn.get = function (key) {
						return srvFn[key];
					};

					return fn;
				})(new ServerFn(obj[key], key));
			}
			else {
				throw new Error('duplicate definition');
			}
		}

		return zq.api;
	};

	/*zq.setApiError = function(apiName , errHandler){
	 zq.api[apiName].srvFn.onError = errHandler ;
	 } ;*/


	zq.apiServer = '{{apiServer}}';


	function hasOwnProperty(obj, prop) {
		return !!obj && obj.hasOwnProperty(prop);
	}

	function setParamsObject(obj, param, value, castBoolean) {
		var reg = /^(.+?)(\[.*\])$/, paramIsArray, match, allKeys, key, k;
		if (match = param.match(reg)) {
			key = match[1];
			allKeys = match[2].replace(/^\[|\]$/g, '').split('][');
			for (var i = 0; k = allKeys[i]; i++) {
				paramIsArray = !k || k.match(/^\d+$/);
				if (!key && isArray(obj)) key = obj.length;
				if (!hasOwnProperty(obj, key)) {
					obj[key] = paramIsArray ? [] : {};
				}
				obj = obj[key];
				key = k;
			}
			if (!key && paramIsArray) key = obj.length.toString();
			setParamsObject(obj, key, value, castBoolean);
		} else if (castBoolean && value === 'true') {
			obj[param] = true;
		} else if (castBoolean && value === 'false') {
			obj[param] = false;
		} else if (castBoolean && zq.validate.number(value)) {
			obj[param] = parseFloat(value, 10);
		} else {
			obj[param] = value;
		}
	}

	zq.request = (function (str, castBoolean) {
		var result = {}, split;
		str = str && str.toString ? str.toString() : '';
		var arr = str.replace(/^.*?\?/, '').split('&'), p;
		for (var i = 0; p = arr[i]; i++) {
			split = p.split('=');
			if (split.length !== 2) continue;
			setParamsObject(result, split[0], decodeURIComponent(split[1]), castBoolean);
		}
		return result;
	})(window.location.search, false);


	zq.format = {
		date: function (date, formater) {
			var format = formater || 'yyyy-MM-dd'; // default format
			var o = {
				"M+": date.getMonth() + 1, //month
				"d+": date.getDate(), //date
				"h+": (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()), //hour 12
				"H+": date.getHours(), //hour 24
				"m+": date.getMinutes(), //minute
				"s+": date.getSeconds(), //second
				"q+": Math.floor((date.getMonth() + 3) / 3), //quarter
				"S": date.getMilliseconds() //millisecond
			};

			if (/(y+)/.test(format))
				format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));

			for (var k in o)
				if (new RegExp("(" + k + ")").test(format))
					format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));

			return format;
		}
	};


	zq.validate = {
		date: function (string, preutc) {
			var date = Date.parse(string);
			if (isFinite(date)) {
				return true;
			}
			if (preutc) {
				var now = new Date();
				string = string.replace(/\d{4}/, now.getFullYear());
				date = Date.parse(string);
				return isFinite(date);
			}
			return false;
		},
		email: function (string) {
			return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i.test(string);
		},
		mobile: function (mob) {
			return /^1[3|4|5|7|8]\d{9}$/.test(mob);
		},
		phone: function (string) {
			return /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(string);
		},
		wx: function () {
			var ua = window.navigator.userAgent.toLowerCase();
			return (ua.match(/MicroMessenger/i) == 'micromessenger');
		}
	};

	var deserialize = function (value) {
		if (typeof value !== 'string') {
			return undefined;
		}
		try {
			return JSON.parse(value);
		}
		catch (e) {
			return value || undefined;
		}
	};

	var storage = window.localStorage;

	zq.store = {
		use: function (storageType) {
			storage = window[storageType || 'localStorage'];
			return store;
		},
		get: function (key, defaultVal) {
			var val = deserialize(storage.getItem(key));
			return (val === undefined ? defaultVal : val);
		},
		set: function (key, val) {
			if (val !== undefined) {
				storage.setItem(key, JSON.stringify(val));
			}
			return val;
		},
		remove: function (key) {
			storage.removeItem(key);
		},
		clear: function () {
			storage.clear();
		},
		each: function (callback) {
			for (var i = 0, l = storage.length; i < l; i++) {
				var key = storage.key(i);
				callback(key, store.get(key));
			}
		}
	};



	zq.alert = function (txt) {
		alert(txt);
	};




	// Expose to window
	window.zq = zq;


})(window, Zepto);
