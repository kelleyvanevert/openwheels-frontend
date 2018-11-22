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
      booking: '=',
    },
    templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    replace: true,
    controller: ['$scope', 'invoice2Service', function ($scope, invoice2Service) {

      // loading iff !price
      $scope.price = null;

      $scope.showPriceDetails = false;
      $scope.setShowPriceDetails = function (b) {
        $scope.showPriceDetails = b;
      };

      $scope.booking.numAdditionalDrivers = 0;

      invoice2Service.calculatePrice({
        resource: $scope.booking.resource.id,
        timeFrame: {
          startDate: $scope.booking.beginRequested,
          endDate: $scope.booking.endRequested,
        },
        includeRedemption: $scope.booking.riskReduction,
        contract: $scope.booking.contract ? $scope.booking.contract.id : undefined,
      }).then(function (price) {
        $scope.price = price;
        update();
      });

      function update () {
        var d = moment.duration(moment($scope.booking.endRequested).diff(moment($scope.booking.beginRequested)));
        if ($scope.price) {
          $scope.price.time_days = Math.floor(d.asDays());
          $scope.price.time_hours = Math.round(d.asHours() % 24);

          // TODO include other parameters in calculation as well
          $scope.price.rent = ($scope.price.time_days * $scope.booking.resource.price.dayRateTotal + $scope.price.time_hours * $scope.booking.resource.price.hourRate);

          var sub_total = $scope.price.rent;

          $scope.price.riskReductionTotal = ($scope.booking.riskReduction ? ($scope.price.default_price_decrease_own_risk * ($scope.price.time_days + 1)) : 0);
          sub_total += $scope.price.riskReductionTotal;

          $scope.price.additionalDriversTotal = ($scope.price.default_price_additional_driver * $scope.booking.numAdditionalDrivers);
          sub_total += $scope.price.additionalDriversTotal;
          
          $scope.price.sub_total = sub_total;
          $scope.price.total = $scope.price.sub_total + $scope.price.booking_fee;
        }
      }

      $scope.$watch('[booking.numAdditionalDrivers, booking.beginRequested, booking.endRequested, booking.riskReduction]', update);

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