'use strict';

/*
  Kelley van Evert, 12 nov 2018
*/
angular.module('timeframePickerDirective', [])

.directive('timeframePicker', function timeframePicker () {

  // Configuration, constants, helpers
  // =====

  const dateTimeConfig = {
    showAccept: true,
    focusOnShow: false, // (!) important for mobile
    useCurrent: true,
    toolbarPlacement: 'bottom',
  };

  const dateConfig = Object.assign({}, dateTimeConfig, {
    format: 'DD-MM-YYYY',
    minDate: moment().subtract(1, 'years'),
    maxDate: moment().add(1, 'years'),
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'left',
      vertical: 'bottom',
    },
  });

  const timeConfig =Object.assign({}, dateTimeConfig, {
    format: 'HH:mm',
    stepping: 15, // minute step size
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'right',
      vertical: 'bottom',
    },
  });

  function getStartOfThisQuarter () {
    var mom = moment();
    var quarter = Math.floor((mom.minutes() | 0) / 15); // returns 0, 1, 2 or 3
    var minutes = (quarter * 15) % 60;
    mom.minutes(minutes);
    return mom;
  }

  function isToday (_moment) {
    return _moment.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD');
  }


  // The directive
  // =====

  return {
    restrict: 'E',
    templateUrl: 'directives/timeframePicker/timeframePicker.tpl.html',
    scope: {
      pickup: '=',
      return: '=',
      mobile: '=',
    },
    controller: function timeframePickerController ($scope, $log, API_DATE_FORMAT) {

      // In order to pass to child components

      $scope.dateConfig = dateConfig;
      $scope.timeConfig = timeConfig;

      // Local (private) state

      $scope.pickupDate = null;
      $scope.pickupTime = null;
      $scope.returnDate = null;
      $scope.returnTime = null;

      $scope.timeframeValid = false;

      // Methods

      $scope.setPickupNow = setPickupNow;
      function setPickupNow () {
        $scope.pickupDate = moment().format(dateConfig.format);
        $scope.pickupTime = getStartOfThisQuarter().format(timeConfig.format);
        checkTimeframe();
      }

      $scope.checkTimeframe = checkTimeframe;
      function checkTimeframe (from, explicitAccept) {
        const data = {
          pickupDate: moment($scope.pickupDate, dateConfig.format), // only used for date part (!)
          pickupTime: moment($scope.pickupTime, timeConfig.format), // only used for time part (!)
          returnDate: moment($scope.returnDate, dateConfig.format), // only used for date part (!)
          returnTime: moment($scope.returnTime, timeConfig.format), // only used for time part (!)
        };

        // Step 1: possibly autofill date resp. time parts

        // If today, then the default timepicker behavior of opening with current time is logical.
        // If not today, then this is not logical and we preemptively set it to 9:00.
        if (data.pickupDate.isValid() && !isToday(data.pickupDate) && $scope.timeframeForm.pickupTime.$untouched) {
          // set pickup time
          $scope.pickupTime = '9:00';
          data.pickupTime = moment($scope.pickupTime, timeConfig.format);
        }

        // If today, then the default timepicker behavior of opening with current time is logical.
        // If not today, then this is not logical and we preemptively set it to 9:00.
        if (data.returnDate.isValid() && !isToday(data.returnDate) && $scope.timeframeForm.returnTime.$untouched) {
          // set return time
          $scope.returnTime = '18:00';
          data.returnTime = moment($scope.returnTime, timeConfig.format);
        }

        if (data.pickupTime.isValid() && $scope.timeframeForm.pickupDate.$untouched) {
          data.pickupDate = moment();
          $scope.pickupDate = data.pickupDate.format(dateConfig.format);
        }


        // Step 2: consolidate into datetimes, if possible

        if (data.pickupDate.isValid() && data.pickupTime.isValid()) {
          data.pickup = moment($scope.pickupDate + ' ' + $scope.pickupTime, dateConfig.format + ' '+ timeConfig.format);
        }

        if (data.returnDate.isValid() && data.returnTime.isValid()) {
          data.return = moment($scope.returnDate + ' ' + $scope.returnTime, dateConfig.format + ' '+ timeConfig.format);
        }


        // Step 3: adjust window

/*
        if ((begin && !end) || (begin && end && begin > end)) {
          end = begin.clone().add(6, 'hours');
          $log.log('setting returnDate =', $scope.returnDate = end.format(dateConfig.format));
          $log.log('setting returnTime =', $scope.returnTime = end.format(timeConfig.format));
        }
*/

/*
        $scope.timeframeValid = data.pickup && data.return && (data.return > data.pickup);
        if (!$scope.timeframeValid) {
          //resetToPreTimeframe();
          return;
        }
*/

        // (!)
        $scope.pickup = data.pickup ? data.pickup.format(API_DATE_FORMAT) : null;
        $scope.return = data.return ? data.return.format(API_DATE_FORMAT) : null;
      }
    },
  };

});