'use strict';

angular.module('owm.components')

.directive('cancellationInfoCard', function () {
  return {
    restrict: 'E',
    scope: {
      booking: '=',
    },
    templateUrl: 'components/cancellationInfoCard.tpl.html',
  };
});
