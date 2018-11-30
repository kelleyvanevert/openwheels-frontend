'use strict';

angular.module('owm.trips.index', [])

.controller('TripsIndexController', function ($log, $timeout, $q, API_DATE_FORMAT, alertService, bookingService, me, $scope, linksService,
  metaInfoService, appConfig, $stateParams, $state, mobileDetectService) {

  metaInfoService.set({url: appConfig.serverUrl + '/trips'});
  metaInfoService.set({canonical: 'https://mywheels.nl/trips'});

  $scope.me = me;
  $scope.showLoaderSpinner = false;
  $scope.renew = false;
  $scope.now = moment().format(API_DATE_FORMAT);


  $scope.mobile = (mobileDetectService.phone() || mobileDetectService.mobile() || mobileDetectService.tablet());

  const dateTimeConfig = {
    // showAccept: true,
    focusOnShow: false, // (!) important for mobile
    useCurrent: true,
    toolbarPlacement: 'bottom',
  };

  const dateConfig = $scope.dateConfig = Object.assign({}, dateTimeConfig, {
    format: 'DD-MM-YYYY',
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'left',
      vertical: 'bottom',
    },
    width: '20em',
  });


  var URL_DATE_TIME_FORMAT = 'YYMMDDHHmm';

  // Define the booking variables
  $scope.bookings = {};
  $scope.totalBookings = {};

  // Set pagination defaults
  $scope.perCall = {};
  $scope.offset = {};

  setPaginationDefaults('asRenter');
  setPaginationDefaults('asOwner');

  function setPaginationDefaults (role) {
    $scope.bookings[role] = {};
    $scope.perCall[role] = 10;
    $scope.offset[role] = 0;
  }

  // Default first and last day of current month or use stateParams if set
  $scope.currentTimeFrame = {
    fromDate:  ($stateParams.start ? moment($stateParams.start, URL_DATE_TIME_FORMAT) : moment().startOf('day').add(-1, 'day')).format(dateConfig.format),
    untilDate: ($stateParams.end   ? moment($stateParams.end,   URL_DATE_TIME_FORMAT) : moment().endOf('day').add(1, 'years') ).format(dateConfig.format),
  };
 
  if($stateParams.cancelled === 'true') {
    $scope.showCancelled = true;
  } else {
    $scope.showCancelled = false;
  }

  // Load all bookings for this person in the role of either a renter or an owner with pagination
  $scope.loadBookings = function (role) {
    $scope.lastCallRenter = false;
    $scope.lastCallOwner = false;
    $scope.showLoaderSpinner = true;

    // Define the parameters for getting the bookings
    var parameters = {
      person: me.id,
      timeFrame: {
        startDate: moment($scope.startDate).startOf('day').format(API_DATE_FORMAT),
        endDate: moment($scope.endDate).endOf('day').format(API_DATE_FORMAT)
      },
      offset: $scope.offset[role],
      limit: $scope.perCall[role],
    };

    // Define which API call to use for which role
    var bookingsPromise = {};

    if(role === 'asRenter') {
      parameters.cancelled = $scope.showCancelled;
      bookingsPromise = bookingService.getBookingList(parameters);
    }

    if(role === 'asOwner') {
      bookingsPromise = bookingService.forOwner(parameters);
    }

    // Get the bookings
    bookingsPromise
      .then(function(bookings) {
        var tempCount = 0;

        if(bookings){
          if(bookings[0]){
            tempCount = bookings[0].count;
          }
        }

        if ($scope.offset[role] === 0) {
          $scope.bookings[role] = bookings;
        } else {
          $scope.bookings[role] = $scope.bookings[role].concat(bookings);
        }

        $scope.offset[role] += $scope.perCall[role];
        $scope.totalBookings[role] = tempCount;

        // Are there more bookings to show?
        if($scope.bookings[role].length >= $scope.totalBookings[role]) {
          if(role === 'asRenter') {
            $scope.lastCallRenter = true;
          } else if (role === 'asOwner') {
            $scope.lastCallOwner = true;
          }
        }

        $timeout(function () {
          $scope.showLoaderSpinner = false;
          $scope.renew = false;
        }, 1000);

      });
  };

  // Load all bookings for the selected period
  $scope.loadDate = function (role, renew) {
    $scope.startDate = moment($scope.currentTimeFrame.fromDate, dateConfig.format).format(API_DATE_FORMAT);
    $scope.endDate = moment($scope.currentTimeFrame.untilDate, dateConfig.format).format(API_DATE_FORMAT);

    //Update stateParams for reload
    $state.go('owm.trips', {
      start: moment($scope.startDate).format(URL_DATE_TIME_FORMAT),
      end: moment($scope.endDate).format(URL_DATE_TIME_FORMAT),
      cancelled: $scope.showCancelled
    }, {
      reload: true,
      inherit: false,
      notify: false
    });

    // Reset offset and bookings for specific role
    if (renew) {
      $scope.renew = true;
      if (role === 'asRenter') {
        $scope.totalBookings.asRenter = 0;
        setPaginationDefaults('asRenter');
      } else if (role === 'asOwner') {
        $scope.totalBookings.asOwner = 0;
        setPaginationDefaults('asOwner');
      } else {
        $scope.totalBookings.asRenter = 0;
        $scope.totalBookings.asOwner = 0;
        setPaginationDefaults('asRenter');
        setPaginationDefaults('asOwner');
      }
    }

    // Load bookings
    if (role === 'asRenter') {
      $scope.loadBookings('asRenter');
    } else if (role === 'asOwner') {
      $scope.loadBookings('asOwner');
    } else {
      $scope.loadBookings('asRenter');
      $scope.loadBookings('asOwner');
    }

  };

  $scope.loadDate();

  $scope.createTripDetailsLink = function (booking) {
    return linksService.tripDetailsPdf(booking.id);
  };

});