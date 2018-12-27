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
    //templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    template: '<div ng-include="templateUrl"></div>',
    replace: true,
    controller: ['$scope', '$filter', function ($scope, $filter) {

      // A/B testing
      function setDesign () {
        var design = $scope.$root.experiments.invoiceEstimate;
        var affix = (!design || design === 'A') ? '' : '-' + design;
        $scope.templateUrl = 'directives/invoiceEstimate/invoiceEstimate' + affix + '.tpl.html';
      }
      $scope.$watch('$root.experiments.invoiceEstimate', setDesign);
      $scope.$root.experiment('invoiceEstimate', 'A');
      
      var currency = $filter('currency');

      $scope.huurkosten = function () {
        if (!$scope.price) {
          return '';
        }

        var h = [];
        if ($scope.price.time_days) {
          //h.push(currency($scope.resource.price.dayRateTotal) + ' x ' + $scope.price.time_days + ' ' + ($scope.price.time_days === 1 ? 'dag' : 'dagen'));
          h.push($scope.price.time_days + ' ' + ($scope.price.time_days === 1 ? 'dag' : 'dagen') + ' x ' + currency($scope.resource.price.dayRateTotal));
        }
        if ($scope.price.time_hours) {
          //h.push(currency($scope.resource.price.hourRate) + ' x ' + $scope.price.time_hours + ' uur');
          h.push($scope.price.time_hours + ' uur' + ' x ' + currency($scope.resource.price.hourRate));
        }
        return h.join(' + ');
      };

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