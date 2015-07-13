/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var sklad = __webpack_require__(1);

	window.sklad = sklad;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * @fileOverview sklad.
	 */

	var Response = __webpack_require__(2);
	var EventEmitter = __webpack_require__(5);

	var sklad;

	function Sklad() {
	    EventEmitter.call(this);
	}

	Sklad.prototype = new EventEmitter();

	Sklad.prototype.constructor = Sklad;

	Sklad.prototype.store = checkAndGetStorage();

	/**
	 * Проверяет доступность localStorage
	 * @return {Boolean}
	 */
	Sklad.prototype.isSupported = function () {
	    return !!this.store;
	};

	/**
	 * Устанавливаем значение в localStorage
	 * @param {*} key строка или все что может быть приведенно к строке
	 *                ключ в localStorage для сохраняемого значения
	 * @param {*} value сохраняемое значение
	 * @param {Boolean} [strict] флаг для проверки сохраненного значения
	 * @return {Response}
	 */
	Sklad.prototype.set = function (key, value, strict) {
	    var r = new Response();
	    var queue = new Response.Queue();
	    var stringValue = JSON.stringify(value);

	    if (!stringValue) {
	        return r.reject("Bad param - value");
	    }

	    queue
	        .setData('params', {
	            key: key,
	            val: stringValue
	        })
	        .push(setItem);

	    if (strict) {
	        queue
	            .push(getItem)
	            .push(checkSavedItem);
	    } else {
	        queue.push(queue.resolve);
	    }

	    queue.start();

	    return r.listen(queue);
	};

	/**
	 * Достаём значение из localStorage
	 * @param {*} key строка или все что может быть приведенно к строке
	 *                ключ сохраненного значения в localStorage
	 * @param {String} [type] если указан как 'json' парсим значение
	 *                      если нет отдаём строку
	 * @return {Response}
	 */
	Sklad.prototype.get = function (key, type) {
	    var r = new Response();
	    var queue = new Response.Queue();

	    queue
	        .setData('params', {
	            key: key,
	            type: type
	        })
	        .push(getItem);

	    if (type) {
	        queue.push(parseData);
	    }

	    queue
	        .push(queue.resolve)
	        .start();

	    return r.listen(queue);
	};

	/**
	 * Метод для получения непосредственно значения
	 * а не экземпляра Response
	 * @param {*} key строка или все что может быть приведенно к строке
	 *                ключ сохраненного значения в localStorage
	 * @param {String} [type] если указан как 'json' парсим значение
	 *                      если нет отдаём строку
	 * @return {*} значение из localStorage
	 */
	Sklad.prototype.getValue = function (key, type) {
	    return this
	        .get(key, type)
	        .getResult();
	};

	/**
	 * Удаляем итэм из хранилища
	 * @param {String} key ключ сохранённого значения
	 * @return {Response}
	 */
	Sklad.prototype.remove = function (key) {
	    var r = new Response();

	    if (sklad.store) {
	        r.invoke(sklad.store.removeItem, [key], sklad.store);
	    } else {
	        r.reject();
	    }

	    if (!r.isRejected()) {
	        r.resolve();
	    }

	    return r;
	}

	sklad = new Sklad();

	/**
	 * @param {Object} event Объект события изменение значений в localStorage
	 */
	var triggerChangeEvent = function (event) {
	    var event = 'change:' + event.key;

	    this.emit(event, event.newValue);
	}.bind(sklad);

	/**
	 * Подписываемся на изменение значений в localStorage
	 * из других вкладок браузера
	 */
	subscribeToStorage(triggerChangeEvent);

	module.exports = sklad;

	/**
	 * Проверяем наличие localStorage
	 * если доступен возвращаем ссылку на него
	 * если не доступен возвращаем false
	 * @return {Storage|Boolean}
	 */
	function checkAndGetStorage() {
	    var test = new Date();
	    var _storage;
	    var result;

	    try {
	        (_storage = window.localStorage).setItem(test, test);
	        result = _storage.getItem(test) == test;
	        _storage.removeItem(test);
	        return result && _storage;
	    } catch (error) {
	        return undefined;
	    }
	}

	/**
	 * В зависимости от браузера возвращаем нужную функцию для подписки на событие 'storage'
	 * @return {Function}
	 */
	function subscribeToStorage(handler) {
	    if (window.attachEvent) {
	        // Note: IE listens on document
	        document.attachEvent('onstorage', handler);
	    } else if (window.opera || /webkit/i.test( navigator.userAgent )){
	        // Note: Opera and WebKits listens on window
	        return window.addEventListener('storage', handler, false);
	    } else {
	        // Note: FF listens on document.body or document
	        return document.body.addEventListener('storage', handler, false);
	    }
	}

	/**
	 * Безопасный метод для записи в localStorage
	 * если ловим ошибки реджектим очередь
	 * @this {Queue}
	 */
	function setItem() {
	    var params = this.getData('params');

	    if (sklad.store) {
	        this.invoke(sklad.store.setItem, [params.key, params.val], sklad.store);
	    } else {
	        this.reject();
	    }
	}

	/**
	 * Безопасный метод для чтения из localStorage
	 * @this {Queue}
	 * @return {*} значение из localStorage
	 */
	function getItem() {
	    var params = this.getData('params');

	    if (sklad.store) {
	        return this.invoke(sklad.store.getItem, [params.key], sklad.store);
	    } else {
	        this.reject();
	        return;
	    }
	}

	/**
	 * В зависимости от ожидаемого формата ответа парсим строку в json
	 * или отдаём сырые данные
	 * @this {Queue}
	 * @return {*}
	 */
	function parseData(data) {
	    var params = this.getData('params');

	    if (params.type === 'json') {
	        return this.invoke(JSON.parse, [data]);
	    } else {
	        return data;
	    }
	}

	/**
	 * Проверяем сохраненное значение если указан strict режим
	 * @this {Queue}
	 */
	function checkSavedItem(data) {
	    var params = this.getData('params');

	    if (data !== params.val) {
	        this.reject();
	    } else {
	        this.resolve(data);
	    }
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * @fileOverview Response.
	 */

	var EventEmitter = __webpack_require__(3);
	var toString = Object.prototype.toString;
	var nativeEmit = EventEmitter.prototype.emit;

	/**
	 *
	 * @param {*} [state] Начальное состояние объекта.
	 * @returns {State}
	 * @constructor
	 * @extends {EventEmitter}
	 */
	function State(state) {
	    EventEmitter.call(this);

	    this.state = arguments.length ? state : this.state;
	    this.data = this.data || {};
	    this.stateData = new Array(0);
	    this.keys = null;

	    return this;
	}

	/**
	 * Проверяет, я вляется ли объект экземпляром конструктора {@link State}.
	 * @param {Object} [object] Проверяемый объект.
	 * @returns {Boolean}
	 * @static
	 */
	State.isState = function (object) {
	    return object != null && ((object instanceof State) || object.isState);
	};

	/**
	 * Создает объект, который наследует от объекта {@link State}.
	 * @function
	 * @static
	 * @returns {Object}
	 * @example
	 * function Const () {}
	 *
	 * Const.prototype = State.create(Const);
	 *
	 * new Const() instanceof State; // true
	 * Const.prototype.constructor === Const; // true
	 */
	State.create = create;

	State.prototype = create.call(EventEmitter, State);

	/**
	 * Событие изменения состояния.
	 * @default 'changeState'
	 * @type {String}
	 */
	State.prototype.EVENT_CHANGE_STATE = 'changeState';

	/**
	 * Событие изменения состояния.
	 * @default 'changeState'
	 * @type {String}
	 */
	State.prototype.STATE_ERROR = 'error';

	/**
	 * @type {Boolean}
	 * @const
	 * @default true
	 */
	State.prototype.isState = true;

	/**
	 * Текущее состояние объекта.
	 * @readonly
	 * @type {String}
	 */
	State.prototype.state = null;

	/**
	 *
	 * @type {Array}
	 * @default null
	 */
	State.prototype.keys = null;

	/**
	 *
	 * @type {*}
	 * @default null
	 */
	State.prototype.data = null;

	/**
	 * Данные для обработчиков стостояния.
	 * @readonly
	 * @type {Array}
	 * @default []
	 */
	State.prototype.stateData = null;

	/**
	 *
	 * @param {Function} method
	 * @param {Array} [args]
	 * @param {*} [context=this]
	 */
	State.prototype.invoke = function (method, args, context) {
	    var ctx = context == null ? this : context;
	    var _args = (args && !isNaN(args.length)) ? args : new Array(0);
	    var r;

	    try {
	        switch (_args.length) {
	            case 0:
	                r = method.call(ctx);
	                break;
	            case 1:
	                r = method.call(ctx, _args[0]);
	                break;
	            case 2:
	                r = method.call(ctx, _args[0], _args[1]);
	                break;
	            case 3:
	                r = method.call(ctx, _args[0], _args[1], _args[2]);
	                break;
	            case 4:
	                r = method.call(ctx, _args[0], _args[1], _args[2], _args[3]);
	                break;
	            case 5:
	                r = method.call(ctx, _args[0], _args[1], _args[2], _args[3], _args[4]);
	                break;
	            default:
	                r = method.apply(ctx, _args);
	        }
	    } catch (error) {
	        r = toError(error);

	        if (this && this.isState) {
	            this.setState(this.STATE_ERROR, r);
	        }
	    }

	    return r;
	};

	/**
	 * @param {String} type Тип события.
	 * @param {...*} [args] Аргументы, передаваемые в обработчик события.
	 * @returns {Boolean|Error}
	 */
	State.prototype.emit = function (type, args) {
	    if (this._events && this._events[type]) {
	        var index = arguments.length;
	        var data = new Array(index);

	        while (index) {
	            data[--index] = arguments[index];
	        }

	        return this.invoke(nativeEmit, data);
	    }

	    return false;
	};

	/**
	 * Обнуляет все собственные свойства объекта.
	 * @returns {State}
	 */
	State.prototype.destroy = function () {
	    for (var property in this) {
	        if (this.hasOwnProperty(property)) {
	            this[property] = null;
	        }
	    }

	    return this;
	};

	/**
	 * Сравнивает текущее состояние объекта со значение state.
	 * @param {*} state Состояние, с которым необходимо ставнить текущее.
	 * @returns {Boolean} Результат сравнения.
	 */
	State.prototype.is = function (state) {
	    return this.state === state;
	};

	/**
	 * Изменяет состояние объекта.
	 * После изменения состояния, первым будет вызвано событие с именем, соответствуюшим новому значению состояния.
	 * Затем событие {@link State#EVENT_CHANGE_STATE}.
	 * Если новое состояние не передано или объект уже находится в указаном состоянии, события не будут вызваны.
	 * @param {*} state Новое сотояние объекта.
	 * @param {Array|*} [stateData] Данные, которые будут переданы аргументом в обработчики нового состояния.
	 *                         Если был передан массив, аргументами для обработчиков будут его элементы.
	 * @returns {State}
	 * @example
	 * new State()
	 *   .onState('foo', function (bar) {
	 *     bar; // 'baz'
	 *     this.state; // 'foo'
	 *   })
	 *   .setState('foo', 'baz');
	 *
	 * new State()
	 *   .onState('foo', function (bar, baz) {
	 *     bar; // true
	 *     baz; // false
	 *   })
	 *   .setState('foo', [true, false]);
	 */
	State.prototype.setState = function (state, stateData) {
	    var _state = this.state !== state;
	    var _hasData = arguments.length > 1;
	    var _data = _hasData ? wrapIfArray(stateData) : new Array(0);

	    if (_state || _hasData || _data.length) {
	        this.stateData = _data;

	        if (this._event) {
	            this._event.data = _data;
	        }
	    }

	    if (_state) {
	        changeState(this, state, _data);
	    }

	    return this;
	};

	/**
	 * Регистрирует обработчик состояния.
	 * Если объект уже находится в указанном состоянии, обработчик будет вызван немедленно.
	 * @param {*} state Отслеживаемое состояние.
	 * @param {Function|EventEmitter} listener Обработчик состояния.
	 * @param {Object} [context=this] Контекст обработчика состояния.
	 * @returns {State}
	 * @throws {Error}
	 * @example
	 * new State()
	 *   .onState('foo', function () {
	 *     this.state; // only 'foo'
	 *   })
	 *   .setState('foo')
	 *   .setState('bar');
	 */
	State.prototype.onState = function (state, listener, context) {
	    if (this.state === state) {
	        invoke(this, listener, context);
	    }

	    return this.on(state, listener, context);
	};

	/**
	 * Регистрирует одноразовый обработчик состояния.
	 * @param {*} state Отслеживаемое состояние.
	 * @param {Function|EventEmitter} listener Обрабо1тчик состояния.
	 * @param {Object} [context=this] Контекст обработчика состояния.
	 * @returns {State}
	 * @throws {Error}
	 * @example
	 * new State()
	 *   .onceState('foo', function () {
	 *     // Этот обработчик будет выполнен один раз
	 *   })
	 *   .setState('foo')
	 *   .setState('bar')
	 *   .setState('foo');
	 */
	State.prototype.onceState = function (state, listener, context) {
	    if (this.state === state) {
	        invoke(this, listener, context);
	    } else {
	        this.once(state, listener, context);
	    }

	    return this;
	};

	/**
	 * Регистрирует обработчик изменения состояния.
	 * @param {Function|EventEmitter} listener Обработчик изменения состояния.
	 * @param {Object} [context=this] Контекст обработчика изменения состояния.
	 * @returns {State}
	 * @example
	 * new State()
	 *   .onChangeState(function (state) {
	 *     console.log(state); // 'foo', 'bar'
	 *   })
	 *   .setState('foo')
	 *   .setState('bar');
	 */
	State.prototype.onChangeState = function (listener, context) {
	    return this.on(this.EVENT_CHANGE_STATE, listener, context);
	};

	/**
	 * Отменяет обработку изменения состояния.
	 * @param {Function|EventEmitter} [listener] Обработчик, который необходимо отменить.
	 *                                           Если обработчик не был передан, будут отменены все обработчики.
	 * @returns {State}
	 */
	State.prototype.offChangeState = function (listener) {
	    if (listener) {
	        this.removeListener(this.EVENT_CHANGE_STATE, listener);
	    } else {
	        this.removeAllListeners(this.EVENT_CHANGE_STATE);
	    }

	    return this;
	};

	/**
	 *
	 * @param {String} key
	 * @param {*} [value]
	 * @returns {State}
	 */
	State.prototype.setData = function (key, value) {
	    this.data[key] = value;

	    return this;
	};

	/**
	 *
	 * @param {String} [key]
	 * @returns {*}
	 */
	State.prototype.getData = function (key) {
	    return arguments.length ? this.data[key] : this.data;
	};

	/**
	 *
	 * @param {Function} callback
	 * @param {Object} [context=this]
	 * @throws {Error}
	 * @returns {Function}
	 */
	State.prototype.bind = function (callback, context) {
	    if (typeof callback !== 'function') {
	        throw new Error('Callback is not a function');
	    }

	    var _context = context == null ? this : context;

	    return function stateCallback() {
	        return callback.apply(_context, arguments);
	    };
	};

	/**
	 *
	 * @param {Array} [keys=this.keys]
	 * @returns {Object}
	 */
	State.prototype.toObject = function (keys) {
	    var _keys = keys == null ? this.keys : keys;

	    if (isArray(_keys)) {
	        return resultsToObject(this.stateData, _keys);
	    } else if (this.stateData.length > 1) {
	        return resultsToArray(this.stateData);
	    } else {
	        return toObject(this.stateData[0]);
	    }
	};

	/**
	 *
	 * @param {*} key
	 * @returns {*}
	 */
	State.prototype.getByKey = function (key) {
	    if (!isArray(this.keys)) {
	        return;
	    }

	    var index = this.keys.length;

	    while (index) {
	        if (this.keys[--index] === key) {
	            return this.stateData[index];
	        }
	    }
	};

	/**
	 *
	 * @param {Number} index
	 * @returns {*}
	 */
	State.prototype.getByIndex = function (index) {
	    return this.stateData[index];
	};

	/**
	 *
	 * @returns {Object}
	 */
	State.prototype.toJSON = function () {
	    return this.toObject();
	};

	/**
	 *
	 * @param {Array} [keys=null]
	 * @returns {State}
	 */
	State.prototype.setKeys = function (keys) {
	    this.keys = isArray(keys) ? keys : null;

	    return this;
	};

	/**
	 *
	 * @param {Response} [parent]
	 * @constructor
	 * @requires EventEmitter
	 * @extends {State}
	 * @returns {Response}
	 */
	function Response(parent) {
	    this.State(this.STATE_PENDING);
	    this.callback = this.callback;

	    if (Response.isCompatible(parent)) {
	        this.listen(parent);
	    }

	    return this;
	}

	/**
	 * @type {State}
	 */
	Response.State = State;

	/**
	 * @type {Queue}
	 */
	Response.Queue = Queue;

	/**
	 *
	 * @param {Response|*} [object]
	 * @static
	 * @returns {Boolean}
	 */
	Response.isResponse = function (object) {
	    return object != null && ((object instanceof Response) || object.isResponse);
	};

	/**
	 *
	 * @param {*} object
	 * @static
	 * @returns {Boolean}
	 */
	Response.isCompatible = function (object) {
	    return object != null && isFunction(object.then);
	};

	/**
	 *
	 * @example
	 * var Response = require('Response');
	 *
	 * module.exports = Response.create();
	 * module.exports instanceof Response; // true
	 * module.exports.hasOwnProperty('resolve'); // false
	 *
	 * @static
	 * @returns {Object}
	 */
	Response.create = create;

	/**
	 * @param {...*} [results]
	 * @static
	 * @returns {Response}
	 */
	Response.resolve = function (results) {
	    var response = new Response();
	    var index = arguments.length;

	    while (index) {
	        response.stateData[--index] = arguments[index];
	    }

	    response.state = response.STATE_RESOLVED;

	    return response;
	};

	/**
	 *
	 * @param {*} reason
	 * @static
	 * @returns {Response}
	 */
	Response.reject = function (reason) {
	    var response = new Response();

	    response.state = response.STATE_REJECTED;
	    response.stateData[0] = toError(reason);

	    return response;
	};

	/**
	 * @param {...*} [args]
	 * @static
	 * @returns {Queue}
	 */
	Response.queue = function (args) {
	    var index = arguments.length;
	    var stack = new Array(index);

	    while (index) {
	        stack[--index] = arguments[index];
	    }

	    return new Queue(stack);
	};

	Response.prototype = State.create(Response);

	/**
	 * {@link State}
	 * @type {State}
	 */
	Response.prototype.State = State;

	/**
	 * @type {String}
	 * @default 'pending'
	 */
	Response.prototype.STATE_PENDING = 'pending';

	/**
	 * @type {String}
	 * @default 'resolve'
	 */
	Response.prototype.STATE_RESOLVED = 'resolve';

	/**
	 * @type {String}
	 * @default 'error'
	 */
	Response.prototype.STATE_REJECTED = 'error';

	/**
	 * @type {String}
	 * @default 'progress'
	 */
	Response.prototype.EVENT_PROGRESS = 'progress';

	/**
	 * @type {Boolean}
	 * @const
	 * @default true
	 */
	Response.prototype.isResponse = true;

	/**
	 *
	 * @returns {Response}
	 */
	Response.prototype.pending = function () {
	    this.setState(this.STATE_PENDING);

	    return this;
	};

	/**
	 * @param {...*} [results]
	 * @returns {Response}
	 */
	Response.prototype.resolve = function (results) {
	    var index = arguments.length;

	    if (index || !this.isResolved()) {
	        var data = new Array(index);

	        while (index) {
	            data[--index] = arguments[index];
	        }

	        this.setState(this.STATE_RESOLVED, data);
	    }

	    return this;
	};

	/**
	 *
	 * @param {*} reason
	 * @returns {Response}
	 */
	Response.prototype.reject = function (reason) {
	    if (arguments.length || !this.isRejected()) {
	        this.setState(this.STATE_REJECTED, toError(reason));
	    }

	    return this;
	};

	/**
	 *
	 * @param {*} progress
	 * @returns {Response}
	 */
	Response.prototype.progress = function (progress) {
	    if (this.isPending() && this._events && this._events[this.EVENT_PROGRESS]) {
	        this.invoke(nativeEmit, new Array(this.EVENT_PROGRESS, progress));
	    }

	    return this;
	};

	/**
	 *
	 * @returns {Boolean}
	 */
	Response.prototype.isPending = function () {
	    return !(
	    this.hasOwnProperty('state') &&
	    this.state === null ||
	    this.state === this.STATE_RESOLVED ||
	    this.state === this.STATE_REJECTED
	    );
	};

	/**
	 *
	 * @returns {Boolean}
	 */
	Response.prototype.isResolved = function () {
	    return this.state === this.STATE_RESOLVED;
	};

	/**
	 *
	 * @returns {Boolean}
	 */
	Response.prototype.isRejected = function () {
	    return this.state === this.STATE_REJECTED;
	};

	/**
	 *
	 * @param {Function|EventEmitter} [onResolve]
	 * @param {Function|EventEmitter} [onReject]
	 * @param {Function|EventEmitter} [onProgress]
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.then = function (onResolve, onReject, onProgress, context) {
	    if (onResolve != null) {
	        this.onceState(this.STATE_RESOLVED, onResolve, context);
	    }

	    if (onReject != null) {
	        this.onceState(this.STATE_REJECTED, onReject, context);
	    }

	    if (onProgress != null) {
	        this.on(this.EVENT_PROGRESS, onProgress, context);
	    }

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.always = function (listener, context) {
	    this
	        .onceState(this.STATE_RESOLVED, listener, context)
	        .onceState(this.STATE_REJECTED, listener, context);

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.onPending = function (listener, context) {
	    this.onceState(this.STATE_PENDING, listener, context);

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.onResolve = function (listener, context) {
	    this.onceState(this.STATE_RESOLVED, listener, context);

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.onReject = function (listener, context) {
	    this.onceState(this.STATE_REJECTED, listener, context);

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.onProgress = function (listener, context) {
	    this.on(this.EVENT_PROGRESS, listener, context);

	    return this;
	};

	/**
	 *
	 * @param {Response} parent
	 * @throws {Error} Бросает исключение, если parent равен this.
	 * @returns {Response}
	 * @this {Response}
	 */
	Response.prototype.notify = function (parent) {
	    if (parent) {
	        if (parent === this) {
	            throw new Error('Can\'t notify itself');
	        }

	        this.then(parent.resolve, parent.reject, parent.progress, parent);
	    }

	    return this;
	};

	/**
	 * @example
	 * var Response = require('Response');
	 * var Vow = require('Vow');
	 *
	 * new Response()
	 *   .onResolve(function (result) {
	 *     // result is "'success'" here
	 *   })
	 *   .listen(new Vow.Promise(function (resolve, reject, notify) {
	 *     resolve('success');
	 *   }));
	 *
	 * @param {Response|Object} response
	 * @this {Response}
	 * @throws {Error} Бросает исключение, если response равен this.
	 * @returns {Response}
	 */
	Response.prototype.listen = function (response) {
	    if (response === this) {
	        throw new Error('Cannot listen on itself');
	    }

	    if (!this.isPending()) {
	        this.pending();
	    }

	    response.then(this.resolve, this.reject, this.progress, this);

	    return this;
	};

	/**
	 *
	 * @returns {Response}
	 */
	Response.prototype.done = function () {
	    return this.always(this.destroy);
	};

	/**
	 *
	 * @param {Error|*} [error]
	 * @param {...*} [results]
	 */
	Response.prototype.callback = function defaultResponseCallback(error, results) {
	    var index = arguments.length;
	    var args;

	    if (error == null) {
	        if (index <= 1) {
	            this.resolve();
	        } else {
	            args = new Array(--index);

	            while (index) {
	                args[--index] = arguments[index + 1];
	            }

	            this.setState(this.STATE_RESOLVED, args);
	        }
	    } else {
	        this.reject(error);
	    }
	};

	/**
	 * @example
	 * var Response = require('Response');
	 * var r = new Response()
	 *   .makeCallback(function (data, textStatus, jqXHR) {
	 *     if (data && data.error) {
	 *        this.reject(data.error);
	 *     } else {
	 *        this.resolve(data.result);
	 *     }
	 *   });
	 *
	 * $.getJSON('ajax/test.json', r.callback);
	 *
	 * @param {Function} [callback=this.callback]
	 * @param {Object} [context=this]
	 * @returns {Response}
	 */
	Response.prototype.makeCallback = function (callback, context) {
	    this.callback = this.bind(isFunction(callback) ? callback : this.callback, context);

	    return this;
	};

	/**
	 *
	 * @example
	 * var r = new Response()
	 *   .resolve(3) // resolve one result
	 *   .getResult() // 3, returns result
	 *
	 * r
	 *   .resolve(1, 2) // resolve more results
	 *   .getResult() // [1, 2], returns a results array
	 *
	 * r.getResult(1) // 2, returns result on a index
	 *
	 * r.getResult(['foo', 'bar']) // {foo: 1, bar: 2}, returns a hash results
	 *
	 * r
	 *   .setKeys(['foo', 'bar']) // sets a default keys
	 *   .getResult('bar') // 2, returns result on a default key
	 *
	 * @param {String|Number} [key]
	 * @returns {*}
	 * @throws {Error}
	 */
	Response.prototype.getResult = function (key) {
	    if (this.isRejected()) {
	        return undefined;
	    }

	    switch (getType(key)) {
	        case 'String':
	        case 'Number':
	            return toObject(this.getByKey(key));
	            break;
	        default:
	            return this.toObject(key);
	            break;
	    }
	};

	/**
	 *
	 * @returns {Error|null}
	 */
	Response.prototype.getReason = function () {
	    return this.isRejected() ? this.stateData[0] : null;
	};

	/**
	 *
	 * @param {Array} [stack=[]]
	 * @param {Boolean} [start=false]
	 * @constructor
	 * @extends {Response}
	 * @returns {Queue}
	 */
	function Queue(stack, start) {
	    this.Response();

	    this.stack = isArray(stack) ? stack : new Array(0);
	    this.item = null;
	    this.isStrict = this.isStrict;
	    this.isStarted = this.isStarted;
	    this
	        .onState(this.STATE_RESOLVED, this.stop)
	        .onState(this.STATE_REJECTED, this.stop);

	    if (getType(start) === 'Boolean' ? start.valueOf() : false) {
	        this.start();
	    }

	    return this;
	}

	Queue.create = create;

	/**
	 *
	 * @param {Queue|*} [object]
	 * @returns {Boolean}
	 */
	Queue.isQueue = function (object) {
	    return object != null && ((object instanceof Queue) || object.isQueue);
	};

	Queue.prototype = Response.create(Queue);

	Queue.prototype.Response = Response;

	/**
	 * @default 'start'
	 * @type {String}
	 */
	Queue.prototype.EVENT_START = 'start';

	/**
	 * @default 'stop'
	 * @type {String}
	 */
	Queue.prototype.EVENT_STOP = 'stop';

	/**
	 * @default 'nextItem'
	 * @type {String}
	 */
	Queue.prototype.EVENT_NEXT_ITEM = 'nextItem';

	/**
	 * @type {Boolean}
	 * @const
	 * @default true
	 */
	Queue.prototype.isQueue = true;

	/**
	 * @readonly
	 * @default false
	 * @type {Boolean}
	 */
	Queue.prototype.isStrict = false;

	/**
	 * @readonly
	 * @type {Boolean}
	 * @default false
	 */
	Queue.prototype.isStarted = false;

	/**
	 * @readonly
	 * @type {Array}
	 * @default null
	 */
	Queue.prototype.stack = null;

	/**
	 * @readonly
	 * @type {*}
	 * @default null
	 */
	Queue.prototype.item = null;

	/**
	 *
	 * @returns {Queue}
	 */
	Queue.prototype.start = function () {
	    if (!this.isStarted && this.isPending()) {
	        this.isStarted = true;
	        this.invoke(nativeEmit, newArray(this.EVENT_START));

	        iterate(this);
	    }

	    return this;
	};

	/**
	 *
	 * @returns {Queue}
	 */
	Queue.prototype.stop = function () {
	    if (this.isStarted === true) {
	        this.isStarted = false;

	        if (this.stack.length === 0) {
	            this.item = null;
	        }

	        this.invoke(nativeEmit, new Array(this.EVENT_STOP, this.item));
	    }

	    return this;
	};

	/**
	 * @param {...*} [args]
	 * @returns {Queue}
	 */
	Queue.prototype.push = function (args) {
	    var length = arguments.length;
	    var index = 0;
	    var stackLength = this.stack.length;

	    while (index < length) {
	        this.stack[stackLength++] = arguments[index++];
	    }

	    return this;
	};

	/**
	 *
	 * @returns {Object}
	 */
	Queue.prototype.getResults = function () {
	    var length = this.stateData.length;
	    var index = 0;
	    var results = {};
	    var key;
	    var item;

	    if (this.isRejected()) {
	        return results;
	    }

	    while (index < length) {
	        key = this.keys[index];

	        if (key != null) {
	            item = this.stateData[index];

	            if (Queue.isQueue(item)) {
	                results[key] = item.getResult();
	            } else if (Response.isResponse(item)) {
	                results[key] = item.getResults();
	            } else if (!(item instanceof Error)) {
	                results[key] = item;
	            }
	        }

	        index++;
	    }

	    return results;
	};

	/**
	 *
	 * @returns {Object}
	 */
	Queue.prototype.getReasons = function () {
	    var length = this.stateData.length;
	    var index = 0;
	    var results = {};
	    var key;
	    var item;

	    while (index < length) {
	        key = this.keys[index];

	        if (key != null) {
	            item = this.stateData[index];

	            if (Queue.isQueue(item)) {
	                results[key] = item.getReason();
	            } else if (Response.isResponse(item)) {
	                results[key] = item.getReasons();
	            } else if (item instanceof Error) {
	                results[key] = item;
	            }
	        }

	        index++;
	    }

	    return results;
	};

	/**
	 * @param {Boolean} [flag=true]
	 * @returns {Queue}
	 */
	Queue.prototype.strict = function (flag) {
	    this.isStrict = arguments.length ? Boolean(flag) : true;

	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Queue}
	 */
	Queue.prototype.onStart = function (listener, context) {
	    this.on(this.EVENT_START, listener, context);
	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Queue}
	 */
	Queue.prototype.onStop = function (listener, context) {
	    this.on(this.EVENT_STOP, listener, context);
	    return this;
	};

	/**
	 *
	 * @param {Function|EventEmitter} listener
	 * @param {Object} [context=this]
	 * @returns {Queue}
	 */
	Queue.prototype.onNextItem = function (listener, context) {
	    this.on(this.EVENT_NEXT_ITEM, listener, context);
	    return this;
	};

	/**
	 *
	 * @returns {Queue}
	 */
	Queue.prototype.destroyItems = function () {
	    var stack = this.stack.concat(this.stateData);
	    var index = stack.length;

	    while (index) {
	        var item = stack[--index];

	        if (State.isState(item)) {
	            item.destroy();
	        }
	    }

	    return this;
	};

	/**
	 * Exports: {@link Response}
	 * @exports Response
	 */
	module.exports = Response;

	function iterate(queue) {
	    if (!queue.isStarted) {
	        return;
	    }

	    while (queue.stack.length) {
	        if (checkFunction(queue, queue.item) || emitNext(queue, queue.item) || checkResponse(queue, queue.item)) {
	            return;
	        }

	        queue.stateData.push(queue.stack.shift());
	    }

	    queue.setState(queue.STATE_RESOLVED, queue.stateData);
	}

	// TODO: fixed "Did not inline State.onceState called from checkResponse (cumulative AST node limit reached)."
	function checkFunction(queue, item) {
	    queue.item = queue.stack[0];

	    if (isFunction(queue.item)) {
	        var results;

	        if (Response.isResponse(item)) {
	            results = item.state === item.STATE_RESOLVED ? item.stateData : null;
	        } else {
	            results = newArray(item);
	        }

	        queue.stack[0] = queue.item = queue.invoke.call(queue.isStrict ? queue : null, queue.item, results, queue);
	    }

	    return !queue.isStarted;
	}

	function emitNext(queue, item) {
	    queue.invoke(nativeEmit, new Array(queue.EVENT_NEXT_ITEM, item));

	    return !queue.isStarted;
	}

	function checkResponse(queue, item) {
	    if (item && Response.isResponse(item) && item !== queue) {
	        if (item.state === item.STATE_REJECTED && queue.isStrict) {
	            queue.setState(queue.STATE_REJECTED, item.stateData);

	            return true;
	        } else if (item.state !== item.STATE_RESOLVED) {
	            item
	                .onceState(item.STATE_RESOLVED, onEndStackItem, queue)
	                .onceState(item.STATE_REJECTED, queue.isStrict ? queue.reject : onEndStackItem, queue);

	            return true;
	        }
	    }
	}

	function onEndStackItem() {
	    if (this.isStarted) {
	        this.stateData.push(this.stack.shift());

	        iterate(this);
	    }
	}

	function getType(object) {
	    return toString.call(object).slice(8, -1);
	}

	function isArray(object) {
	    return object && (toString.call(object).slice(8, -1) === 'Array');
	}

	function wrapIfArray(object) {
	    return isArray(object) ? object : newArray(object);
	}

	function newArray(item) {
	    var _array = new Array(1);
	    _array[0] = item;
	    return _array;
	}

	function isFunction(object) {
	    return typeof object === 'function';
	}

	function toError(value) {
	    return value != null && (getType(value) === 'Error' || value instanceof Error) ? value : new Error(value);
	}

	function changeState(object, state, data) {
	    var _events = object._events;

	    object.stopEmit(object.state);
	    object.state = state;

	    if (_events) {
	        if (_events[state]) {
	            object.invoke(nativeEmit, newArray(state).concat(data));
	        }

	        if (_events[object.EVENT_CHANGE_STATE] && object.state === state) {
	            object.invoke(nativeEmit, new Array(object.EVENT_CHANGE_STATE, state));
	        }
	    }
	}

	function resultsToObject (data, keys) {
	    var index = 0;
	    var length = data.length;
	    var result = {};
	    var key;

	    while (index < length) {
	        key = keys[index];

	        if (key != null) {
	            result[key] = toObject(data[index]);
	        }

	        index++;
	    }

	    return result;
	}

	function resultsToArray (data) {
	    var index = 0;
	    var length = data.length;
	    var result = new Array(length);

	    while (index < length) {
	        result[index] = toObject(data[index++]);
	    }

	    return result;
	}

	function toObject(item) {
	    return (item && item.toObject) ? item.toObject() : item;
	}

	function invoke(emitter, listener, context) {
	    if (isFunction(listener)) {
	        emitter.invoke(listener, emitter.stateData, context);
	    } else if (emitter && isFunction(emitter.then)) {
	        if (emitter._events && emitter._events[emitter.state]) {
	            emitter.invoke(nativeEmit, newArray(emitter.state).concat(emitter.stateData));
	        }
	    } else {
	        throw new Error(EventEmitter.LISTENER_TYPE_ERROR);
	    }
	}

	function Prototype(constructor) {
	    var proto = Prototype.prototype;
	    var name;

	    for (name in proto) {
	        if (proto.hasOwnProperty(name) && name !== 'constructor') {
	            this[name] = proto[name];
	        }
	    }

	    if (constructor) {
	        this.constructor = constructor;
	        constructor.prototype = this;
	    }

	    Prototype.prototype = null;
	}

	function create(constructor, sp) {
	    if (constructor && sp === true) {
	        for (var name in this) {
	            if (this.hasOwnProperty(name)) {
	                constructor[name] = this[name];
	            }
	        }
	    }

	    Prototype.prototype = this.prototype;

	    return new Prototype(constructor);
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * @fileOverview EventEmitter.
	 */

	/**
	 * Наделяет объект событийной моделью.
	 * @constructor
	 * @extend {EventEmitter}
	 */
	function EventEmitter() {
	    this._event = null;
	    this._events = this._events;
	    this._maxListeners = this._maxListeners;
	}

	/**
	 * Сообщение об ошибке попытки подписки некорректного обработчика.
	 * @const
	 * @type {String}
	 */
	EventEmitter.LISTENER_TYPE_ERROR = 'Listener must be a function or EventEmitter';

	try {
	    var EE = __webpack_require__(4).EventEmitter;
	} catch (error) {
	}

	EventEmitter.prototype = new (EE || Object);
	EventEmitter.prototype.constructor = EventEmitter;

	/**
	 * Количество обработчиков одного события по-умолчанию.
	 * @static
	 * @const
	 * @default 10
	 * @type {Number}
	 */
	EventEmitter.MAX_LISTENERS = 10;

	/**
	 * Имя события добавления нового обработчика.
	 * @static
	 * @const
	 * @default 'newListener'
	 * @type {String}
	 */
	EventEmitter.EVENT_NEW_LISTENER = 'newListener';

	/**
	 * Имя события добавления нового обработчика.
	 * @static
	 * @const
	 * @default 'newListener'
	 * @type {String}
	 */
	EventEmitter.EVENT_REMOVE_LISTENER = 'removeListener';

	/**
	 * Возвращает количество обработчиков определенного события.
	 * @param {EventEmitter} emitter Объект {@link EventEmitter}.
	 * @param {String} type Тип события.
	 * @returns {number}
	 */
	EventEmitter.listenerCount = function (emitter, type) {
	    var listeners = emitter._events && emitter._events[type];

	    return listeners ? listeners.length : 0;
	};

	/**
	 * Объект, в котором хранятся обработчики событий.
	 * @type {Object}
	 * @default null
	 * @protected
	 */
	EventEmitter.prototype._events = null;

	/**
	 * Объект события.
	 * @type {Event}
	 * @default null
	 * @protected
	 */
	EventEmitter.prototype._event = null;

	/**
	 * Максимальное количество обработчиков для одного события.
	 * @type {Number}
	 * @default 10
	 * @private
	 */
	EventEmitter.prototype._maxListeners = EventEmitter.MAX_LISTENERS;

	/**
	 * Останавливает выполение обработчиков события.
	 * @param {String|Number} [type] Если передан тип и он не соответствует типу выполняемого события,
	 *                               выполнение не будет остановлено.
	 * @example
	 * var EventEmitter = require('EventEmitter');
	 *
	 * new EventEmitter()
	 *   .on('event', function () {
	 *      new EventEmitter().stopEmit(); // false
	 *      this.stopEmit(); // true
	 *   })
	 *   .emit('event');
	 * @returns {Boolean} Возвращает true, если выполнение обработчиков события было остановлено.
	 */
	EventEmitter.prototype.stopEmit = function (type) {
	    var _event = this._event;

	    if (_event && (!arguments.length || _event.type == type)) {
	        return _event.stop = true;
	    }

	    return false;
	};

	/**
	 * Заменяет данные события, если оно есть.
	 * @param {...*} [args]
	 * @example
	 * new EventEmitter()
	 *   .on('event', function (data) {
	 *     data; // 'foo'
	 *     this.updateEventData('bar');
	 *   })
	 *   .on('event', function (data) {
	 *     data; // 'bar'
	 *   })
	 *   .emit('event', 'foo');
	 */
	EventEmitter.prototype.setEventData = function (args) {
	    var length = arguments.length;
	    var data = this._event && this._event.data;

	    if (data) {
	        data.length = length;

	        while (length) {
	            data[--length] = arguments[length];
	        }
	    }

	    return this;
	};

	/**
	 * Возвращает текущие данные события в виде массива.
	 * @returns {Array|null}
	 * @example
	 * new EventEmitter()
	 *   .on('event', function () {
	 *     this.getEventData(); // ['foo', 'bar'];
	 *   })
	 *   .emit('event', 'foo', 'bar');
	 */
	EventEmitter.prototype.getEventData = function () {
	    var data;
	    var length;
	    var result;

	    if (this._event) {
	        data = this._event.data;
	        length = data.length;
	        result = new Array(length);

	        while (length) {
	            result[--length] = data[length];
	        }

	        return result;
	    } else {
	        return null;
	    }
	};

	/**
	 * Возвращает текущий тип события.
	 * @returns {String|Number|null}
	 */
	EventEmitter.prototype.getEventType = function () {
	    return this._event && this._event.type;
	};

	/**
	 * Устанавливает максимальное количество обработчиков одного события.
	 * @param {Number} count Новое количество обработчиков.
	 * @throws {Error} Бросает исключение при некорректном значении count.
	 */
	EventEmitter.prototype.setMaxListeners = function (count) {
	    if (typeof count !== 'number' || count < 0 || isNaN(count)) {
	        throw new Error('Count must be a positive number');
	    }

	    this._maxListeners = count;
	};

	/**
	 * Устанавливает обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object} [context=this] Контекст выполнения обработчика.
	 * @throws {Error} Бросает исключение, если listener имеет некорректный тип.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.on = function (type, listener, context) {
	    if (!isListener(listener)) {
	        throw new Error(EventEmitter.LISTENER_TYPE_ERROR);
	    }

	    var _events = this._events || (this._events = {});
	    var listeners = _events[type] || (_events[type] = new Array(0));

	    if (_events.newListener) {
	        this.emit('newListener', type, listener, context == null ? this : context);
	    }

	    listeners[listeners.length] = {
	        type: type,
	        callback: listener,
	        context: context,
	        isOnce: false
	    };

	    return this;
	};


	/**
	 * То же, что и {@link EventEmitter#on}.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object|null} [context] Контекст выполнения обработчика.
	 * @function
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	/**
	 * Устанавливает одноразовый обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object|null} [context=this] Контекст выполнения обработчика.
	 * @returns {EventEmitter}
	 * @example
	 * new EventEmitter()
	 *   .once('type', function () {
	 *     // Обработчик выполнится только один раз
	 *   })
	 *   .emit('type')
	 *   .emit('type');
	 */
	EventEmitter.prototype.once = function (type, listener, context) {
	    this.on(type, listener, context);

	    getLastListener(this, type).isOnce = true;

	    return this;
	};

	/**
	 * Удаляет обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик, который необходимо удалить.
	 * @throws {Error} Бросает исключение, если listener имеет некорректный тип.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.off = function (type, listener) {
	    var _events = this._events;
	    var listeners = _events && _events[type];

	    if (!listeners) {
	        return this;
	    }

	    if (isListener(listener)) {
	        if (removeListener(listeners, listener)) {
	            if (_events.removeListener) {
	                this.emit('removeListener', type, listener);
	            }

	            if (listeners.length === 0) {
	                _events[type] = null;
	            }
	        }
	    } else {
	        throw new Error(EventEmitter.LISTENER_TYPE_ERROR);
	    }

	    return this;
	};

	/**
	 * То же, что и {@link EventEmitter#off}.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} [listener] Обработчик, который необходимо удалить.
	 * @function
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

	/**
	 * Если был передан тип события, метод работает аналогично {@link EventEmitter#off}, иначе удаляет все обработчики для всех событий.
	 * @param {String} [type] Тип события.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.removeAllListeners = function (type) {
	    var _events = this._events;
	    var key;
	    var hasNotType = arguments.length === 0;

	    if (!_events) {
	        return this;
	    }

	    if (_events.removeListener) {
	        if (hasNotType) {
	            for (key in _events) {
	                if (key !== 'removeListener' && _events.hasOwnProperty(key)) {
	                    removeAllListeners(this, key, _events);
	                }
	            }

	            removeAllListeners(this, 'removeListener', _events);
	        } else {
	            removeAllListeners(this, type, _events);

	            return this;
	        }
	    }

	    if (hasNotType) {
	        this._events = {};
	    } else {
	        _events[type] = null;
	    }

	    return this;
	};

	/**
	 * Возвращает массив обработчиков события.
	 * @param {String|Number} [type] Тип события.
	 * @returns {Array} Массив объектов события.
	 */
	EventEmitter.prototype.listeners = function (type) {
	    var _events = this._events;
	    var listeners = _events && _events[type];

	    if (listeners) {
	        var length = listeners.length;
	        var res = new Array(length);

	        while (length) {
	            res[--length] = listeners[length].callback;
	        }

	        return res;
	    } else {
	        return new Array(0);
	    }
	};

	/**
	 * Генерирует событие.
	 * @param {String} type Тип события.
	 * @param {...*} [args] Аргументы, которые будут переданы в обработчик события.
	 * @returns {Boolean} Вернет true, если был отработан хотя бы один обработчик события.
	 * @example
	 * new EventEmitter()
	 *   .on('error', function (reason) {
	 *     throw reason; // 'foo'
	 *   })
	 *   .emit('error', 'foo');
	 * @throws {Error} Бросает исключение, если генерируется событие error и на него не подписан ни один обработчик.
	 */
	EventEmitter.prototype.emit = function (type, args) {
	    var events = this._events && this._events[type];
	    var length = events && events.length;
	    var index;
	    var data;
	    var listener;
	    var callback;
	    var listeners;
	    var currentEvent;
	    var _event;

	    if (!length) {
	        if (type === 'error') {
	            throw (args instanceof Error) ? args : new Error('Uncaught, unspecified "error" event.');
	        } else {
	            return false;
	        }
	    }

	    index = arguments.length && arguments.length - 1;
	    data  = new Array(index);

	    while (index) {
	        data[index - 1] = arguments[index--];
	    }

	    index = length;
	    listeners = new Array(length);
	    currentEvent = this._event;
	    _event = this._event = {
	        type: type,
	        data: data,
	        stop: false
	    };

	    while (index) {
	        listeners[--index] = events[index];
	    }

	    while (index < length) {
	        listener = listeners[index++];
	        callback = listener.callback;

	        if (listener.isOnce === true) {
	            this.off(type, callback);
	        }

	        if (isFunction(callback)) {
	            call(callback, listener.context == null ? this : listener.context, _event.data);
	        } else {
	            emit(callback, listener.type, _event.data);
	        }

	        if (_event.stop) {
	            break;
	        }
	    }

	    this._event = currentEvent;

	    return true;
	};

	/**
	 * Назначает делегирование события на другой экземпляр {@link EventEmitter}.
	 * @param {EventEmitter} emitter Объект, на который необходимо делегировать событие type.
	 * @param {String} type Тип события, которое должно делегироваться.
	 * @param {String} [alias=type] Тип события, которое должно возникать на объекте emitter.
	 * @example
	 * var emitter1 = new EventEmitter();
	 * var emitter2 = new EventEmitter();
	 *
	 * emitter2
	 *   .on('some', function (result) {
	 *     // result is 'foo'
	 *   });
	 *
	 * emitter1
	 *   .delegate(emitter2, 'event', 'some')
	 *   .emit('event', 'foo');
	 *
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.delegate = function (emitter, type, alias) {
	    this.on(type, emitter);

	    if (!(alias == null || alias === type)) {
	        getLastListener(this, type).type = alias;
	    }

	    return this;
	};

	/**
	 * Останавливает делегирование события на другой экземпляр {@link EventEmitter}.
	 * @param {EventEmitter} emitter Объект, на который необходимо прекратить делегирование.
	 * @param {String} type Тип события.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.unDelegate = function (emitter, type) {
	    return this.off(type, emitter);
	};

	/**
	 * Exports: {@link EventEmitter}
	 * @exports EventEmitter
	 */
	module.exports = EventEmitter;

	function call(listener, context, data) {
	    switch (data.length) {
	        case 0:
	            listener.call(context);
	            break;
	        case 1:
	            listener.call(context, data[0]);
	            break;
	        case 2:
	            listener.call(context, data[0], data[1]);
	            break;
	        case 3:
	            listener.call(context, data[0], data[1], data[2]);
	            break;
	        default:
	            listener.apply(context, data);
	    }
	}

	function emit(emitter, type, data) {
	    switch (data.length) {
	        case 0:
	            emitter.emit(type);
	            break;
	        case 1:
	            emitter.emit(type, data[0]);
	            break;
	        case 2:
	            emitter.emit(type, data[0], data[1]);
	            break;
	        case 3:
	            emitter.emit(type, data[0], data[1], data[2]);
	            break;
	        default:
	            var a = new Array(1);
	            a[0] = type;
	            emitter.emit.apply(emitter, a.concat(data));
	    }
	}

	function removeListener(listeners, listener) {
	    var length = listeners.length;
	    var index = length;

	    while (index--) {
	        if (listeners[index].callback === listener) {
	            break;
	        }
	    }

	    if (index < 0) {
	        return false;
	    }

	    if (length === 1) {
	        listeners.length = 0;
	    } else {
	        listeners.splice(index, 1);
	    }

	    return true;
	}

	function removeAllListeners(emitter, type, events) {
	    var listeners = events[type];

	    if (!listeners) {
	        return;
	    }

	    var index = listeners.length;

	    while (index--) {
	        emitter.emit('removeListener', type, listeners.pop().callback);
	    }

	    events[type] = null;
	}

	function isFunction(fnc) {
	    return typeof fnc === 'function';
	}

	function isListener(listener) {
	    return listener && (isFunction(listener) || isFunction(listener.emit));
	}

	function getLastListener(emitter, type) {
	    var listeners = emitter._events[type];

	    return listeners[listeners.length - 1];
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];

	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	/**
	 * @fileOverview EventEmitter.
	 */

	/**
	 * Наделяет объект событийной моделью.
	 * @constructor
	 * @extend {EventEmitter}
	 */
	function EventEmitter() {
	    this._event = null;
	    this._events = this._events;
	    this._maxListeners = this._maxListeners;
	}

	/**
	 * Сообщение об ошибке попытки подписки некорректного обработчика.
	 * @const
	 * @type {String}
	 */
	EventEmitter.LISTENER_TYPE_ERROR = 'Listener must be a function or EventEmitter';

	try {
	    var EE = __webpack_require__(4).EventEmitter;
	} catch (error) {
	}

	EventEmitter.prototype = new (EE || Object);
	EventEmitter.prototype.constructor = EventEmitter;

	/**
	 * Количество обработчиков одного события по-умолчанию.
	 * @static
	 * @const
	 * @default 10
	 * @type {Number}
	 */
	EventEmitter.MAX_LISTENERS = 10;

	/**
	 * Имя события добавления нового обработчика.
	 * @static
	 * @const
	 * @default 'newListener'
	 * @type {String}
	 */
	EventEmitter.EVENT_NEW_LISTENER = 'newListener';

	/**
	 * Имя события добавления нового обработчика.
	 * @static
	 * @const
	 * @default 'newListener'
	 * @type {String}
	 */
	EventEmitter.EVENT_REMOVE_LISTENER = 'removeListener';

	/**
	 * Возвращает количество обработчиков определенного события.
	 * @param {EventEmitter} emitter Объект {@link EventEmitter}.
	 * @param {String} type Тип события.
	 * @returns {number}
	 */
	EventEmitter.listenerCount = function (emitter, type) {
	    var listeners = emitter._events && emitter._events[type];

	    return listeners ? listeners.length : 0;
	};

	/**
	 * Объект, в котором хранятся обработчики событий.
	 * @type {Object}
	 * @default null
	 * @protected
	 */
	EventEmitter.prototype._events = null;

	/**
	 * Объект события.
	 * @type {Event}
	 * @default null
	 * @protected
	 */
	EventEmitter.prototype._event = null;

	/**
	 * Максимальное количество обработчиков для одного события.
	 * @type {Number}
	 * @default 10
	 * @private
	 */
	EventEmitter.prototype._maxListeners = EventEmitter.MAX_LISTENERS;

	/**
	 * Останавливает выполение обработчиков события.
	 * @param {String|Number} [type] Если передан тип и он не соответствует типу выполняемого события,
	 *                               выполнение не будет остановлено.
	 * @example
	 * var EventEmitter = require('EventEmitter');
	 *
	 * new EventEmitter()
	 *   .on('event', function () {
	 *      new EventEmitter().stopEmit(); // false
	 *      this.stopEmit(); // true
	 *   })
	 *   .emit('event');
	 * @returns {Boolean} Возвращает true, если выполнение обработчиков события было остановлено.
	 */
	EventEmitter.prototype.stopEmit = function (type) {
	    var _event = this._event;

	    if (_event && (!arguments.length || _event.type == type)) {
	        return _event.stop = true;
	    }

	    return false;
	};

	/**
	 * Заменяет данные события, если оно есть.
	 * @param {...*} [args]
	 * @example
	 * new EventEmitter()
	 *   .on('event', function (data) {
	 *     data; // 'foo'
	 *     this.updateEventData('bar');
	 *   })
	 *   .on('event', function (data) {
	 *     data; // 'bar'
	 *   })
	 *   .emit('event', 'foo');
	 */
	EventEmitter.prototype.setEventData = function (args) {
	    var length = arguments.length;
	    var data = this._event && this._event.data;

	    if (data) {
	        data.length = length;

	        while (length) {
	            data[--length] = arguments[length];
	        }
	    }

	    return this;
	};

	/**
	 * Возвращает текущие данные события в виде массива.
	 * @returns {Array|null}
	 * @example
	 * new EventEmitter()
	 *   .on('event', function () {
	 *     this.getEventData(); // ['foo', 'bar'];
	 *   })
	 *   .emit('event', 'foo', 'bar');
	 */
	EventEmitter.prototype.getEventData = function () {
	    var data;
	    var length;
	    var result;

	    if (this._event) {
	        data = this._event.data;
	        length = data.length;
	        result = new Array(length);

	        while (length) {
	            result[--length] = data[length];
	        }

	        return result;
	    } else {
	        return null;
	    }
	};

	/**
	 * Возвращает текущий тип события.
	 * @returns {String|Number|null}
	 */
	EventEmitter.prototype.getEventType = function () {
	    return this._event && this._event.type;
	};

	/**
	 * Устанавливает максимальное количество обработчиков одного события.
	 * @param {Number} count Новое количество обработчиков.
	 * @throws {Error} Бросает исключение при некорректном значении count.
	 */
	EventEmitter.prototype.setMaxListeners = function (count) {
	    if (typeof count !== 'number' || count < 0 || isNaN(count)) {
	        throw new Error('Count must be a positive number');
	    }

	    this._maxListeners = count;
	};

	/**
	 * Устанавливает обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object} [context=this] Контекст выполнения обработчика.
	 * @throws {Error} Бросает исключение, если listener имеет некорректный тип.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.on = function (type, listener, context) {
	    if (!isListener(listener)) {
	        throw new Error(EventEmitter.LISTENER_TYPE_ERROR);
	    }

	    var _events = this._events || (this._events = {});
	    var listeners = _events[type] || (_events[type] = new Array(0));

	    if (_events.newListener) {
	        this.emit('newListener', type, listener, context == null ? this : context);
	    }

	    listeners[listeners.length] = {
	        type: type,
	        callback: listener,
	        context: context,
	        isOnce: false
	    };

	    return this;
	};


	/**
	 * То же, что и {@link EventEmitter#on}.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object|null} [context] Контекст выполнения обработчика.
	 * @function
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	/**
	 * Устанавливает одноразовый обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик события.
	 * @param {Object|null} [context=this] Контекст выполнения обработчика.
	 * @returns {EventEmitter}
	 * @example
	 * new EventEmitter()
	 *   .once('type', function () {
	 *     // Обработчик выполнится только один раз
	 *   })
	 *   .emit('type')
	 *   .emit('type');
	 */
	EventEmitter.prototype.once = function (type, listener, context) {
	    this.on(type, listener, context);

	    getLastListener(this, type).isOnce = true;

	    return this;
	};

	/**
	 * Удаляет обработчик события.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} listener Обработчик, который необходимо удалить.
	 * @throws {Error} Бросает исключение, если listener имеет некорректный тип.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.off = function (type, listener) {
	    var _events = this._events;
	    var listeners = _events && _events[type];

	    if (!listeners) {
	        return this;
	    }

	    if (isListener(listener)) {
	        if (removeListener(listeners, listener)) {
	            if (_events.removeListener) {
	                this.emit('removeListener', type, listener);
	            }

	            if (listeners.length === 0) {
	                _events[type] = null;
	            }
	        }
	    } else {
	        throw new Error(EventEmitter.LISTENER_TYPE_ERROR);
	    }

	    return this;
	};

	/**
	 * То же, что и {@link EventEmitter#off}.
	 * @param {String} type Тип события.
	 * @param {Function|EventEmitter} [listener] Обработчик, который необходимо удалить.
	 * @function
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

	/**
	 * Если был передан тип события, метод работает аналогично {@link EventEmitter#off}, иначе удаляет все обработчики для всех событий.
	 * @param {String} [type] Тип события.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.removeAllListeners = function (type) {
	    var _events = this._events;
	    var key;
	    var hasNotType = arguments.length === 0;

	    if (!_events) {
	        return this;
	    }

	    if (_events.removeListener) {
	        if (hasNotType) {
	            for (key in _events) {
	                if (key !== 'removeListener' && _events.hasOwnProperty(key)) {
	                    removeAllListeners(this, key, _events);
	                }
	            }

	            removeAllListeners(this, 'removeListener', _events);
	        } else {
	            removeAllListeners(this, type, _events);

	            return this;
	        }
	    }

	    if (hasNotType) {
	        this._events = {};
	    } else {
	        _events[type] = null;
	    }

	    return this;
	};

	/**
	 * Возвращает массив обработчиков события.
	 * @param {String|Number} [type] Тип события.
	 * @returns {Array} Массив объектов события.
	 */
	EventEmitter.prototype.listeners = function (type) {
	    var _events = this._events;
	    var listeners = _events && _events[type];

	    if (listeners) {
	        var length = listeners.length;
	        var res = new Array(length);

	        while (length) {
	            res[--length] = listeners[length].callback;
	        }

	        return res;
	    } else {
	        return new Array(0);
	    }
	};

	/**
	 * Генерирует событие.
	 * @param {String} type Тип события.
	 * @param {...*} [args] Аргументы, которые будут переданы в обработчик события.
	 * @returns {Boolean} Вернет true, если был отработан хотя бы один обработчик события.
	 * @example
	 * new EventEmitter()
	 *   .on('error', function (reason) {
	 *     throw reason; // 'foo'
	 *   })
	 *   .emit('error', 'foo');
	 * @throws {Error} Бросает исключение, если генерируется событие error и на него не подписан ни один обработчик.
	 */
	EventEmitter.prototype.emit = function (type, args) {
	    var events = this._events && this._events[type];
	    var length = events && events.length;
	    var index;
	    var data;
	    var listener;
	    var callback;
	    var listeners;
	    var currentEvent;
	    var _event;

	    if (!length) {
	        if (type === 'error') {
	            throw (args instanceof Error) ? args : new Error('Uncaught, unspecified "error" event.');
	        } else {
	            return false;
	        }
	    }

	    index = arguments.length && arguments.length - 1;
	    data  = new Array(index);

	    while (index) {
	        data[index - 1] = arguments[index--];
	    }

	    index = length;
	    listeners = new Array(length);
	    currentEvent = this._event;
	    _event = this._event = {
	        type: type,
	        data: data,
	        stop: false
	    };

	    while (index) {
	        listeners[--index] = events[index];
	    }

	    while (index < length) {
	        listener = listeners[index++];
	        callback = listener.callback;

	        if (listener.isOnce === true) {
	            this.off(type, callback);
	        }

	        if (isFunction(callback)) {
	            call(callback, listener.context == null ? this : listener.context, _event.data);
	        } else {
	            emit(callback, listener.type, _event.data);
	        }

	        if (_event.stop) {
	            break;
	        }
	    }

	    this._event = currentEvent;

	    return true;
	};

	/**
	 * Назначает делегирование события на другой экземпляр {@link EventEmitter}.
	 * @param {EventEmitter} emitter Объект, на который необходимо делегировать событие type.
	 * @param {String} type Тип события, которое должно делегироваться.
	 * @param {String} [alias=type] Тип события, которое должно возникать на объекте emitter.
	 * @example
	 * var emitter1 = new EventEmitter();
	 * var emitter2 = new EventEmitter();
	 *
	 * emitter2
	 *   .on('some', function (result) {
	 *     // result is 'foo'
	 *   });
	 *
	 * emitter1
	 *   .delegate(emitter2, 'event', 'some')
	 *   .emit('event', 'foo');
	 *
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.delegate = function (emitter, type, alias) {
	    this.on(type, emitter);

	    if (!(alias == null || alias === type)) {
	        getLastListener(this, type).type = alias;
	    }

	    return this;
	};

	/**
	 * Останавливает делегирование события на другой экземпляр {@link EventEmitter}.
	 * @param {EventEmitter} emitter Объект, на который необходимо прекратить делегирование.
	 * @param {String} type Тип события.
	 * @returns {EventEmitter}
	 */
	EventEmitter.prototype.unDelegate = function (emitter, type) {
	    return this.off(type, emitter);
	};

	/**
	 * Exports: {@link EventEmitter}
	 * @exports EventEmitter
	 */
	module.exports = EventEmitter;

	function call(listener, context, data) {
	    switch (data.length) {
	        case 0:
	            listener.call(context);
	            break;
	        case 1:
	            listener.call(context, data[0]);
	            break;
	        case 2:
	            listener.call(context, data[0], data[1]);
	            break;
	        case 3:
	            listener.call(context, data[0], data[1], data[2]);
	            break;
	        default:
	            listener.apply(context, data);
	    }
	}

	function emit(emitter, type, data) {
	    switch (data.length) {
	        case 0:
	            emitter.emit(type);
	            break;
	        case 1:
	            emitter.emit(type, data[0]);
	            break;
	        case 2:
	            emitter.emit(type, data[0], data[1]);
	            break;
	        case 3:
	            emitter.emit(type, data[0], data[1], data[2]);
	            break;
	        default:
	            var a = new Array(1);
	            a[0] = type;
	            emitter.emit.apply(emitter, a.concat(data));
	    }
	}

	function removeListener(listeners, listener) {
	    var length = listeners.length;
	    var index = length;

	    while (index--) {
	        if (listeners[index].callback === listener) {
	            break;
	        }
	    }

	    if (index < 0) {
	        return false;
	    }

	    if (length === 1) {
	        listeners.length = 0;
	    } else {
	        listeners.splice(index, 1);
	    }

	    return true;
	}

	function removeAllListeners(emitter, type, events) {
	    var listeners = events[type];

	    if (!listeners) {
	        return;
	    }

	    var index = listeners.length;

	    while (index--) {
	        emitter.emit('removeListener', type, listeners.pop().callback);
	    }

	    events[type] = null;
	}

	function isFunction(fnc) {
	    return typeof fnc === 'function';
	}

	function isListener(listener) {
	    return listener && (isFunction(listener) || isFunction(listener.emit));
	}

	function getLastListener(emitter, type) {
	    var listeners = emitter._events[type];

	    return listeners[listeners.length - 1];
	}


/***/ }
/******/ ]);