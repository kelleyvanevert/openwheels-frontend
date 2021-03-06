'use strict';

angular.module('owmlanding.mywheels-business', ['slick'])

.controller('MyWheelsBusinessController', function ($scope, $log, me, metaInfoService, appConfig, $anchorScroll, formSubmissionService, personService,
  Analytics) {

  metaInfoService.set({url: appConfig.serverUrl + '/business'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/business'});

  metaInfoService.set({
    title: 'MyWheels Business',
    description: 'MyWheels Business',
  });

  $scope.me = me;

  $scope.$anchorScroll = $anchorScroll;

  // Veelgestelde vragen
  $scope.FAQ = [
    {
      question: 'Hoe maak ik een zakelijk account aan?',
      answer: 'Vul bovenstaand contactformulier in om een zakelijk contract aan te vragen.',
    }, {
      question: 'Hoeveel bestuurders kan ik kosteloos toevoegen?',
      answer: 'Bij MyWheels Company kun je vijftig bestuurders toevoegen en bij MyWheels Member twee. Bij MyWheels Go betaal je een bedrag per extra bestuurder.',
    }, {
      question: 'Ontvang ik een btw-factuur?',
      answer: 'Je ontvangt automatisch gespecificeerde btw-facturen op naam van jouw bedrijf.',
    }, {
      question: 'Wat betekent het label MyWheels Open?',
      answer: 'MyWheels Open auto’s kan een medewerker direct boeken en openen met zijn of haar smartphone, NS-Business Card of een andere OV-chipkaart.',
    },
  ];

  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  
});
