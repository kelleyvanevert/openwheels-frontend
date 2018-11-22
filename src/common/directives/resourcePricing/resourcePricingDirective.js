'use strict';

/**
 * Kelley van Evert, 21 nov 2018
 * API:
 *   <resource-pricing
 *      resource     (=)  :: resource object
 *   />
 */
angular.module('resourcePricingDirective', [])

.directive('resourcePricing', function resourcePricing ($log, mobileDetectService) {

  // Configuration, constants, helpers
  // =====

  var mobile = (mobileDetectService.phone() || mobileDetectService.mobile() || mobileDetectService.tablet());


  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      resource: '=',
    },
    templateUrl: 'directives/resourcePricing/resourcePricing.tpl.html',
    replace: true,
    controller: function resourcePricingController ($scope, $element, $log) {

      $scope.showPricePerHour = false;
    },
  };

});