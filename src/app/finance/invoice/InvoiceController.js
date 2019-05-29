'use strict';

angular.module('owm.finance.invoice', [])

.controller('InvoiceResultController', function (
  $state,
  $scope,
  appConfig,

  orderStatusId,
  paymentSucceeded,
  paymentFailed,

  metaInfoService
) {

  metaInfoService.set({ url: appConfig.serverUrl + '/factuur' });
  metaInfoService.set({ canonical: 'https://mywheels.nl/factuur' });

  if (!orderStatusId) {
    $state.go('owm.finance.invoice.pay', {
      invoiceGroupId: '~',
    }, {
      location: 'replace',
    });
  }

  $scope.paymentSucceeded = paymentSucceeded;
  $scope.paymentFailed = paymentFailed;

})

.controller('InvoiceController', function (
  $scope,
  appConfig,

  buyVoucherRedirect,

  invoiceGroups_simplified,
  credit,

  $stateParams,

  metaInfoService
) {

  metaInfoService.set({ url: appConfig.serverUrl + '/factuur/' + $stateParams.invoiceGroupId });
  metaInfoService.set({ canonical: 'https://mywheels.nl/factuur/' + $stateParams.invoiceGroupId });

  $scope.invoiceGroups_simplified = invoiceGroups_simplified;

  var mainId = parseInt($stateParams.invoiceGroupId);
  var main = _.find(invoiceGroups_simplified, function (invoiceGroup) {
    return invoiceGroup.id === mainId;
  });

  if (main) {
    $scope.mainInvoiceGroup = main;
  } else {
    $scope.mainInvoiceGroup = invoiceGroups_simplified[0];
  }
  $scope.otherInvoiceGroups = invoiceGroups_simplified.filter(function (invoiceGroup) {
    return invoiceGroup !== $scope.mainInvoiceGroup;
  });

  $scope.totalAllInvoiceGroups = invoiceGroups_simplified.reduce(function (total, invoiceGroup) {
    return total + invoiceGroup.total;
  }, 0);

  $scope.currentCredit = credit.value;

  // Redirects

  $scope.payMain = function () {
    buyVoucherRedirect({
      amount: $scope.mainInvoiceGroup.total - $scope.currentCredit,
      afterPayment: {
        redirect: {
          state: 'owm.finance.invoice',
          params: {
            orderStatusId: 100, // fake it
          },
        },
        paymentErrorRedirect: {
          state: 'owm.finance.invoice',
          params: {
            orderStatusId: 0, // fake it
          },
        },
      },
    });
  };

  $scope.payAll = function () {
    buyVoucherRedirect({
      amount: $scope.totalAllInvoiceGroups - $scope.currentCredit,
      afterPayment: {
        redirect: {
          state: 'owm.finance.invoice',
          params: {
            orderStatusId: 100, // fake it
          },
        },
        paymentErrorRedirect: {
          state: 'owm.finance.invoice',
          params: {
            orderStatusId: 0, // fake it
          },
        },
      },
    });
  };

});
