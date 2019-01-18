'use strict';

angular.module('owm.resource.place', [])

.controller('ResourcePlaceController', function (
  // angular
  $scope, $state, $stateParams, $log,

  // mywheels
  appConfig,
  resourceQueryService,

  // api
  metaInfoService,
  resourceService,

  // resolves
  place, me, metaInfo
) {

  if (!place) {
    return $state.go('owm.resource.search.list');
  }

  metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/' + (place.name || '').toLowerCase().replace(/ /g, '-')});
  metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/' + (place.name || '').toLowerCase().replace(/ /g, '-')});
  
//  place.body = place.body
//    .replace(/<div>(((?!<\/div>).)*)<\/div>/g, function (m, content) { return '<p>' + content + '</p>'; })
//    .replace(/<br>/g, '');



  $scope.place = place;
  $scope.me = me;
  $scope.metaInfo = metaInfo;


  $scope.selectResource = function (resource) {
    var params = resourceQueryService.createStateParams();
    params.resourceId = resource.id;
    params.city = (resource.city || '').toLowerCase().replace(/ /g, '-');
    $state.go('owm.resource.show', params);
  };


  angular.extend($scope, {
    map: {
      center: {
        latitude: $scope.place.latitude,
        longitude: $scope.place.longitude
      },
      draggable: true,
      markers: [], // an array of markers,
      zoom: 14,
      options: {
        scrollwheel: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false
      },
    }
  });
  

  function makeParams (options, filters) {
    var params = {
      location: {
        lat: $scope.place.latitude,
        lng: $scope.place.longitude,
      },
      radius: 5000,
      sort: 'relevance',
      person: me ? me.id : undefined,
      maxresults: 10,
      options: options, /*[
        //'airconditioning',
        //'fietsendrager',
        //'winterbanden',
        //'kinderzitje',
        //'navigatie',
        //'trekhaak',
        //'automaat',
        //'mp3-aansluiting',
        //'rolstoelvriendelijk',
      ],*/
      filters: filters, /*{
        //smartwheels: true ("true"?),
        //resourceType: "van" | "cabrio" | "station" | "oldtimer"
        //minSeats: 4,
        //fuelType: "cng" | "benzine" | "diesel" | "elektrisch" | "hybride" | "lpg"
      },*/
    };

    return params;
  }


  $scope.searchBoxes = [
    {
      id: 'openwheels',
      title: 'MyWheels Open',
      description: 'MyWheels Open auto\'s kun je openen met je smartphone en met de MyWheels app. Zo kun je direct op pad.',
      options: undefined,
      filters: { smartwheels: true, type: 'car' },
    },
    {
      id: 'elektrish',
      title: 'Elektrische auto\'s',
      description: 'Maak deel uit van de toekomst in deze elektrische auto\'s!',
      options: undefined,
      filters: { fuelType: 'elektrisch', type: 'car' },
    },
    {
      id: 'veel_zitplaatsen',
      title: 'Auto\'s met veel zitplaatsen',
      description: 'Ideaal voor een uitstapje met het hele gezin',
      options: undefined,
      filters: { minSeats: 5, type: 'car' },
    },
    {
      id: 'automaat',
      title: 'Automatische geschakeld',
      description: '',
      options: [ 'automaat' ],
      filters: { type: 'car' },
    },
    {
      id: 'station',
      title: 'Stationwagens',
      description: 'Met een stationwagen hoef je je in ieder gevaal zorgen te maken over ruimte',
      options: undefined,
      filters: { resourceType: 'station', type: 'car' },
    },
  ];
  $scope.searchBoxes.show = [];
  
  $scope.searchBoxes.forEach(function (box) {
    resourceService
      .searchV3(makeParams(box.options, box.filters))
      .then(function (data) {
        // data :: { results :: [Resource], totalResults :: int, ... }
        
        // only use results with photos
        data.results = data.results.filter(function (resource) {
          return resource.pictures.length > 0;
        });

        // only show the first 3 results
        data.results = data.results.slice(0, 4);

        // TODO remove true
        if (true || data.results.length >= 4) {
          box.data = data;
          $scope.searchBoxes.show = $scope.searchBoxes
            .filter(function (box) {
              return !!box.data;
            })
            .slice(0, 3)
            .sort(function (a, b) {
              return $scope.searchBoxes.indexOf(a) < $scope.searchBoxes.indexOf(b);
            });
        }
      });
  });

});

