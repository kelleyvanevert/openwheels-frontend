'use strict';

angular.module('owm.finance.invoice', [])

.controller('InvoiceController', function (
  $window,
  $state,
  $scope,
  $log,
  appConfig,

//  orderStatusId,
//  paymentSucceeded,
//  paymentFailed,
//
//  instantPayment,
//  instantPaymentService,

  invoiceGroups_simplified,
  
  $stateParams,
  
  alertService,
  metaInfoService
) {

  metaInfoService.set({ url: appConfig.serverUrl + '/factuur/' + $stateParams.invoiceGroupId });
  metaInfoService.set({ canonical: 'https://mywheels.nl/factuur/' + $stateParams.invoiceGroupId });

  $scope.invoiceGroups_simplified = invoiceGroups_simplified;

  $log.log('invoiceGroups_simplified', invoiceGroups_simplified);

});
