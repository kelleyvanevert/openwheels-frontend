'use strict';

angular.module('validPhoneNumberDirective', [])

.directive('validPhoneNumber', function () {

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attr, ngModel) {
      
      ngModel.$validators.validPhoneNumber = function (modelValue, viewValue) {
        if (!viewValue) {
          return false;
        }

        if ((viewValue + '').match(/^[0-9+\-\s\(\)]{5,20}$/)) {
          return true;
        }

/*
        viewValue = (viewValue + '').replace(/[^0-9\+]/g, '');

        if (!viewValue.match(/^(\+31|0)/)) {
          return false;
        }

        viewValue = viewValue.replace(/^(\+31|0)/, '');

        if (viewValue.length < 5 || viewValue.length > 20) {
          return false;
        }
*/

        return false;
      };

    },
  };
});
