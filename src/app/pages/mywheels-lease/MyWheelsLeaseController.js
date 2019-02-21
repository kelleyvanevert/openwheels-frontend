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

  // Veelgestelde vragen
  $scope.FAQ = [
    {
      question: 'Kan ik huren zonder borg?',
      answer: 'Je hoeft bij MyWheels geen borg te betalen en geen machtiging voor automatische incasso af te geven. Je betaalt een rit vooraf veilig en snel met iDEAL.',
    }, {
      question: 'Hoe open ik een auto?',
      answer: 'Je kunt bij ons MyWheels Open auto\'s huren die je opent met je smartphone en/of chipkaart. Of een van de vele auto\'s van particuliere autobezitters, die open je gewoon met de sleutel. Je spreekt dan samen met de verhuurder af hoe je in het bezit komt van de sleutel.',
    }, {
      question: 'Hoe open ik een auto met mijn smartphone?',
      answer: 'Om een MyWheels Open auto te openen en sluiten, klik je op MyWheels.nl of in de MyWheels app op de lopende rit. Vervolgens zie je een groene en een rode knop staan met een sleutelicoon. Met de groene knop open je de auto, met de rode knop sluit je hem.',
    }, {
      question: 'Hoe huur ik een auto?',
      answer: 'Zoek een auto in de buurt die je wilt huren, vul de datum en tijd in dat je de auto nodig hebt en klik op \'Maak reservering\' om de auto te reserveren. Als je nog geen account hebt, kun je deze in drie stappen aanmaken.',
    }, {
      question: 'Wat kost huren via MyWheels?',
      answer: 'Een MyWheels account aanmaken is gratis, je betaalt alleen als je een auto huurt. Het tarief van een auto is een combinatie van een huur- en kilometerprijs. De tarieven van een auto vind je op de autopagina.',
    }, {
      question: 'Wanneer wordt mijn account gecontroleerd?',
      answer: 'Om te mogen rijden, heb je een geactiveerd MyWheels account nodig. De meeste accounts activeren we automatisch, je kunt dan direct op weg!',
    }, {
      question: 'Hoe ben ik verzekerd als ik huur?',
      answer: 'De auto die je via MyWheels huurt, is automatisch goed verzekerd tegen schade, vernieling en diefstal. We sluiten namelijk voor elke rit een all-risk verzekering af. Zo loop jij geen risico als je in een deelauto rijdt. De tarieven van een auto zijn altijd inclusief verzekeringskosten.',
    }, {
      question: 'Wat betekent het label MyWheels Open?',
      answer: 'MyWheels Open auto’s open je met je smartphone en/of chipkaart. De auto\'s zijn direct te boeken. Daarnaast hoef je bij een MyWheels Open auto geen kilometerstanden te noteren, de gereden kilometers registreren we automatisch.',
    },
  ];

  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  
});
