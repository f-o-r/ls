var sklad = require('../sklad');

if (sklad.isSupported()) {
	console.log('localStorage exist');

	sklad
		.set('test-1', 'string')
		.then(function(){
			console.log('test-1', this.getResult());
		});

	sklad.set('test-strict', {a:'a',b:'b'}, true);
	sklad.set('test-num', 234234, true);
	sklad.set('test-arr', [1,2,3,4], true);
	sklad.set('test-reg', /.8/g, true);
	sklad.set('test-bool', true, true);

	console.log(sklad.getValue('test-1'));
	console.log(sklad.getValue('test-1', 'json'));

	console.log(sklad.getValue('test-strict'));
	console.log(sklad.getValue('test-strict', 'json'));

	console.log(sklad.getValue('test-num'));
	console.log(sklad.getValue('test-num', 'json'));

	console.log(sklad.getValue('test-arr'));
	console.log(sklad.getValue('test-arr', 'json'));

	console.log(sklad.getValue('test-reg'));
	console.log(sklad.getValue('test-reg', 'json'));

	console.log(sklad.getValue('test-bool'));
	console.log(sklad.getValue('test-bool', 'json'));
}
