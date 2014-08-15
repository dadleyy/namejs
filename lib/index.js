var promises = require('q'),
    http = require('http'),
    path = require('path'),
    request = require('request');

module.exports = (function() {

  var namejs = {},
      Client,
      api_home = 'https://api.name.com';

  function send(token, username, method, url, data) {
    var deferred = promises.defer(),
        options = {
          url: [api_home, url].join('/'),
          method: method,
          headers: {
            'Api-Username': username,
            'Api-Token': token,
          }
        };

    if(data) {
      options['json'] = true;
      options['body'] = data;
    }

    function callback(error, res, body) {
      if(error)
        deferred.reject('fatal api error');

      var parsed, 
          outcome = res.statusCode < 300 ? 'resolve' : 'reject';

      try {
        parsed = JSON.parse(body);
      } catch(e) {
        return deferred.reject('unable to parse response body [' + e + ']');
      }

      return deferred[outcome](parsed);
    }

    request(options, callback);

    return deferred.promise;
  };

  function get(url) {
    return send(this.token, this.username, 'GET', url);
  };

  function post(url, data) {
    return send(this.token, this.username, 'POST', url, data);
  };

  Client = function(config) {
    this.username = config.username;
    this.token = config.token;

    if(!this.token || !this.username)
      throw("unable to create client");
  };

  Client.prototype.getAccount = function() {
    var promise = get.call(this, '/api/account/get');
    return promise;
  };

  Client.prototype.getDomains = function() {
    var promise = get.call(this, '/api/domain/list');
    return promise;
  };

  Client.prototype.getDnsFor = function(domain) {
    var dns_path = path.join('/api/dns/list', domain),
        promise = get.call(this, dns_path);

    return promise;
  };

  Client.prototype.getDomain = function(domain) {
    var domain_path = path.join('/api/domain/get', domain),
        promise = get.call(this, domain_path);

    return promise;
  };

  Client.prototype.createSubdomain = function(domain, subdomain) {
    var create_path = path.join('/api/dns/create', domain);
        promise = post.call(this, create_path, {
          "hostname": subdomain,
          "type": "CNAME",
          "content": domain
        });

    return promise;
  };

  Client.prototype.deleteSubdomain = function(domain, subdomain) {
    var deferred = promises.defer(),
        retreive_promise = this.getDnsFor(domain),
        target = [subdomain, domain].join('.'),
        delete_path = path.join('/api/dns/delete', domain);

      function deleted() {
        deferred.resolve('deleted');
      }

      function deleteRecord(record_id) {
        post.call(this, delete_path, {record_id: record_id}).then(deleted, failout);
      }

      function lookup(response) {
        var records = response.records,
            record_id = false;

        for(var i = 0; i < records.length; i++) {
          if(records[i].name === target)
            record_id = records[i].record_id;
        }

        if(record_id === false)
          deferred.reject('unable to find subdomain');
        else 
          deleteRecord(record_id);
      }

      function failout() {
        deferred.reject('unable to lookup domain information');
      }

      retreive_promise.then(lookup, failout);

    return deferred.promise;
  };

  namejs.Client = Client;

  return namejs;

})();
