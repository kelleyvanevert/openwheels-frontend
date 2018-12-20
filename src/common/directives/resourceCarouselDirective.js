'use strict';

angular.module('resourceCarouselDirective', [])

.directive('resourceCarousel', function ($translate, appConfig) {
  return {
    restrict: 'A',
    scope   : {
      resource: '=resourceCarousel'
    },
    template: '<uib-carousel interval="4000">' +
              '  <uib-slide ng-repeat="image in images">' +
              '    <img style="margin:auto" ng-src="{{ image.url }}" />' +
              '  </uib-slide>' +
              '</uib-carousel>',
    link: function (scope, elm, attrs) {

      scope.images = [];

      angular.forEach(scope.resource.pictures, function (picture) {
        var path = picture.large || picture.normal || picture.small || null;
        if (path) {
          if (!path.match(/^http/)) {
            path = appConfig.serverUrl + '/' + path;
          }
          scope.images.push({
            url: path
          });
        }
      });

      if (scope.images.length === 0) {
        scope.images.push({ url: 'assets/img/resource-avatar-large.jpg' });
      }
    }
  };
});
