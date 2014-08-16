var promises = require('q'),
    http = require('http'),
    path = require('path'),
    request = require('request');

module.exports = (function() {

  var namejs = {},
      Client,
      Dispatch = require('./dispatch');

  function get(url) {
    return Dispatch.get(this.token, this.username, url);
  }

  function post(url, data) {
    return Dispatch.post(this.token, this.username, url, data);
  }

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

  Client.prototype.createCNAME = function(domain, subdomain, target) {
    var create_path = path.join('/api/dns/create', domain);
        promise = post.call(this, create_path, {
          "hostname": subdomain,
          "type": "CNAME",
          "content": target
        });

    return promise;
  };

  Client.prototype.createARecord = function(domain, subdomain, ip_addr) {
    var create_path = path.join('/api/dns/create', domain);
        promise = post.call(this, create_path, {
          "hostname": subdomain,
          "type": "A",
          "content": ip_addr
        });

    return promise;
  };

  Client.prototype.createSubdomain = function(domain, subdomain, value, type) {
    var fn = type === 'cname' ? 'createCNAME' : 'createARecord';
    return this[fn].call(this, domain, subdomain, value);
  };


  Client.prototype.deleteSubdomain = function(domain, subdomain) {
    var deferred = promises.defer(),
        retreive_promise = this.getDnsFor(domain),
        target = [subdomain, domain].join('.'),
        delete_path = path.join('/api/dns/delete', domain),
        delete_fn = (function(client) {
          return function(record_id) {
            post.call(client, delete_path, {record_id: record_id}).then(deleted, failout);
          }
        })(this);

      function deleted() {
        deferred.resolve('deleted');
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
          delete_fn(record_id);
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
