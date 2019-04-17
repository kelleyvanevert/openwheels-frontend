'use strict';

angular.module('owm.person.invite-requests', [])

  .controller('ActionInviteRequestsController', function ($scope, me,
    inviteRequestsBooking, inviteRequestsContract, extraDriverService, alertService,
    $translate, metaInfoService, appConfig) {

    metaInfoService.set({url: appConfig.serverUrl + '/dashboard/profile/invite-requests'});
    metaInfoService.set({canonical: 'https://mywheels.nl/dashboard/profile/invite-requests'});

    $scope.me = me;
    $scope.nudgeToFlow = false;

    $scope.inviteRequestsBooking = inviteRequestsBooking;
    $scope.inviteRequestsContract = inviteRequestsContract;
    $scope.showForm = true;
    $scope.isSaved = false;
    $scope.isSaving = false;
    $scope.isDeclined = false;

    $scope.loadRequestsBooking = function() {
      extraDriverService.getRequestsForPerson({person: me.id, type: 'booking'})
        .then(function(inviteRequestsBooking) {
          $scope.inviteRequestsBooking = inviteRequestsBooking;
        });
    };

    $scope.loadRequestsContract = function() {
      extraDriverService.getRequestsForPerson({person: me.id, type: 'contract'})
        .then(function(inviteRequestsContract) {
          $scope.inviteRequestsContract = inviteRequestsContract;
        });
    };

    $scope.acceptBookingRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.acceptRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsBooking();
          if (me.status === 'new') {
            $scope.nudgeToFlow = true;
          }
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.declineBookingRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.declineRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsBooking();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.revokeBookingRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.revokeBookingRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsBooking();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.acceptContractRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.acceptContractRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsContract();
          if (me.status === 'new') {
            $scope.nudgeToFlow = true;
          }
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.declineContractRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.declineContractRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsContract();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.revokeContractRequest = function (request) {

      $scope.isSaving = true;

      extraDriverService.revokeContractRequest({ id: request.id }).then(function (result) {
      })
        .then(function () {
          $scope.loadRequestsContract();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

  })
;