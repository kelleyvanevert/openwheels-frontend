'use strict';

angular.module('owm.resource.create.carPhotos', [])

.controller('carPhotosControler', function ($scope, $filter, $state, $log, $q, $stateParams, $translate, resources, resourceService,
	authService, alertService, dialogService, me, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/mijn-auto/create/photos'});
  metaInfoService.set({canonical: 'https://mywheels.nl/mijn-auto/create/photos'});
  
  var resource = $scope.resource;
});
