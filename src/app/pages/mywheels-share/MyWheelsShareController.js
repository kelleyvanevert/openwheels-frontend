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

});
