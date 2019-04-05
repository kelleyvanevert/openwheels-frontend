'use strict';

angular.module('owmlanding.mywheels-share', ['slick'])

.controller('MyWheelsShareController', function ($scope, $log, me, metaInfoService, appConfig, $anchorScroll) {

  metaInfoService.set({url: appConfig.serverUrl + '/share'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/share'});

  metaInfoService.set({
    title: 'MyWheels Share',
    description: 'MyWheels Share',
  });

  $scope.me = me;

  $scope.$anchorScroll = $anchorScroll;

  // Veelgestelde vragen
  $scope.FAQ = [
    {
      question: 'Hoeveel kilometer mag ik per jaar rijden?',
      answer: 'De leaseprijs is inclusief 15.000 kilometer per jaar. De kilometerbundel is zowel voor je privé kilometers, als voor de kilometers van huurders in jouw leaseauto. Boven dit aantal kilometers per jaar is de meerprijs per kilometer 8 cent.',
    }, {
      question: 'Wat is de looptijd?',
      answer: 'De looptijd is 36 maanden, voor 15 euro per maand extra kun je na één jaar maandelijks het contract opzeggen.',
    }, {
      question: 'Krijg ik MyWheels bestickering op mijn auto?',
      answer: 'Ja, we plakken MyWheels stickers op de auto. De buren zien dan dat ze jouw auto kunnen huren. Wil je geen bestickering? Dan betaal je 40 euro per maand extra.',
    }, {
      question: 'Wat is inbegrepen in de leaseprijs?',
      answer: 'De leaseprijs is inclusief: all-risk verzekering, schade verzekering inzittenden, wegenbelasting, afschrijving, reparatie, onderhoud, banden, ruitreparatie, pechhulp in binnen- en buitenland, vervangend vervoer bij schade en MyWheels Open technologie. Enkel de brandstof, verkeersboetes en de wasstraat vallen buiten de leaseprijs.',
    }, {
      question: 'Hoe verhuur ik mijn leaseauto?',
      answer: 'Verhuren is heel makkelijk: nieuwe huurverzoeken worden automatisch geaccepteerd. Door de MyWheels Open technologie opent een huurder jouw auto met zijn of haar smartphone. Het enige dat jij hoeft te doen, is het bijhouden van de kalender van je auto.',
    }, {
      question: 'Hoe veel dagen moet mijn auto beschikbaar zijn?',
      answer: 'We verwachten dat jouw auto minimaal 10 dagen per beschikbaar is voor autodelen, waarvan 4 dagen in het weekeinde.',
    }, {
      question: 'Waarom is de leaseprijs zo voordelig?',
      answer: 'De leaseprijs is voordeliger dan bij andere aanbieders omdat maandelijks de eerste 50 euro aan verhuuropbrengst naar de leasemaatschappij gaat. Verdien je meer? Dan ontvang jij de extra verhuuropbrengst.',
    }, {
      question: 'Hoe is de auto verzekerd tijdens verhuur?',
      answer: 'De auto is per verhuring aanvullend all-risk verzekerd met de ritverzekering van Centraal Beheer via het MyWheels platform.',
    }, {
      question: 'Hoe worden huurders gecontroleerd?',
      answer: 'Een huurder moet in bezit zijn van een geldig rijbewijs en een geverifieerde bankrekening hebben. Daarnaast doen wij extra controles ter beoordeling van de betrouwbaarheid van de huurder.',
    }, {
      question: 'In welke steden geldt dit aanbod?',
      answer: 'Dit private lease aanbod is geldig voor inwoners van de volgende gebieden: Amersfoort, Amstelveen, Amsterdam, Arnhem, Delft, Den Haag, Deventer, Eindhoven, Groningen, Haarlem, Hilversum, Leiden, Leeuwarden, Nijmegen, Rijswijk, Rotterdam, Utrecht, Wageningen, Zeist en Zwolle.',
    },
  ];

  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  
});
