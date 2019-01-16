'use strict';

angular.module('mwResourceLocationMap', [])

.directive('mwResourceLocationMap', function (appConfig, $window) {

  return {
    restrict: 'E',
    templateUrl: 'directives/mwResourceLocationMap.tpl.html',
    scope: {
      map: '=',
    },
    link: function ($scope, el, attrs) {

      var center = '';
      var markers = '';

      if ($scope.map.markers && $scope.map.markers.length > 0) {
        var m = $scope.map.markers[0];
        if (!m.icon.match(/^http/)) {
          m.icon = 'https://mywheels.nl/' + m.icon;
        }
        // use `m.title` ?
        markers = encodeURIComponent([
          'icon:' + m.icon,
          '|',
          'scale:2',
          '|',
          m.latitude + ',' + m.longitude,
        ].join(''));
      } else {
        center = $scope.map.center.latitude + ',' + $scope.map.center.longitude;
      }

      var width = 640; // = max width

      if ($window.innerWidth < 640) {
        width = $window.innerWidth;
      }

      var height = Math.round(width * (350/640));

      $scope.src = [
        'https://maps.googleapis.com/maps/api/staticmap',
        '?zoom=', 14,
        (center ? '?center=' + center : ''), // not necessary if marker given
        '&scale=2', // for retina
        '&size=', width, 'x', height,
        '&maptype=roadmap',
        (markers ? '&markers=' + markers : ''),
        '&key=', appConfig.gmaps_js_api_key,
// TODO        '&signature=',
      ].join('');

      $scope.gmaps_url = [
        'https://maps.google.com/maps',
        '?z=', 12,
        '&t=m',
        '&q=', $scope.map.center.latitude, ',', $scope.map.center.longitude,
      ].join('');
    },
  };

});

/*
https://maps.googleapis.com/maps/api/staticmap
  ?center
  &key=AIzaSyAsnQSjaFmgUUm5N_hbgMwY86uuVV6u9nk
  &size=640x256
  &scale=2
  &zoom=15
  &markers=icon%3Ahttps%3A%2F%2Fd2y2masl4rtrav.cloudfront.net%2Fassets%2Fcar%2Fmarker_car%402x-4137c19c693ce3dae521587981f98e8b50065c776bedacafa2edbfb0c903d93e.png%7Cscale%3A2%7C48.878506%2C2.350925
  &signature=MxNgHw_k-IPv9-RN8D9sGpqcjTY=


  icon:https://d2y2masl4rtrav.cloudfront.net/assets/car/marker_car@2x-4137c19c693ce3dae521587981f98e8b50065c776bedacafa2edbfb0c903d93e.png|scale:2|48.878506,2.350925"
*/