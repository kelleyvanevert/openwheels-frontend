'use strict';

angular.module('owm.resource.create.location', [])

.controller('locationControler', function ($scope, $filter, $state, $log, $q, $stateParams, $translate, resources, resourceService,
	authService, alertService, dialogService, me, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/mijn-auto/create/location'});
  metaInfoService.set({canonical: 'https://mywheels.nl/mijn-auto/create/location'});

  var resource = $scope.resource;
});
