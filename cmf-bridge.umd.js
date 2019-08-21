(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.cmfBridge = {})));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	(function(global) {
	  /**
	   * Polyfill URLSearchParams
	   *
	   * Inspired from : https://github.com/WebReflection/url-search-params/blob/master/src/url-search-params.js
	   */

	  var checkIfIteratorIsSupported = function() {
	    try {
	      return !!Symbol.iterator;
	    } catch(error) {
	      return false;
	    }
	  };


	  var iteratorSupported = checkIfIteratorIsSupported();

	  var createIterator = function(items) {
	    var iterator = {
	      next: function() {
	        var value = items.shift();
	        return { done: value === void 0, value: value };
	      }
	    };

	    if(iteratorSupported) {
	      iterator[Symbol.iterator] = function() {
	        return iterator;
	      };
	    }

	    return iterator;
	  };

	  /**
	   * Search param name and values should be encoded according to https://url.spec.whatwg.org/#urlencoded-serializing
	   * encodeURIComponent() produces the same result except encoding spaces as `%20` instead of `+`.
	   */
	  var serializeParam = function(value) {
	    return encodeURIComponent(value).replace(/%20/g, '+');
	  };

	  var deserializeParam = function(value) {
	    return decodeURIComponent(value).replace(/\+/g, ' ');
	  };

	  var polyfillURLSearchParams= function() {

	    var URLSearchParams = function(searchString) {
	      Object.defineProperty(this, '_entries', { value: {} });

	      if(typeof searchString === 'string') {
	        if(searchString !== '') {
	          searchString = searchString.replace(/^\?/, '');
	          var attributes = searchString.split('&');
	          var attribute;
	          for(var i = 0; i < attributes.length; i++) {
	            attribute = attributes[i].split('=');
	            this.append(
	              deserializeParam(attribute[0]),
	              (attribute.length > 1) ? deserializeParam(attribute[1]) : ''
	            );
	          }
	        }
	      } else if(searchString instanceof URLSearchParams) {
	        var _this = this;
	        searchString.forEach(function(value, name) {
	          _this.append(value, name);
	        });
	      }
	    };

	    var proto = URLSearchParams.prototype;

	    proto.append = function(name, value) {
	      if(name in this._entries) {
	        this._entries[name].push(value.toString());
	      } else {
	        this._entries[name] = [value.toString()];
	      }
	    };

	    proto.delete = function(name) {
	      delete this._entries[name];
	    };

	    proto.get = function(name) {
	      return (name in this._entries) ? this._entries[name][0] : null;
	    };

	    proto.getAll = function(name) {
	      return (name in this._entries) ? this._entries[name].slice(0) : [];
	    };

	    proto.has = function(name) {
	      return (name in this._entries);
	    };

	    proto.set = function(name, value) {
	      this._entries[name] = [value.toString()];
	    };

	    proto.forEach = function(callback, thisArg) {
	      var entries;
	      for(var name in this._entries) {
	        if(this._entries.hasOwnProperty(name)) {
	          entries = this._entries[name];
	          for(var i = 0; i < entries.length; i++) {
	            callback.call(thisArg, entries[i], name, this);
	          }
	        }
	      }
	    };

	    proto.keys = function() {
	      var items = [];
	      this.forEach(function(value, name) { items.push(name); });
	      return createIterator(items);
	    };

	    proto.values = function() {
	      var items = [];
	      this.forEach(function(value) { items.push(value); });
	      return createIterator(items);
	    };

	    proto.entries = function() {
	      var items = [];
	      this.forEach(function(value, name) { items.push([name, value]); });
	      return createIterator(items);
	    };

	    if(iteratorSupported) {
	      proto[Symbol.iterator] = proto.entries;
	    }

	    proto.toString = function() {
	      var searchArray = [];
	      this.forEach(function(value, name) {
	        searchArray.push(serializeParam(name) + '=' + serializeParam(value));
	      });
	      return searchArray.join("&");
	    };

	    global.URLSearchParams = URLSearchParams;
	  };

	  if(!('URLSearchParams' in global) || (new URLSearchParams('?a=1').toString() !== 'a=1')) {
	    polyfillURLSearchParams();
	  }

	  // HTMLAnchorElement

	})(
	  (typeof commonjsGlobal !== 'undefined') ? commonjsGlobal
	    : ((typeof window !== 'undefined') ? window
	    : ((typeof self !== 'undefined') ? self : commonjsGlobal))
	);

	(function(global) {
	  /**
	   * Polyfill URL
	   *
	   * Inspired from : https://github.com/arv/DOM-URL-Polyfill/blob/master/src/url.js
	   */

	  var checkIfURLIsSupported = function() {
	    try {
	      var u = new URL('b', 'http://a');
	      u.pathname = 'c%20d';
	      return (u.href === 'http://a/c%20d') && u.searchParams;
	    } catch(e) {
	      return false;
	    }
	  };


	  var polyfillURL = function() {
	    var _URL = global.URL;

	    var URL = function(url, base) {
	      if(typeof url !== 'string') url = String(url);

	      // Only create another document if the base is different from current location.
	      var doc = document, baseElement;
	      if(base && (global.location === void 0 || base !== global.location.href)) {
	        doc = document.implementation.createHTMLDocument('');
	        baseElement = doc.createElement('base');
	        baseElement.href = base;
	        doc.head.appendChild(baseElement);
	        try {
	            if(baseElement.href.indexOf(base) !== 0) throw new Error(baseElement.href);
	        } catch (err) { 
	            throw new Error("URL unable to set base " + base + " due to " + err);
	        }
	      }

	      var anchorElement = doc.createElement('a');
	      anchorElement.href = url;
	      if (baseElement) {
	          doc.body.appendChild(anchorElement);
	          anchorElement.href = anchorElement.href; // force href to refresh
	      }

	      if(anchorElement.protocol === ':' || !/:/.test(anchorElement.href)) {
	        throw new TypeError('Invalid URL');
	      }

	      Object.defineProperty(this, '_anchorElement', {
	        value: anchorElement
	      });
	    };

	    var proto = URL.prototype;

	    var linkURLWithAnchorAttribute = function(attributeName) {
	      Object.defineProperty(proto, attributeName, {
	        get: function() {
	          return this._anchorElement[attributeName];
	        },
	        set: function(value) {
	          this._anchorElement[attributeName] = value;
	        },
	        enumerable: true
	      });
	    };

	    ['hash', 'host', 'hostname', 'port', 'protocol', 'search']
	    .forEach(function(attributeName) {
	      linkURLWithAnchorAttribute(attributeName);
	    });

	    Object.defineProperties(proto, {

	      'toString': {
	        get: function() {
	          var _this = this;
	          return function() {
	            return _this.href;
	          };
	        }
	      },

	      'href' : {
	        get: function() {
	          return this._anchorElement.href.replace(/\?$/,'');
	        },
	        set: function(value) {
	          this._anchorElement.href = value;
	        },
	        enumerable: true
	      },

	      'pathname' : {
	        get: function() {
	          return this._anchorElement.pathname.replace(/(^\/?)/,'/');
	        },
	        set: function(value) {
	          this._anchorElement.pathname = value;
	        },
	        enumerable: true
	      },

	      'origin': {
	        get: function() {
	          // get expected port from protocol
	          var expectedPort = {'http:': 80, 'https:': 443, 'ftp:': 21}[this._anchorElement.protocol];
	          // add port to origin if, expected port is different than actual port
	          // and it is not empty f.e http://foo:8080
	          // 8080 != 80 && 8080 != ''
	          var addPortToOrigin = this._anchorElement.port != expectedPort &&
	            this._anchorElement.port !== '';

	          return this._anchorElement.protocol +
	            '//' +
	            this._anchorElement.hostname +
	            (addPortToOrigin ? (':' + this._anchorElement.port) : '');
	        },
	        enumerable: true
	      },

	      'password': { // TODO
	        get: function() {
	          return '';
	        },
	        set: function(value) {
	        },
	        enumerable: true
	      },

	      'username': { // TODO
	        get: function() {
	          return '';
	        },
	        set: function(value) {
	        },
	        enumerable: true
	      },

	      'searchParams': {
	        get: function() {
	          var searchParams = new URLSearchParams(this.search);
	          var _this = this;
	          ['append', 'delete', 'set'].forEach(function(methodName) {
	            var method = searchParams[methodName];
	            searchParams[methodName] = function() {
	              method.apply(searchParams, arguments);
	              _this.search = searchParams.toString();
	            };
	          });
	          return searchParams;
	        },
	        enumerable: true
	      }
	    });

	    URL.createObjectURL = function(blob) {
	      return _URL.createObjectURL.apply(_URL, arguments);
	    };

	    URL.revokeObjectURL = function(url) {
	      return _URL.revokeObjectURL.apply(_URL, arguments);
	    };

	    global.URL = URL;

	  };

	  if(!checkIfURLIsSupported()) {
	    polyfillURL();
	  }

	  if((global.location !== void 0) && !('origin' in global.location)) {
	    var getOrigin = function() {
	      return global.location.protocol + '//' + global.location.hostname + (global.location.port ? (':' + global.location.port) : '');
	    };

	    try {
	      Object.defineProperty(global.location, 'origin', {
	        get: getOrigin,
	        enumerable: true
	      });
	    } catch(e) {
	      setInterval(function() {
	        global.location.origin = getOrigin();
	      }, 100);
	    }
	  }

	})(
	  (typeof commonjsGlobal !== 'undefined') ? commonjsGlobal
	    : ((typeof window !== 'undefined') ? window
	    : ((typeof self !== 'undefined') ? self : commonjsGlobal))
	);

	function callUriForIOS(uri) {
	    var iframe = document.createElement('iframe');
	    iframe.style.width = '1px';
	    iframe.style.height = '1px';
	    iframe.style.display = 'none';
	    iframe.src = uri;
	    document.documentElement.appendChild(iframe);
	    setTimeout(function () { return document.documentElement.removeChild(iframe); }, 0);
	}
	function hasPromise() {
	    return typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1;
	}
	function queryStringToJSON(uri) {
	    var pairs = uri.search.slice(1).split('&');
	    var result = {};
	    pairs.forEach(function (pair) {
	        pair = pair.split('=');
	        result[pair[0]] = decodeURIComponent(pair[1] || '');
	    });
	    return JSON.parse(JSON.stringify(result));
	}
	var Util = {
	    hasPromise: hasPromise,
	    callUriForIOS: callUriForIOS,
	    queryStringToJSON: queryStringToJSON
	};

	function applyObjectAssign() {
	    if (typeof Object.assign !== 'function') {
	        Object.defineProperty(Object, 'assign', {
	            value: function assign(target, varArgs) {
	                if (target == null) {
	                    throw new TypeError('Cannot convert undefined or null to object');
	                }
	                var to = Object(target);
	                for (var index = 1; index < arguments.length; index++) {
	                    var nextSource = arguments[index];
	                    if (nextSource != null) {
	                        for (var nextKey in nextSource) {
	                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
	                                to[nextKey] = nextSource[nextKey];
	                            }
	                        }
	                    }
	                }
	                return to;
	            },
	            writable: true,
	            configurable: true
	        });
	    }
	}
	if (!Array.prototype.includes) {
	    Object.defineProperty(Array.prototype, 'includes', {
	        value: function (valueToFind, fromIndex) {
	            if (this == null) {
	                throw new TypeError('"this" is null or not defined');
	            }
	            var o = Object(this);
	            var len = o.length >>> 0;
	            if (len === 0) {
	                return false;
	            }
	            var n = fromIndex | 0;
	            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
	            function sameValueZero(x, y) {
	                return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
	            }
	            while (k < len) {
	                if (sameValueZero(o[k], valueToFind)) {
	                    return true;
	                }
	                k++;
	            }
	            return false;
	        }
	    });
	}
	function applyEvent() {
	    if (typeof window.CustomEvent === 'function')
	        return false;
	    function CustomEvent(event, params) {
	        var evt = document.createEvent('CustomEvent');
	        params = params || { bubbles: false, cancelable: false, detail: undefined };
	        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
	        return evt;
	    }
	    CustomEvent.prototype = window.Event.prototype;
	    window.CustomEvent = CustomEvent;
	}
	var PolyfillUtil = {
	    applyObjectAssign: applyObjectAssign,
	    applyEvent: applyEvent
	};

	var callbackArray = {};
	var nativeMessages = [];
	var uniqueId = 1;
	var SUCCESS_CODE = 200;
	var ERROR_CODE = 500;
	function handleOptionsRequest(url, data, callbackId, isOptionsCall) {
	    if (isOptionsCall) {
	        url.searchParams.set('isCMFMessage', 'true');
	    }
	    callbackArray[callbackId]['uri'] = url.toString();
	    if (window.cmfAndroid && window.cmfAndroid.enqueue) {
	        window.cmfAndroid.enqueue(callbackId, url.toString(), JSON.stringify(data));
	    }
	    else {
	        Util.callUriForIOS(url.toString());
	    }
	}
	function setCallbackArrayForPromise(callbackId, resolve, reject, iframeUri) {
	    callbackArray[callbackId] = {
	        promise: true,
	        resolve: resolve,
	        reject: reject,
	        uri: iframeUri
	    };
	}
	function nativeFetchMessages(callbackId) {
	    for (var i = 0; i < nativeMessages.length; i++) {
	        var nativeMessage = nativeMessages[i];
	        if (nativeMessage && nativeMessage.callbackId === callbackId) {
	            return JSON.stringify(nativeMessage);
	        }
	    }
	}
	function buildData(uri, optionsOrCallback) {
	    var callbackId = 'cmf_' + uniqueId++ + '_' + new Date().getTime();
	    var url = new URL(uri);
	    url.searchParams.set('callbackId', callbackId);
	    var iframeUri = url.toString();
	    var currentNativeMessage = {
	        callbackId: callbackId,
	        uri: iframeUri,
	        data: typeof optionsOrCallback === 'object' ? optionsOrCallback : '',
	        promise: false
	    };
	    var queryData = Util.queryStringToJSON(url);
	    if (!currentNativeMessage.data) {
	        currentNativeMessage.data = {};
	    }
	    Object.assign(currentNativeMessage.data, queryData);
	    return { callbackId: callbackId, url: url, iframeUri: iframeUri, currentNativeMessage: currentNativeMessage };
	}
	function callHandlerForCallback(uri, optionsOrCallback, callback) {
	    if (!window.cmfBridge) {
	        return;
	    }
	    PolyfillUtil.applyObjectAssign();
	    var _a = buildData(uri, optionsOrCallback), callbackId = _a.callbackId, url = _a.url, iframeUri = _a.iframeUri, currentNativeMessage = _a.currentNativeMessage;
	    callbackArray[callbackId] = {
	        uri: iframeUri
	    };
	    if (typeof optionsOrCallback === 'function') {
	        callbackArray[callbackId].callback = optionsOrCallback;
	    }
	    if (typeof callback === 'function') {
	        callbackArray[callbackId].callback = callback;
	    }
	    nativeMessages.push(currentNativeMessage);
	    if (typeof optionsOrCallback === 'object') {
	        return handleOptionsRequest(url, optionsOrCallback, callbackId, true);
	    }
	    return handleOptionsRequest(url, currentNativeMessage.data, callbackId, false);
	}
	function callHandler(uri, options) {
	    if (!window.cmfBridge) {
	        return;
	    }
	    var _a = buildData(uri, options), callbackId = _a.callbackId, url = _a.url, iframeUri = _a.iframeUri, currentNativeMessage = _a.currentNativeMessage;
	    if (!Util.hasPromise()) {
	        console.info('no promise function, default to callback');
	        callHandlerForCallback(uri, options, iframeUri);
	    }
	    currentNativeMessage.promise = true;
	    nativeMessages.push(currentNativeMessage);
	    if (options && typeof options === 'object') {
	        return new Promise(function (resolve, reject) {
	            setCallbackArrayForPromise(callbackId, resolve, reject, iframeUri);
	            return handleOptionsRequest(url, options, callbackId, true);
	        });
	    }
	    return new Promise(function (resolve, reject) {
	        setCallbackArrayForPromise(callbackId, resolve, reject, iframeUri);
	        return handleOptionsRequest(url, currentNativeMessage.data, callbackId, false);
	    });
	}
	function removeNativeMessagesById(callbackId) {
	    for (var i = 0; i < nativeMessages.length; i++) {
	        var nativeMessage = nativeMessages[i];
	        if (nativeMessage && nativeMessage.callbackId === callbackId) {
	            nativeMessages.splice(i, 1);
	        }
	    }
	}
	function dispatchResult(result) {
	    var data;
	    if (typeof result === 'string') {
	        try {
	            data = JSON.parse(result);
	        }
	        catch (e) {
	            return console.error(e);
	        }
	    }
	    else if (typeof result === 'object') {
	        data = result;
	    }
	    else {
	        return console.error('return result error: ' + result);
	    }
	    if (!data || (data && !data.callbackId)) {
	        return console.error('no callback id');
	    }
	    var callbackId = data.callbackId;
	    if (callbackId && callbackArray[callbackId]) {
	        var isPromiseCall = Util.hasPromise() &&
	            callbackArray[callbackId].hasOwnProperty('promise') &&
	            callbackArray[callbackId].promise;
	        if (isPromiseCall) {
	            if (data.code === SUCCESS_CODE && callbackArray[callbackId].resolve) {
	                callbackArray[callbackId].resolve(data);
	            }
	            if (data.code === ERROR_CODE && callbackArray[callbackId].reject) {
	                callbackArray[callbackId].reject(data);
	            }
	            if (!(data.data && data.data.keepCallback)) {
	                removeNativeMessagesById(callbackId);
	                delete callbackArray[callbackId];
	            }
	        }
	        else {
	            setTimeout(function () {
	                var callbackElement = callbackArray[callbackId];
	                if (callbackElement && typeof callbackElement.callback === 'function') {
	                    if (data.code === SUCCESS_CODE || data.code === ERROR_CODE) {
	                        callbackElement.callback(data);
	                    }
	                }
	                if (!(data.data && data.data.keepCallback)) {
	                    removeNativeMessagesById(callbackId);
	                    delete callbackArray[callbackId];
	                }
	            }, 0);
	        }
	    }
	    else {
	        console.error('callback not match with the id:' + JSON.stringify(data));
	    }
	}

	function cmfDispatchEvent(eventName, options) {
	    PolyfillUtil.applyEvent();
	    var eventOptions = options || {};
	    window.dispatchEvent(new CustomEvent(eventName, {
	        detail: eventOptions
	    }));
	}

	var PLATFORMS_MAP = {
	    ipad: isIpad,
	    iphone: isIphone,
	    ios: isIOS,
	    android: isAndroid,
	    phablet: isPhablet,
	    tablet: isTablet,
	    mobile: isMobile,
	    desktop: isDesktop
	};
	function isPlatform(win, platform) {
	    return setupPlatforms(win).includes(platform);
	}
	function setupPlatforms(win) {
	    var platforms = win.cmf.platforms;
	    if (platforms == null) {
	        platforms = win.cmf.platforms = detectPlatforms(win);
	        var classList_1 = win.document.body.classList;
	        platforms.forEach(function (p) { return classList_1.add("platform-" + p); });
	    }
	    return platforms;
	}
	function detectPlatforms(win) {
	    return Object.keys(PLATFORMS_MAP).filter(function (p) { return PLATFORMS_MAP[p](win); });
	}
	function isIpad(win) {
	    return testUserAgent(win, /iPad/i);
	}
	function isIphone(win) {
	    return testUserAgent(win, /iPhone/i);
	}
	function isIOS(win) {
	    return testUserAgent(win, /iPad|iPhone|iPod/i);
	}
	function isAndroid(win) {
	    return testUserAgent(win, /android|sink/i);
	}
	function isPhablet(win) {
	    var _a = getLargestAndSmallest(win), smallest = _a.smallest, largest = _a.largest;
	    return smallest > 390 && smallest < 520 && (largest > 620 && largest < 800);
	}
	function getLargestAndSmallest(win) {
	    var width = win.innerWidth;
	    var height = win.innerHeight;
	    var smallest = Math.min(width, height);
	    var largest = Math.max(width, height);
	    return { smallest: smallest, largest: largest };
	}
	function isTablet(win) {
	    var _a = getLargestAndSmallest(win), smallest = _a.smallest, largest = _a.largest;
	    return smallest > 460 && smallest < 820 && (largest > 780 && largest < 1400);
	}
	function isMobile(win) {
	    return isAndroid(win) || isIphone(win);
	}
	function isDesktop(win) {
	    return !isMobile(win);
	}
	function testUserAgent(win, expr) {
	    return expr.test(win.navigator.userAgent);
	}

	var cmf = {
	    nativeFetchMessages: nativeFetchMessages,
	    dispatch: dispatchResult,
	    dispatchEvent: cmfDispatchEvent,
	    trigger: callHandler,
	    triggerC: callHandlerForCallback,
	    callback: callbackArray,
	    isPlatform: function (platform) {
	        return isPlatform(window, platform);
	    },
	    setupPlatforms: setupPlatforms,
	    version: '0.2.2'
	};
	window.cmf = window.cmf || cmf;

	exports.cmf = cmf;
	exports.callbackArray = callbackArray;
	exports.nativeMessages = nativeMessages;
	exports.nativeFetchMessages = nativeFetchMessages;
	exports.callHandlerForCallback = callHandlerForCallback;
	exports.callHandler = callHandler;
	exports.dispatchResult = dispatchResult;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cmf-bridge.umd.js.map
