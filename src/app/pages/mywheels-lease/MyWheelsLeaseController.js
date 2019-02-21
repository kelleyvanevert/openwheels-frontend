'use strict';

angular.module('owmlanding.mywheels-lease', ['slick'])

.controller('MyWheelsLeaseController', function ($scope, $log, metaInfoService, appConfig, $anchorScroll, formSubmissionService, personService,
  Analytics) {

  metaInfoService.set({url: appConfig.serverUrl + '/lease'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/lease'});

  metaInfoService.set({
    title: 'MyWheels Lease',
    description: 'Lease nu een auto, verhuur hem met MyWheels Open zonder sleuteloverdracht en verdien je maandlasten terug vanuit je luie stoel.',
  });

  $scope.$anchorScroll = $anchorScroll;

  $scope.formEntry = {
    model: '',
  };
  $scope.formSendStatus = false;

  personService.meAnonymous().then(autoFill).catch(function () {});

  function autoFill (user) {
    if ($scope.form.$pristine) {
      $scope.formEntry.email = user.email;
      $scope.formEntry.firstName = user.firstName;
      $scope.formEntry.surname = (user.preposition ? (user.preposition + ' ') : '') + user.surname;
      $scope.formEntry.zipcode = user.zipcode;
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
        type: 'mw_lease',
        email: $scope.formEntry.email,
        firstName: $scope.formEntry.firstName,
        surname: $scope.formEntry.surname,
        zipcode: $scope.formEntry.zipcode,
        phoneNumber: $scope.formEntry.phoneNumber,
        extraInfo: {
          model: $scope.formEntry.model,
        },
      })
      .then(function (r) {
        $scope.formSendStatus = 'success';
        Analytics.trackEvent('forms', 'mywheels_lease_meedoen', undefined, undefined, true);
      })
      .catch(function (e) {
        $scope.formSendStatus = 'error';
        Analytics.trackEvent('exceptions', 'mywheels_lease_meedoen', undefined, undefined, true);
      })
      .finally(function () {
        // hi
      });
    }
  };

});
