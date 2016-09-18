"use strict";

const url 		= require('url');
const request 	= require('request');
const thunkify 	= require('thunkify-wrap');
const rget 		= thunkify(request.get);

function Hellobot(opts) {

	this.converter = opts.converter;

	this.agents = opts.agents || [
		'baiduspider',
		'facebookexternalhit',
		'twitterbot',
		'rogerbot',
		'linkedinbot',
		'embedly',
		'quora link preview',
		'showyoubot',
		'outbrain',
		'pinterest',
		'developers.google.com/+/web/snippet',
		'googlebot'
	];
}

Hellobot.prototype.isFragment = function(query) {
	return Object.keys(query).indexOf('_escaped_fragment_') !== -1;
}

Hellobot.prototype.isAgent = function(agent) {
	return this.agents.some( (c_agent) => {
		return agent.toLowerCase().indexOf(c_agent.toLowerCase()) !== -1;
	});
}

Hellobot.prototype.koa = function(opts) {

	var self = this;

	return function * (next) {

		if (self.isAgent(this.get('user-agent')) || self.isFragment(this.query)) {

			let response = yield rget({
				url: self.converter + this.protocol + '://'  + this.host + this.url,
				// url: self.converter + 'https://www.dkefe.com' + this.url,
				gzip: true
			});

			let body = response[1] || '';

			yield* next;

			this.set('Content-type', 'text/html');
			this.set('X-Hellobot', true);
			this.body = body.toString();

		} else {

			yield* next;
			this.set('X-Hellobot', false);
		}
	}
}

module.exports = Hellobot;