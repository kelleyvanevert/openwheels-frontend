'use strict';

angular.module('owm.resource.place', [])

.controller('ResourcePlaceController', function (
  // angular
  $scope, $state, $stateParams, $log, $window,

  // lib
  uiGmapGoogleMapApi,

  // mywheels
  appConfig,
  resourceQueryService,

  // api
  api,
  metaInfoService,
  resourceService,

  // resolves
  place, me, metaInfo
) {

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



  // Veelgestelde vragen

  $scope.FAQ = [
    {
      question: 'Wat is autodelen?',
      answer: '<p>Bij autodelen maak je niet meer alleen gebruik van een auto, maar deel je hem met anderen. Je kunt kiezen om je eigen auto te delen of gebruik te maken van de auto van een ander. Zo bespaar je niet alleen op je autokosten, maar krijg je ook meer <a href="https://mywheels.nl/autodelen/community/onze-idealen/">contact met de buurt en worden buurten weer leefbaar</a>.</p><p>Je vindt op MyWheels auto’s met een boordcomputer en auto’s die je met&nbsp;de sleutel opent. Auto’s met het label MyWheels Open hebben een boordcomputer en open je met een <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-ik-een-auto-met-mijn-chipkaart/">OV-chipkaart</a> of met je <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-auto-smartphone/">smartphone</a>. Auto’s zonder het label MyWheels Open open je gewoon met de sleutel, je spreekt dan samen met de verhuurder af hoe je in het bezit komt van de sleutel.</p>',
    },
    {
      question: 'Wat zijn de voordelen van autodelen?',
      answer: '<p><!--:nl--><strong>Een auto huren</strong><br>Met autodelen zit je niet meer vast aan één en dezelfde auto, maar je kunt per keer de auto nemen die je wilt.&nbsp;Zuinige auto’s, ruime auto’s, goedkope auto’s, mooie auto’s: bij MyWheels kun je ze huren of verhuren.</p><p><strong>Lage bemiddelingskosten</strong><br>MyWheels is not-for-profit en daar profiteer jij van mee.</p><p><strong>Duizenden mensen delen honderden auto’s</strong><br>MyWheels is het not-for-profit platform voor het delen van auto’s.</p><p><strong>MyWheels zit boordevol idealen</strong><br>Zo streven we naar leefbare buurten in plaats van winst. Als mensen auto’s delen hoeven er veel minder auto’s in de wijk geparkeerd te staan.</p><p><strong>Reserveer tot 1 minuut van tevoren</strong><br>Via internet of smartphone reserveer je eenvoudig de auto die je wilt.</p><p><strong>Lid worden is makkelijk en gratis</strong><br>Je betaalt alleen als je rijdt. Je kunt na aanmelding meteen gaan huren of je eigen auto gratis te huur zetten. Lees meer over de tarieven bij <a href="https://mywheels.nl/autodelen/hoe-huren-werkt/tarieven-huren/">tarieven</a>.</p><p><strong>24/7 bereikbaar</strong><br>De supportafdeling van MyWheels is 24 uur per dag en 7 dagen per week telefonisch bereikbaar.<!--:--></p>',
    },
    {
      question: 'Op welke manieren kan ik een auto openen?',
      answer: '<p>Je vindt op MyWheels auto’s met een boordcomputer en auto’s die je met&nbsp;de sleutel opent. Auto’s met het label <a href="https://mywheels.nl/auto-huren?smartwheels=true">MyWheels Open</a> hebben een boordcomputer en open je met een <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-ik-een-auto-met-mijn-chipkaart/">OV-chipkaart</a> of met je <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-auto-smartphone/">smartphone</a>.</p><p>Auto’s zonder het label MyWheels Open open je gewoon met de sleutel, je spreekt dan samen met de verhuurder af hoe je in het bezit komt van de sleutel.<!--:--></p>',
    },
    {
      question: 'Wat betekent het label MyWheels Open?',
      answer: '<p>Auto’s met het label MyWheels Open hebben een boordcomputer en open je met je <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-ik-een-auto-met-mijn-chipkaart/">OV-chipkaart</a> en <a href="https://mywheels.nl/autodelen/veelgestelde-vragen/hoe-open-auto-smartphone/">smartphone</a>. De auto’s zijn 24 uur per dag te huur. Daarnaast hoef je bij een auto met MyWheels Open geen kilometerstanden te noteren, de boordcomputer registreert de gereden kilometers&nbsp;automatisch. In het <a href="https://mywheels.nl/auto-huren" target="_blank" rel="noopener">huuroverzicht</a>&nbsp;zie je dit label staan.</p>',
    },
    {
      question: 'Hoe betaal ik met een tankpas?',
      answer: '<p>De meeste auto’s met MyWheels Open hebben een tankpas van Multi Tank Card. Omdat je per gereden kilometer een brandstofprijs betaalt, hoef je niet op eigen kosten te tanken. Je kunt een tankbeurt daarom met de tankkaart betalen. Je vindt de tankkaart in het dashboardkastje. De viercijferige pincode van de tankkaart staat in de bevestigingsmail en vind je in de MyWheels app. Je hoeft de tankbon niet te bewaren als je met de tankpas betaalt.</p><p>Je kunt met de tankkaart alleen goedkope Euro 95 betalen, niet de duurdere premium brandstoffen (zoals Shell V-Power). We houden samen de kosten laag door niet langs&nbsp;snelwegen te tanken, maar langs binnenwegen. De tankkosten vallen dan vaak circa 10 cent goedkoper uit.</p><p>Let op: met een tankpas kun je niet in het buitenland betalen. Moet je in het buitenland toch tanken, dan kun je het tankbonnetje naar <a href="http://support@mywheels.nl" target="_blank">support@mywheels.nl</a> opsturen.</p>',
    },
  ];
  $scope.FAQ.left = $scope.FAQ.slice(0, Math.floor($scope.FAQ.length/2));
  $scope.FAQ.right = $scope.FAQ.slice(Math.floor($scope.FAQ.length/2));
  

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
      description: 'MyWheels Open auto\'s open je met je smartphone of OV-chipkaart. Zo kun je direct op pad.',
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
      description: 'Ideaal voor een uitstapje met het hele gezin.',
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
      description: 'In een stationwagen heb je altijd genoeg ruimte.',
      options: undefined,
      filters: { resourceType: 'station' },
    },
    {
      id: 'aanbevolen',
      title: 'Populaire auto\'s',
      description: undefined,
      options: undefined,
      filters: undefined,
    },
  ];
  function recomputeShownBoxes () {
    $scope.searchBoxes.show = $scope.searchBoxes
      .filter(function (box) {
        return !!box.data;
      })
      .slice(0, 3)
      .sort(function (a, b) {
        return $scope.searchBoxes.indexOf(a) < $scope.searchBoxes.indexOf(b);
      });
  }
  
  $scope.searchBoxes.forEach(function (box, i) {
    setTimeout(function () {
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

      var promise = (appConfig.test && appConfig.test.searchV3FromOpenWheels) ?
        api.invokeRpcMethod('resource.searchV3', box.params, undefined, true, {
          url: 'https://openwheels.nl/api/',
        })
          .then(function (data) {
            data.results.forEach(function (resource) {
              resource.pictures.forEach(function (picture) {
                picture.large = 'https://openwheels.nl/' + picture.large;
              });
            });
            return data;
          }) :
        resourceService
          .searchV3(box.params);
      
      promise.then(function (data) {
        // data :: { results :: [Resource], totalResults :: int, ... }
        
        // only use results with photos
        data.results = data.results.filter(function (resource) {
          return resource.pictures.length > 0;
        });

        // only show the first 3 results
        data.results = data.results.slice(0, 4);

        if (data.results.length >= 4) {
          box.data = data;
          recomputeShownBoxes();
        }

        if (!$scope.searchBoxes.show) {
          $scope.searchBoxes.show = [];
          $scope.loadMap = true;
        }
      });
    }, i * 500);
  });



  // In order not to add new markers for already existing cars
  // ID => new google.maps.Marker
  var mapResourceCache = {};

  $scope.mapLoading = false;

  var boundsFetched;

  var reloadMapResourcesDebounced = _.debounce(function (bounds) {
    //$log.log('reloading resources on map for bounds:', bounds);
    
    resourceService
      .searchMapV1({ locationPoint: bounds })
      .then(function (resourcesInArea) {
        boundsFetched = boundsFetched ? {
          latitudeMin: Math.min(boundsFetched.latitudeMin, bounds.latitudeMin),
          longitudeMin: Math.min(boundsFetched.longitudeMin, bounds.longitudeMin),
          latitudeMax: Math.max(boundsFetched.latitudeMax, bounds.latitudeMax),
          longitudeMax: Math.max(boundsFetched.longitudeMax, bounds.longitudeMax),
        } : angular.extend({}, bounds);

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


  $scope.loadMap = false;
  $scope.loadMapNow = function () {
    $scope.loadMap = true;
  };

  function loadMapIfInViewport () {
    if (!$scope.loadMap && $('.full-gmaps').visible(true)) {
      $scope.$apply(function () {
        $scope.loadMap = true;
      });
    }
  }
  $scope.mapLoadOnScroll = function () {
    $($window).on('scroll', loadMapIfInViewport);
    loadMapIfInViewport();
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
          closeBoxURL: 'data:image/svg+xml;charset=utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath d="M0 0h24v24H0z" fill="white"/%3E%3Cpath d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="black"/%3E%3C/svg%3E',
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

            var requestedBounds = {
              latitudeMin: mapbounds.getSouthWest().lat(),
              longitudeMin: mapbounds.getSouthWest().lng(),

              latitudeMax: mapbounds.getNorthEast().lat(),
              longitudeMax: mapbounds.getNorthEast().lng(),
            };

            if (!boundsFetched || (
              (requestedBounds.latitudeMin < boundsFetched.latitudeMin) ||
                (requestedBounds.longitudeMin < boundsFetched.longitudeMin) ||
                (requestedBounds.latitudeMax > boundsFetched.latitudeMax) ||
                (requestedBounds.longitudeMax > boundsFetched.longitudeMax)
              )
            ) {
              //$log.log('out of bounds or initial load', boundsFetched);
              var d_Lng = (requestedBounds.longitudeMax - requestedBounds.longitudeMin) / 10;
              var d_Lat = (requestedBounds.latitudeMax - requestedBounds.latitudeMin) / 10;

              requestedBounds.latitudeMax += d_Lat * 2;
              requestedBounds.latitudeMin -= d_Lat * 5; // bottom
              requestedBounds.longitudeMax += d_Lng * 2;
              requestedBounds.longitudeMin -= d_Lng * 2;

              reloadMapResources(boundsFetched ? {
                latitudeMax: Math.max(requestedBounds.latitudeMax, boundsFetched.latitudeMax),
                latitudeMin: Math.min(requestedBounds.latitudeMin, boundsFetched.latitudeMin),
                longitudeMax: Math.max(requestedBounds.longitudeMax, boundsFetched.longitudeMax),
                longitudeMin: Math.min(requestedBounds.longitudeMin, boundsFetched.longitudeMin),
              } : requestedBounds);
            }
          },
        },
      }
    });
  });

});

