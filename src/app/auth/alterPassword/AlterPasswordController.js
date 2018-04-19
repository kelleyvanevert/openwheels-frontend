'use strict';

angular.module('owm.auth.alterPassword', [])

.controller('AlterPasswordController', function ($translate, $state, $scope, alertService, personService, me, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/change-password'});
  metaInfoService.set({canonical: 'https://mywheels.nl/change-password'});

  $scope.busy = false;
  $scope.oldPassword = '';
  $scope.newPassword = '';
  $scope.newPasswordRepeat = '';
  $scope.submit = savePassword;

  function savePassword() {
    var params = {
      person: me.id,
      newProps: {
        oldPassword: $scope.oldPassword,
        password: $scope.newPassword
      }
    };

    alertService.load();
    $scope.busy = true;
    personService.alter(params).then(function () {
        alertService.add('success', $translate.instant('AUTH_CHANGE_PWD_SUCCESS'), 8000);
        $state.go('owm.person.dashboard');
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
        $scope.busy = false;
      });
  }

});
