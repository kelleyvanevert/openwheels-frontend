'use strict';

angular.module('owmlanding.mywheels-fleet', ['slick'])

.controller('MyWheelsFleetController', function ($scope, $log, me, metaInfoService, appConfig, $anchorScroll) {

  metaInfoService.set({url: appConfig.serverUrl + '/fleet'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/fleet'});

  metaInfoService.set({
    title: 'MyWheels Fleet',
    description: 'MyWheels Fleet',
  });

  $scope.me = me;

  $scope.$anchorScroll = $anchorScroll;

});
