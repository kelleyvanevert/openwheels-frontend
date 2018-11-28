'use strict';

angular.module('owm-landing.mywheels-open', ['slick'])

.controller('MyWheelsOpenController', function ($scope, $log, metaInfoService, appConfig, $anchorScroll, formSubmissionService, personService) {

  metaInfoService.set({url: appConfig.serverUrl + '/mywheels-open'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/mywheels-open'});

  metaInfoService.set({
    title: 'MyWheels Open: Verhuur je auto altijd',
    description: 'Laat buren, vrienden en anderen nog makkelijker jouw auto huren. Geen sleuteloverdracht, automatische kilometerregistratie en zorgeloos je auto verhuren waar je ook bent.',
  });

  $scope.$anchorScroll = $anchorScroll;

  $scope.formEntry = {};
  $scope.formSendStatus = false;

  personService.meAnonymous().then(autoFill).catch(function () {});

  function autoFill (user) {
    if ($scope.form.$pristine) {
      $scope.formEntry.email = user.email;
      $scope.formEntry.firstName = user.firstName;
      $scope.formEntry.surname = (user.preposition ? (user.preposition + ' ') : '') + user.surname;
      $scope.formEntry.city = user.city;
      if (user.phoneNumbers && user.phoneNumbers.length > 0) {
        var preferred = user.phoneNumbers[0].number;
        for (var i = 0; i < user.phoneNumbers.length; i++) {
          if (user.phoneNumbers[i].type === 'mobile') {
            preferred = user.phoneNumbers[i].number;
          }
        }
        $scope.formEntry.phoneNumber = preferred;
      }
      //$scope.formEntry.registrationPlate;
    }
  }

  $scope.submit = function () {
    if ($scope.form.$valid) {
      $scope.formSendStatus = 'sending';

      formSubmissionService.send({
        type: 'mw_open',
        email: $scope.formEntry.email,
        firstName: $scope.formEntry.firstName,
        surname: $scope.formEntry.surname,
        city: $scope.formEntry.city,
        phoneNumber: $scope.formEntry.phoneNumber,
        extraInfo: {
          registrationPlate: $scope.formEntry.registrationPlate,
        },
      })
      .then(function (r) {
        $scope.formSendStatus = 'success';
      })
      .catch(function (e) {
        $scope.formSendStatus = 'error';
      })
      .finally(function () {
        // hi
      });
    }
  };

});
