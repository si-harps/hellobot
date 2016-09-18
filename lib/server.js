"use strict";

const cheerio 	= require('cheerio');
const minify 	= require('html-minifier').minify;
const Horseman 	= require('node-horseman');

const Promise 	= require('bluebird');
Promise.config({ cancellation: true });

function Hellobot(opts) {
	
	this.client = opts.client;
	// this.cacheopts = {
	// 	set: Promise.promisify(this.client.set, { context: this.client }),
	// 	get: Promise.promisify(this.client.get, { context: this.client })
	// }
}

Hellobot.prototype.req = function(opts) {

	var horseman;
	var horsemanOpts = { timeout: 20000 }
	
	return new Promise( (resolve, reject) => {

		let promise = this
			.get(opts)
			.then(data => {

				if (!data)
					return this.load( (horseman = new Horseman(horsemanOpts)), opts.location );

				resolve(data);
				promise.cancel();

			})
			.then(this.clean)
			.then(data => this.set({ location: opts.location, data }))
			.then(this.minify)
			// .then(this.close)
			.then(resolve)
			.then( () => horseman.close() )
			.catch(reject);
	})
}

Hellobot.prototype.load = function(horseman, location) {

	let resources = new Array();

	horseman.on('resourceRequested', function(data, network) {
		resources.push({ id: data.id, url: data.url });
		console.log('PUSH:', { id: data.id, url: data.url });
	})

	horseman.on('resourceReceived', function(data) {
		resources = resources.filter( item => item.id !== data.id );
		console.log('POP:', resources);
	})

	return horseman.open(location).html()
}

Hellobot.prototype.set = function(opts) {

	return new Promise(( resolve, reject ) => {

		if (!this.client.ready)
			return resolve(opts.data);

		this.client.set(`static:html:${opts.location}`, opts.data, (err, res) => {

			if (err)
				return reject(err)

			resolve(opts.data);
		})
	})
}

Hellobot.prototype.get = function(opts) {

	return new Promise(( resolve, reject ) => {

		if (!this.client.ready)
			return resolve(opts.data);

		this.client.get(`static:html:${opts.location}`, (err, res) => {

			if (err)
				return reject(err)

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