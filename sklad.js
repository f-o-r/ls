'use strict';

var Response = require('Response');
var EventEmitter = require('EventEmitter');

var sklad = new EventEmitter();

var storage = checkAndGetStorage();
var addListener;

module.exports = sklad;

sklad.isSupported = function () {
    return !!storage;
};

addListener = getListenerFunc();

addListener('storage', function (e) {
    var event = 'change:' + e.key;

    sklad.emit(event, e.newValue);
}, false);

sklad.set = function (key, value, strict) {
    var r = new Response();
    var queue = new Response.Queue();
    var stringValue = stringifyValue(value);

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

sklad.getValue = function (key, type) {
    var r = this.get(key, type);
    return r.getResult();
};

function checkAndGetStorage() {
    var test = new Date;
    var stor;
    var result;
    try {
        (stor = window.localStorage).setItem(test, test);
        result = stor.getItem(test) == test;
        stor.removeItem(test);
        return result && stor;
    } catch (exception) {}
}

function getListenerFunc() {
    if ('v'=='\v') { // Note: IE listens on document
        return document.attachEvent.bind(document);
    } else if (window.opera || /webkit/i.test( navigator.userAgent )){ // Note: Opera and WebKits listens on window
        return window.addEventListener.bind(window);
    } else { // Note: FF listens on document.body or document
        return document.body.addEventListener.bind(document.body);
    }
}

function stringifyValue(value) {
    var result;
    if (typeof value === 'string') {
        return value;
    } else {
        result = JSON.stringify(value);
        return result;
    }
}

function setItem() {
    var params = this.getData('params');

    this.invoke(storage.setItem, [params.key, params.val], storage);
}

function getItem() {
    var params = this.getData('params');

    return this.invoke(storage.getItem, [params.key], storage);
}

function parseData(data) {
    var params = this.getData('params');

    if (params.type === 'json') {
        return this.invoke(JSON.parse, [data]);
    } else {
        this.resolve(data);
    }
}

function checkSavedItem(data) {
    var params = this.getData('params');

    if (params.strict && data !== params.val) {
        this.reject();
    } else {
        this.resolve(data);
    }
}
