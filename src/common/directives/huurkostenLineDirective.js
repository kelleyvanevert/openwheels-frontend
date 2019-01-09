'use strict';

angular.module('huurkostenLineDirective', [])

.directive('huurkostenLine', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      price: '=', // booking price object (result of invoice2.calculatePrice or 'booking_price' in result of booking.calculateRequiredCreditForBooking)
      resource: '=',
    },
    template: '<span>' +
        '{{ huurkosten }} ' +
        '<ng-md-icon ng-if="numDaysDiffCalcDays" size="20" icon="info_italic" class="info-icon bg" info-dialog="numDaysDiffCalcDays"></ng-md-icon>' +
      '</span>',
    controller: ['$scope', '$filter', function ($scope, $filter) {

      var currency = $filter('currency');

      $scope.numDaysDiffCalcDays = ($scope.price.time_days > $scope.price.num_of_days - 1);

      var h = [];
      if ($scope.price.time_days) {
        if ($scope.numDaysDiffCalcDays) {
          h.push($scope.price.time_days + ' x dagprijs ' + currency($scope.resource.price.dayRateTotal));
        } else {
          h.push($scope.price.time_days + ' ' + ($scope.price.time_days === 1 ? 'dag' : 'dagen') + ' x ' + currency($scope.resource.price.dayRateTotal));
        }
      }
      if ($scope.price.time_hours) {
        h.push($scope.price.time_hours + ' uur' + ' x ' + currency($scope.resource.price.hourRate));
      }
      $scope.huurkosten = h.join(' + ');
    }],
  };
})
;