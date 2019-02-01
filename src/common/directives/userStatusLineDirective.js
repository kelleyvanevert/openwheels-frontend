'use strict';

angular.module('userStatusLine', [])

.directive('userStatusLine', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      person: '=',
      hasBooked: '=',
      // whether the user has done any booking at any time
      // => then we know that 'book-only' is a serious
      //    indication, and the user has to be manually checked
    },
    templateUrl: 'directives/userStatusLine.tpl.html',
    controller: function ($scope) {

      $scope.show = ($scope.person.preference === 'renter' || $scope.person.preference === 'both');
      if ($scope.show) {
        $scope.verified = ($scope.person.status === 'active');
        $scope.manual_check_required = ($scope.person.status === 'book-only' && $scope.hasBooked);
        $scope.is_new = ! ($scope.verified || $scope.manual_check_required);
      }
    },
  };
});
