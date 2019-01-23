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
    $log.log('this place does not exist??');
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

  $scope.mapLoading = false;

  var reloadMapResourcesDebounced = _.debounce(function (bounds) {
    //$log.log('reloading resources on map for bounds:', bounds);
    
    resourceService
      .searchMapV1({ locationPoint: bounds })
      .then(function (resourcesInArea) {
        resourcesInArea.forEach(function (resourcePreview) {
          // `resourcePreview` is a subset of
          //  what is usually a `resource`:
          // { id, latitude, longitude, alias, boardcomputer, brand, model, newScoreCar, pictures, price }
          var coords = {
            latitude: resourcePreview.latitude,
            longitude: resourcePreview.longitude
          };

          if (!mapResourceCache[resourcePreview.id]) {
            var marker = {
              id: resourcePreview.id,
              //position: { lat: coords.latitude, lng: coords.longitude },
              coords: coords,
              title: resourcePreview.alias,
              resource: resourcePreview,
              icon: resourcePreview.boardcomputer ? 'assets/img/mywheels-open-marker-v2-40.png' : 'assets/img/mywheels-key-marker-v2-40.png',
              showWindow: false,
            };

            marker.onClick = function(){
              $scope.$apply(function(){
                $scope.selectedMarker = null;
              });
              $scope.$apply(function(){
                $scope.selectedMarker = marker;
                $scope.selectedMarker.imgUrl = resourcePreview.pictures && resourcePreview.pictures.length > 0 ? (resourcePreview.pictures[0].large || resourcePreview.pictures[0].normal || resourcePreview.pictures[0].small) : 'assets/img/resource-avatar-large.jpg';
                if ($scope.selectedMarker.imgUrl && !$scope.selectedMarker.imgUrl.match(/^http/)) {
                  $scope.selectedMarker.imgUrl = appConfig.appUrl + '/' + $scope.selectedMarker.imgUrl;
                }
                $scope.selectedMarker.showWindow = true;
              });
            };

            $scope.markers.push(mapResourceCache[resourcePreview.id] = new google.maps.Marker(marker));
          }
        });

        $scope.mapLoading = false;
      });
  }, 500);

  var reloadMapResources = function (bounds) {
    $scope.mapLoading = true;
    reloadMapResourcesDebounced(bounds);
  };

  $scope.markers = [];


  uiGmapGoogleMapApi.then(function (google_maps) {
    $scope.closeWindow = function () {
      $scope.$apply(function(){
        $scope.selectedMarker.showWindow = false;
        $scope.selectedMarker = null;
      });
    };

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
        windowOptions: {
          boxClass: 'mw-gmap-window',
          boxStyle: {
            width: '280px',
            padding: '0px',
          },

          disableAutoPan: false,
          maxWidth: 0,
          pixelOffset: new google_maps.Size(-140, 0),
          zIndex: null,

          // https://yoksel.github.io/url-encoder/
          closeBoxURL: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath d="M0 0h24v24H0z" fill="white"/%3E%3Cpath d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="black"/%3E%3C/svg%3E',
          infoBoxClearance: new google.maps.Size(1, 1),
          isHidden: false,
          pane: 'floatPane',
          enableEventPropagation: false,
        },
        events: {
          // This event is also triggered when the map is
          //  rendered for the first time
          bounds_changed: function (map) {
            var mapbounds = map.getBounds();
            // latitude = "y coordinate" (52-ish)
            // longitude = "x coordinate" (4-6)

            var bounds = {
              latitudeMin: mapbounds.getSouthWest().lat(),
              longitudeMin: mapbounds.getSouthWest().lng(),

              latitudeMax: mapbounds.getNorthEast().lat(),
              longitudeMax: mapbounds.getNorthEast().lng(),
            };

            var pad_Lng = (bounds.longitudeMax - bounds.longitudeMin) / 3;
            var pad_Lat = (bounds.latitudeMax - bounds.latitudeMin) / 3;

            bounds.latitudeMax += pad_Lat;
            bounds.latitudeMin -= pad_Lat;
            bounds.longitudeMax += pad_Lng;
            bounds.longitudeMin -= pad_Lng;

            reloadMapResources(bounds);
          },
        },
      }
    });
  });

});

