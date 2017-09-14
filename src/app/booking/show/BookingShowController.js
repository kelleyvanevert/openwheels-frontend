'use strict';

angular.module('owm.booking.show', [])

.controller('BookingShowController', function (
  $q, $timeout, $log, $scope, $location, $filter, $translate, $state, $stateParams, appConfig, API_DATE_FORMAT,
  bookingService, resourceService, invoice2Service, alertService, dialogService,
  authService, boardcomputerService, discountUsageService, chatPopupService, linksService,
  booking, me, declarationService, $mdDialog, contract, Analytics, paymentService, voucherService, $window, $mdMedia, discountService) {

  $scope.appConfig = appConfig;
  $scope.alteredAfterBuyVoucher = false;
  $scope.voucherOptions = [25, 50, 100, 250, 500];
  $scope.showVoucherOptions = false;
  /**
   * HACK
   * see issue MW-1206 "booking.resource.price not implemented"
   */
  if (!booking.resource.price) {
    booking.resource.price = {};
    ['hourRate', 'dayRateTotal', 'fuelPerKilometer', 'kilometerRate', 'kmFree'].forEach(function (prop) {
      booking.resource.price[prop] = booking.resource[prop];
    });
  }

  /**
   * change booking times if user has bought voucher via Pay
   */
  if ($stateParams.end) {
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
      initBookingRequestScope(booking);
      initPermissions();
      $scope.alteredAfterBuyVoucher = true;
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
  }

  function initBookingRequestScope(booking) {
    $scope.bookingRequest = angular.copy(booking);
    $scope.bookingRequest.beginRequested = booking.beginRequested ? booking.beginRequested : booking.beginBooking;
    $scope.bookingRequest.endRequested= booking.endRequested ? booking.endRequested : booking.endBooking;
  }
  initBookingRequestScope(booking);
  $scope.contract = contract;

  $scope.booking = booking;
  $scope.bookingStarted = moment().isAfter(moment(booking.beginBooking));
  $scope.bookingEnded = moment().isAfter(moment(booking.endBooking));
  $scope.bookingEndedRealy = moment().isAfter(moment(booking.endBooking).add('1', 'hour'));
  $scope.resource = booking.resource;
  $scope.isOpen = false;
  $scope.contactRenterOrOwnerisOpen = false;
  $scope.agreementIsOpen = false;
  $scope.paymentIsOpen = booking.approved === 'BUY_VOUCHER' ? true : false;
  $scope.editBookingIsOpen = booking.approved !== 'BUY_VOUCHER' ? true : false;
  
  
  $scope.showBookingForm = !$scope.bookingEndedRealy;
  $scope.showPricePerHour = false;
  $scope.userInput = {
    acceptRejectRemark: ''
  };
  $scope.allowFinalize = (function () {
    if(!booking.trip.updatedBy) { return false; }
    return (booking.trip.odoEnd - booking.trip.odoBegin > 0 && booking.trip.updatedBy.id !== me.id && !booking.trip.finalized);
  } ());

  $scope.paymentInit = (function () {
    if(['requested'].indexOf(booking.status) >= 0 && booking.person.numberOfBookings > 1) {
      return false;
    }

    return true;
  }());
  console.log('debug: booking.status', booking.status);
  console.log('debug: booking.person.numberOfBookings ', booking.person.numberOfBookings );


  if(booking.resource.refuelByRenter) {
    $scope.contract.type.canHaveDeclaration = false;
  }

  $scope.userPerspective = (function () {
    if (booking.person.id === me.id) {
      return 'renter';
    } else {
      return 'owner';
    }
  }());


  initPermissions();
  loadDeclarations();

  function loadDeclarations() {
    if(contract.type.canHaveDeclaration) {
      declarationService.forBooking({booking: booking.id})
      .then(function(res) {
        $scope.booking.declarations = res;
      })
      .catch(function(err) {
        alertService.add('danger', 'Tankbonnen konden niet opgehaald worden.', 4000);
      });
    }
  }

  $scope.editOwnerBookingIsOpen = false;
  $scope.toggleEditOwnerBookingCard = function () {
    var isOpen = $scope.editOwnerBookingIsOpen;
    if(isOpen === true) {
      $scope.editOwnerBookingIsOpen = false;
    } else {
      $scope.editOwnerBookingIsOpen = true;
    }
  };


  if ($scope.allowOvereenkomst) {
    $scope.overeenkomstUrl = linksService.bookingAgreementPdf(booking.id);
  }

  $scope.toggleVoucherOptions = function (toggle) {
    $scope.showVoucherOptions = toggle;
  };

  function initPermissions () {
    var booking = $scope.booking;

    $scope.allowEdit   = false;
    $scope.allowCancel = false;
    $scope.allowStop   = false;
    $scope.allowAcceptReject  = false;
    $scope.allowBoardComputer = false;
    $scope.allowMap    = false;
    $scope.allowOvereenkomst = (booking.approved === null || booking.approved === 'OK') && booking.status === 'accepted';
    $scope.allowDeclarations = contract.type.canHaveDeclaration && ($scope.booking.approved === 'OK' || $scope.booking.approved === null) && $scope.bookingStarted && !$scope.booking.resource.refuelByRenter && !booking.resource.fuelCardCar;
    $scope.allowDeclarationsAdd = $scope.allowDeclarations && moment().isBefore(moment(booking.endBooking).add(5, 'days'));

    if ($scope.userPerspective === 'renter') {

      $scope.allowEdit = (function () {
        if (booking.endBooking) {
          return moment().isBefore(moment(booking.endBooking).add(1, 'hours')); // hooguit een uur geleden afgelopen
        }
        else if (booking.beginRequested) {
          return moment().isBefore(moment(booking.beginRequested)); // moet nog beginnen
        }
        return false;
      }());

      $scope.allowCancel = (function () {
        if (booking.beginBooking) {
          return moment().isBefore(moment(booking.beginBooking)); // moet nog beginnen
        }
        return true;
      }());

      $scope.allowBoardComputer = (function () {
        return (booking.status === 'accepted' &&
          booking.resource.locktypes.indexOf('smartphone') >= 0 &&
          booking.beginBooking && booking.endBooking &&
          moment().isAfter(moment(booking.beginBooking).add(-5, 'minutes')) && // hooguit 5 minuten geleden begonnen
          moment().isBefore(moment(booking.endBooking).add(1, 'hours')) // hooguit een uur geleden afgelopen
        );
      }());

      $scope.allowStop = (function () {
        return ($scope.allowEdit &&
          booking.status === 'accepted' &&
          booking.beginBooking && booking.endBooking &&
          moment().isAfter(moment(booking.beginBooking)) &&
          moment().isBefore(moment(booking.endBooking))
        );
      }());

      $scope.allowMap = $scope.allowEdit;
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

  angular.extend($scope, {
    map: {
      center: {
        latitude: $scope.resource.latitude,
        longitude: $scope.resource.longitude
      },
      draggable: true,
      markers: [{
        idKey: 1,
        latitude: $scope.resource.latitude,
        longitude: $scope.resource.longitude,
        title: $scope.resource.alias
      }], // an array of markers,
      zoom: 14,
      options: {
        scrollwheel: false
      }
    }
  });

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

  $scope.openDoor = function(resource) {
    alertService.load();
    boardcomputerService.control({
      action: 'OpenDoorStartEnable',
      resource: resource.id,
      booking: booking ? booking.id : undefined
    })
    .then( function(result) {
      if(result === 'error') {
        return alertService.add('danger', result, 5000);
      }
      alertService.add('success', 'De auto opent binnen 15 seconden.', 3000);
    }, function(error) {
      alertService.add('danger', error.message, 5000);
    })
    .finally( function() {
      alertService.loaded();
    });
  };

  $scope.closeDoor = function(resource) {
    alertService.load();
    boardcomputerService.control({
      action: 'CloseDoorStartDisable',
      resource: resource.id,
      booking: booking ? booking.id : undefined
    })
    .then( function(result) {
      if(result === 'error') {
        return alertService.add('danger', result, 5000);
      }
      alertService.add('success', 'De auto sluit binnen 15 seconden.', 3000);
    }, function(error) {
      alertService.add('danger', error.message, 5000);
    })
    .finally( function() {
      alertService.loaded();
    });
  };

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
    if(booking.status === 'requested'){
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
      initBookingRequestScope(booking);
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

  function errorHandler (err) {
    if (err && err.level && err.message) {
      $scope.extraCredit = false;
      if(err.message.match('onvoldoende')) {
        $scope.extraCredit = err.data.extra_credit;
        err.message = err.message + '. Je hebt nog <strong>&euro;' + err.data.extra_credit + '</strong> extra rijtegoed nodig voordat je de boeking kan verlengen.';
        alertService.add(err.level, err.message, 5000);
      } else {
        alertService.add(err.level, err.message, 5000);
      }
    } else {
      //alertService.addGenericError();
    }
    if(!err.message.match('onvoldoende')) {
      initBookingRequestScope($scope.booking);
    }
  }

  $scope.buyVoucher = function (value) {
    Analytics.trackEvent('payment', 'started', undefined, undefined, true);
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
        redirect(data.url);
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded($scope);
      });
  };

  function redirect(url) {
    var redirectTo = appConfig.appUrl + $state.href('owm.booking.show', { bookingId: $scope.booking.id }) + '?start=' + moment($scope.bookingRequest.beginRequested).format('YYMMDDHHmm') + '&end=' + moment($scope.bookingRequest.endRequested).format('YYMMDDHHmm');
    $window.location.href = url + '?redirectTo=' + encodeURIComponent(redirectTo);
  }

  // PRICE & AVAILABILITY

  $scope.price = null;
  $scope.isPriceLoading = false;
  loadDiscount();

  $scope.hasDiscount = false;
  $scope.discount = null;

  var unbindWatch = $scope.$watch('showBookingForm', function (val) {
    if (val) {
      $scope.$watch('bookingRequest.beginRequested', onTimeFrameChange);
      $scope.$watch('bookingRequest.endRequested', onTimeFrameChange);
      unbindWatch();
    }
  });

  var timer;
  function onTimeFrameChange () {
    $scope.extraCredit = false;
    $timeout.cancel(timer);
    timer = $timeout(function () {
      loadAvailability().then(function (availability) {
        loadPrice();
      });
    }, 100);
  }

  $scope.availability = null;
  $scope.isAvailabilityLoading = false;
  function loadAvailability () {
    var dfd = $q.defer();
    var b = $scope.bookingRequest;
    var r = $scope.resource;
    $scope.availability = null;
    $scope.price = null;

    if (b.beginRequested && b.endRequested) {
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

  function loadPrice () {
    var r = $scope.resource;
    var b = $scope.bookingRequest;
    var params;
    $scope.price = null;

    if ( $scope.availability &&
         ['yes','unknown'].indexOf($scope.availability.available) >= 0 &&
         (b.beginRequested && b.endRequested) ) {
      $scope.isPriceLoading = true;
      params = {
        resource : r.id,
        timeFrame: {
          startDate: b.beginRequested,
          endDate: b.endRequested
        }
      };
      if (b.contract) {
        params.contract = b.contract.id;
      }
      invoice2Service.calculatePrice(params).then(function (price) {
        $scope.price = price;
      })
      .finally(function () {
        $scope.isPriceLoading = false;
      });
    }
  }

  function loadDiscount () {
    discountUsageService.search({
      booking: $scope.booking.id
    })
    .then(function (discount) {
      $scope.discount = discount;
      if($scope.discount.length > 0){
        $scope.hasDiscount = true;
      }
    });
  }

  $scope.priceHtml = function (price) {
    var s = '';
    if (price.rent > 0) { s += 'Huur: ' + $filter('currency')(price.rent) + '<br/>'; }
    if (price.insurance > 0) { s += 'Verzekering: ' + $filter('currency')(price.insurance) + '<br/>'; }
    if (price.booking_fee > 0) { s += 'Boekingskosten: ' + $filter('currency')(price.booking_fee) + '<br/>'; }
    if (price.redemption > 0) { s+='Verlagen eigen risico: ' + $filter('currency')(price.redemption) + '<br/>'; }
    s += 'Totaal: ' + $filter('currency')(price.total);
    return s;
  };


  // INVOICES
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

  if ($scope.userPerspective === 'renter') {
    $q.all({received: loadReceivedInvoices()})
    .then(injectInvoiceLines);
  }

  if ($scope.userPerspective === 'owner') {
    $q.all({received: loadReceivedInvoices(), sent: loadSentInvoices()})
    .then(injectInvoiceLines);
  }

  $scope.toggleContactCard = function () {
    var isOpen = $scope.contactRenterOrOwnerisOpen;
    if(isOpen === true) {
      $scope.contactRenterOrOwnerisOpen = false;
    } else {
      $scope.contactRenterOrOwnerisOpen = true;
    }
  };

  $scope.toggleAgreementCard = function () {
    var isOpen = $scope.agreementIsOpen;
    if(isOpen === true) {
      $scope.agreementIsOpen = false;
    } else {
      $scope.agreementIsOpen = true;
    }
  };

  //

  $scope.toggleEditBookingCard = function () {
    var isOpen = $scope.editBookingIsOpen;
    if(isOpen === true) {
      $scope.editBookingIsOpen = false;
    } else {
      $scope.editBookingIsOpen = true;
    }
  };


  $scope.togglePaymentCard = function () {
    var isOpen = $scope.paymentIsOpen;
    if(isOpen === true) {
      $scope.paymentIsOpen = false;
    } else {
      $scope.paymentIsOpen = true;
    }
  };

  function loadReceivedInvoices () {
    var booking = $scope.booking;
    return invoice2Service.getReceived({ person: me.id, booking: booking.id }).then(function (invoices) {
      $log.debug('got received invoices', invoices);

      //var invoiceLines = _.sortBy(_.flatten(_.pluck(invoices, 'invoiceLines')), 'position');
      //$log.debug('order received invoice lines', invoiceLines);

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

  function loadSentInvoices () {
    var booking = $scope.booking;
    return invoice2Service.getSent({ person: me.id, booking: booking.id }).then(function (invoices) {
      $log.debug('got sent invoices', invoices);

      //var invoiceLines = _.sortBy(_.flatten(_.pluck(invoices, 'invoiceLines')), 'position');
      //$log.debug('order invoice lines', invoiceLines);

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

  function addDiscount(value) {
    return discountService.apply({ //apply the discount code
      booking: booking.id,
      discount: value
    }).then(function () {
      alertService.addSaveSuccess('De kortingscode is toegevoegd aan je boeking.'); //if there is something wrong show a err
      $scope.hasDiscount = true;
      $mdDialog.cancel();
    }).catch(function (err) {
      alertService.addError(err); //if there is something wrong show a err
    });
  }

  $scope.toggleBookingCard = function () {
    var isOpen = $scope.isOpen;
    if(isOpen === true) {
      $scope.isOpen = false;
    } else {
      $scope.isOpen = true;
    }

  };

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

  //test

  $scope.requiredValue = null;
  $scope.credit = null;
  $scope.debt = null;

  reload();

  function reload () {
    alertService.load();
    $q.all([ getVouchers(), getRequiredValue(), getCredit(), getDebt() ]).finally(function () {
      alertService.loaded();
    });
  }

  function getVouchers () {
    $scope.vouchers = null;
    var promise = voucherService.search({ person: booking.person.id, minValue: 0 });
    promise.then(function (vouchers) {
      $scope.vouchers = vouchers;
    })
      .catch(function (err) {
        $scope.vouchers = [];
      });
    return promise;
  }

  function getRequiredValue () {
    $scope.requiredValue = null;
    var promise = voucherService.calculateRequiredCredit({ person: booking.person.id });
    promise.then(function (value) {
      $scope.requiredValue = { value: value };
    })
      .catch(function (err) {
        $scope.requiredValue = { error: err };
      });
    return promise;
  }

  function getCredit () {
    $scope.credit = null;
    var promise = voucherService.calculateCredit({ person: booking.person.id });
    promise.then(function (credit) {
      $scope.credit = { value: credit };
    })
      .catch(function (err) {
        $scope.credit = { error: err };
      });
    return promise;
  }

  function getDebt () {
    $scope.debt = null;
    var promise = voucherService.calculateDebt({ person: booking.person.id });
    promise.then(function (debt) {
      $scope.debt = { value: debt };
    })
      .catch(function (err) {
        $scope.debt = { error: err };
      });
    return promise;
  }


  $scope.openChatWith = openChatWith;
  function openChatWith(otherPerson) {
    var otherPersonName = $filter('fullname')(otherPerson);
    chatPopupService.openPopup(otherPersonName, otherPerson.id, booking.resource.id, booking.id);
  }

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

})
;
