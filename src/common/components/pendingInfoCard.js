'use strict';

angular.module('owm.components')

.directive('pendingInfoCard', function () {
  return {
    restrict: 'E',
    scope: {
    },
    templateUrl: 'components/pendingInfoCard.tpl.html',
  };
});
