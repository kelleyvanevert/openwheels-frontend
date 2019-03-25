'use strict';

angular.module('inlineConfirmDirective', [])

.directive('inlineConfirm', function () {
  return {
    restrict: 'E',
    scope: {
      initialText: '@',
      confirmText: '@',
      onConfirm: '&',
    },
    template: '<span class="inline-confirm">' +
        '<a class="ic--initiate" ng-click="initiate()" ng-if="state.initial">{{ initialText }}</a>' +
        '<span class="ic--query" ng-if="state.confirm">' +
          '<span>{{ confirmText }}</span>' +
          ' <a class="ic--confirm" ng-click="confirm()">JA</a>' +
          ' | <a class="ic--cancel" ng-click="reset()">NEE</a>' +
        '</span>' +
      '</span>',
    controller: function ($scope) {

      $scope.initiate = function () {
        $scope.state = {
          initial: false,
          confirm: true,
        };
      };

      $scope.confirm = function () {
        $scope.onConfirm();
      };

      $scope.reset = function () {
        $scope.state = {
          initial: true,
          confirm: false,
        };
      };

      $scope.reset();
    }
  };
});
