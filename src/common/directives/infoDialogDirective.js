'use strict';

angular.module('infoDialogDirective', [])

.directive('infoDialog', function ($mdDialog) {

  return {
    restrict: 'A',
    scope: {
      infoDialog: '@',
      params: '=infoDialogParams',
    },
    link: function (s, element, attrs) {
      element.on('click', function () {
        $mdDialog.show({
          templateUrl: 'info-dialogs/dialog-' + s.infoDialog + '.tpl.html',
          parent: angular.element(document.body),
          // targetEvent: $event,
          clickOutsideToClose: true,
          hasBackdrop: true,
          controller: ['$scope', function ($scope) {
            $scope.params = s.params;
            $scope.hide = function () {
              $mdDialog.hide();
            };
          }],
        });
      });
    }
  };
});
