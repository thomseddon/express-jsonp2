
/**
 * HTML for iframe
 */

var iframe = [
  ['<html><!doctype html><html><head>',
    '<meta http-equiv="Content-Type" content="text/html charset=utf-8"/>',
    '<script type="text/javascript">'].join(''),
  '</script></head><body></body></html>'];

/**
 * Add to prototype
 */

module.exports = function (app) {
  app.response.__proto__.jsonp = jsonp2;
};

/**
 * Jsonp2
 */

function jsonp2 (obj) {
  // allow status / body
  if (2 == arguments.length) {
    // res.json(body, status) backwards compat
    if ('number' === typeof arguments[1]) {
      throw new Error('Invalid arguments for jsonp2');
    } else {
      this.statusCode = obj;
      obj = arguments[1];
    }
  }

  // Settings
  var app = this.app;
  var replacer = app.get('json replacer');
  var spaces = app.get('json spaces');
  var body = JSON.stringify(obj, replacer, spaces)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  var callback = this.req.query[app.get('jsonp callback name')];
  var origin = app.get('jsonp origin') || '*';
  var state = this.req.query[app.get('jsonp state')];

  // content-type
  this.get('Content-Type') || this.set('Content-Type', 'application/json');

  // fixup callback
  if (Array.isArray(callback)) {
    callback = callback[0];
  }

  if (callback && 'string' === typeof callback) {
    var cb = callback.replace(/[^\[\]\w$.]/g, '');

    // @TODO: cleanup
    if (this.req.method !== 'GET') {
      this.set('Content-Type', 'text/html');

      // Call parent
      cb = 'parent.' + cb;

      // IE8 will only pass strings so we stringify again
      body = JSON.stringify(body, replacer, spaces);

      var parts = [ iframe[0], 'typeof ', cb, ' === \'function\' && ', cb, '(',
        body, ',', '\'', origin, '\''];

      // Add state
      if (state) {
        parts.push(',', '\'', state, '\'');
      }

      parts.push(');', iframe[1]);

      body = parts.join('');
    } else {
      this.set('Content-Type', 'text/javascript');
      body = 'typeof ' + cb + ' === \'function\' && ' + cb + '(' + body + ');';
    }
  }

  this.send(body);
}
