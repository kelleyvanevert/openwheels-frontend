'use strict';

angular.module('owm.components')

.controller('RD_CreateBookingDialogController', function (
  $scope,
  resourceService,
  bookingService,
  extraDriverService,
  API_DATE_FORMAT,
  $mdDialog,

  // Dialog locals
  fixedResource,
  perspective,
  resource,
  datetime,
  me,
  contract,
  onBookingCreated
) {

  $scope.fixedResource = fixedResource;
  $scope.perspective = perspective;
  $scope.me = me;

  // fixedResource: boolean
  // perspective: {
  //   isProviderAdmin: boolean
  // }
  // resource: Resource
  // datetime: moment
  // me: Person
  // contract: Contract // TODO remove this

  $scope.booking = {
    resource: resource, // maybe null, see `fixedResource`
    beginRequested: datetime.format(API_DATE_FORMAT),
    endRequested: datetime.clone().add(1, 'hour').format(API_DATE_FORMAT),
    person: perspective.isProviderAdmin
      ? null       // show dropdown
      : $scope.me, // automatic
    remarkRequester: '',
  };
  $scope.personQuery = '';
  $scope.resourceQuery = '';

  $scope.$watch('[booking.beginRequested, booking.endRequested]', function () {
    if (!$scope.booking.beginRequested || !$scope.booking.endRequested) {
      $scope.timeFrameError = true;
      return;
    }

    if (moment($scope.booking.beginRequested) >= moment($scope.booking.endRequested)) {
      $scope.timeFrameError = 'invalid';
      return;
    }

    $scope.timeFrameError = false;
  });

  $scope.searchResource = function (query) {
    return resourceService.forOwner({
      person: contract.contractor.id,
    });
  };

  $scope.searchPerson = function (query) {
    return extraDriverService.search({
      person: contract.contractor.id,
      contract: contract.id,
      search: query,
      //limit: 999,
      //offset: 0,
    }).then(d => {
      return d.result;
    });
  };

  // $scope.selectPerson = () => {};
  // $scope.queryChange = () => {};

  $scope.create = function () {
    if ($scope.timeFrameError || !$scope.booking.person || !$scope.booking.resource) {
      return;
    }

    $scope.succeeded = false;
    $scope.failed = false;
    $scope.sending = true;
    
    bookingService.create({
      resource: $scope.booking.resource.id,
      timeFrame: {
        startDate: $scope.booking.beginRequested,
        endDate: $scope.booking.endRequested
      },
      person: $scope.booking.person.id,
      contract: contract.id,
      remark: $scope.booking.remarkRequester,
    })
    .then(createdBooking => {
      $scope.succeeded = true;
      $scope.createdBooking = createdBooking;
      if (onBookingCreated) {
        onBookingCreated();
      }
    })
    .catch(error => {
      $scope.failed = true;
      $scope.error = error;
    })
    .finally(__ => {
      $scope.sending = false;
    });
  };

  $scope.hide = function () {
    $mdDialog.hide();
  };
});
