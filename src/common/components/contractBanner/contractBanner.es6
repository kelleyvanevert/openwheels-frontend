'use strict';

angular.module('owm.components')

.directive('contractBanner', function () {
  return {
    restrict: 'E',
    templateUrl: 'components/contractBanner/contractBanner.tpl.html',
  };
});
