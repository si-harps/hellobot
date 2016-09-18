"use strict";

const url 		= require('url');
const request 	= require('request');
const thunkify 	= require('thunkify-wrap');
const rget 		= thunkify(request.get);

function Hellobot(opts) {

	this.converter = opts.converter;

	// Google & Yahoo not included as _escape_fragment supported
	// ----------------------------------------------------------
	// Ensures no penalty for cloaking

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
		'pinterest/0.',
		'developers.google.com/+/web/snippet',
		'slackbot',
		'vkShare',
		'W3C_Validator',
		'redditbot',
		'Applebot',
		'WhatsApp',
		'flipboard',
		'tumblr',
		'bitlybot',
		'SkypeUriPreview',
		'nuzzel',
		'Discordbot'
	];

	this.ignore = [
		'.js',
		'.css',
		'.xml',
		'.less',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.pdf',
		'.doc',
		'.txt',
		'.ico',
		'.rss',
		'.zip',
		'.mp3',
		'.rar',
		'.exe',
		'.wmv',
		'.doc',
		'.avi',
		'.ppt',
		'.mpg',
		'.mpeg',
		'.tif',
		'.wav',
		'.mov',
		'.psd',
		'.ai',
		'.xls',
		'.mp4',
		'.m4a',
		'.swf',
		'.dat',
		'.dmg',
		'.iso',
		'.flv',
		'.m4v',
		'.torrent',
		'.woff',
		'.ttf',
		'.svg'
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

Hellobot.prototype.isFileRequest = function(url) {

	console.log(url)
	return this.ignore.some( (ext) => {
		return url.indexOf(ext) !== -1;
	})
}

Hellobot.prototype.prerender = function(request) {

	if (this.isFileRequest(request.url))
		return false;

	if (this.isAgent(request.get('user-agent')))
		return true;

	if (this.isFragment(request.query))
		return true;

	return false;
}

Hellobot.prototype.koa = function(opts) {

	var self = this;

	return function * (next) {

		if (self.prerender(this)) {

			let response = yield rget({
				url: `${self.converter}${this.protocol}://${this.host}${this.url}`,
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