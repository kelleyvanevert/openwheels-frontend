'use strict';

angular.module('owm.booking.show', [])

.controller('BookingShowRentingOutController', function (
  metaInfoService,
  appConfig,

  $log,
  $scope
) {
  // $scope = { perspective, resource, booking, contract }
})

.controller('BookingShowRentingController', function (
  metaInfoService,
  appConfig,

  $log,
  $timeout,
  $scope
) {
  // $scope = { perspective, resource, booking, contract }

  var steps = {
    accountCheck: {
      checked: true,
      stress: false,
      text: 'Account gecontroleerd',
    },
    reservation: {
      checked: true,
      stress: false,
      text: 'Reservering gemaakt',
    },
    accepted: {
      stress: false,
    },
    payment: {},
  };

  function updatePaymentStep () {
    steps.payment = {
      checked: !$scope.paymentInit,
      stress: $scope.paymentInit,
      text: $scope.paymentInit ? 'Reservering betalen' : 'Reservering betaald',
      scrollTo: $scope.paymentInit ? '#bookingPayment' : undefined,
    };
  }
  $scope.$watch('paymentInit', updatePaymentStep);
  updatePaymentStep();

  if ($scope.accepted) {
    steps.accepted.checked = true;
    if ($scope.resource.isConfirmationRequiredOthers) {
      steps.accepted.text = 'Geaccepteerd door eigenaar';
    } else {
      steps.accepted.text = 'Automatisch geaccepteerd';
      //steps.accepted.tooltip = 'Deze auto hoeft niet handmatig geaccepteerd te worden door de eigenaar';
    }
  } else {
    steps.accepted.checked = false;
    steps.accepted.text ='Nog niet geaccepteerd door eigenaar';
    if (steps.payment.checked) {
      steps.accepted.tooltip = 'Je kunt voor de zekerheid een alternatief overwegen. Andere openstaande reserveringen worden automatisch geannuleerd bij acceptatie.';
    } else {
      steps.accepted.tooltip = 'Je kunt al wel betalen, zodat je direct op pad kunt zodra de reservering is geaccepteerd.';
    }
  }

  $scope.progressList = [
    steps.reservation,
    steps.accepted,
    steps.payment,
  ];
  
  if ($scope.showBookOnlyNotice) {
    $scope.progressList.splice(1, 0, steps.accountCheck);
    steps.accountCheck.checked = false;
    steps.accountCheck.stress = true;
    steps.accountCheck.text = 'Handmatige account-check vereist';
  } else if ($scope.firstTime) {
    $scope.progressList.unshift(steps.accountCheck);
  }

  $scope.progressPercentage = 0;
  $timeout(function () {
    $scope.progressPercentage = 100 * ($scope.progressList.filter(function (step) {
      return step.checked;
    }).length / $scope.progressList.length);
  }, 100);
})

