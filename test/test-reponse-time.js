
//TODO 有问题

var koa = require('koa');

var responseTime = require('koa-response-time');

var app = koa();

app.use(responseTime());

app.use(function *(next) {
	yield next;
	yield sleep(150);
	this.body = 'hello';
})


function sleep(ms) {
	return function (done) {
		setTimeout(done, ms);
	}
}

app.listen(4000);

console.log('listening on port 4000');
