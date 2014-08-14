var assert = require('assert'),
    dotenv = require('dotenv'),
    namejs = require('../lib');

describe('namejs client test suite', function() {

  dotenv.load();

  it('should throw an error if trying to create a client without creds', function() {
    var err = false;

    try {
      var client = new namejs.Client({});
    } catch(e) {
      err = true;
    }

    assert.equal(err, true);
  });

  describe('valid client creds', function() {

    var user, token;

    function client() {
      return new namejs.Client({
        username: user,
        token: token
      });
    }

    beforeEach(function() {
      user = process.env['API_USER'];
      token = process.env['API_TOKEN'];
    });

    it('should not throw an error if there was no problems with credentials', function() {
      var err = false

      try {
        client();
      } catch(e) {
        err = true;
      }
      assert.equal(err, false);
    });

    it('should make a http request to get client', function(done) {
      function finish(response) {
        var not_undef = response.domains !== undefined;
        assert.equal(not_undef, true);
        done();
      }

      client().domains().then(finish);
    });

    it('should query the dns for a certain domain', function(done) {
      function finish(response) {
        var index = 0,
            records = response.records;

        assert.equal(records.length > 0, true);
        done();
      }
      client().dns('lofti.li').then(finish);
    });

    it('should retreive a domain by name', function(done) {
      function finish(response) {
        var index = 0,
            info = response;

        assert.equal(info.domain_name, 'lofti.li');
        done();
      }

      client().domain('lofti.li').then(finish);
    });

  });

});
