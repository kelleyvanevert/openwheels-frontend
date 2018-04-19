'use strict';
angular.module('owm.pages.invite', [])

.controller('InviteController', function ($scope, $state, $stateParams, me, metaInfoService, personService, alertService, Analytics, $filter, appConfig, $mdDialog, $mdMedia) {

	metaInfoService.set({url: appConfig.serverUrl + '/uitnodigen'});
	metaInfoService.set({canonical: 'https://mywheels.nl/uitnodigen'});

	$scope.me = me;
	$scope.appConfig = appConfig;
	$scope.personalLink = 'https://test.openwheels.nl/uitnodigen/' + $filter('lowercase')($scope.me.slug);
	$scope.personalLinkCopied = false;
	$scope.shareText = 'Meld je via' + $scope.me.firstName + 'mij aan bij MyWheels en ontvang 10 euro korting op je eerst rit!';
	$scope.openboxes = {};
	$scope.refreshProfileImage = false;

	$scope.toggleBox = function (box) {
		if (!$scope.openboxes[box]) {
		  $scope.openboxes[box] = true;
		} else {
		  $scope.openboxes[box] = !$scope.openboxes[box];
		}
	};

	$scope.selectLink = function() {
		var input = document.getElementById('personalLink');
		input.select();
		input.setSelectionRange(0,9999);
	};

	$scope.copyPersonalLink = function() {
		var input = document.getElementById('personalLink');
		input.select();
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

	$scope.openModal = function(ev) {
		$mdDialog.show({
			clickOutsideToClose: true,
			targetEvent: ev,
			preserveScope: true,
			locals: {
			  me: $scope.me,
			},
			fullscreen: $mdMedia('xs'),
			templateUrl: 'pages/invite/invite-email-dialog.tpl.html',
			controller: ['$scope', '$mdDialog', 'me', '$filter', function ($scope, $mdDialog, me, $filter) {
			  $scope.me = me;
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


});
