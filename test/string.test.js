/*!
 * hessian.js - test/string.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var hessian = require('../');
var utils = require('./utils');

describe('string.test.js', function () {
  var helloBuffer = Buffer.concat([new Buffer(['S'.charCodeAt(0), 0x00, 0x05]),
    new Buffer('hello')]);

  it('should read string', function () {
    hessian.decode(helloBuffer).should.equal('hello');
    hessian.decode(Buffer.concat([new Buffer(['s'.charCodeAt(0), 0x00, 0x07]),
        new Buffer('hello, '), new Buffer(['S'.charCodeAt(0), 0x00, 0x05]),
        new Buffer('world')])).should.equal('hello, world');
  });

  it('should write string', function () {
    var s = hessian.encode('hello');
    s.should.be.a.Buffer;
    s.should.length(8);
    s.should.eql(helloBuffer);
  });

  it('should read write empty string', function () {
    hessian.decode(new Buffer(['S'.charCodeAt(0), 0, 0])).should.equal('');
    hessian.encode('').should.eql(new Buffer(['S'.charCodeAt(0), 0, 0]));
  });

  describe('v2.0', function () {
    it('should read short strings', function () {
      hessian.decode(new Buffer([0x00]), '2.0').should.equal('');
      hessian.decode(new Buffer([0x00]), '2.0', true).should.equal('');
      hessian.decode(Buffer.concat([new Buffer([0x05]),
        new Buffer('hello')]), '2.0').should.equal('hello');
      hessian.decode(new Buffer([0x01, 0xc3, 0x83]), '2.0').should.equal('\u00c3');
      hessian.decode(Buffer.concat([new Buffer([0x09]),
        new Buffer('hello, 中文')]), '2.0').should.equal('hello, 中文');
    });

    it('should read "hello" in long form', function () {
      hessian.decode(Buffer.concat([new Buffer(['S'.charCodeAt(0), 0x00, 0x05]),
        new Buffer('hello')]), '2.0').should.equal('hello');
    });

    it('should read split into two chunks: s and short strings', function () {
      hessian.decode(Buffer.concat([new Buffer(['s'.charCodeAt(0), 0x00, 0x07]),
        new Buffer('hello, '), new Buffer([0x05]), new Buffer('world')]), '2.0')
      .should.equal('hello, world');
    });

    it('should write short strings', function () {
      hessian.encode('', '2.0').should.eql(new Buffer([0x00]));
      hessian.encode('foo', '2.0').should.eql(
        Buffer.concat([
          new Buffer([0x03]),
          new Buffer('foo')
        ])
      );
      hessian.encode('0123456789012345678901234567890', '2.0').should.eql(
        Buffer.concat([
          new Buffer([0x1f]),
          new Buffer('0123456789012345678901234567890')
        ])
      );

      var len32Buf = new Buffer(2);
      len32Buf.writeInt16BE(32, 0);
      hessian.encode('01234567890123456789012345678901', '2.0').should.eql(
        Buffer.concat([
          new Buffer([0x53]),
          len32Buf,
          new Buffer('01234567890123456789012345678901')
        ])
      );

      var largeBuf = new Buffer(65535);
      largeBuf.fill(0x41);
      hessian.encode(largeBuf.toString(), '2.0');

      largeBuf = new Buffer(65535 * 3 + 100);
      largeBuf.fill(0x41);
      hessian.encode(largeBuf.toString(), '2.0');
    });

    it('should read java string', function () {
      hessian.decode(utils.bytes('v2/string/empty'), '2.0').should.equal('');
      hessian.decode(utils.bytes('v2/string/foo'), '2.0').should.equal('foo');
      hessian.decode(utils.bytes('v2/string/chinese'), '2.0').should.equal('中文 Chinese');
      hessian.decode(utils.bytes('v2/string/text4k'), '2.0').should.equal(utils.string('4k'));

      var largeBuf = new Buffer(65535);
      largeBuf.fill(0x41);
      hessian.decode(utils.bytes('v2/string/large_string_65535'), '2.0').should.equal(largeBuf.toString());
    });

    it('should write string same as java write', function () {
      hessian.encode('', '2.0').should.eql(utils.bytes('v2/string/empty'));
      hessian.encode('foo', '2.0').should.eql(utils.bytes('v2/string/foo'));
      hessian.encode('中文 Chinese', '2.0').should.eql(utils.bytes('v2/string/chinese'));
      var text4k = utils.string('4k');
      hessian.encode(text4k, '2.0').should.eql(utils.bytes('v2/string/text4k'));

      var largeBuf = new Buffer(65535);
      largeBuf.fill(0x41);
      hessian.encode(largeBuf.toString(), '2.0').should.eql(utils.bytes('v2/string/large_string_65535'));

      var largeString = new Array(65535);
      for (var i = 0; i < largeString.length; i += 2) {
        largeString[i] = String.fromCharCode(0xd800);
        if (i + 1 < largeString.length) {
          largeString[i + 1] = String.fromCharCode(0xdbff);
        }
      }
      largeString = largeString.join('');
      hessian.encode(largeString, '2.0').should.eql(utils.bytes('v2/string/large_string_chars'));
    });
  });
});
