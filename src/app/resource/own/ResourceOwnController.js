'use strict';

angular.module('owm.resource.own', [])

.controller('ResourceOwnController', function ($scope, $filter, $state, me, $translate, resources, resourceService, authService,
  alertService, dialogService, boardcomputerService, $window, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/mijn-auto'});
  metaInfoService.set({canonical: 'https://mywheels.nl/mijn-auto'});

  $scope.resources = resources;
  $scope.me = me;

  $scope.licencePlate = {
    content: '',
    data: false,
    showError: false,
    error: ''
  };
  
  //Syntus Utrecht offer for MyWheels Open
  if ($scope.me.zipcode) {
    $scope.zipcode = $scope.me.zipcode.substring(0, 4);
    $scope.MyWheelsOpenUtrecht = ($scope.zipcode >= 3400 && $scope.zipcode <= 4133 && ['Culemborg', 'Den Haag', '\'s-Gravenhage'].indexOf($scope.me.city) < 0) ? true : false;
  } else {
    $scope.MyWheelsOpenUtrecht = false;
  }

  $scope.goToMyWheelsOpen = function() {
    window.open('/open','_blank');
  };

  $scope.saveOld = function (resource) {
    alertService.load();
    return authService.me()
    .then(function (me) {
      resourceService.create({
        'owner': me.id,
        'registrationPlate': resource.registrationPlate
      }).then(function (resource) {
          alertService.loaded();
          $state.go('owm.resource.edit', {'resourceId': resource.id});
        }, function (error) {
          alertService.loaded();
          alertService.add('danger', error.message, 5000);
        });
    });
  };

  $scope.save = function (registrationPlate) {
    alertService.load();
    return authService.me()
    .then(function (me) {
      resourceService.create({
        'owner': me.id,
        'registrationPlate': registrationPlate
      }).then(function (resource) {
          alertService.loaded();
          $state.go('owm.resource.edit', {'resourceId': resource.id});
        }, function (error) {
          alertService.loaded();
          alertService.add('danger', error.message, 5000);
        });
    });
  };
  
  $scope.setResourceAvailability = function (resource, value) {
    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CLOSE'),
      actionButtonText: $translate.instant('OK'),
      headerText: $translate.instant('IS_AVAILABLE_RESOURCE_TITLE'),
      bodyText: $translate.instant('IS_AVAILABLE_RESOURCE')
    })
    .then(function () {
      resourceService.alter({
        resource: resource.id,
        newProps: {
          'isAvailableOthers': value,
          'isAvailableFriends': value
        }
      })
      .then(function () {
        alertService.add('success', $filter('translate')('IS_AVAILABLE_RESOURCE_SAVE_SUCCESS'), 3000);
        resource.isAvailableOthers = value;
        resource.isAvailableFriends = value;
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
      });
    });
  };

  $scope.location = function(resource) {
    boardcomputerService.currentLocation({
      resource: resource.id
    })
    .then(function(location) {
      var locationUrl = 'https://www.google.nl/maps/search/' + location.lat + ',%20' + location.lng;
      $window.open(locationUrl);
    })
    .catch(function (err) {
      alertService.addError(err);
    });
  };

});
