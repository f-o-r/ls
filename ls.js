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
    var success;

    try {
        storage.setItem(key, stringValue);
        success = strict ? storage.getItem(key) === stringValue : true;
    } catch (error) {
        r.reject(error);
        success = false
    }

    if (success) {
        r.resolve();
    } else {
        r.reject();
    }

    return r;
};

ls.get = function (key, type) {
    // body...
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
