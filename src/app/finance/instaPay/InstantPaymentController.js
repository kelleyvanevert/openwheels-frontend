'use strict';

angular.module('owm.finance.instapay', [])

.controller('InstantPaymentController', function (
  $window,
  $state,
  $scope,
  appConfig,

  orderStatusId,
  paymentSucceeded,
  paymentFailed,

  instantPayment,
  instantPaymentService,
  
  $stateParams,
  
  alertService,
  metaInfoService
) {

  metaInfoService.set({url: appConfig.serverUrl + '/betaal/' + $stateParams.id + '/' + $stateParams.token});
  metaInfoService.set({canonical: 'https://mywheels.nl/betaal/' + $stateParams.id + '/' + $stateParams.token});

  if (!orderStatusId && !instantPayment) {
    $scope.notFound = true;
  }

  if (orderStatusId) {
    $scope.paymentSucceeded = paymentSucceeded;
    $scope.paymentFailed = paymentFailed;
  }

  if (instantPayment) {

    $scope.totalAllInvoiceGroups = instantPayment.invoices.reduce(function (total, invoiceGroup) {
      return total + invoiceGroup.total;
    }, 0);

    if (instantPayment.invoiceGroup) {
      // => this is a single invoice related instant payment
      $scope.focus = 'single';
      
      // deduce current credit
      $scope.currentCredit = instantPayment.invoiceGroup.total - instantPayment.total;

      // main invoice to pay
      $scope.mainInvoiceGroup = instantPayment.invoiceGroup;

      // all other invoices
      $scope.otherInvoiceGroups = instantPayment.invoices.filter(function (other) {
        return other.id !== $scope.mainInvoiceGroup.id;
      });
    }
    else {
      // => this is an instant payment related to all open invoices
      $scope.focus = 'all';

      // deduce current credit
      $scope.currentCredit = $scope.totalAllInvoiceGroups - instantPayment.total;

      // main invoice to pay (the one with the highest amount)
      $scope.mainInvoiceGroup = instantPayment.invoices.reduce(function (a, b) {
        return a.total > b.total ? a : b;
      });

      // all other invoices
      $scope.otherInvoiceGroups = instantPayment.invoices.filter(function (other) {
        return other.id !== $scope.mainInvoiceGroup.id;
      });
    }


  //  if (instantPayment.invoiceGroup) {
  //    // => this is an invoice-related instant payment
  //
  //    if (instantPayment.moreOpenInvoices) {
  //      // => there are more invoices
  //      //    => make an instant payment for the next one, in order to redirect to it after payment success
  //      //    => make an instant payment for ALL invoices, for if the user wants to pay them all at once
  //
  //      $scope.otherInvoices = instantPayment.invoices.filter(function (invoiceGroup) {
  //        return invoiceGroup.id !== instantPayment.invoiceGroup.id;
  //      });
  //
  //      instantPaymentService.createByIdAndToken({
  //        id: instantPayment.id,
  //        token: instantPayment.viewToken,
  //        invoiceGroup: $scope.otherInvoices[0].id,
  //      })
  //      .then(function (nextInstantPayment) {
  //        $scope.nextInstantPayment = nextInstantPayment;
  //      })
  //      .catch(function (e) {
  //        console.log('error creating next instapay for next invoice', e);
  //      });
  //    }
  //  }


    // Redirects

    $scope.payMain = function () {
      var redirectTo = appConfig.appUrl + $state.href('owm.instantpayment.pay', {
        id: instantPayment.id,
        token: instantPayment.viewToken,
      }, { inherit: false });

      if ($scope.focus === 'single') {
        pay(instantPayment, redirectTo);
      }
      else {
        $scope.makingMainInstantPayment = true;
        instantPaymentService.createByIdAndToken({
          id: instantPayment.id,
          token: instantPayment.viewToken,
          invoiceGroup: $scope.mainInvoiceGroup.id,
        })
        .then(function (mainInstantPayment) {
          pay(mainInstantPayment, redirectTo);
        })
        .catch(function (e) {
          console.log('error creating next instapay for ALL invoices', e);
          alertService.addError(e);
        });
      }
    };

    $scope.payAll = function () {
      var redirectTo = appConfig.appUrl + $state.href('owm.instantpayment.pay', {
        id: instantPayment.id,
        token: instantPayment.viewToken,
      }, { inherit: false });

      if ($scope.focus === 'all') {
        pay(instantPayment, redirectTo);
      }
      else {
        $scope.makingAllInstantPayment = true;
        instantPaymentService.createByIdAndToken({
          id: instantPayment.id,
          token: instantPayment.viewToken,
          invoiceGroup: null,
        })
        .then(function (allInstantPayment) {
          pay(allInstantPayment, redirectTo);
        })
        .catch(function (e) {
          console.log('error creating next instapay for ALL invoices', e);
          alertService.addError(e);
        });
      }
    };

  }

  function pay (payInstantPayment, redirectTo) {
    var url = appConfig.appUrl + '/instant-payment/pay-now/' + payInstantPayment.id + '/' + payInstantPayment.viewToken +
      '?redirectTo=' + encodeURIComponent(redirectTo);
    
    $window.location = url;
  }

});
