var promises = require('Q'),
    request = require('request');

module.exports = (function() {

  var Dispatch = {},
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

      if(!parsed.result || parsed.result.code !== 100)
        return deferred.reject(parsed.result.message);

      return deferred[outcome](parsed);
    }

    request(options, callback);

    return deferred.promise;
  };

  Dispatch.get = function(token, username, url) {
    return send(token, username, 'GET', url);
  };

  Dispatch.post = function(token, username, url, data) {
    return send(token, username, 'POST', url, data);
  };

  return Dispatch;


})();
