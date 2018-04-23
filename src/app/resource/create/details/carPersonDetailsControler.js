'use strict';

angular.module('owm.resource.create.details', [])

.controller('carPersonDetailsControler', function ($scope, $filter, $state, $log, $q, $stateParams, $translate, resources,
	resourceService, authService, alertService, dialogService, me, metaInfoService, appConfig, linksService) {

	metaInfoService.set({url: appConfig.serverUrl + '/mijn-auto/create/details'});
	metaInfoService.set({canonical: 'https://mywheels.nl/mijn-auto/create/details'});

	var resource = $scope.resource;
	$scope.personSubmitted = $stateParams.personSubmitted === 'true' ? true : false;

	$scope.shareUrl = linksService.resourceUrl(resource.id, resource.city);
	$log.debug('Share url = ' + $scope.shareUrl);

	$scope.goToInviteFriends = function() {
		$state.go('invite');
	};

});
