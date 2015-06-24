'use strict';

var Response = require('Response');

var KEY_REGEXP = /^change:(.*)$/;

var ls = {};
var storage = checkAndGetStorage();
var addListener = getListenerFunc();

module.exports = ls;

ls.isSupported = function () {
    return !!storage;
};

if (!storage) {
    return;
}

ls.set = function (key, value, strict) {
    var r = new Response();
    var stringValue = stringifyValue(value);

    r.invoke(storage.setItem, [key, stringValue], storage);

    if (!r.isRejected()) {
        if (strict && r.invoke(storage.getItem, [key], storage) !== stringValue) {
            r.reject();
        } else {
            r.resolve(stringValue);
        }
    }

    return r;
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
    return r.isResolved() ? r.getResult() : null;
};

ls.on = function (key, listener, context) {
    var name = getKeyName(key);

    addListener('storage', function(e) {
        if (e.key === name && e.oldValue !== e.newValue) {
            listener.call(context, e.newValue);
        }
    }, false);

    return this;
};

ls.once = function (key, listener, context) {

};

ls.off = function (key, listener, context) {

};

function checkAndGetStorage() {
    var test = new Date;
    var storage;
    var result;
    try {
        (storage = window.localStorage).setItem(test, test);
        result = storage.getItem(test) == test;
        storage.removeItem(test);
        return result && storage;
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

function getKeyName(key) {
    return key.replace(KEY_REGEXP, '$1');
}
