'use strict';

var Response = require('Response');
var EventEmitter = require('EventEmitter');

var ls = new EventEmitter();

var storage = checkAndGetStorage();
var addListener;

module.exports = ls;

ls.isSupported = function () {
    return !!storage;
};

if (!storage) {
    return;
}

addListener = getListenerFunc();

addListener('storage', function (e) {
    var event = 'change:' + e.key;

    ls.emit(event, e.newValue);
}, false);

ls.set = function (key, value, strict) {
    var r = new Response();
    var queue = new Response.Queue();
    var stringValue = stringifyValue(value);

    queue
        .setData({
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

ls.get = function (key, type) {
    var r = new Response();
    var queue = new Response.Queue();

    queue
        .setData({
            key: key,
            type: type
        })
        .push(getItem)
        .push(parseData)
        .push(queue.resolve)
        .start();

    return r.listen(queue);
};

ls.getValue = function (key, type) {
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

    result = JSON.stringify(value);
    return result;
}

function setItem() {
    this.invoke(storage.setItem, [this.data.key, this.data.val], storage);
}

function getItem() {
    return this.invoke(storage.getItem, [this.data.key], storage);
}

function parseData(data) {
    if (this.data.type === 'json') {
        return this.invoke(JSON.parse, [data]);
    } else {
        this.resolve(data);
    }
}

function checkSavedItem(data) {
    if (this.data.strict && data !== this.data.val;) {
        this.reject();
    } else {
        this.resolve(data);
    }
}
