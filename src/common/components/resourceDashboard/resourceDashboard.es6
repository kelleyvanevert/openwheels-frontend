'use strict';

angular.module('owm.components')

.directive('resourceDashboard', function ($state, API_DATE_FORMAT) {
  return {
    restrict: 'E',
    scope: {
      me: '=',
    },
    templateUrl: 'components/resourceDashboard/resourceDashboard.tpl.html',
    controller: function ($scope, contractService, bookingService) {

      // PUBLIC

      const dateTimeConfig = {
        // showAccept: true,
        focusOnShow: false, // (!) important for mobile
        useCurrent: true,
        toolbarPlacement: 'bottom',
      };

      const dateConfig = $scope.dateConfig = {
        ...dateTimeConfig,
        format: 'DD-MM-YYYY',
        minDate: moment().startOf('day'),
        widgetPositioning: { // with knowledge of the html (!)
          horizontal: 'auto', // 'left',
          vertical: 'bottom',
        },
        width: '20em',
      };

      $scope.scales = {
        day: {
          text: '24 uur',
          interval: [1, "day"],
        },
        two_days: {
          text: '2 dagen',
          interval: [2, "day"],
        },
        week: {
          text: '1 week',
          interval: [1, "week"],
        },
      };

      $scope.loading = true;
      $scope.grouped = [];

      $scope.focus = {
        scale: "day",
        date: moment().format(dateConfig.format),
      };

      $scope.changeDate = function () {
        focusUpdated();
      };

      $scope.move = function (dir) {
        if (dir !== 'add' && dir !== 'subtract') {
          dir = 'add';
        }
        const curr = moment($scope.focus.date, dateConfig.format);
        $scope.focus.date = curr[dir](...$scope.scales[$scope.focus.scale].interval).format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setToday = function () {
        $scope.focus.date = moment().format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setScale = function (key) {
        $scope.focus.scale = key;
        focusUpdated();
      };

      $scope.refresh = function () {
        focusUpdated();
      };


      // PRIVATE

      async function focusUpdated () {
        console.log($scope.focus);
        const interval = $scope.scales[$scope.focus.scale].interval[1];
        const startDate = moment($scope.focus.date, dateConfig.format).startOf(interval);
        const endDate = startDate.clone().add(1, interval);

        $scope.loading = true;

        // TODO caching

        // Temporary API call (We're going to use the new `calender.search` later)
        const bookings = await bookingService.forOwner({
          person: $scope.me.id,
          timeFrame: {
            startDate: startDate.format(API_DATE_FORMAT),
            endDate: endDate.format(API_DATE_FORMAT),
          },
        });
        const grouped = Object.values(
          bookings.reduce((grouped, booking) => {
            if (!grouped[booking.resource.id]) {
              grouped[booking.resource.id] = {
                resource: booking.resource,
                bookings: [],
              };
            }
            grouped[booking.resource.id].bookings.push(booking);
            return grouped;
          }, {})
        );

        $scope.loading = false;
        $scope.grouped = grouped;

        $scope.$digest();
      }

      init();
      async function init () {

        const contracts = await contractService.forDriver({
          person: $scope.me.id
        });

        const isCompany = $scope.isCompany = contracts.reduce((isCompany, contract) => isCompany || contract.type.id === 120, false);

        console.log("contracts", contracts, "is company?", isCompany);

        // setTimeout(() => {
        //   $scope.calendarForm.date.$setTouched(true);
        // }, 1);

        $scope.$digest();

        focusUpdated();

      }

    },
  };
});
