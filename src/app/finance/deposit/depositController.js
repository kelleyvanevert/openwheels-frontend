'use strict';

angular.module('owm.finance.deposit', [])

.controller('DepositController', function ($scope, alertService, depositService, me, type, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/deposit'});
  metaInfoService.set({canonical: 'https://mywheels.nl/deposit'});

  $scope.month =  moment().month();
  $scope.data = { mandate: false };
  $scope.busy = false;

  $scope.payDeposit = function () {
    $scope.busy = true;
    alertService.load($scope);
    depositService.requestContractAndPay({
      person: me.id,
      contractType: type
    })
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      $scope.busy = false;
      alertService.loaded($scope);
    });
  };
});
