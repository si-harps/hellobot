"use strict";

const url 		= require('url');
const request 	= require('request');
const thunkify 	= require('thunkify-wrap');
const rget 		= thunkify(request.get);

function Hellobot(opts) {
	this.renderer = opts.renderer;
}

Hellobot.prototype.koa = function(opts) {

	var self = this;

	return function * (next) {

		let response = yield rget({
			url: self.renderer + 'https://www.dkefe.com' + this.url,
			gzip: true
		});

		let body = response[1] || '';

		yield* next;

		if (body)
			this.body = body.toString();
			this.set('X-Hellobot', true);
	}
}

module.exports = Hellobot;