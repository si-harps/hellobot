"use strict";

const path 		= require('path');
const Promise 	= require('bluebird');
const cheerio 	= require('cheerio');
const minify 	= require('html-minifier').minify;
const Horseman 	= require('node-horseman');

// Optionally use phantomjs.path but not working with docker

function Hellobot(opts) {

	this.client = opts.client;
	this.phantomopts = { 
		timeout: opts.timeout || 15000
	}

	// Optional pass phantompath to horseman
	// ----------------------------------------------------------
	// Otherwise horseman will decide which phantom instance to use
	// Will try local phantom-prebuilt first

	if (opts.phantomPath)
		this.phantomopts.phantomPath = opts.phantomPath;
}

Hellobot.prototype.req = function(opts) {

	var horseman;
	
	return new Promise( (resolve, reject) => {

		this.get(opts).then(data => {

			if (data)
				return resolve(data);

			console.log('OPTS:', this.phantomopts)

			return this
				.load(( horseman = new Horseman(this.phantomopts) ), opts.location )
				.then(this.clean)
				.then(data => this.set({ location: opts.location, data }))
				.then(this.minify)
				.then(resolve)
				.then( () => horseman.close() )

		})
		.catch(reject);
	})
}

Hellobot.prototype.load = function(horseman, location) {

	let resources = new Array();

	horseman.on('resourceRequested', function(data, network) {
		resources.push({ id: data.id, url: data.url });
	})

	horseman.on('resourceReceived', function(data) {
		resources = resources.filter( item => item.id !== data.id );
	})

	return horseman.open(location).wait(200).html()
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

	$('meta[name=fragment]').remove();

	return Promise.resolve(`<!DOCTYPE html><html lang="en-US">${$.html()}</html>`);

}

Hellobot.prototype.minify = function(html) {
	return Promise.resolve(minify(html));
}

module.exports = Hellobot;