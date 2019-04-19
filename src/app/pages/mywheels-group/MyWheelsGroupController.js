'use strict';

angular.module('owmlanding.mywheels-group', ['slick'])

.controller('MyWheelsGroupController', function ($scope, $log, me, metaInfoService, appConfig, $anchorScroll) {

  metaInfoService.set({url: appConfig.serverUrl + '/group'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/group'});

  metaInfoService.set({
    title: 'MyWheels Group',
    description: 'MyWheels Group',
  });

  $scope.me = me;

  $scope.$anchorScroll = $anchorScroll;

});
