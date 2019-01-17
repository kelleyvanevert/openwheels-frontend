'use strict';

angular.module('owm.person.invite-requests', [])

  .controller('ActionInviteRequestsController', function ($scope, me, inviteRequestsBooking, inviteRequestsContract, extraDriverService, alertService, $translate) {

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
          alertService.add('success', $translate.instant('BOOKING.INVITE_EXTRA_ACCEPTED'), 8000);
          $scope.loadRequestsBooking();
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
          alertService.add('danger', $translate.instant('BOOKING.INVITE_EXTRA_DECLINED'), 8000);
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
          alertService.add('danger', $translate.instant('INVITE_EXTRA_PERSON_REVOKE'), 8000);
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
          alertService.add('success', $translate.instant('BOOKING.INVITE_EXTRA_ACCEPTED'), 8000);
          $scope.loadRequestsContract();
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
          alertService.add('danger', $translate.instant('BOOKING.INVITE_EXTRA_DECLINED'), 8000);
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
          alertService.add('danger', $translate.instant('INVITE_EXTRA_PERSON_REVOKE'), 8000);
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