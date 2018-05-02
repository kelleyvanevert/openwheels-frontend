'use strict';

angular.module('owm.auth.signup', [])

.controller('AuthSignupController', function ($scope, $state, $stateParams, $translate, $q, authService, featuresService, alertService, metaInfoService, appConfig) {

	metaInfoService.set({url: appConfig.serverUrl + '/signup'});
	metaInfoService.set({canonical: 'https://mywheels.nl/signup'});

	$scope.url = 'owm.person.dashboard';
});
