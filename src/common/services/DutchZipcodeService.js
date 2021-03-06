'use strict';

angular.module('DutchZipcodeService', [])

.factory('dutchZipcodeService', function($rootScope, $timeout, $http, $q) {
  var zipcodeService = {};
  var pro6pp_auth_key = '5MyYoDMamZNLazVS';

  // Trigger on '5408xb' and on '5408 XB'
  var NL_SIXPP_REGEX = /[0-9]{4,4}\s?[a-zA-Z]{2,2}/;
  var NL_STREETNUMBER_REGEX = /[0-9]+/;

  var BE_FOURPP_REGEX = /^\s*[0-9]{4,4}\s*$/;
  var BE_STREETNUMBER_REGEX = /[0-9]+/;
  var pro6pp_cache = {};

  function getApiBaseUrl() {
    return 'https://api.pro6pp.nl/v1';
  }

  function pro6pp_cached_get(obj, url, params) {
    var key = JSON.stringify(params);
    var deferred = $q.defer();
    if (pro6pp_cache.hasOwnProperty(key)) {
      deferred.resolve(pro6pp_cache[key]);
    } else {
      $http.get(url, { params: params})
      .success(function(data) {
        pro6pp_cache[key] = data;
        deferred.resolve(data);
      })
      .error(function() {
        deferred.reject({
          message: 'Unable to contact Pro6PP validation service'
        });
      });
    }
    return deferred.promise;
  }

  zipcodeService.autocomplete = function(obj) {
    var deferred = $q.defer();
    var country = obj.country || 'nl';
    var zipcode = obj.zipcode;
    var streetnumber = obj.streetNumber;
    // Streetnumber is only required when there's an input field defined for it.
    // There may be use-cases where the streetnumber is not required.

    var params;

    if (country === 'nl' && NL_SIXPP_REGEX.test(zipcode)) {
      params = {};
      params.nl_sixpp = zipcode;
      if (angular.isDefined(streetnumber) && NL_STREETNUMBER_REGEX.test(streetnumber)) {
        params.streetnumber = streetnumber;
      }
    }

    if (country === 'be' && BE_FOURPP_REGEX.test(zipcode)) {
      params = {};
      params.be_fourpp = zipcode;
      if (angular.isDefined(streetnumber) && BE_STREETNUMBER_REGEX.test(streetnumber)) {
        params.streetnumber = streetnumber;
      }
    }

    if (params) {
      var url = getApiBaseUrl() + '/autocomplete';
      params.auth_key = pro6pp_auth_key;
      pro6pp_cached_get(obj, url, params)
      .then(function(data) {
        if(data.error) {
          deferred.reject(data.error);
        } else{
          deferred.resolve(data.results);
        }
      });
    } else {
      deferred.reject({
        message: 'Invalid zipcode or street number'
      });
    }
    return deferred.promise;
  };

  return zipcodeService;
})

;
