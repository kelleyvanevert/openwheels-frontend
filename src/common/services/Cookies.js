'use strict';

angular.module('Cookies', [])

.service('Cookies', function ($window) {

  var storage = $window.localStorage;
  var EXPIRES = 99 * 7 * 24 * 3600; // 99 weeks

  var storageEnabled = function () {
    if (!storage) {
      return false;
    }

    try {
      storage.setItem('__test', 'test');
    } catch (e) {
      if (/QUOTA_?EXCEEDED/i.test(e.name)) {
        return false;
      }
    }

    return true;
  };

  var createCookie = function (name, value, days) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toGMTString();
    } else {
      expires = '';
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  };

  var readCookie = function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  var eraseCookie = function (key) {
    createCookie(key, '', -1);
  };


  this.set = function (key, data) {
    if (storageEnabled()) {
      storage.setItem(key, data);
    } else {
      createCookie(key, data, EXPIRES);
    }
  };

  this.get = function (key) {
    if (storageEnabled()) {
      return storage.getItem(key);
    } else {
      return readCookie(key);
    }
  };

  this.clear = function (key) {
    if (storageEnabled()) {
      storage.removeItem(key);
    } else {
      eraseCookie(key);
    }
  };

});
