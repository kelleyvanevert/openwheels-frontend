'use strict';

angular.module('owm.finance', [
  'owm.finance.index',
  'owm.finance.kmpoints',
  'owm.finance.vouchers',
  'owm.finance.paymentResult',
  'owm.finance.deposit',
  'owm.finance.v4',
])

.factory('payRedirect', ['$window', '$sessionStorage', '$state', 'appConfig', function ($window, $sessionStorage, $state, appConfig) {
  return function (payUrl, afterPayment) {

    // first, store flow-continuation information in session storage
    $sessionStorage.afterPayment = afterPayment;

    // then, redirect to pay
    var redirectTo = appConfig.appUrl + $state.href('owm.finance.payment-result');
    $window.location.href = payUrl + '?redirectTo=' + encodeURIComponent(redirectTo);
  };
}])

.config(function config($stateProvider) {

  $stateProvider

  .state('owm.finance', {
    abstract: true,
    views: {
      'main-full@shell': {
        templateUrl: 'finance/index.tpl.html',
        controller: 'FinanceIndexController'
      }
    },
    data: {
      access: {
        deny: {
          anonymous: true
        },
      }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.me();
      }],
      requiredCredit: ['me', 'voucherService', function (me, voucherService) {
        return voucherService.calculateRequiredCredit({ person: me.id });
      }],
      kmPoints: ['me', 'kmPointService', function (me, kmPointService) {
        return kmPointService.forPerson({ person: me.id });
      }],
    },
  })

  .state('owm.finance.v4', {
    url: '/finance',
    noGlobalLoader: true,
    views: {
      '@owm.finance': {
        templateUrl: 'finance/v4/financeOverview.tpl.html',
        controller: 'FinanceV4OverviewController'
      }
    },
  })

  .state('owm.finance.vouchers', {
    url: '/vouchers',
    noGlobalLoader: true,
    views: {
      '@owm.finance': {
        templateUrl: 'finance/vouchers/vouchers.tpl.html',
        controller: 'VouchersController'
      }
    },
  })

  .state('owm.finance.kmpoints', {
    url: '/beheerdersvergoeding',
    noGlobalLoader: true,
    views: {
      '@owm.finance': {
        templateUrl: 'finance/kmpoints/kmpoints.tpl.html',
        controller: 'KmPointsController'
      }
    },
  })


  /**
   * All versions
   */

  .state('owm.finance.deposit', {
    url: '/deposit',
    views: {
      'main-full@shell': {
        templateUrl: 'empty.tpl.html'
      },
      'main@shell': {
        templateUrl: 'finance/deposit/deposit.tpl.html',
        controller: 'DepositController'
      }
    },
    data: {
      access: {
        deny: {
          anonymous: true
        }
      }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.authenticatedUser();
      }],
      type: function() { return 65; }
    }
  })

  .state('owm.finance.contributie', {
    url: '/contributie',
    views: {
      'main-full@shell': {
        templateUrl: 'empty.tpl.html'
      },
      'main@shell': {
        templateUrl: 'finance/deposit/deelauto.tpl.html',
        controller: 'DepositController'
      }
    },
    data: {
      access: {
        deny: {
          anonymous: true
        }
      }
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.authenticatedUser();
      }],
      type: function () { return 5; }
    }
  })

  .state('owm.finance.payment-result', {
    url: '/payment-result?orderStatusId&cont',
    views: {
      'main-full@shell': {
        templateUrl: 'empty.tpl.html'
      },
      'main@shell': {
        templateUrl: 'finance/paymentResult/paymentResult.tpl.html',
        controller: 'PaymentResultController'
      }
    },
    resolve: {
      orderStatusId: ['$stateParams', function ($stateParams) {
        return parseInt($stateParams.orderStatusId);
      }],
      me: ['authService', function (authService) {
        return authService.me();
      }],
      success: ['orderStatusId', function (orderStatusId) {
        return (orderStatusId === 100);
      }],
      afterPayment: ['$sessionStorage', function ($sessionStorage) {
        //  afterPayment: {
        //    redirect?: UIRoute
        //    successLink?: UIRoute
        //    errorLink?: UIRoute
        //  }
        //  interface UIRoute {
        //    state: string
        //    params?: object
        //  }
        var afterPayment = $sessionStorage.afterPayment || null;
        $sessionStorage.afterPayment = null;
        return afterPayment;
      }],
//      // Another possibility would have been the more state-less option of putting this
//      //  info in the URL. But this seems less reliable for more data, because Pay.nl might
//      //  not be too happy with really long URLs.
//      cont: ['$stateParams', '$log', '$state', function ($stateParams, $log, $state) {
//        var cont = null;
//
//        if ($stateParams.cont) {
//          try {
//            cont = JSON.parse($stateParams.cont);
//            $log.log('continuation:', cont);
//          } catch (e) {
//            $log.log('could not parse continuation parameter:', $stateParams.cont);
//          }
//        }
//
//        return cont;
//      }],
    },
    onEnter: ['afterPayment', '$state', function (afterPayment, $state) {
      if (afterPayment && afterPayment.redirect) {
        $state.go(afterPayment.redirect.state, afterPayment.redirect.params);
      }
    }],
  })
  ;

});
