'use strict';

angular.module('owm.trips.index', [])

.controller('TripsIndexController', function ($log, $timeout, $q, API_DATE_FORMAT, alertService, bookingService, me, $scope, linksService) {

  $scope.me = me;
  $scope.showLoaderSpinner = false;
  $scope.showCancelled = false;
  $scope.renew = false;
  $scope.now = moment().format('YYYY-MM-DD HH:mm');

  $scope.dateConfig = {
    modelFormat: API_DATE_FORMAT,
    formatSubmit: 'yyyy-mm-dd',
    viewFormat: 'DD-MM-YYYY',
    format: 'dd-mm-yyyy',
    selectMonths: true
  };

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

  // Default first and last day of current month
  $scope.currentTimeFrame = {
    fromDate: moment().startOf('month').format('YYYY-MM-DD HH:mm'),
    untilDate: moment().endOf('month').format('YYYY-MM-DD HH:mm')
  };

  // Load all bookings for this person in the role of either a renter or an owner with pagination
  $scope.loadBookings = function (role) {
    $scope.lastCallRenter = false;
    $scope.lastCallOwner = false;
    $scope.showLoaderSpinner = true;

    // Define the parameters for getting the bookings
    var parameters = {
      person: me.id,
      timeFrame: {
        startDate: moment($scope.startDate).format(API_DATE_FORMAT),
        endDate: moment($scope.endDate).format(API_DATE_FORMAT)
      },
      offset: $scope.offset[role],
      limit: $scope.perCall[role]
    };

    // Define which API call to use for which role
    var bookingsPromise = {};

    if(role === 'asRenter') {

      if ($scope.showCancelled) {
        parameters.cancelled = true;
      } else {
        parameters.cancelled = false;
      }

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
    $scope.startDate = moment($scope.currentTimeFrame.fromDate).format('YYYY-MM-DD HH:mm');
    $scope.endDate = moment($scope.currentTimeFrame.untilDate).format('YYYY-MM-DD HH:mm');

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