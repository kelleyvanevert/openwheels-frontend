'use strict';

angular.module('owm.resource.search.map', ['uiGmapgoogle-maps'])

  .controller('ResourceSearchMapController', function ($scope, uiGmapGoogleMapApi, uiGmapIsReady, $stateParams, appConfig,
    metaInfoService, resourceService, resourceQueryService, $state, $location, $rootScope, $timeout, $filter) {

    metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/kaart'});
    metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/kaart'});

    var timer;
    $scope.filtersUpdated = false;
    var DEFAULT_MAP_CENTER_LOCATION = {
      // Utrecht, The Netherlands
      latitude : 52.091667,
      longitude: 5.117778000000044
    };
    var zoom = 13;
    var center = {
      latitude:  $stateParams.lat || DEFAULT_MAP_CENTER_LOCATION.latitude,
      longitude: $stateParams.lng || DEFAULT_MAP_CENTER_LOCATION.longitude
    };
    var windows = [];
    $scope.markers = [];

    //Google Maps options
    angular.extend($scope, {
      map: {
        draggable: false,
        center: center,
        zoom: zoom,
        markers: $scope.markers,
        windows: windows,
        fitMarkers: true,
        control: {},
        options: {
          minZoom: 12,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false
        }
      }
    });

    uiGmapGoogleMapApi.then(function(maps) {
      var boundsFromSearch;

      $scope.$watch(function(){
        if($scope.map.control && $scope.map.control.getGMap){
          return $scope.map.control.getGMap();
        }

        return null;
      }, function(map){
        //default map on relevance
        $scope.sort = 'relevance';

        $scope.$watch('bounds', function(){
          if(map && $scope.bounds){
            map.fitBounds($scope.bounds);
          }
        });

        //update markers on center change of map, with timeout of 0.8 seconds to prevent too max calls
        map.addListener('idle', function() {
          $scope.sort = 'distance';
          $timeout.cancel(timer);

          timer = $timeout(function () {
            $scope.updateResources();
          }, 800);
        });

        //update timeframe
        $scope.$watch('booking', function (newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.markers.length = 0;

            $scope.newTimeFrame = null;
            $scope.newTimeFrame = {
              startDate: newValue.beginRequested,
              endDate: newValue.endRequested
            };

            $scope.filtersUpdated = true;
            $scope.updateResources();
          }
        });

        //update filters, options and radius on filter change
        $scope.$watch('filters', function (newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.markers.length = 0;

            $scope.newFilters = null;
            angular.forEach(newValue.filters, function (value, key) {
              if (!value) { return; }
              if (key === 'minSeats') {
                try {
                  $scope.newFilters = $scope.newFilters || {};
                  $scope.newFilters[key] = parseInt(value);
                } catch (e) {
                }
              } else {
                $scope.newFilters = $scope.newFilters || {};
                $scope.newFilters[key] = value;
              }
            });

            $scope.newOptions = [];
            angular.forEach(newValue.options, function (value, option) {
              if (value === true) {
                $scope.newOptions.push(option);
              }
            });

            $scope.newRadius = newValue.props.radius;
            $scope.filtersUpdated = true;
            $scope.updateResources();
          }
        }, true);

        //update resources
        $scope.updateResources = function() {
          resourceQueryService.setLocation({
            latitude: map.getCenter().lat(),
            longitude: map.getCenter().lng()
          });

          $location.search(resourceQueryService.createStateParams());

          var params = [];
          if($scope.filtersUpdated) {
            params = {
              filters: $scope.newFilters || [],
              options: $scope.newOptions || [],
              radius: $scope.newRadius,
              sort: map.getZoom() >= 14 ? $scope.sort : resourceQueryService.data.sort,
              location: resourceQueryService.data.location,
              timeFrame: $scope.newTimeFrame || [],
              maxresults: 30
            };
          } else {
            params = {
              filters: resourceQueryService.data.filters || [],
              options: resourceQueryService.data.options || [],
              radius: resourceQueryService.data.radius,
              sort: map.getZoom() >= 14 ? $scope.sort : resourceQueryService.data.sort,
              location: resourceQueryService.data.location,
              timeFrame: resourceQueryService.data.timeFrame,
              maxresults: 30
            };
          }

          resourceService.searchV3(params)
          .then(function (resources) {
            $scope.resources = resources.results;
            $scope.filtersUpdated = false;
          });
        };

        //update markers on change of resources
        $scope.$watch('resources', function(){
          if(!$scope.resources.length){
            return;
          }

          angular.forEach($scope.resources, function(resource){
            var coords = {
              latitude: resource.latitude,
              longitude: resource.longitude
            };

            var marker = {
              id: resource.id,
              coords: coords,
              title: resource.alias,
              animation: maps.Animation.DROP,
              resource: resource,
              icon: 'assets/img/mywheels-marker-40.png',
              showWindow: false
            };

            marker.onClick = function(){
              $scope.$apply(function(){
                $scope.selectedMarker = null;
              });
              $scope.$apply(function(){
                $scope.selectedMarker = marker;
                $scope.selectedMarker.imgUrl = resource.pictures && resource.pictures.length > 0 ?  appConfig.serverUrl + '/' + (resource.pictures[0].large || resource.pictures[0].normal || resource.pictures[0].small) : 'assets/img/resource-avatar-large.jpg';
                $scope.selectedMarker.showWindow = true;
              });
            };

            $scope.markers.push(new google.maps.Marker(marker));
          });

          if(!boundsFromSearch){
            $scope.map.fitMarkers = true;
          }
        });

      });

      $scope.closeWindow = function () {
        $scope.$apply(function(){
          $scope.selectedMarker.showWindow = false;
          $scope.selectedMarker = null;
        });
      };

      $scope.$watch('placeDetails', function() {
        var viewport;
        if($scope.placeDetails && $scope.placeDetails.geometry){
          if( $scope.placeDetails.geometry.viewport){
            viewport = $scope.placeDetails.geometry.viewport;
            boundsFromSearch = new maps.LatLngBounds(
              new maps.LatLng(viewport.getSouthWest().lat(), viewport.getSouthWest().lng()),
              new maps.LatLng(viewport.getNorthEast().lat(), viewport.getNorthEast().lng())
            );
            $scope.map.fitMarkers = false;
            $scope.bounds = angular.copy(boundsFromSearch);
          }else if($scope.placeDetails.geometry.location){
            $scope.map.center = {latitude: $scope.placeDetails.geometry.location.lat(), longitude:  $scope.placeDetails.geometry.location.lng()};
            $scope.map.zoom = 13;
          }
        }
      });

    });
  });