'use strict';

angular.module('owm.finance', [
  'owm.finance.index',
  'owm.finance.kmpoints',
  'owm.finance.invoice',
  'owm.finance.instapay',
  'owm.finance.vouchers',
  'owm.finance.paymentResult',
  'owm.finance.deposit',
  'owm.finance.v4',
])

// This is a helper to save continuation information before going to pay.nl
.factory('payRedirect', function ($window, $sessionStorage, $state, appConfig) {
  return function (payUrl, afterPayment) {

    // first, store flow-continuation information in session storage
    $sessionStorage.afterPayment = afterPayment;

    // then, redirect to pay
    var redirectTo = appConfig.appUrl + $state.href('owm.finance.payment-result');
    $window.location.href = payUrl + '?redirectTo=' + encodeURIComponent(redirectTo);
  };
})

.factory('instaPayRedirect', function ($window, appConfig) {
  return function (instantPayment, redirectTo) {
    var url = appConfig.appUrl + '/instant-payment/pay-now/' + instantPayment.id + '/' + instantPayment.viewToken +
      '/10/0' + // betalen met iDeal
      '?redirectTo=' + encodeURIComponent(redirectTo);
    
    $window.location = url;
  };
})

// This is a helper to initiate a voucher payment + redirect for a certain amount.
.factory('buyVoucherRedirect', function (
  $location,
  
  Analytics,

  payRedirect,

  alertService,
  voucherService,
  paymentService,
  authService
) {
  return function (info) {
    // info.amount: euros
    // info.afterPayment
    // info.onError

    var me = authService.user.identity;

    Analytics.trackEvent('payment', 'started', undefined, undefined, true);

    if (!info.amount || info.amount < 0) {
      return;
    }

    alertService.load();
    $location.url($location.path());
    voucherService.createVoucher({
        person: me.id,
        value: info.amount,
      })
      .then(function (voucher) {
        return paymentService.payVoucher({
          voucher: voucher.id
        });
      })
      .then(function (data) {
        if (!data.url) {
          throw new Error('Er is een fout opgetreden');
        }
        payRedirect(data.url, info.afterPayment);
      })
      .catch(info.onError || function () {})
      .finally(function () {
        alertService.loaded();
      });
  };
})

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
      },
      checkAccess: function (me) {
        return !me.isBusinessConnected;
      },
    },
    resolve: {
      me: ['authService', '$stateParams', function (authService, $stateParams) {
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

/*

interface InvoiceGroup_BookingsData {
  original: InvoiceGroup
  [type: "renter" | "owner"]: {
    [booking_id: number]: {
      total: number
      totalTax: number
      booking: Booking
      invoiceLines: InvoiceLine[] // (w/ invoicetype: "sent" | "received")
    }
  }
  other: {
    0: Invoice[]
  }
}

interface InvoiceGroup {
  id: number
  approved: boolean
  currency: "EUR"
  
  date: datetime_string
  expirationDate: datetime_string
  paid: null | datetime_string

  person: Person // (me)
  total: number
  // type
}

interface Invoice {
  id: number
  
  date: datetime_string
  expirationDate: datetime_string
  paid: null | datetime_string

  sender: Person
  recipient: Person

  invoiceLines: InvoiceLine[]

  // recipientInvoiceGroup

  total: number
  totalTax: number

  type: string // e.g. "receipt"
}

interface InvoiceLine {
  id: number

  position: number
  price: number // euros
  total: number
  quantity: number
  taxRate: number // percentage 0 .. 100
  description: string

  type: string // e.g. "receipt"

  // invoice
}

*/

  .state('owm.finance.invoice', {
    url: '/factuur?orderStatusId',
    noGlobalLoader: false,
    views: {
      '@owm.finance': {
        templateUrl: 'finance/invoice/invoiceResult.tpl.html',
        controller: 'InvoiceResultController',
      },
    },
    resolve: {
      orderStatusId: ['$stateParams', function ($stateParams) {
        return $stateParams.orderStatusId ? parseInt($stateParams.orderStatusId) : null;
      }],
      paymentSucceeded: ['orderStatusId', function (orderStatusId) {
        return (orderStatusId === 100);
      }],
      paymentFailed: ['orderStatusId', function (orderStatusId) {
        return (orderStatusId !== 100);
      }],
    },
  })

  .state('owm.finance.invoice.pay', {
    url: '/:invoiceGroupId',
    noGlobalLoader: false,
    views: {
      '@owm.finance': {
        templateUrl: 'finance/invoice/invoice.tpl.html',
        controller: 'InvoiceController',
      },
    },
    resolve: {
      credit: ['voucherService', 'me', function (voucherService, me) {
        return voucherService.calculateCredit({ person: me.id })
        .then(function (credit) {
          return { value: credit };
        });
      }],
      invoiceGroups: ['me', 'paymentService', function (me, paymentService) {
        return paymentService.getInvoiceGroups({
          person: me.id,
          max: 100,
          status: 'unpaid',
        }).then(function (invoiceGroups) {
          return invoiceGroups.filter(function (invoiceGroup) {
            return invoiceGroup.total > 0;
          });
        });
//        .catch(function (err) {
//          // TODO
//        });
      }],
      invoiceGroupsData: ['invoiceGroups', 'invoice2Service', '$q', function (invoiceGroups, invoice2Service, $q) {
        return $q.all(invoiceGroups.map(function (invoiceGroup) {
          return invoice2Service.getInvoiceGroup({
            invoiceGroup: invoiceGroup.id,
            groupByBooking: true,
          });
//          .catch(function (err) {
//            // TODO
//          });
        }));
      }],
      invoiceGroups_simplified: ['invoiceGroupsData', function (invoiceGroupsData) {
        return invoiceGroupsData.map(function (invoiceGroupData) {
          var lines = {
            other: [
              {
                lines: [],
              },
            ],
            booking: [],
          };

          if (invoiceGroupData.other[0] && invoiceGroupData.other[0].length > 0) {
            _.forEach(invoiceGroupData.other[0], function (invoice) {
              _.forEach(invoice.invoiceLines, function (invoiceLine) {
                lines.other[0].lines.push({
                  description: invoiceLine.description,
                  quantity: invoiceLine.quantity,
                  price: invoiceLine.price,
                  total: invoiceLine.total,
                  tax: invoiceLine.taxRate / 100,
                });
              });
            });
          }

          _.forEach(['renter', 'owner'], function (type) {
            _.forEach(Object.values(invoiceGroupData[type]), function (linesForBooking) {
              var booking = linesForBooking.booking;
              if (!lines.booking[booking.id]) {
                lines.booking[booking.id] = {
                  beginBooking: booking.beginBooking,
                  lines: [],
                };
              }

              _.forEach(linesForBooking.invoiceLines, function (invoiceLine) {
                if ((invoiceLine.invoicetype === 'sent' && type === 'renter') || (invoiceLine.invoicetype === 'received' && type === 'owner')) {
                  lines.booking[booking.id].lines.push({
                    description: invoiceLine.description,
                    quantity: invoiceLine.quantity,
                    price: - invoiceLine.price,
                    total: - invoiceLine.total,
                    tax: invoiceLine.taxRate / 100,
                  });
                } else {
                  lines.booking[booking.id].lines.push({
                    description: invoiceLine.description,
                    quantity: invoiceLine.quantity,
                    price: invoiceLine.price,
                    total: invoiceLine.total,
                    tax: invoiceLine.taxRate / 100,
                  });
                }
              });
            });
          });

          lines.booking = Object.values(lines.booking);

          if (lines.other[0].lines.length === 0) {
            lines.other = [];
          }

          return {
            id: invoiceGroupData.original.id,
            total: invoiceGroupData.original.total,
            invoiceLines: lines,
          };
        });
      }],
    },
  })

  .state('owm.instantpayment', {
    url: '/betaal?orderStatusId',
    noGlobalLoader: true,
    abstract: true,
    resolve: {
      orderStatusId: ['$stateParams', function ($stateParams) {
        return $stateParams.orderStatusId ? parseInt($stateParams.orderStatusId) : null;
      }],
      paymentSucceeded: ['orderStatusId', function (orderStatusId) {
        return (orderStatusId === 100);
      }],
      paymentFailed: ['orderStatusId', function (orderStatusId) {
        return (orderStatusId !== 100);
      }],
    },
  })

  .state('owm.instantpayment.pay', {
    url: '/:id/:token',
    noGlobalLoader: true,
    views: {
      'main-full@shell': {
        templateUrl: 'finance/instaPay/instaPay.tpl.html',
        controller: 'InstantPaymentController',
      },
    },
    resolve: {
      instantPayment: ['instantPaymentService', '$stateParams', 'paymentSucceeded', function (instantPaymentService, $stateParams, paymentSucceeded) {
        if (paymentSucceeded) {
          return null;
        }

        return instantPaymentService.getByIdAndToken({
          id: $stateParams.id,
          token: $stateParams.token,
        })
        .then(function (instantPayment) {
          return instantPayment;
        })
        .catch(function (e) {
          return null;
        })
        ;
      }],
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
    onEnter: ['afterPayment', 'success', '$state', function (afterPayment, success, $state) {
      var loc;
      
      if (success && afterPayment && afterPayment.redirect) {
        loc = afterPayment.redirect;
        $state.go(loc.state, loc.params);
      }
      else if (!success && afterPayment && afterPayment.paymentErrorRedirect) {
        loc = afterPayment.paymentErrorRedirect;
        $state.go(loc.state, loc.params);
      }
      // else, just let this page handle it
    }],
  })
  ;

});
