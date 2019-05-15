'use strict';

angular.module('owm.finance.instapay', [])

.controller('InstantPaymentController', function (
  $state,
  $scope,
  appConfig,

  orderStatusId,
  paymentSucceeded,
  paymentFailed,

  me,
  instantPayment,
  instantPaymentService,
  
  $stateParams,

  buyVoucherRedirect,
  instaPayRedirect,
  
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

    // Redirects

    $scope.payMain = function () {
      if (me) {
        buyVoucherRedirect({
          amount: $scope.mainInvoiceGroup.total - $scope.currentCredit,
          afterPayment: {
            redirect: {
              state: 'owm.instantpayment.pay',
              params: {
                id: instantPayment.id,
                token: instantPayment.viewToken,
                orderStatusId: 100, // fake it
              },
            },
            paymentErrorRedirect: {
              state: 'owm.instantpayment.pay',
              params: {
                id: instantPayment.id,
                token: instantPayment.viewToken,
                orderStatusId: 0, // fake it
              },
            },
          },
        });
      } else {
        var redirectTo = appConfig.appUrl + $state.href('owm.instantpayment.pay', {
          id: instantPayment.id,
          token: instantPayment.viewToken,
        }, { inherit: false });

        if ($scope.focus === 'single') {
          instaPayRedirect(instantPayment, redirectTo);
        }
        else {
          $scope.makingMainInstantPayment = true;
          instantPaymentService.createByIdAndToken({
            id: instantPayment.id,
            token: instantPayment.viewToken,
            invoiceGroup: $scope.mainInvoiceGroup.id,
          })
          .then(function (mainInstantPayment) {
            instaPayRedirect(mainInstantPayment, redirectTo);
          })
          .catch(function (e) {
            console.log('error creating next instapay for ALL invoices', e);
            alertService.addError(e);
          });
        }
      }
    };

    $scope.payAll = function () {
      if (me) {
        buyVoucherRedirect({
          amount: $scope.totalAllInvoiceGroups - $scope.currentCredit,
          afterPayment: {
            redirect: {
              state: 'owm.instantpayment.pay',
              params: {
                id: instantPayment.id,
                token: instantPayment.viewToken,
                orderStatusId: 100, // fake it
              },
            },
            paymentErrorRedirect: {
              state: 'owm.instantpayment.pay',
              params: {
                id: instantPayment.id,
                token: instantPayment.viewToken,
                orderStatusId: 0, // fake it
              },
            },
          },
        });
      } else {
        var redirectTo = appConfig.appUrl + $state.href('owm.instantpayment.pay', {
          id: instantPayment.id,
          token: instantPayment.viewToken,
        }, { inherit: false });

        if ($scope.focus === 'all') {
          instaPayRedirect(instantPayment, redirectTo);
        }
        else {
          $scope.makingAllInstantPayment = true;
          instantPaymentService.createByIdAndToken({
            id: instantPayment.id,
            token: instantPayment.viewToken,
            invoiceGroup: null,
          })
          .then(function (allInstantPayment) {
            instaPayRedirect(allInstantPayment, redirectTo);
          })
          .catch(function (e) {
            console.log('error creating next instapay for ALL invoices', e);
            alertService.addError(e);
          });
        }
      }
    };

  }

});
