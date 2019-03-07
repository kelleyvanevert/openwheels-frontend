'use strict';

angular.module('owm.finance', [
  'owm.finance.index',
  'owm.finance.kmpoints',
  'owm.finance.vouchers',
  'owm.finance.paymentResult',
  'owm.finance.deposit',
  'owm.finance.v4',
])
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
        return (orderStatusId > 0);
      }],
      afterPayment: ['$sessionStorage', function ($sessionStorage) {
//        $sessionStorage.afterPayment = { redirect: { state: 'owm.booking.show', params: { bookingId: 110 } } };
        var afterPayment = $sessionStorage.afterPayment || null;
        $sessionStorage.afterPayment = null;
        return afterPayment;
      }],
//      cont: ['$stateParams', '$log', '$state', function ($stateParams, $log, $state) {
//        var cont = null;
//
//        if ($stateParams.cont) {
//          try {
//            cont = JSON.parse($stateParams.cont);
//            $log.log('continuation:', cont);
//          } catch (e) {
//            $log.log('could not parse this `cont` parameter:', $stateParams.cont);
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
