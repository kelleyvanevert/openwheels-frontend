'use strict';

angular.module('owm.auth.resetPassword', [])

.controller('ResetPasswordController', function ($state, $stateParams, $translate, $scope, alertService, personService, code, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/reset-password/'});
  metaInfoService.set({canonical: 'https://mywheels.nl/reset-password/'});

  $scope.isBusy = false;
  $scope.password = '';
  $scope.submit = savePassword;
  $scope.showNotEqual = false;

  $scope.updateShowNotEqual = function() {
    if($scope.showNotEqual) {
      $scope.showNotEqual = $scope.password !== $scope.password_check;
    }
  };

  function savePassword() {
    if($scope.password !== $scope.password_check) {
      $scope.showNotEqual = true;
      return;
    }

    var params = {
      password: $scope.password,
      code: code
    };
    personService.resetPassword(params).then(function () {
        alertService.add('success', $translate.instant('AUTH_CHANGE_PWD_SUCCESS'), 8000);
        $state.go('home');
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
        $scope.isBusy = false;
      });
  }

});
