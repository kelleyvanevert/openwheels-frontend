'use strict';

/**
 * Kelley van Evert, 22 nov 2018
 * API:
 *   <invoice-estimate
 *      booking         :: { resource, beginRequested, endRequested, riskReduction }
 *   />
 */
angular.module('invoiceEstimateDirective', [])

.directive('invoiceEstimate', function invoiceEstimate ($log) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      resource: '=',
      booking: '=',
      price: '=',
      mustReduceOwnRisk: '=',
    },
    templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    replace: true,
    controller: ['$scope', '$filter', '$mdDialog', function ($scope, $filter, $mdDialog) {
      
      var currency = $filter('currency');

      // TODO replace this with a check on the API results
      // (but for now we're still waiting on the required API fields)
      var numDaysDiffCalcDays = $scope.numDaysDiffCalcDays = (function () {

        var a = moment($scope.booking.beginRequested);
        var b = moment($scope.booking.endRequested);
        var d = moment.duration(b.diff(a));
        var numDays = d.asDays(); // e.g. 2.25

        return ($scope.price.time_days > numDays);
      }());

      $scope.huurkosten = (function () {

        var h = [];
        if ($scope.price.time_days) {
          if (numDaysDiffCalcDays) {
            h.push($scope.price.time_days + ' x dagprijs ' + currency($scope.resource.price.dayRateTotal));
          } else {
            h.push($scope.price.time_days + ' ' + ($scope.price.time_days === 1 ? 'dag' : 'dagen') + ' x ' + currency($scope.resource.price.dayRateTotal));
          }
        }
        if ($scope.price.time_hours) {
          h.push($scope.price.time_hours + ' uur' + ' x ' + currency($scope.resource.price.hourRate));
        }
        return h.join(' + ');
      }());

      $scope.showPriceDetails = false;
      $scope.setShowPriceDetails = function (b) {
        $scope.showPriceDetails = b;
      };
      $scope.toggleShowPriceDetails = function () {
        $scope.showPriceDetails = !$scope.showPriceDetails;
      };
    }],
  };

});

/*
{
  // deprecated
  day_fee: 0,
  insurance: 0,

  // global parameters
  booking_fee: 2.5,
  default_estimate_km_day: 150,
  default_estimate_km_hour: 15,
  default_price_additional_driver: 1.25,
  default_price_decrease_own_risk: 3.5,
  default_free_km_day: 100,
  default_free_km_hour: 10,

  // complicated
  discount: 0,

  // timeframe specific
  estimate_km_total: 90,
  time_days: 0,
  time_hours: 6,
  redemption: 0, // E

  // car specific (already have these)
  free_km_day: 0, // boolean
  fuel_per_kilometer: 0, // E/km

  rent: 15,
  sub_total: 15,
  total: 17.5,
}
*/