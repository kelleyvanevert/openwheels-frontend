'use strict';

angular.module('owm.resource')

.directive('owResourceCardBox', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      resource: '=',
    },
    templateUrl: 'resource/components/resource-card-box.tpl.html'
  };
});
