'use strict';

angular.module('owm.auth.forgotPassword', [])

.controller('ForgotPasswordController', function ($state, $translate, personService, alertService, $scope, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/forgot-password'});
  metaInfoService.set({canonical: 'https://mywheels.nl/forgot-password'});

  $scope.email = '';

  $scope.submit = function () {
    $scope.isBusy = true;
    alertService.closeAll();
    alertService.load();

    personService.sendResetPassword({
        email: $scope.email
      })
      .then(function () {
        alertService.add('success', $translate.instant('AUTH.RESET_PASSWORD_SUCCESS'), 5000);
        $state.go('home');
      })
      .catch(function (err) {
        if (err && err.level && err.message) {
          alertService.add(err.level, err.message, 5000);
        } else {
          alertService.addGenericError();
        }
      })
      .finally(function () {
        $scope.isBusy = false;
        alertService.loaded();
      });
  };

});
