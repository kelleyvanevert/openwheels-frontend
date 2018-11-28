'use strict';

angular.module('owm.shell')

.controller('MenuController', function ($window, $log, $rootScope, $scope, $state, $translate, authService, featuresService, contractService, $localStorage) {

  $rootScope.$watch(function isAuthenticated () {
    return authService.user.isAuthenticated;
  }); // end $watch

  if($localStorage.invitedBySlug) {
    $scope.invitedBySlug = $localStorage.invitedBySlug;
  }

  $scope.navigate = function (toState, toParams) {
    $scope.closeMenu();
    $state.go(toState, toParams);
  };

  $scope.goToMyWheelsOpen = function() {
    window.open('/open','_blank');
  };

  $scope.translateAndNavigate = function (translateKey) {
    var translated = $translate.instant(translateKey);
    $scope.closeMenu();
    $window.location.href = translated;
  };

});
