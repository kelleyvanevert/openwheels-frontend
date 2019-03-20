'use strict';

angular.module('owm.components')

.directive('bookingTimeframeIndicator', function () {
  return {
    restrict: 'E',
    scope: {
      frame: '=',
    },
    templateUrl: 'components/bookingTimeframeIndicator.tpl.html',
  };
});
