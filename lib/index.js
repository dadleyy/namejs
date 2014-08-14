var promises = require('q'),
    http = require('http'),
    path = require('path');

module.exports = (function() {

  var namejs = {},
      Client,

      api_home = 'https://api.name.com';

  function get(url) {
    var token = this.token,
        username = this.username,
        deferred = promises.defer(),
        options = {
          hostname: 'api.name.com',
          path: url,
          port: 80,
          agent: false,
          method: 'GET',
          headers: {
            'Api-Username': username,
            'Api-Token': token,
          }
        };

    function callback(res) {
      res.on('data', function (chunk) {
        try {
          var a = JSON.parse(chunk);
        } catch(e) {
          return deferred.reject(e);
        }
        deferred.resolve(a);
      });
    }

    //deferred.resolve();

    http.get(options, callback);

    return deferred.promise;
  };

  Client = function(config) {
    this.username = config.username;
    this.token = config.token;

    if(!this.token || !this.username)
      throw("unable to create client");
  };

  Client.prototype.account = function() {
    var promise = get.call(this, '/api/account/get');
    return promise;
  };

  Client.prototype.domains = function() {
    var promise = get.call(this, '/api/domain/list');
    return promise;
  };

  Client.prototype.dns = function(domain) {
    var dns_path = path.join('/api/dns/list', domain),
        promise = get.call(this, dns_path);
    return promise;
  };

  Client.prototype.domain = function(domain) {
    var domain_path = path.join('/api/domain/get', domain),
        promise = get.call(this, domain_path);
    return promise;
  };

  namejs.Client = Client;

  return namejs;

})();
