'use strict';

angular.module('owm.person.intro', [])

.controller('PersonIntroController', function ($scope, me, $state, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard/intro'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard/intro'});

  activate();

  function activate() {
    $scope.openboxes = {};
    $scope.me = me;
  }

  if(me.status !== 'new') {
    $state.go('owm.person.dashboard');
  }

  $scope.toggleBox = function (box) {
    if (!$scope.openboxes[box]) {
      $scope.openboxes[box] = true;
    } else {
      $scope.openboxes[box] = !$scope.openboxes[box];
    }
  };

});
