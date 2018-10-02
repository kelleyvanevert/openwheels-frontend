'use strict';

angular.module('owm.resource.search.map', [])

  .controller('ResourceSearchMapController', function ($scope, uiGmapGoogleMapApi, uiGmapIsReady, $stateParams, appConfig,
    metaInfoService, resourceService, resourceQueryService, $state, $location) {

    metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/kaart'});
    metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/kaart'});

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
    $scope.markers = [];
    var windows = [];

    angular.extend($scope, {
      map: {
        draggable: false,
        center: center,
        zoom: zoom,
        maxZoom: 7,
        markers: $scope.markers,
        windows: windows,
        fitMarkers: true,
        control: {},
        options: {
          scrollwheel: false
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
        $scope.$watch('bounds', function(){
          if(map && $scope.bounds){
            map.fitBounds($scope.bounds);
          }
        });

        map.addListener('idle', function() {
          resourceQueryService.setLocation({
            latitude: this.getCenter().lat(),
            longitude: this.getCenter().lng()
          });

          $location.search(resourceQueryService.createStateParams());

          var params = {
            filters: resourceQueryService.data.filters || [],
            radius: resourceQueryService.data.radius,
            sort: resourceQueryService.data.sort,
            location: resourceQueryService.data.location
          };

          resourceService.searchV3(params)
          .then(function (resources) {
            $scope.resources = resources.results;
          });

        });

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
              type: 'circle',
              resource: resource,
              icon: 'https://mywheels.nl/branding/logoicon-32.png',
              showWindow: false,
              labelClass: 'label'
            };

            marker.onClick = function(){
              $scope.$apply(function(){
                $scope.selectedMarker = null;
              });
              $scope.$apply(function(){
                $scope.selectedMarker = marker;
                $scope.selectedMarker.imgUrl = resource.pictures && resource.pictures.length > 0 ?  appConfig.serverUrl + '/' + (resource.pictures[0].small || resource.pictures[0].normal || resource.pictures[0].large) : null;
                $scope.selectedMarker.showWindow = true;
              });
            };

            $scope.markers.push(marker);
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

      $scope.$watch('placeDetails', function(){

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
            $scope.map.zoom = 14;
          }

        }
      });
    });

  });
