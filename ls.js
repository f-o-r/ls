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
