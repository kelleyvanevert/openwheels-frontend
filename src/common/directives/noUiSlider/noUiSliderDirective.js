'use strict';

/**
 * Kelley van Evert, 22 nov 2018
 * API:
 *   <no-ui-slider
 *      ng-model      :: integer
 *   />
 */
angular.module('noUiSliderDirective', [])

.directive('noUiSlider', function noUiSlider ($log, $window) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      min: '=',
      max: '=',
      step: '=',
      ngModel: '=',
    },
    templateUrl: 'directives/noUiSlider/noUiSlider.tpl.html',
    replace: true,
    require: 'ngModel',
    link: function ($scope, elem, attr, ngModel) {

      ngModel.$parsers.push(function (val) {
        return val !== null ? parseInt(val, 10) : null;
      });
      ngModel.$formatters.push(function (val) {
        return val !== null ? '' + val : null;
      });

      var slider = elem[0];
      $window.noUiSlider.create(slider, {
        start: [ $scope.ngModel ],
        step: $scope.step,
        // connect: [true, false],
        tooltips: [ $window.wNumb({ decimals: 0, suffix: ' km' }) ],
        range: {
          'min': [ $scope.min ],
          'max': [ $scope.max ],
        }
      });

      // change: when done dragging
      // update: while dragging
      slider.noUiSlider.on('update', function (values, handleNumber, unencoded) {
        var my_val = unencoded[0];
        ngModel.$setViewValue(my_val);
      });

      ngModel.$render = function (a, b, c) {
        // currently not called, but why not ??
        slider.noUiSlider.set([ ngModel.$viewValue ]);
      };

      //ngModelCtrl.$setViewValue(ngModel);
    },
  };

});