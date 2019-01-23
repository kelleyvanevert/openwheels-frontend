'use strict';

angular.module('owm.resource')

.directive('owResourceCardBox', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      resource: '=',
    },
    templateUrl: 'resource/components/resource-card-box.tpl.html',
    controller: function ($scope) {
      var ageInDays = moment().diff($scope.resource.created, 'days');
      $scope.resource.isNew = ageInDays < 180;
    }
  };
});
