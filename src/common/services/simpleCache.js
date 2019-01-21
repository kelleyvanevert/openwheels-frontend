'use strict';

angular.module('mw.simpleCache', [])

.service('simpleCache', function ($window) {

  var storage = $window.localStorage;

  if (!Object.entries) {
    Object.entries = function( obj ){
      var ownProps = Object.keys( obj ),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
      while (i--) {
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      }

      return resArray;
    };
  }

  this.getCacheStore = function (cache_name, max_entries) {
    return new SimpleCacheStore(cache_name, max_entries);
  };

  function SimpleCacheStore (CACHE_NAME, MAX_ENTRIES) {

    var self = this;
    self.CACHE_NAME = CACHE_NAME;
    self.MAX_ENTRIES = MAX_ENTRIES;
    

    // try to retrieve cache on init

    try {
      self.cache = JSON.parse(storage.getItem(CACHE_NAME));
      if (!self.cache) {
        storage.setItem(CACHE_NAME, '{}');
        self.cache = {};
      }
    } catch (e) {
      try {
        storage.setItem(CACHE_NAME, '{}');
        self.cache = {};
      } catch (e) {} // no localstorage
    } // no localstorage or json parse error


    // internal API

    var _cacheSaveTimeoutID;

    self._saveCache = function () {

      if (self.cache && storage) {
        // first, prune the cache to only include the 500 most recent autocomplete api results
        var entries = Object.entries(self.cache);
        var num_remove = Math.max(0, entries.length - MAX_ENTRIES);
        if (num_remove) {
          entries
            .sort(function (a,b) { return a.timestamp < b.timestamp; })
            .slice(0, num_remove)
            .forEach(function (entry) {
              delete self.cache[entry[0]];
            });
        }

        try {
          storage.setItem(CACHE_NAME, JSON.stringify(self.cache));
        } catch (e) {} // no localstorage or storage limit reached
      }

      _cacheSaveTimeoutID = undefined;
    };

    self._scheduleCacheSave = function () {
      if (!_cacheSaveTimeoutID) {
        _cacheSaveTimeoutID = setTimeout(self._saveCache, 1000);
      }
    };


    // public API

    self.tryGetCached = function (key) {
      if (self.cache && self.cache[key]) {
        var dt_seconds = (Math.round(Date.now() / 1000) - self.cache[key].timestamp);
        if (dt_seconds / (60 * 60 * 24 * 30) > 1) {
          // don't keep/use longer than 1 month
          delete self.cache[key];
          self._scheduleCacheSave();
          return false;
        }

        return self.cache[key].data;
      }

      // if anything goes wrong
      return false;
    };

    self.cacheEntry = function (key, data) {
      if (self.cache) {
        self.cache[key] = {
          timestamp: Math.round(Date.now() / 1000),
          data: data,
        };
        self._scheduleCacheSave();
      }
    };
  }

})
;

/*

          predictions: predictions.map(function (prediction) {
            delete prediction.structured_formatting;
            delete prediction.reference;
            delete prediction.types;
            return prediction;
          }),*/