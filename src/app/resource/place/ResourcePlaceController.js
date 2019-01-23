'use strict';

angular.module('owm.resource.place', [])

.controller('ResourcePlaceController', function (
  // angular
  $scope, $state, $stateParams, $log,

  // lib
  uiGmapGoogleMapApi,

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

  // TODO remove
  $scope.selectResource = function (resource) {
    var params = resourceQueryService.createStateParams();
    params.resourceId = resource.id;
    params.city = (resource.city || '').toLowerCase().replace(/ /g, '-');
    $state.go('owm.resource.show', params);
  };
  

  // The place page should show a number of "interesting categories"
  //  of cars. Of course we should only show a category if there
  //  are at least some cars in that category, and also we only
  //  want to show cars that have pictures.
  // The code below issues a number of API calls to request
  //  cars in certain categories, and then decides which 3 categories
  //  to actually show, based on their priority and how many
  //  cars are returned (with at least 1 image).

  function makeParams (options, filters) {
    filters = filters || {};

    // Only select actual cars
    filters.type = 'car';

    var params = {
      location: {
        latitude: $scope.place.latitude,
        longitude: $scope.place.longitude,
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
      filters: { smartwheels: true },
    },
    {
      id: 'elektrish',
      title: 'Elektrische auto\'s',
      description: 'Maak deel uit van de toekomst in deze elektrische auto\'s!',
      options: undefined,
      filters: { fuelType: 'elektrisch' },
    },
    {
      id: 'veel_zitplaatsen',
      title: 'Auto\'s met veel zitplaatsen',
      description: 'Ideaal voor een uitstapje met het hele gezin',
      options: undefined,
      filters: { minSeats: 5 },
    },
    {
      id: 'automaat',
      title: 'Automatische geschakeld',
      description: '',
      options: [ 'automaat' ],
      filters: undefined,
    },
    {
      id: 'station',
      title: 'Stationwagens',
      description: 'Met een stationwagen hoef je je in ieder gevaal zorgen te maken over ruimte',
      options: undefined,
      filters: { resourceType: 'station' },
    },
  ];
  $scope.searchBoxes.show = [];
  
  $scope.searchBoxes.forEach(function (box) {
    box.params = makeParams(box.options, box.filters);
    box.sref = 'owm.resource.search.list({' +
        'lat: ' + $scope.place.latitude + ',' +
        'lng: ' + $scope.place.longitude + ',' +
        'text: "' + $scope.place.name + '",' +
        'radius: 5000,' +
        'options: "' + (box.options || []).join(',') + '",' +
        ((box.filters && box.filters.fuelType) ? ('fuel: "' + box.filters.fuelType + '",') : '') +
        ((box.filters && box.filters.minSeats) ? ('seats: "' + box.filters.minSeats + '",') : '') +
        ((box.filters && box.filters.resourceType) ? ('type: "' + box.filters.resourceType + '",') : '') +
        ((box.filters && box.filters.smartwheels) ? ('smartwheels: true,') : '') +
        //'sort: "relevance"' +
      '})';

    resourceService
      .searchV3(box.params)
      .then(function (data) {
        // data :: { results :: [Resource], totalResults :: int, ... }
        
        // only use results with photos
        data.results = data.results.filter(function (resource) {
          return resource.pictures.length > 0;
        });

        //$log.log('box', box, data.results.length, data.results);

        // only show the first 3 results
        data.results = data.results.slice(0, 4);

        // TODO remove true
        if (data.results.length >= 4) {
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



  // In order not to add new markers for already existing cars
  // ID => new google.maps.Marker
  var mapResourceCache = {};

  var mapInitialized = false;

  var reloadMapResources = _.debounce(function (bounds, map) {
    $log.log('reloading resources on map for bounds:', bounds);
    
    resourceService
      .searchV3(makeParams())
      .then(function (data) {
        data.results.forEach(function (resource) {
          var coords = {
            latitude: resource.latitude,
            longitude: resource.longitude
          };

          if (!mapResourceCache[resource.id]) {
            var marker = {
              id: resource.id,
              //position: { lat: coords.latitude, lng: coords.longitude },
              coords: coords,
              title: resource.alias,
              resource: resource,
              icon: (resource.locktypes.indexOf('chipcard') >= 0 || resource.locktypes.indexOf('smartphone') >= 0) ? 'assets/img/mywheels-open-marker-v2-40.png' : 'assets/img/mywheels-key-marker-v2-40.png',
              showWindow: false,
            };

            marker.onClick = function(){
              $scope.$apply(function(){
                $scope.selectedMarker = null;
              });
              $scope.$apply(function(){
                $scope.selectedMarker = marker;
                $scope.selectedMarker.imgUrl = resource.pictures && resource.pictures.length > 0 ? (resource.pictures[0].large || resource.pictures[0].normal || resource.pictures[0].small) : 'assets/img/resource-avatar-large.jpg';
                if ($scope.selectedMarker.imgUrl && !$scope.selectedMarker.imgUrl.match(/^http/)) {
                  $scope.selectedMarker.imgUrl = appConfig.serverUrl + '/' + $scope.selectedMarker.imgUrl;
                }
                $scope.selectedMarker.showWindow = true;
              });
            };

            $scope.markers.push(mapResourceCache[resource.id] = new google.maps.Marker(marker));
          }
        });

//        if (!mapInitialized) {
//          mapInitialized = true;
//          var markerCluster = new MarkerClusterer(map, $scope.markers, {
//            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
//          });
//        }
      });
  }, 500);

  $scope.markers = [];

  angular.extend($scope, {
    map: {
      center: {
        latitude: $scope.place.latitude,
        longitude: $scope.place.longitude
      },
      draggable: true,
      markers: $scope.markers,
      zoom: 14,
      gestureHandling: 'cooperative',
      clickableIcons: false,
      options: {
        scrollwheel: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [/*
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [
              {
                visibility: 'off',
              },
            ],
          },*/
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [
              {
                visibility: 'off',
              },
            ],
          },
          {
            featureType: 'landscape',
            elementType: 'labels',
            stylers: [
              {
                visibility: 'off',
              },
            ],
          },
        ],
      },
      clusterOptions: {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
      },
      events: {
        // This event is also triggered when the map is
        //  rendered for the first time
        bounds_changed: function (map) {
          var mapbounds = map.getBounds();
          // latitude = "y coordinate" (52-ish)
          // longitude = "x coordinate" (4-6)

          reloadMapResources({
            latitude_min: mapbounds.getSouthWest().lat(),
            longitude_min: mapbounds.getSouthWest().lng(),

            latitude_max: mapbounds.getNorthEast().lat(),
            longitude_max: mapbounds.getNorthEast().lng(),
          }, map);
        },
      },
    }
  });

  uiGmapGoogleMapApi.then(function(maps) {
    $scope.closeWindow = function () {
      $scope.$apply(function(){
        $scope.selectedMarker.showWindow = false;
        $scope.selectedMarker = null;
      });
    };
  });

});

