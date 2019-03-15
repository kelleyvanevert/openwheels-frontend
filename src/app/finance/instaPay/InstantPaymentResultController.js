'use strict';

angular.module('owm.finance.instapayresult', [])

.controller('InstantPaymentResultController', function (
  $scope,
  appConfig,
  
  paymentSucceeded,
  paymentFailed,

  metaInfoService
) {

  metaInfoService.set({url: appConfig.serverUrl + '/betaal/'});
  metaInfoService.set({canonical: 'https://mywheels.nl/betaal/'});

  $scope.paymentSucceeded = paymentSucceeded;
  $scope.paymentFailed = paymentFailed;

});
