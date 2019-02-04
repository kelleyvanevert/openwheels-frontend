'use strict';

angular.module('owm.resource')

.directive('owResourceCard', function () {
  return {
    restrict: 'E',
    scope: {
      lightweight: '=',
      resource: '=',
      onSelect: '&',
      onSelectLoadOverlay: '=',
    },
    templateUrl: 'resource/components/resource-card.tpl.html',
    controller: function ($scope) {
      $scope.showLoadOverlay = false;

      $scope.select = function () {
        if ($scope.onSelectLoadOverlay) {
          $scope.showLoadOverlay = true;
        }

        if ($scope.onSelect) {
          $scope.onSelect($scope.resource);
        }
      };
    }
  };
});
