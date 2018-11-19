'use strict';

/**
 * Kelley van Evert, 12 nov 2018
 * API:
 *   <timeframe-picker
 *      ng-model        <-- value is an object like so: { pickup: moment, return: moment }
 *   />
 */
angular.module('timeframePickerDirective', [])

.directive('timeframePicker', function timeframePicker ($log, API_DATE_FORMAT, mobileDetectService) {

  // Configuration, constants, helpers
  // =====

  const mobile = (mobileDetectService.phone() || mobileDetectService.mobile() || mobileDetectService.tablet());

  const dateTimeConfig = {
    // showAccept: true,
    focusOnShow: false, // (!) important for mobile
    useCurrent: true,
    toolbarPlacement: 'bottom',
  };

  const dateConfig = Object.assign({}, dateTimeConfig, {
    format: 'DD-MM-YYYY',
    minDate: moment().startOf('day'),
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'left',
      vertical: 'bottom',
    },
    width: '20em',
  });

  const timeConfig = Object.assign({}, dateTimeConfig, {
    format: 'HH:mm',
    stepping: 15, // minute step size
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'right',
      vertical: 'bottom',
    },
    width: '12em',
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
    //require: 'ngModel',
    replace: true,
    controller: function timeframePickerController ($scope, $element, $log, API_DATE_FORMAT) {

      $scope.mobile = mobile; // see above

      const controller = $element.controller('ngModel');

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

      function adjustPickup (tf) {
        if (!tf.return) {
          tf.pickup = moment();
        }
        else if (!tf.return.isValid()) {
          return;
        }
        else {
          tf.pickup = tf.return.subtract('hours', 6);
        }
        
        $scope.pickupDate = tf.pickup.format(dateConfig.format);
        $scope.pickupTime = tf.pickup.format(timeConfig.format);
        
        $scope.form.pickupDate.$setTouched(true); // ??
        $scope.form.pickupTime.$setTouched(true); // ??
      }

      function adjustReturn (tf) {
        if (!tf.pickup.isValid()) {
          return;
        }

        /* #MW-1782: end time should not automagically jump to next day */
        const midnight = tf.pickup.clone().startOf('day').add(1, 'days');
        const sixHoursLater = tf.pickup.clone().add(6, 'hours');
        if (tf.pickup.isBefore(midnight) && sixHoursLater.isAfter(midnight)) {
          tf.return = tf.pickup.clone().add(30, 'minutes');
        } else {
          tf.return = sixHoursLater;
        }

        $scope.returnDate = tf.return.format(dateConfig.format);
        $scope.returnTime = tf.return.format(timeConfig.format);
        
        $scope.form.returnDate.$setTouched(true); // ??
        $scope.form.returnTime.$setTouched(true); // ??
      }

      $scope.setPickupNow = setPickupNow;
      function setPickupNow () {
        $scope.pickupDate = moment().format(dateConfig.format);
        $scope.pickupTime = getStartOfThisQuarter().format(timeConfig.format);
        
        $scope.form.pickupDate.$setTouched(true); // ??
        $scope.form.pickupTime.$setTouched(true); // ??

        checkTimeframe('pickup_now');
      }

      $scope.checkTimeframe = checkTimeframe;
      function checkTimeframe (caller) {
        const tf = {
          pickupDate: moment($scope.pickupDate, dateConfig.format), // only used for date part (!)
          pickupTime: moment($scope.pickupTime, timeConfig.format), // only used for time part (!)
          returnDate: moment($scope.returnDate, dateConfig.format), // only used for date part (!)
          returnTime: moment($scope.returnTime, timeConfig.format), // only used for time part (!)
        };
 
        // Step 1: possibly autofill date resp. time parts

        // If today, then the default timepicker behavior of opening with current time is logical.
        // If not today, then this is not logical and we preemptively set it to 9:00.
        if (tf.pickupDate.isValid() && !isToday(tf.pickupDate) && $scope.form.pickupTime.$untouched) {
          // set pickup time
          $scope.pickupTime = '9:00';
          tf.pickupTime = moment($scope.pickupTime, timeConfig.format);

          $scope.form.pickupTime.$setTouched(true); // ??
        }

        // If today, then the default timepicker behavior of opening with current time is logical.
        // If not today, then this is not logical and we preemptively set it to 9:00.
        if (tf.returnDate.isValid() && !isToday(tf.returnDate) && $scope.form.returnTime.$untouched) {
          // set return time
          $scope.returnTime = '18:00';
          tf.returnTime = moment($scope.returnTime, timeConfig.format);

          $scope.form.returnTime.$setTouched(true); // ??
        }

        if (tf.pickupTime.isValid() && $scope.form.pickupDate.$untouched) {
          tf.pickupDate = moment();
          $scope.pickupDate = tf.pickupDate.format(dateConfig.format);

          $scope.form.pickupDate.$setTouched(true); // ??
        }


        // Step 2: consolidate into datetimes, if possible

        if (tf.pickupDate.isValid() && tf.pickupTime.isValid()) {
          tf.pickup = moment($scope.pickupDate + ' ' + $scope.pickupTime, dateConfig.format + ' '+ timeConfig.format);
        }

        if (tf.returnDate.isValid() && tf.returnTime.isValid()) {
          tf.return = moment($scope.returnDate + ' ' + $scope.returnTime, dateConfig.format + ' '+ timeConfig.format);
        }


        // Step 3: adjust window when necessary
        // (this logic used to reside in `src/common/directives/pickadate/TimeframeDirective.js`)

        const pickupAdjustable = (caller === 'pickup_now' && !$scope.pickupTime && !$scope.pickupDate) || ($scope.form.pickupTime.$untouched && $scope.form.pickupDate.$untouched);
        const returnAdjustable = (caller === 'pickup_now' && !$scope.returnTime && !$scope.returnDate) || ($scope.form.returnTime.$untouched && $scope.form.returnDate.$untouched);
        
        if (pickupAdjustable && returnAdjustable) {
          // just null
        }
        else if (tf.pickup && returnAdjustable) {
          adjustReturn(tf);
        }
        else if (pickupAdjustable && tf.return) {
          adjustPickup(tf);
        }
        else if (caller === 'pickup' && tf.pickup > tf.return) {
          adjustReturn(tf);
        }
        else if (caller === 'return' && tf.pickup > tf.return) {
          adjustPickup(tf);
        }

        delete tf.pickupDate;
        delete tf.pickupTime;
        delete tf.returnDate;
        delete tf.returnTime;
        controller.$setViewValue(tf);
        //controller.$setValidity('begin_before_end', $scope.timeframeValid);
      }
    },
  };

});