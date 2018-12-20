'use strict';

/**
 * Kelley van Evert, 22 nov 2018
 * API:
 *   <number-tool
 *      ng-model      :: integer
 *   />
 */
angular.module('numberToolDirective', [])

.directive('numberTool', function numberTool ($log) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      min: '=',
      max: '=',
      ngModel: '=',
    },
    templateUrl: 'directives/numberTool/numberTool.tpl.html',
    replace: true,
    require: 'ngModel',
    link: function ($scope, elem, attr, ngModelCtrl) {

      ngModelCtrl.$parsers.push(function (n_str) {
        return parseInt(n_str, 10);
      });

      $scope.increment = function () {
        ngModelCtrl.$setViewValue(Math.min($scope.max, ngModelCtrl.$modelValue + 1));
      };
      $scope.decrement = function () {
        ngModelCtrl.$setViewValue(Math.max($scope.min, ngModelCtrl.$modelValue - 1));
      };

      //ngModelCtrl.$setViewValue(ngModel);
    },
  };

});