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
    },
    templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    replace: true,
    controller: ['$scope', '$filter', '$mdDialog', function ($scope, $filter, $mdDialog) {
      
      var currency = $filter('currency');

      // TODO replace this with a check on the API results
      // (but for now we're still waiting on the required API fields)
      var numDaysDiffCalcDays = $scope.numDaysDiffCalcDays = (function () {
        return ($scope.price.time_days > $scope.price.num_of_days);
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

      $scope.estimateDialogController = {
        kilometerEstimate: $scope.price.estimate_km_total,
        estimatedPrice: $scope.price,
        updateKmEstimate: function () {
          var controller = $scope.estimateDialogController;
          
          controller.estimatedPrice.km_price_fuel = controller.kilometerEstimate * parseFloat($scope.resource.price.fuelPerKilometer);

          var paidKms = Math.max(0, controller.kilometerEstimate - $scope.price.free_km_total);
          controller.estimatedPrice.km_price_rate = paidKms * (parseFloat($scope.resource.price.kilometerRate) - ($scope.price.discount_per_km || 0));

          controller.estimatedPrice.discount_km_points_included = Math.min(controller.estimatedPrice.km_price_rate, $scope.price.discount_km_points_remaining || 0);
          controller.estimatedPrice.km_price_rate -= controller.estimatedPrice.discount_km_points_included;
        },
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