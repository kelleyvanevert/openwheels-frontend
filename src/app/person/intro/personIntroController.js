'use strict';

angular.module('owm.person.intro', [])

.controller('PersonIntroController', function ($scope, me, $state) {
  activate();

  function activate() {
    $scope.openboxes = {};
    $scope.me = me;
    loadFeaturedSlider();
  }

  $scope.toggleBox = function (box) {
    if (!$scope.openboxes[box]) {
      $scope.openboxes[box] = true;
    } else {
      $scope.openboxes[box] = !$scope.openboxes[box];
    }
  };

});
