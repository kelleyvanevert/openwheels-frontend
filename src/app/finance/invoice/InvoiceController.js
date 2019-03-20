'use strict';

angular.module('owm.finance.invoice', [])

.controller('InvoiceController', function ($window, $q, $state, $scope, account2Service, appConfig, alertService, voucherService,
  payRedirect,
  $stateParams,
  paymentService, bookingService, me, Analytics, metaInfoService) {

  metaInfoService.set({url: appConfig.serverUrl + '/factuur/' + $stateParams.invoiceGroupId});
  metaInfoService.set({canonical: 'https://mywheels.nl/factuur/' + $stateParams.invoiceGroupId});

});
