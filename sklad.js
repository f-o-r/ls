'use strict';

/**
 * @fileOverview sklad.
 */

var Response = require('Response');
var EventEmitter = require('EventEmitter');

var sklad = new EventEmitter();

var storage = checkAndGetStorage();
var addListener = getListenerFunc();

module.exports = sklad;

/**
 * Проверяет доступность localStorage
 * @return {Boolean}
 */
sklad.isSupported = function () {
    return !!storage;
};

/**
 * Подписываемся на изменение значений в localStorage
 * из других вкладок браузера
 */
addListener('storage', triggerChangeEvent, false);

/**
 * @param {Object} e Объект события изменение значений в localStorage
 */
function triggerChangeEvent(e) {
    var event = 'change:' + e.key;

    sklad.emit(event, e.newValue);
}

/**
 * Устанавливаем значение в localStorage
 * @param {*} key строка или все что может быть приведенно к строке
 *                ключ в localStorage для сохраняемого значения
 * @param {*} value сохраняемое значение
 * @param {Boolean} [strict] флаг для проверки сохраненного значения
 * @return {Response}
 */
sklad.set = function (key, value, strict) {
    var r = new Response();
    var queue = new Response.Queue();
    var stringValue = JSON.stringify(value);

    queue
        .setData('params', {
            key: key,
            val: stringValue,
            strict: strict
        })
        .push(setItem)
        .push(getItem)
        .push(checkSavedItem)
        .start();

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
sklad.get = function (key, type) {
    var r = new Response();
    var queue = new Response.Queue();

    queue
        .setData('params', {
            key: key,
            type: type
        })
        .push(getItem)
        .push(parseData)
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
sklad.getValue = function (key, type) {
    var r = this.get(key, type);
    return r.getResult();
};

/**
 * Удаляем итэм из хранилища
 * @param {String} key ключ сохранённого значения
 * @return {Response}
 */
sklad.remove = function (key) {
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

/**
 * Проверяем наличие localStorage
 * если доступен возвращаем ссылку на него
 * если не доступен возвращаем false
 * @return {Storage|Boolean}
 */
function checkAndGetStorage() {
    var test = new Date;
    var stor;
    var result;
    try {
        (stor = window.localStorage).setItem(test, test);
        result = stor.getItem(test) == test;
        stor.removeItem(test);
        return result && stor;
    } catch (exception) {
        return false;
    }
}

/**
 * В зависимости от браузера возвращаем нужную функцию для подписки на событие 'storage'
 * @return {Function}
 */
function getListenerFunc() {
    if ('v'=='\v') {
        // Note: IE listens on document
        return document.attachEvent.bind(document);
    } else if (window.opera || /webkit/i.test( navigator.userAgent )){
        // Note: Opera and WebKits listens on window
        return window.addEventListener.bind(window);
    } else {
        // Note: FF listens on document.body or document
        return document.body.addEventListener.bind(document.body);
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
        this.resolve(data);
    }
}

/**
 * Проверяем сохраненное значение если указан strict режим
 * @this {Queue}
 */
function checkSavedItem(data) {
    var params = this.getData('params');

    if (params.strict && data !== params.val) {
        this.reject();
    } else {
        this.resolve(data);
    }
}
