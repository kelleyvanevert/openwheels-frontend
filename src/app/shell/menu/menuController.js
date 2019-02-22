'use strict';

angular.module('owm.shell')

.controller('MenuController', function ($window, $rootScope, $scope, $state, $translate, authService, $localStorage,
  resourceQueryService,
  makeHomeAddressPrefill
) {

  var query = resourceQueryService.data;

  $rootScope.$watch(function isAuthenticated () {
    $scope.homeAddressPrefill = query.text || makeHomeAddressPrefill(authService.user.identity);
    //return authService.user.isAuthenticated;
  }); // end $watch

  if($localStorage.invitedBySlug) {
    $scope.invitedBySlug = $localStorage.invitedBySlug;
  }

  $scope.navigate = function (toState, toParams) {
    $scope.closeMenu();
    $state.go(toState, toParams);
  };

  $scope.translateAndNavigate = function (translateKey) {
    var translated = $translate.instant(translateKey);
    $scope.closeMenu();
    $window.location.href = translated;
  };

  $scope.showGeoSearch = true; // $state.$current.toString(), $state.includes(<String>)

});
