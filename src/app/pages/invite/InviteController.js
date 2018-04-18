'use strict';
angular.module('owm.pages.invite', [])

.controller('InviteController', function ($scope, $state, $stateParams, me, metaInfoService, personService, alertService, Analytics, $filter) {
	
	$scope.me = me;
	$scope.personalLink = 'www.mywheels.nl/uitnodigen/' + $filter('lowercase')($scope.me.slug);
	$scope.personalLinkCopied = false;
	$scope.openboxes = {};
	$scope.refreshProfileImage = false;

	$scope.toggleBox = function (box) {
		if (!$scope.openboxes[box]) {
		  $scope.openboxes[box] = true;
		} else {
		  $scope.openboxes[box] = !$scope.openboxes[box];
		}
	};

	$scope.copyPersonalLink = function() {
		document.querySelector('.personal-link').select();
		document.execCommand('copy');
		$scope.personalLinkCopied = true;
	};

	angular.element('#ProfileImage').on('change', function (e) {
		uploadProfileImage(e.target.files[0]);
		$scope.$apply(function () {
		  $scope.profileFileName = e.target.files[0].name;
		});
	});

	var uploadProfileImage = function (file) {
		$scope.profileImageSuccess = false;
		if (!file) {
		  return;
		}

		$scope.refreshProfileImage = true;

		personService.setProfileImage({
			person: $scope.me.id,
		}, {
			image: file
		})
		.then(function (person) {
			Analytics.trackEvent('person', 'profilepicture_uploaded', person.id, undefined, true);
			$scope.profileImageSuccess = true;
		})
		.catch(function (err) {
			alertService.addError(err);
		})
		.finally(function () {
			$scope.refreshProfileImage = false;
		});
	};

});
