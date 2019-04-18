'use strict';

angular.module('owm.shell')

.controller('ToolbarController', function ($scope, $state, me, $rootScope,
		$localStorage, $timeout, $filter, autocompleteOptions,
		$location,
		unwrap,
		resourceQueryService
) {

	//if visitor is on the signup page, don't show the buttons in the toolbar because of distraction reasons
	$scope.onSignUpPage = $rootScope.$state.current.name === 'owm.auth.signup' ? true : false;
	$scope.onListYourCarPage = $rootScope.$state.current.name === 'list-your-car' ? true : false;

	$rootScope.$on('$stateChangeSuccess', function (event, toState) {
		$scope.onSignUpPage = toState.name === 'owm.auth.signup' ? true : false;
		$scope.onListYourCarPage = toState.name === 'list-your-car' ? true : false;
	});

	if (me) {
		$scope.profileImageUrl = $filter('profileImageUrl')(me);
	}

	$scope.redirectTo = function() {
	  if (me) {
	    $state.go('owm.person.dashboard');
	  } else {
	    $state.go('home');
	  }
	};

	$timeout(function () {
		if($localStorage.invitedBySlug) {
		  $scope.invitedBySlug = $localStorage.invitedBySlug;
		}
	}, 1000);

	$scope.autocompleteOptions = autocompleteOptions;

	$scope.$on('g-places-autocomplete:select', function(event, res) {
		if (res) {
			//close keyboard on iOS
			document.activeElement.blur();
			var inputs = document.querySelectorAll('input');
			for(var i=0; i < inputs.length; i++) {
				inputs[i].blur();
			}
			
			resourceQueryService.setText(res.formatted_address);
			resourceQueryService.setLocation({
				latitude:  unwrap(res.geometry.location.lat),
				longitude: unwrap(res.geometry.location.lng),
			});

			var params = resourceQueryService.createStateParams();

			$scope.geoSearch = '';
			$state.go('owm.resource.search.list.reloadable', params);
		}
	});

	// Om een edge-case op te lossen waarbij een <enter> op een andere pagina om
	//  een of andere reden de bovenstaande regel invalideert...
  $rootScope.$on('$stateChangeSuccess', function () {
		setTimeout(function () {
			$scope.geoSearch = '';
			$scope.$apply();
		}, 100);
	});

});