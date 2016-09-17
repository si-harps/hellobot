"use strict";

const Horseman 	= require('node-horseman');
const horseman 	= new Horseman();
const cheerio 	= require('cheerio');
const minify 	= require('html-minifier').minify;

const Promise 	= require('bluebird');
Promise.config({
    cancellation: true
});

function Hellobot(opts) {
	this.client = opts.client;
	this.cacheopts = {
		set: Promise.promisify(this.client.set, { context: this.client }),
		get: Promise.promisify(this.client.get, { context: this.client })
	}
}

Hellobot.prototype.req = function(opts) {
	
	return new Promise( (resolve, reject) => {

		let promise = this
			.get(opts)
			.then( data => {

				if (!data)
					return this.load(opts.location)

				resolve(data);
				promise.cancel();

			})
			.then(this.clean)
			.then( data => this.set({ location: opts.location, data }))
			.then(this.minify)
			.then(resolve)
			.catch(reject);
	})
}

Hellobot.prototype.load = function(location) {

	return horseman
		.open(location)
		.waitForSelector('#footer_view')
		.wait(500)
		.html()
}

Hellobot.prototype.set = function(opts) {

	return new Promise(( resolve, reject ) => {

		if (!this.client.ready)
			return resolve(opts.data);

		this.client.set(`render:static:${opts.location}`, opts.data, (err, res) => {
			resolve(opts.data);
		})
	})
}

Hellobot.prototype.get = function(opts) {

	return new Promise(( resolve, reject ) => {

		if (!this.client.ready)
			return resolve(opts.data);

		this.client.get(`render:static:${opts.location}`, (err, res) => {
			resolve(res);
		})
	})
}

Hellobot.prototype.res = function(data) {
	console.log('res content')
}

Hellobot.prototype.clean = function(data) {

	let $ = cheerio.load(data, { 
		normalizeWhitespace: true 
	});

	$('script, noscript').remove()

	return Promise.resolve($.html());

}

Hellobot.prototype.minify = function(html) {
	return Promise.resolve(minify(html));
}

Hellobot.prototype.reject = function(data) {
	
}

module.exports = Hellobot;