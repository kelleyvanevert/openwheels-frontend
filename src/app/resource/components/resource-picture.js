(function () {
  'use strict';

  angular.module('owm.resource')

  .directive('owResourcePicture', function (appConfig, $filter) {
    return {
      restrict: 'E',
      template: '<img class="resource-picture" ng-cloak alt="{{alttext}}" ng-src="{{ imageUrl }}">',
      scope: {
        resource: '=',
      },
      link: function (scope, elm, attrs) {
        var resource = scope.resource;

        attrs.$observe('size', function (size) {
          if (!resource.pictures || !resource.pictures.length) {
            scope.imageUrl = defaultPicture(size);
            return;
          }

          var pictures = $filter('orderBy')(resource.pictures, 'order', false);

          if (pictures[0][size]) {
            scope.imageUrl = pictures[0][size];
            if (!scope.imageUrl.match(/^http/)) {
              scope.imageUrl = appConfig.serverUrl + '/' + scope.imageUrl;
            }
          }
        });
        attrs.$observe('alttext', function (alttext) {
          if(alttext) {
            scope.alttext = alttext;
            return;
          }
          scope.alttext = '';
        });

        function defaultPicture (size) {
          return 'assets/img/resource-avatar-' + size + '.jpg';
        }

      }
    };
  });

}());
