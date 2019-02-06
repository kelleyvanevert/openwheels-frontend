'use strict';

angular.module('personDirectives', [])

.filter('profileImageUrl', function (appConfig) {
  return function (userId, noCache) {
    if (userId === null) {
      return false;
    }
    
    if (typeof userId === 'object' && userId.id) {
      userId = userId.id;
    }

    return (appConfig.test && appConfig.test.appUrlForProfilePic ? appConfig.appUrl : appConfig.serverUrl) + '/person' +
      '/' + userId +
      '/' + 150 +
      '/' + 150 +
      '/profile.png' +
      (noCache ? '?nocache=' + Math.random() : '');
  };
})

.directive('personProfileImage', ['$log', 'appConfig', function ($log, appConfig) {

  var cacheId = 0;

  return {
    restrict: 'A',
    scope: {},
    link: function (scope, elm, attrs) {
      var options = scope.$parent.$eval(attrs.personProfileImage);

      var person = options.person  || null;
      var size   = options.size    || 'small';
      var noCache= options.noCache || false;
      var w, h, src;

      if (person) {
        switch (size) {
          case 'small':
          case 'square':
            w = 50;
            h = 50;
            break;
          case 'normal':
            w = 72;
            h = 72;
            break;
          case 'large':
            w = 150;
            h = 150;
            break;
          default:
            w = 50;
            h = 50;
        }
        src = (appConfig.test && appConfig.test.appUrlForProfilePic ? appConfig.appUrl : appConfig.serverUrl) + '/person' +
          '/' + person.id +
          '/' + w +
          '/' + h +
          '/profile.png' +
          (noCache ? '?nocache=' + (++cacheId).toString() : '');

        elm.attr('src', src);
      }
    }
  };
}]);
