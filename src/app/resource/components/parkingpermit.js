'use strict';

angular.module('owm.resource.parkingpermit', ['alertService'])
.directive('parkingpermit', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      resource: '=',
      resourceList: '='
    },
    templateUrl: 'resource/components/parkingpermit.tpl.html',
    controller: 'ParkingpermitController'
  };
})
    
.controller('ParkingpermitController', function($scope, $log, alertService, resourceService, dialogService, $state, $translate) {
//  $log.log($scope.resourceList);
  var show = function (permits) {
    if(permits.length === 0) {
      $scope.create = true;
      $scope.update = false;
    } else {
      $scope.create = false;
      $scope.permit_id = permits[0].id;
      $scope.update = true;
    }
  };
  
  $scope.createParkingPermit = function () {
    resourceService.getMembers({resource: $scope.resource.id})
    .then(function (members) {
      return dialogService.showModal({
        templateUrl: 'resource/components/parking-create.tpl.html'
      }, {
        resource: $scope.resource,
        members: members,
        cities: ['Den Haag', 'Rijswijk', 'Gooise Meren', 'Groningen', 'Haarlem', 'Leiden', 'Nijmegen', 'Tilburg', 'Utrecht'],
        closeButtonText: $translate.instant('CANCEL'),
        actionButtonText: 'Aanvragen'
      });
    })
    .then(function (city) {
      $scope.city = city;
      alertService.load($scope, 'success', 'Parkeervergunning aanvragen');
      return resourceService.createParkingpermit({
        resource: $scope.resource.id,
        city: $scope.city
      });
    })
    .then(function(permit) {
      $log.debug('Parkeervergunning aangevraagd', permit);
      alertService.loaded($scope);
      alertService.add($scope, 'success', 'Parkeervergunning brief verzonden.');
      return [permit];
    }).then(show, function (error) {
      if(error === 'cancel') {
        return;
      }
      alertService.loaded($scope);
      alertService.addError(error);
    });
  };
  
  $scope.updateParkingPermit = function (permit) {
    resourceService.getMembers({resource: $scope.resource.id})
    .then(function (members) {
      return dialogService.showModal({
        templateUrl: 'resource/components/parking-edit.tpl.html'
      }, {
        resource: $scope.resource,
        resourceList: $scope.resourceList,
        members: members,
        closeButtonText: $translate.instant('CANCEL'),
        actionButtonText: 'Wijzigen'
      });
    }).then(function (resource) {
      $log.log('resource', $scope.resource.id);
      if(!resource) {
        return $state.go('owm.resource.replace', {
          resourceId: $scope.resource.id
        });
      }
      
      alertService.load($scope, 'success', 'Parkeervergunning wijzigen');
      return resourceService.alterParkingpermit({
        parkingpermit: permit,
        resource: resource.id
      }).then(function(permit) {
        $log.debug('Parkeervergunning aangevraagd', permit);
        alertService.loaded($scope);
        alertService.add($scope, 'success', 'Parkeervergunning brief verzonden.');
        return [permit];
      }).then(show, function (error) {
        if(error === 'cancel') {
          return;
        }
        alertService.loaded($scope);
        alertService.addError(error);
      });
    });
  };
 
  $scope.removeParkingPermit = function (permit) {
    alertService.load($scope, 'success', 'vergunning verwijderen');
    resourceService.removeParkingpermit({parkingpermit: permit})
    .then(function(permit) {
      $log.debug('Parkeervergunning opgezegd', permit);
      alertService.loaded($scope);
      alertService.add($scope, 'success', 'Parkeervergunning opzegbrief verzonden.');
      return [];
    }).then(show, function (error) {
      alertService.loaded($scope);
      alertService.addError(error);
    });
  };

  resourceService.getParkingpermits({
    resource: $scope.resource.id
  }).then(show);
});