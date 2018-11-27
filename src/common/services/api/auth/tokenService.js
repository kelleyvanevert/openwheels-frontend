'use strict';

angular.module('tokenService', [])

// mw.tokenFactory is defined in `src/assets/tokens.js`
.factory('tokenService', ['$window', '$log', '$q', mw.tokenServiceFactory]);
