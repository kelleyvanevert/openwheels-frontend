'use strict';

angular.module('owm.resource.reservationForm', [])

.directive('reservationForm', function () {
  return {
    restrict: 'E',
    scope: {
      mobile: '=',
      person: '=',
      resource: '=',
      booking: '=', // { beginRequested, endRequested, remarkRequester, contract }     , timeframe (!)
      showPrice: '=',
    },
    templateUrl: 'resource/components/reservationForm.tpl.html',
    controller: 'ReservationFormController'
  };
})

.controller('ReservationFormController', function (
  $log, $q, $timeout, $filter, $rootScope, $scope, $state, $element,
  API_DATE_FORMAT, resourceService, invoice2Service, alertService, authService, bookingService, discountService,
  contractService, featuresService, $mdDialog, $mdMedia, $translate, $location, $localStorage, Analytics) {

  // Check if this page is being called after login/singup in booking process
  handleAuthRedirect();

  // This data does not change
  $scope.age = -1;
  if(authService.user.isAuthenticated && authService.user.identity.dateOfBirth) {
    var dob = moment(authService.user.identity.dateOfBirth);
    $scope.age  = Math.abs(dob.diff(moment(), 'years'));
  }

  $scope.features = $rootScope.features;
  $scope.user = authService.user;
  if($scope.person) {
    $scope.invitedDiscount = ($scope.person.invited.id && !$scope.person.invited.redemeed && $scope.person.numberOfBookings === 0) ? true : false;
  } else {
    $scope.invitedDiscount = false;
  }


  // This data DOES change

  function resetToPreTimeframe () {
    $scope.timeFrameError = false;
    $scope.availability = null; // null | { yes: true | no: true | unknown: true, available: 'yes'|'no'|'unknown' }
    $scope.price = null;        // null | result of invoice2.calculatePrice(...)
    $scope.discountCodeValidation = {
      timer: null,
      submitted: false,
      busy: false,
      showSpinner: false,
      success: false,
      error: false
    };
  }
  resetToPreTimeframe();

  $scope.showExtraFields = false;

  $scope.extraFieldBlur = function () {
    setTimeout(function () {
      var has_focus = $element.find('#res_discountCode').is(':focus') || $element.find('#res_comment').is(':focus');
      if (!has_focus && !$scope.booking.discountCode && !$scope.booking.remarkRequester) {
        $scope.showExtraFields = false;
        $scope.$apply(); // necessary because of the timeout wrapper
      }
    }, 150);
  };

  $scope.extraField = function (field) {
    $scope.showExtraFields = true;
    setTimeout(function () {
      $element.find('#res_' + field).focus();
    }, 10);
  };

  var availabilityCheckTimer;
  $scope.$watch('[booking.beginRequested, booking.endRequested]', function () {
    //$log.log($scope.booking.beginRequested + ' -> ' + $scope.booking.endRequested);

    if (!$scope.booking.beginRequested || !$scope.booking.endRequested) {
      return false;
    }

    Analytics.trackEvent('booking', 'timeframe_entered', $scope.user.identity ? $scope.user.identity.id : undefined, undefined, true);

    $timeout.cancel(availabilityCheckTimer);
    resetToPreTimeframe();

    if (moment($scope.booking.beginRequested) >= moment($scope.booking.endRequested)) {
      $scope.timeFrameError = 'invalid';
    }
    else {
      $scope.timeFrameError = false;
      availabilityCheckTimer = $timeout(function () {
        loadAvailability().then(function (availability) {
          if (availability.yes) {
            loadContractsOnce().then(function () {
              validateDiscountCode();
              loadPrice();
            });
          } else {
            validateDiscountCode();
            loadPrice();
          }
        });
      }, 800);
    }
  });

  $scope.$watch('[booking.riskReduction]', loadPrice);


  function loadAvailability () {
    //$log.log('loadAvailability()');

    $scope.availability = null;
    var resource = $scope.resource;
    var booking = $scope.booking;

    return $q(function (resolve, reject) {
      if (!booking.beginRequested || !booking.endRequested) {
        //$log.log(' (aborted)');
        return reject();
      }

      resourceService.checkAvailability({
          resource: resource.id,
          timeFrame: {
            startDate: booking.beginRequested,
            endDate: booking.endRequested,
          }
        })
        .then(function (isAvailable) {
          $scope.availability = {
            available: isAvailable ? 'yes' : 'no',
            yes: isAvailable,
            no: !isAvailable,
            unknown: false,
          };
        })
        .catch(function () {
          $scope.availability = {
            available: 'unknown',
            yes: false,
            no: false,
            unknown: true,
          };
        })
        .finally(function () {
          resolve($scope.availability);
        });
    });
  }

  function loadContractsOnce () {
    //$log.log('loadContractsOnce()');

    var booking = $scope.booking;

    return $q(function (resolve, reject) {
      if (booking.contractOptions) {
        resolve(booking.contractOptions);
      }
      else if (!$scope.person) {
        booking.contractOptions = [];
        booking.contract = null;
        resolve([]);
      }
      else {
        contractService.forDriver({
          person: $scope.person.id
        })
        .then(function (contracts) {
          booking.contractOptions = contracts || [];
          booking.contract = contracts.length ? contracts[0] : null;
          $scope.$watch('booking.contract.id', loadPrice);
          resolve(contracts);
        });
      }
    });
  }

  function loadPrice () {
    //$log.log('loadPrice()');

    var availability = $scope.availability;
    var resource = $scope.resource;
    var booking = $scope.booking;
    $scope.price = null;

    return $q(function (resolve, reject) {
      if (!availability || availability.no || !booking.beginRequested || !booking.endRequested) {
        //$log.log(' (aborted)');
        return reject();
      }

      if (booking.riskReduction === undefined) {
        booking.riskReduction = true;
      }

      invoice2Service.calculatePrice({
        resource: resource.id,
        timeFrame: {
          startDate: booking.beginRequested,
          endDate: booking.endRequested
        },
        includeRedemption: booking.riskReduction,
        contract: booking.contract ? booking.contract.id : undefined,
      }, resource)
      .then(function (price) {
        $scope.price = price;
        resolve(price);
      });
    });
  }

  $scope.priceHtml = function (price) {
    var s = '';
    if (price.rent > 0) {
      s += 'Huur: ' + $filter('currency')(price.rent) + '<br/>';
    }
    if (price.insurance > 0) {
      s += 'Verzekering: ' + $filter('currency')(price.insurance) + '<br/>';
    }
    if (price.booking_fee > 0) {
      s += 'Boekingskosten: ' + $filter('currency')(price.booking_fee) + '<br/>';
    }
    if (price.redemption > 0) {
      s += 'Verlagen eigen risico: ' + $filter('currency')(price.redemption) + '<br/>';
    }
    s += 'Totaal: ' + $filter('currency')(price.total);
    return s;
  };

  $scope.removeLocalDiscountCode = function removeLocalDiscountCode () {
    // Ideally, we'd just want to `$state.go('.', { discountCode: '' })`
    //  and be done with it.
    // But, because `app.js` doesn't treat `$stateChangeStart` and `$stateChangeSuccess`
    //  lightly, we can't really do this. Hence still small 'workaround'
    //  in which we `notify: false` and then change the discountCode ourselves.
    //  (We know for sure this is the only change, so it doesn't hurt that much.)
    $localStorage.discountCode = $scope.booking.discountCode = '';
    $scope.extraFieldBlur();
    $scope.discountCodeValidation = {
      timer: null,
      submitted: false,
      busy: false,
      showSpinner: false,
      success: false,
      error: false
    };
    $state.go('.', { discountCode: '' }, {
      notify: false,
    });
  };

  $scope.validateDiscountCode = validateDiscountCode;
  function validateDiscountCode() {
    var DEBOUNCE_TIMEOUT_MS = 500,
      validation = $scope.discountCodeValidation,
      code = $scope.booking.discountCode;

    $timeout.cancel(validation.timer);
    validation.busy = false;
    validation.showSpinner = false;
    validation.success = false;
    validation.error = false;

    if (!code || !$scope.person || !$scope.booking.contract || !$scope.booking.contract.id) {
      return;
    }

    validation.busy = true;
    validation.showSpinner = true;
    validation.timer = $timeout(function validateDebounced() {
      $log.debug('validating', code);

      discountService.isApplicable({
          resource: $scope.resource.id,
          person: $scope.person.id,
          contract: $scope.booking.contract.id,
          discount: code,
          timeFrame: {
            startDate: $scope.booking.beginRequested,
            endDate: $scope.booking.endRequested
          }
        })
        .then(function (result) {
          if (!validation.busy || code !== $scope.booking.discountCode) {
            return;
          }
          validation.success = result.applicable;
          validation.error = !validation.success;
        })
        .catch(function () {
          if (!validation.busy || code !== $scope.booking.discountCode) {
            return;
          }
          validation.success = false;
          validation.error = true;
        })
        .finally(function () {
          if (!validation.busy || code !== $scope.booking.discountCode) {
            return;
          }
          validation.submitted = true;
          validation.busy = false;
          validation.showSpinner = false;
        });
    }, DEBOUNCE_TIMEOUT_MS);
  }

  function handleAuthRedirect() {
    if ($location.search().authredirect) {}
  }

  function dialogController($scope, $mdDialog, authService, booking, resource) {
    $scope.url = 'owm.person.details({pageNumber: \'1\'})';
    $scope.booking = booking;
    $scope.resource = resource;
    $scope.hide = function () {
      $mdDialog.hide();
    };
    $scope.cancel = function () {
      $mdDialog.cancel();
    };
    $scope.answer = function (answer) {
      $mdDialog.hide(answer);
    };
  }
  $scope.loading = {createBooking: false};

  $scope.createBooking = function (booking) {
    $scope.loading.createBooking = true;

    $scope.person = authService.user.identity;
    $rootScope.$watch(function isAuthenticated() {
      $scope.person = authService.user.identity;
    });

    loadContractsOnce()
    .then(function() {
      createBookingDoCalls($scope.booking);
    });
  };

  $scope.initPhoneNumbers = function () {
    $scope.verifiedPhoneNumbers = false;

    for(var i=0; i<$scope.person.phoneNumbers.length; i++) {
      if($scope.person.phoneNumbers[i].verified === true) {
        $scope.verifiedPhoneNumbers = true;
      }
    }
  };

  function createBookingDoCalls(booking) {
    if($scope.person) {
      $scope.initPhoneNumbers();
    }

    if ($scope.timeFrameError) {
      return;
    }
    if (!booking.beginRequested || !booking.endRequested) {
      $scope.loading.createBooking = false;
      $scope.timeFrameError = 'not_given';
      return;
    }
    if (!$scope.features.signupFlow && !$scope.person) { // not logged in
      $scope.loading.createBooking = false;
      return $state.go('owm.auth.signup');
    } else if (!$scope.person) { // not logged in

      // Als je nog niet bent ingelogd is er
      // even een andere flow nodig
      $scope.loading.createBooking = false;
      return $mdDialog.show({
        controller: ['$scope', '$mdDialog', 'authService', 'booking', 'resource', dialogController],
        templateUrl: 'resource/components/ReservationFormDialog.tpl.html',
        clickOutsideToClose: true,
        locals: {
          booking: $scope.booking,
          resource: $scope.resource
        },
        fullscreen: $mdMedia('xs')
      });
    } else if ($scope.person.status === 'new' && !$scope.features.signupFlow) {
      $scope.loading.createBooking = false;
      return alertService.add('danger', 'Voordat je een auto kunt boeken, hebben we nog wat gegevens van je nodig.', 5000);
    } else if ($scope.person.status === 'new' && $scope.features.signupFlow) { // upload driver's license
      $scope.loading.createBooking = false;
      return $state.go('owm.person.details', { // should register
        pageNumber: '1',
        city: $scope.resource.city ? $scope.resource.city : 'utrecht',
        resourceId: $scope.resource.id,
        startDate: booking.beginRequested,
        endDate: booking.endRequested,
        discountCode: booking.discountCode,
        remarkRequester: booking.remarkRequester,
        riskReduction: booking.riskReduction
      });
    } else if ($scope.person.status === 'book-only' && $scope.features.signupFlow && $scope.person.numberOfBookings === 0 && !$scope.verifiedPhoneNumbers) { // verify phone number
      $scope.loading.createBooking = false;
      return $state.go('owm.person.details', { // should register
        pageNumber: '1',
        city: $scope.resource.city ? $scope.resource.city : 'utrecht',
        resourceId: $scope.resource.id,
        startDate: booking.beginRequested,
        endDate: booking.endRequested,
        discountCode: booking.discountCode,
        remarkRequester: booking.remarkRequester,
        riskReduction: booking.riskReduction
      });
    } else if (!booking.contract) { // should pay deposit to get a contract
      $scope.loading.createBooking = false;
      return alertService.add('danger', 'Voordat je een auto kunt boeken, hebben we een borg van je nodig', 5000);
    } else {
      alertService.load();

      return authService.me().then(function (me) {
          /**
           * Create booking
           */
          return bookingService.create({
            resource: $scope.resource.id,
            timeFrame: {
              startDate: booking.beginRequested,
              endDate: booking.endRequested
            },
            person: me.id,
            contract: booking.contract.id,
            remark: booking.remarkRequester,
            riskReduction: booking.riskReduction
          });
        })
        //
        // /**
        //  * Apply discount (only if we have a discount code)
        //  */
        .then(function (response) {
          Analytics.trackEvent('booking', 'created_post', response.id, $scope.resource.owner.id === 282 ? 11 : (!$scope.resource.isConfirmationRequiredOthers ? 4 : undefined), true);
          if (!booking.discountCode) { // === undefined (?)
            return response;
          } else {
            return discountService.apply({
                booking: response.id,
                discount: booking.discountCode
              })
              .then(function (discountResponse) {
                Analytics.trackEvent('booking', 'discount_applied', undefined, undefined, true);
                $log.debug('successfully applied discount');
                return response; // <-- the response from bookingService.create
              })
              .catch(function (err) {
                $log.debug('error applying discount');
                alertService.addError(err);
                return response; // <-- continue, although the discount has not been applied!
              });
          }
        })
        .then(function (response) {
          var bookingId = response.id;
          return $state.go('owm.booking.show', { bookingId: bookingId });
        })
        .catch(alertService.addError)
        .finally(function() {
          $scope.loading.createBooking = false;
          alertService.loaded();
        });
    }
  }

});
