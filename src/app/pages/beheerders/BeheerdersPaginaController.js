'use strict';

angular.module('owmlanding.beheerders', ['slick'])

.controller('BeheerdersPaginaController', function ($scope, $log, metaInfoService, appConfig, $anchorScroll, formSubmissionService, personService,
  Analytics) {

  metaInfoService.set({url: appConfig.serverUrl + '/beheerders'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/beheerders'});

  metaInfoService.set({
    title: 'MyWheels Beheerders',
//    description: '',
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
        Analytics.trackEvent('forms', 'word_een_beheerder', undefined, undefined, true);
      })
      .catch(function (e) {
        $scope.formSendStatus = 'error';
        Analytics.trackEvent('exceptions', 'word_een_beheerder', undefined, undefined, true);
      })
      .finally(function () {
        // hi
      });
    }
  };

  // Veelgestelde vragen
  $scope.FAQ = [
    {
      question: 'Wat zijn de taken van een beheerder?',
      answer_html: '<p>Een beheerder let erop dat diens auto in topconditie blijft. Concreet houdt dit in:</p><ul><li>nieuwe leden uitleg geven;</li><li>contact met gebruikers in de buurt onderhouden;</li><li>de reservesleutel beheren en bij nood beschikbaar stellen;</li></ul><p>Jaarlijks onderhoud wordt door de garage gedaan. Als beheerder maak je hier een afspraak voor.</p>',
    }, {
      question: 'Is er een vergoeding voor beheerderschap?',
      answer: 'Ja, al bedankje krijgen MyWheels beheerders maandelijks een vrijwilligersvergoeding in de vorm van 75 vrije kilometers.',
    },
    {
      question: 'Wat als er geen MyWheels Open auto in mijn buurt staat?',
      answer_html: '<p>Staat er nog geen auto met MyWheels Open bij jou in de buurt? Neem dan <a href="https://mywheels.nl/autodelen/community/contact/">contact</a> met ons op om de mogelijkheden te bespreken.</p>',
    },
  ];

  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  
});
