(function () {
  'use strict';

  angular.module('owm.resource')

  .directive('owResourcePicture', function (appConfig, $filter) {
    return {
      restrict: 'E',
      template: '<img ng-cloak alt="{{alttext}}" ng-src="{{ imageUrl }}">',
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
            scope.imageUrl = appConfig.serverUrl + '/' + pictures[0][size];
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
