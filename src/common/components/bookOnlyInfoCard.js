'use strict';

angular.module('owm.components')

.directive('bookOnlyInfoCard', function () {
  return {
    restrict: 'E',
    scope: {
    },
    templateUrl: 'components/bookOnlyInfoCard.tpl.html',
  };
});
