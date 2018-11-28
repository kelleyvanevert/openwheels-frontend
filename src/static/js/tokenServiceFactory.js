
window.mw = window.mw || {};

mw.tokenServiceFactory = function tokenServiceFactory ($window, $log, $q) {

  var KEY = 'openwheels_fauth';
  var DEFAULT_EXPIRES_IN = 4 * 7 * 24 * 3600; // 4 weeks
  var storage = $window.localStorage;
  var tokenService = {};
  var pendingRefreshToken;
  var storageEnabled = function () {
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
  var eraseCookie = function (name) {
    createCookie(name, '', -1);
  };

  var tokenPrototype = {
    isExpired: function () {
      return this.expiryDate ? moment().isAfter(moment(this.expiryDate)) : false;
    },
    expiresIn: function () {
      return this.expiryDate ? moment(this.expiryDate).diff(moment(), 'milliseconds') / 1000 : DEFAULT_EXPIRES_IN;
    },
    isFresh: function () {
      var minRemainingSec = 15 * 60; // 15 minutes
      return this.expiresIn() >= minRemainingSec;
    },
    save: function () {
      var authData = JSON.stringify({
        tokenType: this.tokenType,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiryDate: this.expiryDate
      });
      if (storageEnabled()) {
        storage.setItem(KEY, authData);
      } else {
        createCookie(KEY, authData, this.expiresIn);
      }
      return this;
    },
    refresh: function () {
      return refreshToken(this);
    }
  };

  tokenService.createToken = function (data) {
    var token = Object.create(tokenPrototype);
    var expiresIn = data.expiresIn;
    try {
      expiresIn = parseInt(expiresIn);
    } catch (ex) {
      expiresIn = DEFAULT_EXPIRES_IN;
    }

    token.tokenType = data.tokenType;
    token.accessToken = data.accessToken;
    token.refreshToken = data.refreshToken;
    token.expiryDate = moment().add(expiresIn, 'seconds').toDate();

    return token;
  };

  tokenService.getToken = function () {
    var data, token;
    try {
      if (storageEnabled()) {
        data = JSON.parse(storage.getItem(KEY));
      } else {
        data = JSON.parse(readCookie(KEY));
      }

      token = Object.create(tokenPrototype);
      
        // cast to string (prevents errors when storage contains messed up data, such as an Array)
      token.tokenType = data.tokenType ? data.tokenType + '' : null;
      token.accessToken = data.accessToken ? data.accessToken + '' : null;
      token.refreshToken = data.refreshToken ? data.refreshToken + '' : null;
      token.expiryDate = moment(data.expiryDate).toDate();

      return token;
    } catch (e) {
      return null;
    }
  };

  tokenService.clearToken = function () {
    if (storageEnabled()) {
      storage.removeItem(KEY);
    } else {
      eraseCookie(KEY);
    }
  };

  function refreshToken(token) {
    return $q.reject('no longer supported');
  }

  return tokenService;
}
