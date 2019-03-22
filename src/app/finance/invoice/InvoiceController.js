'use strict';

angular.module('owm.finance.invoice', [])

.controller('InvoiceResultController', function (
  $window,
  $state,
  $scope,
  $log,
  appConfig,

  orderStatusId,
  paymentSucceeded,
  paymentFailed,
  
  alertService,
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
  $window,
  $state,
  $scope,
  $log,
  appConfig,

  instantPaymentService,
  instaPayRedirect,

  me,
  invoiceGroups_simplified,
  credit,
  
  $stateParams,
  
  alertService,
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
    var redirectTo = appConfig.appUrl + $state.href('owm.finance.invoice', null, { inherit: false });

    $scope.makingMainInstantPayment = true;
    instantPaymentService.create({
      person: me.id,
      invoiceGroup: $scope.mainInvoiceGroup.id,
    })
    .then(function (mainInstantPayment) {
      instaPayRedirect(mainInstantPayment, redirectTo);
    })
    .catch(function (e) {
      console.log('error creating next instapay for ALL invoices', e);
      alertService.addError(e);
    });
  };

  $scope.payAll = function () {
    var redirectTo = appConfig.appUrl + $state.href('owm.finance.invoice', null, { inherit: false });

    $scope.makingAllInstantPayment = true;
    instantPaymentService.create({
      person: me.id,
      invoiceGroup: null,
    })
    .then(function (allInstantPayment) {
      instaPayRedirect(allInstantPayment, redirectTo);
    })
    .catch(function (e) {
      console.log('error creating next instapay for ALL invoices', e);
      alertService.addError(e);
    });
  };

});