.controller('BookingShowController', function (
  $q, $timeout, $log, $scope, $location, $filter, $translate, $state, $stateParams, appConfig, API_DATE_FORMAT,
  bookingService, resourceService, invoice2Service, alertService, dialogService,
  perspective,
  authService, boardcomputerService, discountUsageService, chatPopupService, linksService,
  booking, me, declarationService, $mdDialog, contract, Analytics, paymentService, voucherService,
  $window, $mdMedia, discountService, account2Service, $rootScope, chipcardService, metaInfoService,
  extraDriverService,
  damageService) {

  metaInfoService.set({url: appConfig.serverUrl + '/booking/' + booking.id});
  metaInfoService.set({canonical: 'https://mywheels.nl/booking/' + booking.id});

  $scope.perspective = perspective;

  $scope.appConfig = appConfig;
  $scope.contract = contract;
  $scope.booking = booking;
  var resource = $scope.resource = booking.resource;
  $scope.me = me;

  // Is person the renter or the owner
  $scope.ownContract = (contract.contractor.id === me.id);
  $scope.userPerspective = (function () {
    if (booking.person.id === me.id) {
      // het kan hier gaan om:
      // - een boeking op je eigen contract
      // - een boeking op iemand anders' contract [je bent contractant]
      return 'renter';
    }
    else if (resource.owner.id === me.id) {
      return 'owner';
    }
    else if ($scope.ownContract) {
      // het gaat hier om een rit van een contractant
      // [dit is niet jouw eigen boeking, maar die van een contractant]
      return 'contract_holder';
    }
  }());

  /*
  * Init booking times
  */
  $scope.initBookingRequestScope = function (booking) {
    $scope.bookingRequest = angular.copy(booking);
    $scope.bookingRequest.beginRequested = booking.beginRequested ? booking.beginRequested : booking.beginBooking;
    $scope.bookingRequest.endRequested   = booking.endRequested   ? booking.endRequested   : booking.endBooking;
  };
  $scope.initBookingRequestScope(booking);

  $scope.bookingStarted = moment().isAfter(moment(booking.beginBooking));
  $scope.bookingEnded = moment().isAfter(moment(booking.endBooking));
  $scope.bookingRequestEnded = moment().isAfter(moment(booking.endRequested));
  $scope.bookingStartsWithinOneHour = moment().isAfter(moment(booking.beginBooking).add(-1, 'hour'));
  $scope.bookingEndedReally = moment().isAfter(moment(booking.endBooking).add(1, 'hour'));
  $scope.bookingRequestEndedReally = moment().isAfter(moment(booking.endRequested).add(1, 'hour'));
  $scope.showBookingForm = !$scope.bookingEndedReally;
  $scope.requested = ($scope.booking.status === 'requested');
  $scope.accepted = ($scope.booking.status === 'accepted');
  $scope.firstTime = ($scope.booking.person.numberOfBookings === 0);

  $scope.showBookOnlyNotice = !booking.ok && (booking.person.status === 'book-only');

  $scope.userInput = {
    acceptRejectRemark: ''
  };

  $scope.openDialog = function($event, declaration) {
    $mdDialog.show({
      controller: ['$scope', '$mdDialog', 'appConfig', function($scope, $mdDialog, appConfig) {
        $scope.image = 'declaration/' + declaration.image;
        $scope.appConfig = appConfig;
        $scope.declaration = declaration;
        $scope.hide = function() {
          $mdDialog.hide();
        };
      }],
      templateUrl: 'booking/administer/declarationDialog.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose:true,
    })
    .then(function(res) {
    });
  };

  /*
  * Init permissions
  */
  initPermissions();

  function initPermissions() {
    var booking = $scope.booking;

    $scope.allowEdit   = false;
    $scope.allowCancel = false;
    $scope.allowStop   = false;
    $scope.allowAcceptReject  = false;
    $scope.allowDeclarations = contract.type.canHaveDeclaration && ($scope.booking.approved === 'OK' || $scope.booking.approved === null) && $scope.bookingStarted && !$scope.booking.resource.refuelByRenter && !booking.resource.fuelCardCar;
    $scope.allowDeclarationsAdd = $scope.allowDeclarations && moment().isBefore(moment(booking.endBooking).add(5, 'days'));

    $scope.showReviewTeaser = (booking.status === 'accepted') && booking.ok && // booking is definitely accepted and OK
      booking.beginBooking && booking.endBooking && // booking has a(n accepted) timeframe
      (moment().isAfter(moment(booking.beginBooking)) || moment().isAfter(moment(booking.endBooking))); // bezig of geweest

    // whether to show (possibly deactivated) buttons to open/close the car
    $scope.showBoardComputerButtons = false;

    // whether to enable the buttons (when you can actually open/close the car),
    //  or just show their shapes to prime people for the possibility
    $scope.enableBoardComputerButtons = false;

    if ($scope.booking.ok) {
      $scope.allowAgreementUrl = linksService.bookingAgreementPdf(booking.id);
    }

    if ($scope.userPerspective === 'renter') {
      $scope.allowEdit = (function () {
        if (booking.endBooking) {
          return moment().isBefore(moment(booking.endBooking).add(30, 'minutes')); // hooguit 30 minuten geleden afgelopen
        }
        else if (booking.beginRequested) {
          return moment().isBefore(moment(booking.beginRequested).add(15, 'minutes')); // moet nog beginnen
        }
        return false;
      }());

      $scope.allowCancel = (function () {
        if (booking.beginBooking) {
          return moment().isBefore(moment(booking.beginBooking)); // moet nog beginnen
        }
        return true;
      }());

      $scope.showBoardComputerButtons = (booking.resource.locktypes.indexOf('smartphone') >= 0) && !$scope.bookingEndedReally;
      if ($scope.showBoardComputerButtons) {
        $scope.enableBoardComputerButtons = true &&
          (booking.status === 'accepted') && booking.ok && // booking is definitely accepted and OK
          booking.beginBooking && booking.endBooking && // booking has a(n accepted) timeframe
          moment().isAfter(moment(booking.beginBooking).add(-5, 'minutes')) && // hooguit 5 minuten geleden begonnen
          moment().isBefore(moment(booking.endBooking).add(1, 'hour')); // hooguit 1 uur geleden afgelopen
      }

      $scope.allowStop = (function () {
        return ($scope.allowEdit &&
          booking.status === 'accepted' &&
          booking.beginBooking && booking.endBooking &&
          moment().isAfter(moment(booking.beginBooking)) &&
          moment().isBefore(moment(booking.endBooking))
        );
      }());

      if ($scope.requested) {
        loadAlternatives();
      }
    }

    if ($scope.userPerspective === 'owner') {
      $scope.allowAcceptReject = booking.beginRequested && booking.endRequested;
      $scope.allowCancel = (function () {
        return (
          !$scope.allowAcceptReject &&
          booking.status === 'accepted' &&
          booking.beginBooking &&
          moment().isBefore(moment(booking.beginBooking)) // is nog niet begonnen
        );
      }());
    }
  }

  $scope.hasAcceptedTimeframe = function (booking) {
    return booking.beginBooking && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

  $scope.hasRequestedTimeframe = function (booking) {
    return booking.beginRequested && ( ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 );
  };

  $scope.setTimeframe = function(booking, addDays) {
    booking.beginRequested = moment().add('days', addDays).format(API_DATE_FORMAT);
  };

  $scope.dateConfig = {
    //model
    modelFormat: API_DATE_FORMAT,
    formatSubmit: 'yyyy-mm-dd',

    //view
    viewFormat: 'DD-MM-YYYY',
    format: 'dd-mm-yyyy',
    //options
    selectMonths: true,
    container: 'body'
  };

  $scope.timeConfig = {
    //model
    modelFormat: API_DATE_FORMAT,
    formatSubmit: 'HH:i',

    //view
    viewFormat: 'HH:mm',
    format: 'HH:i',

    //options
    interval: 15,
    container: 'body'
  };

  /*
  * Boardcomputers functions
  */

  // general purpose dialog showing method
  $scope.infoDialog = infoDialog;
  function infoDialog (messageCode, $event, scopeExtender) {
    $mdDialog.show({
      templateUrl: 'booking/show/dialog-' + messageCode + '.tpl.html',
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: true,
      // scope: $scope,
      // preserveScope: true,
      controller: ['$scope', function ($scope) {
        // $scope.resource = resource;
        $scope.hide = function () {
          $mdDialog.hide();
        };
        if (typeof scopeExtender === 'function') {
          scopeExtender($scope);
        }
      }],
    });
  }

  // intermediate board computer control method
  // which delegates user intentions to
  // actual api calls or other dialogs
  $scope.boardComputerControl = boardComputerControl;
  function boardComputerControl (action, $event) {

    if (!$scope.enableBoardComputerButtons) {
      return false;
    }

    // helper
    function showInfoDialog (dialog, scopeExtender) {
      return function (errorMessage) {
        infoDialog(dialog, $event, function ($scope) {
          if (errorMessage) {
            $scope.errorMessage = errorMessage;
          }
          if (typeof scopeExtender === 'function') {
            scopeExtender($scope);
          }
        });
      };
    }

    if (action === 'closeDoor') {
      return closeDoor()
        .then(showInfoDialog('closeDoorSuccess'))
        .catch(showInfoDialog('boardComputerError'));
    }

    if (action === 'openDoorAfterDamageReport') {
      return openDoor()
        .then(showInfoDialog('openDoorSuccess', function ($scope) {
          $scope.damageStateReported = true;

          $scope.messDescription = '';
          $scope.thanks = false;
          $scope.mess = false;
          $scope.noMess = function () {
            //$mdDialog.hide();
            reportMess(false);
            $scope.thanks = true;
          };
          $scope.isMess = function () {
            $scope.mess = true;
            // $scope.$apply(); // apparently already run
          };
          $scope.reportMessDescription = function () {
            reportMess(true, $scope.messDescription);
            //$mdDialog.hide();
            $scope.thanks = true;
          };
        }))
        .catch(showInfoDialog('boardComputerError'));
    }

    if (action === 'openDoor') {
      if (!booking || booking.trip.begin) {
        // If there is no related booking, or the trip has indeed already begun,
        //  just open the door and be done with it.
        return openDoor()
          .then(showInfoDialog('openDoorSuccess'))
          .catch(showInfoDialog('boardComputerError'));
      }

      // There is a booking, and the related trip has not yet begun,
      //  so show a dialog informing after possible new damage.
      return infoDialog('openDoorDamagePrompt', $event, function ($scope) {
        $scope.schade = false;
        $scope.damageDescription = '';
        $scope.hide = function () {
          $mdDialog.hide();
        };
        $scope.geenSchade = function () {
          $mdDialog.hide();
          reportDamage(false);
          boardComputerControl('openDoorAfterDamageReport');
        };
        $scope.welSchade = function () {
          $scope.schade = true;
          // $scope.$apply(); // apparently already run
        };
        $scope.reportDamageDescription = function () {
          reportDamage(true, $scope.damageDescription);
          $mdDialog.hide();
          boardComputerControl('openDoorAfterDamageReport');
        };
      });
    }
  }

  // actual api call, no UI logic
  function closeDoor () {
    return $q(function (resolve, reject) {
      alertService.load();
      boardcomputerService.control({
        action: 'CloseDoorStartDisable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          reject(result);
        } else {
          resolve();
        }
      }, function (error) {
        reject(error.message);
      })
      .finally( function() {
        alertService.loaded();
      });
    });
  }

  // actual api call, no UI logic
  function openDoor () {
    return $q(function (resolve, reject) {
      alertService.load();
      boardcomputerService.control({
        action: 'OpenDoorStartEnable',
        resource: resource.id,
        booking: booking ? booking.id : undefined
      })
      .then(function (result) {
        if (result === 'error') {
          reject(result);
        } else {
          resolve();
        }
      }, function (error) {
        reject(error.message);
      })
      .finally( function() {
        alertService.loaded();
      });
    });
  }

  // These API calls are not tracked: failure
  //  does not impact UX, and hence should not
  //  form any obstruction
  function reportDamage (has_damage, description) {
    setTimeout(function () {
      damageService.addUserDamage({
        booking: booking.id,
        answer:      has_damage ? 'yes'       : 'no',
        description: has_damage ? description : undefined,
      });
    }, 10);
  }
  function reportMess (has_mess, description) {
    setTimeout(function () {
      damageService.dirty({
        booking: booking.id,
        answer:      has_mess ? 'yes'       : 'no',
        description: has_mess ? description : undefined,
      });
    }, 10);
  }

  //get currenct location of the resource if locktypes contains smartphone and booking begins within 60 minutes
  var longitude = null;
  var latitude = null;
  var zoom = 14;

  $scope.setMarkersForMap = function() {
    angular.extend($scope, {
      map: {
        center: {
          latitude: latitude,
          longitude: longitude
        },
        draggable: true,
        markers: [{
          idKey: 1,
          icon: ($scope.resource.locktypes.indexOf('chipcard') >= 0 || $scope.resource.locktypes.indexOf('smartphone') >= 0) ? 'assets/img/mywheels-open-marker-v2-80.png' : 'assets/img/mywheels-key-marker-v2-80.png',
          latitude: latitude,
          longitude: longitude,
          title: $scope.resource.alias
        }], // an array of markers,
        zoom: zoom,
        options: {
          scrollwheel: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false
        }
      }
    });
  };

  if (booking.resource.locktypes.indexOf('smartphone') >= 0 && !$scope.bookingEndedReally && $scope.accepted && booking.ok && $scope.bookingStartsWithinOneHour) {
    boardcomputerService.currentLocation({
      resource: $scope.resource.id
    })
    .then(function(location) {
      latitude = location.lat;
      longitude = location.lng;
      zoom = 16;
      $scope.setMarkersForMap();
    })
    .catch(function (error) {
      $scope.locationError = error.message;
      latitude = $scope.resource.latitude;
      longitude = $scope.resource.longitude;
      $scope.setMarkersForMap();
    });
  } else {
    latitude = $scope.resource.latitude;
    longitude = $scope.resource.longitude;
    $scope.setMarkersForMap();
  }

  // check is resource has fuelcard
  if ([282, 519038].indexOf(booking.resource.owner.id) >= 0 && booking.resource.boardcomputer) {
    $scope.fuelCard = true;
  } else {
    $scope.fuelCard = false;
  }

  // get chipcard fish if boardcomputer is convadis
  $scope.fish = false;

  $scope.getFish = function() {
    chipcardService.getFish({
      person: me.id
    }).then(function (fish) {
      if (fish !== null || fish !== undefined) {
        $scope.fish = fish;
      }
    });
  };

  if (booking.resource.locktypes.indexOf('smartphone') < 0 && booking.resource.locktypes.indexOf('chipcard') >= 0) {
    $scope.getFish();
  }

  /*
  * Booking alterations
  */
  $scope.editBooking = function(booking) {
    if( !$scope.showBookingForm ) {
      $scope.showBookingForm = true;
      return;
    }
    alertService.load();
    bookingService.alterRequest({
      booking: booking.id,
      timeFrame: {
        startDate: booking.beginRequested,
        endDate: booking.endRequested
      },
      remark: booking.remarkRequester
    })
    .then(function (booking) {
      Analytics.trackEvent('altered', 'success', booking.id, undefined, true);
      $scope.booking = booking;
      initPermissions();
      if (booking.beginRequested) {
        alertService.add('info', $filter('translate')('BOOKING_ALTER_REQUESTED'), 5000);
      } else {
        alertService.add('success', $filter('translate')('BOOKING_ALTER_ACCEPTED'), 5000);
      }
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.cancelBooking = function (booking) {
    var promise = function() {
      return dialogService.showModal({templateUrl: 'booking/show/dialog-cancel.tpl.html'}, {
        closeButtonText: $translate.instant('CLOSE'),
        actionButtonText: $translate.instant('CONFIRM'),
        headerText: $translate.instant('CANCEL_BOOKING'),
        bodyText: $translate.instant('BOOKING.CANCEL.CONFIRM_TEXT'),
        contract: contract,
        booking: booking
      });
    };
    if($scope.requested){
      promise = function() { return $q.when(true); };
    }

    promise()
    .then(function () {
      alertService.load();
      return bookingService.cancel({
        id: booking.id
      });
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', $scope.userPerspective === 'owner' ? 'cancelled_owner' : 'cancelled_renter', booking.id, undefined, true);
      $scope.booking = booking;
      alertService.add('success', $filter('translate')('BOOKING_CANCELED'), 5000);
      $state.go('owm.person.dashboard');
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.stopBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('STOP_BOOKING'),
      bodyText: $translate.instant('BOOKING.STOP.CONFIRM_TEXT')
    })
    .then(function () {
      alertService.load();
      return bookingService.stop({
        booking: booking.id
      });
    })
    .then(function (booking) {
      $scope.booking = booking;
      initPermissions();
      $scope.initBookingRequestScope(booking);
      alertService.add('success', $filter('translate')('BOOKING_STOPPED'), 10000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.extendBooking = function(booking, hours) {
    booking.endRequested = moment(booking.endRequested).add('hours', hours).format(API_DATE_FORMAT);
  };

  $scope.acceptBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('BOOKING.ACCEPT.TITLE'),
      bodyText: $translate.instant('BOOKING.ACCEPT.INTRO')
    })
    .then(function () {
      var params = {
        booking: booking.id
      };

      if ($scope.userInput.acceptRejectRemark) {
        params.remark = $scope.userInput.acceptRejectRemark;
      }
      alertService.load();
      return bookingService.acceptRequest(params);
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', 'accepted', booking.id, 4, undefined, true);
      $scope.booking = booking;
      $state.reload();
      initPermissions();
      alertService.add('success', $filter('translate')('BOOKING.ACCEPT.SUCCESS'), 5000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.rejectBooking = function (booking) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('BOOKING.REJECT.TITLE'),
      bodyText: $translate.instant('BOOKING.REJECT.INTRO')
    })
    .then(function () {
      var params = {
        booking: booking.id
      };
      if ($scope.userInput.acceptRejectRemark) {
        params.remark = $scope.userInput.acceptRejectRemark;
      }
      alertService.load();
      return bookingService.rejectRequest(params);
    })
    .then(function (booking) {
      Analytics.trackEvent('booking', 'rejected', booking.id, undefined, true);
      $scope.booking = booking;
      initPermissions();
      alertService.add('success', $filter('translate')('BOOKING.REJECT.SUCCESS'), 5000);
    })
    .catch(errorHandler)
    .finally(function () {
      alertService.loaded();
    });
  };


  /*
  * Load extra drivers
  */
  $scope.extraDrivers = {
    loading: false,
    inviteRequests: [],
    basis: ($scope.contract.type.id === 60) ? 'per_booking' : 'per_contract',
    load: function () {
      if ($scope.userPerspective !== 'owner') { // to avoid permission problem for now

        $scope.extraDrivers.loading = true;

        var promise = ($scope.extraDrivers.basis === 'per_booking')  ?
          extraDriverService.driversForBooking({ booking: $scope.booking.id }) :
          extraDriverService.getRequestsForContract({ contract: $scope.contract.id });

        promise
        .then(function (inviteRequests) {
          if (inviteRequests.result && _.isArray(inviteRequests.result)) {
            inviteRequests = inviteRequests.result;
          }
          if ($scope.userPerspective === 'owner') {
            inviteRequests = inviteRequests.filter(function (request) {
              return request.status === 'accepted';
            });
          }
          $scope.extraDrivers.inviteRequests = inviteRequests;
        })
        .catch(function (e) {
          alertService.addError(e);
        })
        .finally(function () {
          $scope.extraDrivers.loading = false;
        });
      }
    },
  };


  /*
  * Load availability
  */
  $scope.availability = null;
  $scope.isAvailabilityLoading = false;
  var timer;

  $scope.$watch('[bookingRequest.beginRequested, bookingRequest.endRequested]', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      onTimeFrameChange();
    }
  }, true);

  function onTimeFrameChange() {
    $scope.extraCredit = false;
    $timeout.cancel(timer);
    timer = $timeout(function () {
      loadAvailability();
    }, 100);
  }

  function loadAvailability() {
    var dfd = $q.defer();
    var b = $scope.bookingRequest;
    var r = $scope.resource;
    $scope.availability = null;

    if (b.beginRequested && b.endRequested && $scope.userPerspective==='renter') {
      $scope.isAvailabilityLoading = true;
      resourceService.checkAvailability({
        resource: r.id,
        booking: b.id,
        timeFrame: {
          startDate: b.beginRequested,
          endDate: b.endRequested
        }
      })
      .then(function (isAvailable) {
        $scope.availability = { available: isAvailable ? 'yes' : 'no' };
        dfd.resolve($scope.availability);
      })
      .catch(function () {
        $scope.availability = { available: 'unknown' };
        dfd.resolve($scope.availability);
      })
      .finally(function () {
        $scope.isAvailabilityLoading = false;
      });
    }
    return dfd.promise;
  }

  /*
  * load alternatives for requested bookings
  */
  function loadAlternatives() {
    var URL_DATE_TIME_FORMAT = 'YYMMDDHHmm';
    $scope.startDate = moment($scope.booking.beginRequested).format(URL_DATE_TIME_FORMAT);
    $scope.endDate = moment($scope.booking.endRequested).format(URL_DATE_TIME_FORMAT);

    var params = {};

    params.timeframe = {
      startDate: $scope.booking.beginRequested,
      endDate: $scope.booking.endRequested
    };

    params.location = {
      latitude: $scope.booking.person.latitude,
      longitude: $scope.booking.person.longitude
    };

    params.filters = {
      minSeats: $scope.booking.resource.numberOfSeats,
      resourceType: $scope.booking.resource.resourceType
    };

    params.radius = 5000;
    params.maxresults = 4;
    params.person = $scope.booking.person.id;
    params.sort = 'relevance';

    resourceService.searchV3(params)
    .then(function (alternatives) {
      // remove current resource
      $scope.resourceAlternatives = alternatives.results;
      for (var i=0; i<$scope.resourceAlternatives.length; i++) {
        if ($scope.resourceAlternatives[i].id === booking.resource.id) {
          $scope.resourceAlternatives.splice(i, 1);
        }
      }
    });
  }

  $scope.selectResourceAlternative = function (resource) {
    $state.go('owm.resource.show', {
      resourceId: resource.id,
      city: (resource.city || '').toLowerCase().replace(/ /g, '-'),
      start: $scope.startDate,
      end: $scope.endDate
    });
  };

  /*
  * Chat
  */
  $scope.openChatWith = openChatWith;
  function openChatWith(otherPerson) {
    var otherPersonName = $filter('fullname')(otherPerson);
    chatPopupService.openPopup(otherPersonName, otherPerson.id, booking.resource.id, booking.id);
  }

  /*
  * Discount
  */
  loadDiscount();

  $scope.discount = [];

  function loadDiscount() {
    discountUsageService.search({
      booking: $scope.booking.id
    })
    .then(function (discount) {
      $scope.discount = discount;
    });
  }

  function addDiscount(value) {
    return discountService.apply({
      booking: booking.id,
      discount: value
    }).then(function (discount) {
      $scope.discount.push(discount);
      $rootScope.discountAdded = true;
      alertService.addSaveSuccess('De kortingscode is toegevoegd aan je boeking.');
      if ($scope.paymentInit) {
        $scope.bookingChanged(booking);
      }
      $mdDialog.cancel();
    }).catch(function (err) {
      alertService.addError(err);
    });
  }

  $scope.openDiscountDialog = function () {
    $mdDialog.show({
      fullscreen: $mdMedia('lg'),
      preserveScope: true,
      locals: {
      },
      scope: $scope,
      templateUrl: 'discount/discountBookingDialog.tpl.html',
      controller: ['$scope', '$mdDialog', '$mdMedia', function ($scope, $mdDialog, discountService, contractService) {

        $scope.checkingDiscountCode = false;
        $scope.hide = function () {
          $mdDialog.hide();
        };

        $scope.save = function () {
          addDiscount($scope.discountCode);
        };

        $scope.cancel = function () {
          $mdDialog.cancel();
        };
      }]
    });
  };

  /*
  * Load declarations
  */
  if($scope.allowDeclarations) {
    loadDeclarations();
  }

  function loadDeclarations() {
    declarationService.forBooking({
      booking: booking.id
    })
    .then(function(res) {
      $scope.booking.declarations = res;
    })
    .catch(function(err) {
      alertService.add('danger', 'Tankbonnen konden niet opgehaald worden.', 4000);
    });
  }

  /*
  * Invoices
  */
  function injectInvoiceLines(res) {
    var invoiceLinesSent, invoiceLinesReceived = [];
    if(res.sent) {
      invoiceLinesSent = _.map(_.flatten(_.pluck(res.sent, 'invoiceLines')), function(i) {i.type='sent'; return i; });
    }
    if(res.received) {
      invoiceLinesReceived = _.map(_.flatten(_.pluck(res.received, 'invoiceLines')), function(i) {i.type='received'; return i; });
    }
    var invoiceLines = _.sortBy(_.union(invoiceLinesSent, invoiceLinesReceived), 'position');
    $scope.invoiceLines = invoiceLines;
    return invoiceLines;
  }

  $scope.receivedInvoices = null;
  $scope.receivedInvoicesTotalAmount = 0;

  $scope.sentInvoices = null;
  $scope.sentInvoicesTotalAmount = 0;

  if (($scope.userPerspective === 'renter' || $scope.userPerspective === 'contract_holder') && !$scope.requested && $scope.booking.approved === 'OK') {
    $q.all({received: loadReceivedInvoices()})
    .then(injectInvoiceLines);
  }

  if ($scope.userPerspective === 'owner' && !$scope.requested && $scope.booking.approved === 'OK') {
    $q.all({received: loadReceivedInvoices(), sent: loadSentInvoices()})
    .then(injectInvoiceLines);
  }

  function loadReceivedInvoices() {
    var booking = $scope.booking;
    return invoice2Service.getReceived({ person: me.id, booking: booking.id }).then(function (invoices) {

      $scope.receivedInvoices = invoices || [];

      var sum = 0;
      var hasError = false;
      angular.forEach(invoices, function (invoice) {
        var invoiceTotal;
        try {
          invoiceTotal = parseFloat(invoice.total);
          sum += invoiceTotal;
        } catch (e) {
          hasError = true;
        }
      });
      $scope.receivedInvoicesTotalAmount = hasError ? null : sum;
      return invoices;
    });
  }

  function loadSentInvoices() {
    var booking = $scope.booking;
    return invoice2Service.getSent({ person: me.id, booking: booking.id }).then(function (invoices) {

      $scope.sentInvoices = invoices || [];

      var sum = 0;
      var hasError = false;
      angular.forEach(invoices, function (invoice) {
        var invoiceTotal;
        try {
          invoiceTotal = parseFloat(invoice.total);
          sum += invoiceTotal;
        } catch (e) {
          hasError = true;
        }
      });
      $scope.sentInvoicesTotalAmount = hasError ? null : sum;
      return invoices;
    });
  }

  /*
  * Payment
  */
  $scope.buyVoucher = function (value) {
    Analytics.trackEvent('payment', 'started', undefined, undefined, true);
    if (!value || value < 0) {
      return;
    }
    alertService.load($scope);
    $location.url($location.path());
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
        if ($scope.extraCredit) {
          redirectExtraCredit(data.url);
        } else {
          redirect(data.url);
        }
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded($scope);
      });
  };

  function redirectExtraCredit(url) {
    var redirectTo = appConfig.appUrl + $state.href('owm.booking.show', { bookingId: $scope.booking.id }) + '?start=' + moment($scope.bookingRequest.beginRequested).format('YYMMDDHHmm') + '&end=' + moment($scope.bookingRequest.endRequested).format('YYMMDDHHmm');
    $window.location.href = url + '?redirectTo=' + encodeURIComponent(redirectTo);
  }

  function redirect(url) {
    var redirectTo = appConfig.appUrl + $state.href('owm.finance.payment-result');
    $window.location.href = url + '?redirectTo=' + encodeURIComponent(redirectTo);
  }

  updateBookingTimesAfterPayment();

  //change booking times if user has bought voucher via Pay
  function updateBookingTimesAfterPayment() {
    $scope.paymentError = false;
    $scope.alteredAfterBuyVoucher = false;

    if ($stateParams.orderStatusId <= 0) {
      $scope.paymentError = true;
    }

    if ($stateParams.end && $stateParams.orderStatusId > 0) {
      bookingService.alterRequest({
        booking: booking.id,
        timeFrame: {
          startDate: moment($stateParams.start, 'YYMMDDHHmm').format(API_DATE_FORMAT),
          endDate: moment($stateParams.end, 'YYMMDDHHmm').format(API_DATE_FORMAT)
        }
      })
      .then(function (booking) {
        Analytics.trackEvent('altered', 'success', booking.id, undefined, true);
        $scope.booking = booking;
        $scope.initBookingRequestScope(booking);
        initPermissions();
        $scope.alteredAfterBuyVoucher = true;
        if (booking.beginRequested) {
          alertService.add('info', $filter('translate')('BOOKING_ALTER_REQUESTED'), 5000);
        } else {
          alertService.add('success', $filter('translate')('BOOKING_ALTER_ACCEPTED'), 5000);
        }
      })
      .catch(function (error) {
        alertService.add('danger', error.message, 5000);
      })
      .finally(function () {
        alertService.loaded();
      });
    }
  }

  // open payment block to add extra driver
  $scope.addExtraDriver = false;

  $scope.addExtraDriverButton = function () {
    $scope.addExtraDriver = true;
    $scope.initPayment();
    reload().then(function () {
      $('html, body').stop().animate({ scrollTop: $('#bookingPayment').offset().top }, 300, 'swing');
    });
  };

  $rootScope.$watch('extraDriverAdded', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      reload();
      $rootScope.extraDriverAdded = false;
    }
  }, true);

  // check if renter needs to pay the booking
  $scope.initPayment = function() {
    if((
        ($scope.requested && booking.person.numberOfBookings === 0) ||
        booking.approved === 'BUY_VOUCHER' ||
        $scope.addExtraDriver) &&
        ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0 &&
        me.id === $scope.contract.contractor.id
      ) {
      $scope.paymentInit = true;
    } else {
      $scope.paymentInit = false;
    }
  };
  $scope.initPayment();

  // check if person is renter and needs to pay the booking
  if($scope.paymentInit && ($scope.userPerspective === 'renter' || $scope.userPerspective === 'contract_holder')) {

    // check if person has already approved bank accounts
    $scope.accountApproved = false;

    account2Service.forMe()
    .then(function (value) {
      $scope.accounts = value;
      for(var i = 0; i < value.length; i++){
        if (value[i].approved === true) {
          $scope.accountApproved = true;
        }
        if (value[i].approved === false) {
          $scope.name = value[i].lastName;
          $scope.person = value[i].person;
          $scope.accountDisapproved = true;
        }
      }
    });

    $scope.vouchers = null;
    $scope.requiredValue = null;
    $scope.credit = null;
    $scope.debt = null;

    reload();

  }

  $scope.bookingChanged = function() {
    $log.log('bookingChanged');
    reload();
  };

  $scope.bookingDriversChanged = function() {
    $log.log('bookingDriversChanged');
    reloadRequiredValue();
  };

  function reloadRequiredValue() {
    alertService.load();

    $q.all([ getRequiredValue() ]).finally(function () {
      alertService.loaded();
    });
  }

  function reload() {
    $rootScope.isPaymentLoading = true;
    alertService.load();

    return $q.all([ getVouchers(), getRequiredValue(), getCredit(), getDebt() ]).finally(function () {
      alertService.loaded();
      $rootScope.isPaymentLoading = false;
    });
  }

  function getVouchers() {
    var promise = voucherService.search({ person: me.id, minValue: 0 });
    promise.then(function (vouchers) {
      $scope.vouchers = vouchers;
    })
      .catch(function (err) {
        $scope.vouchers = [];
      });
    return promise;
  }

  function getRequiredValue() {
    var promise = voucherService.calculateRequiredCredit({ person: me.id });
    promise.then(function (value) {
      $scope.requiredValue = { value: value };
    })
      .catch(function (err) {
        $scope.requiredValue = { error: err };
      });
    return promise;
  }

  function getCredit() {
    var promise = voucherService.calculateCredit({ person: me.id });
    promise.then(function (credit) {
      $scope.credit = { value: credit };
    })
      .catch(function (err) {
        $scope.credit = { error: err };
      });
    return promise;
  }

  function getDebt() {
    var promise = voucherService.calculateDebt({ person: me.id });
    promise.then(function (debt) {
      $scope.debt = { value: debt };
    })
      .catch(function (err) {
        $scope.debt = { error: err };
      });
    return promise;
  }

  /*
  * Error handling
  */
  function errorHandler(err) {
    if (err && err.level && err.message) {
      $scope.extraCredit = false;
      if(err.message.match('onvoldoende')) {
        $scope.extraCredit = err.data.extra_credit;
        $scope.errorExtraCredit = err.message + '. Betaal hieronder ' + err.data.extra_credit + ' euro extra rijtegoed om de rit te kunnen verlengen.';
      } else {
        alertService.add(err.level, err.message, 5000);
      }
    } else {
      //alertService.addGenericError();
    }
    if(!err.message.match('onvoldoende')) {
      $scope.initBookingRequestScope($scope.booking);
    }
  }

  /*
  * Other
  */
  $scope.goToPrevious = function() {
    $state.go($rootScope.previousState, $rootScope.previousStateParams, {reload: true, inherit: false, notify: true});
  };

});