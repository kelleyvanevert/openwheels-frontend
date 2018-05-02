'use strict';

angular.module('owm.pages.emailPreference', [])

.controller('EmailPreferenceController', function ($state, $stateParams, $scope, personService, alertService, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/email-uitschrijven'});
  metaInfoService.set({canonical: 'https://mywheels.nl/email-uitschrijven'});

  var personId = $stateParams.person;
  var hash = $stateParams.hash;

  if (!personId || !hash) {
    $state.go('home');
    return;
  }

  $scope.ready = false;
  $scope.error = false;
  $scope.success = false;

  alertService.load();

  personService.emailPreferenceToNone({
    person: personId,
    hash  : hash
  })
  .then(function () {
    $scope.success = true;
  })
  .catch(function (err) {
    $scope.error = true;
  })
  .finally(function () {
    $scope.ready = true;
    alertService.loaded();
  });

})
;
