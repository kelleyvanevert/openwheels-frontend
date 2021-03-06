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
      person: '=',
    },
    templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    replace: true,
    controller: ['$scope', '$filter', '$mdDialog', function ($scope, $filter, $mdDialog) {

      if ($scope.booking.contract && $scope.booking.contract.type.id !== 60) {
        $scope.totalText = 'Verwachte ritkosten';
      } else {
        $scope.totalText = 'Totaal te betalen';
      }

      $scope.showPriceDetails = false;
      $scope.setShowPriceDetails = function (b) {
        $scope.showPriceDetails = b;
      };
      $scope.toggleShowPriceDetails = function () {
        $scope.showPriceDetails = !$scope.showPriceDetails;
      };

      $scope.estimateDialogController = {
        min: 0,
        max: Math.max(200, 2.7 * $scope.price.estimate_km_total),
        
        kilometerEstimate: $scope.price.estimate_km_total,
        estimatedPrice: angular.extend({}, $scope.price),
        updateKmEstimate: function () {
          var controller = $scope.estimateDialogController;
          
          controller.estimatedPrice.km_price_fuel = controller.kilometerEstimate * parseFloat($scope.resource.price.fuelPerKilometer);

          var paidKms = Math.max(0, controller.kilometerEstimate - $scope.price.free_km_total);
          controller.estimatedPrice.km_price_rate = paidKms * (parseFloat($scope.resource.price.kilometerRate) - ($scope.price.discount_per_km || 0));

          controller.estimatedPrice.discount_km_points_included = Math.min(controller.estimatedPrice.km_price_rate, $scope.price.discount_km_points_remaining || 0);
          controller.estimatedPrice.km_price_rate -= controller.estimatedPrice.discount_km_points_included;

          var rt = 0;
          if ($scope.resource.price.vacationKilometerReduction) {
            if ($scope.price.time_days >= 7) {
              rt = $scope.resource.price.vacationLongRate;
            } else if ($scope.price.time_days >= 3) {
              rt = $scope.resource.price.vacationShortRate;
            }
          }
          controller.estimatedPrice.discount_vacation_km = controller.estimatedPrice.km_price_rate * rt;
          controller.estimatedPrice.km_price_rate -= controller.estimatedPrice.discount_vacation_km;
          controller.estimatedPrice.km_price_rate = Math.max(controller.estimatedPrice.km_price_rate, 0);

          controller.estimatedPrice.rit_totaal = $scope.price.total + $scope.price.km_price_fuel + $scope.price.km_price_rate - $scope.price.discount_vacation_km;
          controller.estimatedPrice.rit_totaal_estimate = $scope.price.total + controller.estimatedPrice.km_price_fuel + controller.estimatedPrice.km_price_rate;
          controller.estimatedPrice.rit_totaal_diff = Math.abs(controller.estimatedPrice.rit_totaal_estimate - controller.estimatedPrice.rit_totaal);
        },
      };
      $scope.estimateDialogController.updateKmEstimate();
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