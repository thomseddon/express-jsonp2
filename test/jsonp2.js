
/**
 * Module dependencies
 */

var request = require('supertest');
var express = require('express');
var jsonp2 = require('../');

/**
 * Bootstrap
 */

var bootstrap = function () {

  var app = express();

  jsonp2(app);

  app.all('/', function (req, res, next) {
    res.jsonp({
      name: 'thom'
    });
  });

  return app;
};

/**
 * Jsonp2
 */

describe('jsonp2', function () {

  it('should override prototype', function () {
    var app = express();
    var jsonp = app.response.jsonp;

    jsonp2(app);

    app.response.jsonp.should.not.equal(jsonp);
    app.response.jsonp.name.should.equal('jsonp2');
  });

  it('should return json in absence of callback', function (done) {

    request(bootstrap())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        res.text.should.equal('{"name":"thom"}');
        done();
      });

  });

  it('should wrap in callback if provided', function (done) {

    request(bootstrap())
      .get('/?callback=callme')
      .expect(200)
      .end(function (err, res) {
        res.text.should.equal('typeof callme === \'function\' && callme({"name":"thom"});');
        done();
      });

  });

  it('should wrap in iframe + callback if not GET', function (done) {

    request(bootstrap())
      .post('/?callback=callme')
      .expect(200)
      .end(function (err, res) {
        res.text.should.equal([
          '<html><!doctype html><html><head>',
            '<meta http-equiv="Content-Type" content="text/html charset=utf-8"/>',
            '<script type="text/javascript">typeof parent.callme === \'function\' && parent.callme({"name":"thom"});',
            '</script>',
          '</head><body></body></html>'].join(''));
        done();
      });

  });

});
