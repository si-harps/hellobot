"use strict";

const cheerio 	= require('cheerio');
const minify 	= require('html-minifier').minify;

const Promise 	= require('bluebird');
Promise.config({ cancellation: true });

const Horseman 	= require('node-horseman');
const horseman 	= new Horseman({ timeout: 20000 });

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

Hellobot.prototype.clean = function(data) {

	let $ = cheerio.load(data, { 
		normalizeWhitespace: false,
	});

	// $('script, noscript').remove()

	$('meta[name=fragment]').remove();

	return Promise.resolve(`<!DOCTYPE html><html lang="en-US">${$.html()}</html>`);

}

Hellobot.prototype.minify = function(html) {
	return Promise.resolve(minify(html));
}

module.exports = Hellobot;