'use strict';

angular.module('owm.components')

/*

type type_string = "other" | "booking"

interface invoiceGroup {
  id: number

  total: number

  invoiceLines: {
    [type: type_string]: Group[]
  }
}

interface Group {
  beginBooking: datetime_string // if "booking" type

  lines: Line[]
}

interface Line {
  description: string
  quantity: number
  price: number
  total: number
  tax: number // percentage 0..1
}

*/

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

      $scope.subCollapse = !$scope.collapse;

      $scope.sumLines = function (lines) {
        return lines.reduce(function (total, line) {
          return total + line.total;
        }, 0);
      };
    },
  };
});
