'use strict';

angular.module('tokenService', [
  'tokenSilentRefreshService',
])

// mw.tokenFactory is defined in `src/static/js/tokenServiceFactory.js`
.factory('tokenService', ['$window', '$log', '$q', mw.tokenServiceFactory]);
