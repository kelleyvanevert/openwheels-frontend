'use strict';
angular.module('owm.pages.invite.subscribe', [])

.controller('InviteSubscribeController', function ($scope, $state, $rootScope, inviter, $stateParams, $mdDialog,
	$mdMedia, $timeout, $localStorage, resourceService, metaInfoService, appConfig, $filter) {

	metaInfoService.set({robots: 'noindex'});
	metaInfoService.set({url: appConfig.serverUrl + '/uitnodigen/' + inviter.slug});
	metaInfoService.set({canonical: 'https://mywheels.nl/uitnodigen/' + inviter.slug});

	$scope.inviter = inviter;
	$scope.openboxes = {};
	$scope.resources = [];

	//set slug to localStorage
	$localStorage.invitedBySlug = $scope.inviter.slug;

	if($stateParams.name) {
		$rootScope.prefilledName = $stateParams.name;
	}
	if($stateParams.mail) {
		$rootScope.prefilledMail = $stateParams.mail;
	}

	$scope.toggleBox = function (box) {
		if (!$scope.openboxes[box]) {
		  $scope.openboxes[box] = true;
		} else {
		  $scope.openboxes[box] = !$scope.openboxes[box];
		}
	};

	function loadResources() {
		resourceService.search({
			owner: $scope.inviter.id,
			page: 0,
			perPage: 5
		})
		.then(function (resources) {
			$scope.resources  = $filter('filter')(resources || [], function (resource) {
				return resource.isActive;
			});
		})
		.catch(function () {
			$scope.resources = [];
		});
	}

	//load resource if inviter is probably owner
	if($scope.inviter.preference !== 'renter') {
		loadResources();
	}

	$scope.openModal = function(ev) {
		$mdDialog.show({
			clickOutsideToClose: true,
			targetEvent: ev,
			preserveScope: true,
			locals: {
			  inviter: $scope.inviter,
			},
			fullscreen: $mdMedia('xs'),
			templateUrl: 'pages/inviteSubscribe/invite-subscribe-dialog.tpl.html',
			controller: ['$scope', '$mdDialog', 'authService', 'inviter', '$filter', function ($scope, $mdDialog, authService, inviter, $filter) {
				$scope.inviter = inviter;
				$scope.url = 'owm.person.dashboard';
				$scope.hide = function () {
					$mdDialog.hide();
				};
				$scope.cancel = function () {
					$mdDialog.cancel();
				};
				$scope.answer = function (answer) {
					$mdDialog.hide(answer);
				};
			}]
		});
	};

	//load modal after page is loaded
	angular.element(function () {
		$timeout(function () {
			$scope.openModal();
		}, 1000);
	});

});
