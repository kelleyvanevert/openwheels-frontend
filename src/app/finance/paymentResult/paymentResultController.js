'use strict';
angular.module('owm.finance.paymentResult', [])

.controller('PaymentResultController', function ($scope, $state, $log, $window, appConfig, orderStatusId, account2Service, alertService, voucherService, me, paymentService, bookingService, chipcardService, linksService, API_DATE_FORMAT, Analytics, metaInfoService,
  success,
  payRedirect,
  afterPayment // flow-continuation information
) {

  metaInfoService.set({url: appConfig.serverUrl + '/payment-result'});
  metaInfoService.set({canonical: 'https://mywheels.nl/payment-result'});

  $scope.isBusy = true;
  $scope.isApproved = false;
  $scope.accounts = [];
  $scope.name = '';
  $scope.person = '';
  $scope.fish = false;
  $scope.bookings = [];
  $scope.me = me;

  $scope.result = {
    success: success,
  };

  $scope.buyVoucher = function (value) { //buy a vouchure from 0.01 cents
    if (!value || value < 0) {
      return;
    }
    alertService.load($scope);
    voucherService.createVoucher({
        person: me.id,
        value: value
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
        /* redirect to payment url */
        payRedirect(data.url, afterPayment);
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded($scope);
      });
  };

  $scope.goAfterPayment = function () {
    if (!afterPayment) {
      $state.go('home');
    }

    if ($scope.result.successLink) {
      $state.go(afterPayment.successLink.state, afterPayment.successLink.params);
    } else {
      $state.go(afterPayment.errorLink.state, afterPayment.errorLink.params);
    }
  };

  function getBookings() { //get all the bookings from the user
    $scope.isBusy = true;
    alertService.load($scope);

    bookingService.getBookingList({
        person: me.id,
        asc: true,
        timeFrame: {
          startDate: moment().add(-1, 'hour').format(API_DATE_FORMAT),
          endDate: moment().add(1, 'year').format(API_DATE_FORMAT)
        },
        cancelled: false
      })
      .then(function (bookings) {
        var data = [];
        bookings.forEach(function (elm) {
          if (me.numberOfBookings <= 1 || elm.approved === 'OK') { //only aproved ones in the list
            if (elm.resource.locktype === 'chipcard') {
              chipcardService.getFish({
                person: me.id
              }).then(function (fish) {
                if (fish !== null || fish !== undefined) {
                  $scope.fish = fish;
                }
              });
            } else if (elm.resource.locktype === 'meeting') {
              elm.link = linksService.bookingAgreementPdf(elm.id);
            }
            if ([282, 519038].indexOf(elm.resource.owner.id) >= 0 && elm.resource.boardcomputer) {
              elm.fuelCard = true;
            } else {
              elm.fuelCard = false;
            }
            data.push(elm);
          }
        });
        return data;
      }).then(function (bookings) {
        $scope.bookings = bookings;
      }).catch(function (err) {

        alertService.addError(err);
      }).finally(function () {

        $scope.isBusy = false;
        alertService.loaded($scope);
      });
  }
  getBookings();

  function init() {
    if($scope.result.success) {
      Analytics.trackEvent('payment', 'success', undefined, undefined, true);
    } else {
      Analytics.trackEvent('payment', 'failed', undefined, undefined, true);
    }

    account2Service.forMe({}).then(function (data) {
      $scope.accounts = data;
      data.every(function (elm) {
        $scope.name = elm.lastName;
        $scope.person = elm.person;
        if (elm.approved === true) {
          $scope.isApproved = true;
          return false;
        } else {
          return true;
        }
      });
      $scope.isBusy = false;
    });
  }

  //start page
  init();

  $scope.hasAcceptedTimeframe = function (booking) {
    return booking.beginBooking && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

  $scope.hasRequestedTimeframe = function (booking) {
    return booking.beginRequested && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

});
