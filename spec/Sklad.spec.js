describe('Sklad:', function () {
    var sklad = require('../sklad');
    var types = [
        { type: 'str', val: 'Lorem ipsum' },
        { type: 'obj', val: { a: 'a', b: 'b'} },
        { type: 'arr', val: [ 1, 2, 3 ] },
        { type: 'num', val: 23 },
        { type: 'neg', val: -44 },
        { type: 'bool', val: false },
        { type: 'reg', val: /.[wtf]/gi },
        { type: 'null', val: null },
        { type: 'undef', val: undefined },
        { type: 'func', val: function () { alert('Hello World!') } }
    ];

    describe('check support:', function () {
        it('isSupported', function () {
            var support = sklad.isSupported();
            expect(support).toBeTruthy();
        });
    });

    describe('check set:', function () {

        beforeEach(function() {
            localStorage.clear();
        });

        for (var i = 0; i < types.length; i++) {
            setTest(types[i]);
        }

    });

    describe('check set with strict mode:', function () {

        beforeEach(function() {
            localStorage.clear();
        });

        for (var i = 0; i < types.length; i++) {
            setTest(types[i], true);
        }

    });

    describe('check get:', function () {
        var item;
        localStorage.clear();

        for (var i = 0; i < types.length; i++) {
            item = types[i];
            sklad.set('test-' + item.type, item.val);
            getTest(item);
        }
    });

    describe('check get with json parsing:', function () {
        var item;
        localStorage.clear();

        for (var i = 0; i < types.length; i++) {
            item = types[i];
            sklad.set('test-' + item.type, item.val);
            getTest(item, 'json');
        }
    });

    describe('check remove:', function () {
        var removeItem;

        beforeEach(function() {
            var item;
            localStorage.clear();

            for (var i = 0; i < types.length; i++) {
                item = types[i];
                sklad.set('test-' + item.type, item.val);
            }
        });

        for (var i = 0; i < types.length; i++) {
            removeItem = types[i];
            sklad.remove('test-' + removeItem.type);
            removeTest(removeItem);
        }
    });

    function setTest(item, strict) {
        var value;
        var etalon = getString(item.val);

        sklad.set('test-' + item.type, item.val, strict);
        value = sklad.getValue('test-' + item.type);

        it('set' + item.type, function () {
            expect(value).toEqual(etalon);
        });
    }

    function getTest(item, type) {
        var res = sklad.get('test-' + item.type, type);
        var etalon;

        if (!type) {
            etalon = getString(item.val);
        } else {
            etalon = item.val;
        }

        it('get' + item.type, function () {
            if (type === 'json' && (item.val instanceof Function || item.val instanceof RegExp)) {
                expect(res.getResult()).not.toEqual(etalon);
            } else {
                expect(res.getResult()).toEqual(etalon);
            }
        });
    }

    function removeTest(item) {
        var removed = sklad.getValue('test-' + item.type);

        it('remove', function () {
            expect(removed).toBeNull();
        });
    }

    function getString(value) {
        var stringValue = JSON.stringify(value);
        return stringValue || String(value);
    }
});
