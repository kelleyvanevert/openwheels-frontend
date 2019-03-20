'use strict';

angular.module('owm.components')

.directive('rejectionInfoCard', function ($state) {
  return {
    restrict: 'E',
    scope: {
      booking: '=',
    },
    templateUrl: 'components/rejectionInfoCard.tpl.html',
    controller: function ($scope) {
      
      if (moment().isBefore(moment($scope.booking.beginRequested || $scope.booking.beginBooking))) {
        $scope.searchAlternatives = {
          url: $state.href('owm.resource.search.list', {
            start: moment($scope.booking.beginRequested || $scope.booking.beginBooking).format('YYMMDDHHmm'),
            end: moment($scope.booking.endRequested || $scope.booking.endBooking).format('YYMMDDHHmm'),
            lat: $scope.booking.resource.latitude,
            lng: $scope.booking.resource.longitude,
          }),
        };
      }

    },
  };
});
