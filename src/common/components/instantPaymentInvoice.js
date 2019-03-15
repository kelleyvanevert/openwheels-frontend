'use strict';

angular.module('owm.components')

.directive('instantPaymentInvoice', function (
  $state,
  $window,
  appConfig
) {
  return {
    restrict: 'E',
    scope: {
      invoiceGroup: '=',
      collapse: '=',
    },
    templateUrl: 'components/instantPaymentInvoice.tpl.html',
    controller: function ($scope) {

      if ($scope.collapse === undefined) {
        $scope.collapse = false;
      }

      $scope.sumLines = function (lines) {
        return lines.reduce(function (total, line) {
          return total + line.total;
        }, 0);
      };
    },
  };
});
