'use strict';

/**
 * Kelley van Evert, 21 nov 2018
 * API:
 *   <resource-pricing
 *      resource     (=)  :: resource object
 *   />
 */
angular.module('resourcePricingDirective', [])

.directive('resourcePricing', function resourcePricing ($log) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      resource: '=',
      isBusiness: '=',
    },
    //templateUrl: 'directives/resourcePricing/resourcePricing.tpl.html',
    template: '<div ng-include="templateUrl"></div>',
    replace: true,
    controller: ['$scope', '$element', '$log', '$mdDialog', function resourcePricingController ($scope, $element, $log, $mdDialog) {

      var resource = $scope.resource;

      function setDesign () {
        var design = $scope.$root.experiments.resourcePricing;
        var affix = (!design || design === 'A') ? '' : '-' + design;
        $scope.templateUrl = 'directives/resourcePricing/resourcePricing' + affix + '.tpl.html';
      }
      $scope.$watch('$root.experiments.resourcePricing', setDesign);
      $scope.$root.experiment('resourcePricing', 'A');

      $scope.showPricePerHour = false;
    }],
  };

});