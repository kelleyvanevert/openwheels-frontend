'use strict';

angular.module('owm.person.inviterequest', [])

.controller('PersonActionBookingRequestController', function ($scope, request, extraDriverService, alertService, $translate) {

  $scope.request = request;
  $scope.showForm = true;
  $scope.isSaved = false;
  $scope.isSaving = false;
  $scope.isDeclined = false;
  $scope.sender = request.sender.firstName;
  $scope.resource = request.booking.resource.alias;


  $scope.acceptRequest = function () {

    $scope.isSaving = true;

    extraDriverService.acceptRequest({ id: request.id }).then(function (result) {
    })
      .then(function () {
        alertService.add('success', $translate.instant('BOOKING.INVITE_EXTRA_ACCEPTED'), 8000);
        $scope.showForm = false;
        $scope.isSaved = true;
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        $scope.isSaving = false;
      });
  };

  $scope.declineRequest = function () {
    
    $scope.isSaving = true;

    extraDriverService.declineRequest({ id: request.id }).then(function (result) {
    })
      .then(function () {
        alertService.add('danger', $translate.instant('BOOKING.INVITE_EXTRA_DECLINED'), 8000);
        $scope.showForm = false;
        $scope.isDeclined = true;
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