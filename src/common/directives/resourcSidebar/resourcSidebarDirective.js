'use strict';

angular.module('resourceSidebarDirective', [])

.directive('resourceSidebar', function () {
  return {
    restrict: 'A',
    scope: {
      data: '@'
    },
    replace: true,
    templateUrl: 'directives/resourcSidebar/resourcSidebar.tpl.html',
    controller: function ($stateParams, $scope, resourceService, windowSizeService, FRONT_DATE_FORMAT) {
      var city = $stateParams.city,
        resourceId = $stateParams.resourceId,
        discountCode = $stateParams.discountCode;

      $scope.timeframe = {
        pickup: moment($stateParams.startDate),
        return: moment($stateParams.endDate),
      };

      $scope.resource = {};
      resourceService.get({
        'resource': resourceId
      })
      .then(function (res) {
        $scope.resource = res;
      });
    }
  };
});
