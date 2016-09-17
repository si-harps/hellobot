# Hellobot
#### A friendly javascript pre-rendering engine

```npm install hellobot```

### Introduction

Pre-render your javascript pages on the fly for improved SEO.

### Usage

This module contains 2 main entry points, the converter and the client...

### The Converter

The converter is responsible for converting and responding with pre-renderdered HTML based on a url passed as a parameter.

```javascript
var Hellobot = require('hellobot').server;
var hellobot = new Hellobot();

hellobot.req({ location: 'https://www.example.com/blog' })
```

### The Client

If required, the client requests HTML from the converter, supplying a request endpoint.

```javascript
const app = require('koa')();

var Hellobot = require('hellobot').client;
var hellobot = new Hellobot({ 
	converter: 'https://my-rest-endpoint.com/render',
});
app.use(hellobot.koa());

// Express coming soon
```

