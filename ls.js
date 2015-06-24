'use strict';

var Response = require('Response');
var EventEmitter = require('EventEmitter');

var emitter = new EventEmitter();
var ls = {};
var storage = checkAndGetStorage();

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
    var result = new Response();
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

    return result.listen(queue);
};

ls.getValue = function (key, type) {
    // body...
};

ls.on = function (key, listener, context) {

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
