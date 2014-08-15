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

    var user, token, domain;

    function client() {
      return new namejs.Client({
        username: user,
        token: token
      });
    }

    beforeEach(function() {
      user = process.env['API_USER'];
      token = process.env['API_TOKEN'];
      domain = process.env['TEST_DOMAIN'];
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

    it('should return a result from getDomains', function(done) {
      function finish(response) {
        assert.equal(response.result.code, 100);
        done();
      }

      function fail(info) {
        assert.equal(true, false);
        done();
      }

      client().getDomains().then(finish, fail);
    });


    describe('domain specific', function() {
    
      it('getDns', function(done) {
        function finish(response) {
          assert.equal(response.result.code, 100);
          done();
        }

        function fail(info) {
          console.log('failed!');
          done();
        }

        client().getDnsFor(domain).then(finish, fail);
      });

      it('should get info on single domain with getDomain', function(done) {
        function finish(response) {
          assert.equal(response.result.code, 100);
          done();
        }

        function fail(info) {
          console.log('failed!');
          done();
        }

        client().getDomain(domain).then(finish, fail);
      });

      it('should reject if deleting a non-existent subdomain', function(done) {
        var failed = false;

        function success(response) { failed = false; }
        function fail(info) { failed = true; }

        function finish() {
          assert.equal(failed, true);
          done();
        }

        client().deleteSubdomain(domain, 'stub').then(success, fail).fin(finish);
      });

    });

  });

});
