'use strict';

angular.module('owm.resource')

.directive('owResourceCardBox', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      resource: '=',
      onSelect: '&',
    },
    templateUrl: 'resource/components/resource-card-box.tpl.html',
    controller: function ($scope) {
      $scope.select = function () {
        if ($scope.onSelect) {
          $scope.onSelect($scope.resource);
        }
      };
    },
  };
});
