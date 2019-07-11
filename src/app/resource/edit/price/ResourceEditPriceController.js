'use strict';

angular.module('owm.resource.edit.price', [])

  .controller('ResourceEditPriceController', function ($q, $filter, $scope, alertService, resourceService) {

    $scope.vacationDiscountSettings = {
      vacationShortRate: 0.15,
      vacationLongRate: 0.25,
      vacationKilometerReduction: true
    };

    var master = $scope.resource;

    $scope.reset = function () {
      $scope.resource = angular.copy(master);
      $scope.fields = {
        refuelByRenter: master.refuelByRenter ? 'true' : '',
        vacationDiscount: (master.price.vacationShortRate || master.price.vacationLongRate) ? 'true' : ''
      };
      if ($scope.form) {
        $scope.form.$setPristine();
      }
    };

    $scope.reset();

    $scope.save = function () {
      alertService.load();
      var newProps = $filter('returnDirtyItems')(angular.copy($scope.resource), $scope.form);

      newProps.refuelByRenter = !!$scope.fields.refuelByRenter;

      if (newProps.refuelByRenter) {
        newProps.fuelPerKilometer = 0;
      }

      var priceNewProps = $scope.fields.vacationDiscount ? $scope.vacationDiscountSettings : {
        vacationShortRate: 0,
        vacationLongRate: 0,
        vacationKilometerReduction: true
      };

      resourceService.alterPrice({
        resource: $scope.resource.id,
        newProps: priceNewProps
      })
        .then(function () {
          return resourceService.alter({
            id: $scope.resource.id,
            newProps: newProps
          });
        })
        .then(function (resource) {
          if(resource.minimumAge !== $scope.resource.minimumAge && resource.price.dayRateTotal >= 45) {
            alertService.add('success', 'De minimum leeftijd van jouw auto is automatisch verhoogd naar ' + resource.minimumAge + ' omdat de dagprijs hoger dan 45 euro is.' , 5000);
          } else {
            alertService.addSaveSuccess();
          }

          // Update master
          master = resource;

          // Update working copy
          $scope.reset();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          alertService.loaded();
        });

    };

    // returns `true` in case of errors
    $scope.checkInput = function (e) {
      var dayRateTotal = $scope.resource.dayRateTotal,
        hourRate = $scope.resource.hourRate,
        kilometerRate = $scope.resource.kilometerRate,
        me = $scope.me;

      if(e === 'dayRateTotal' && !$scope.resource.kilometerRate.$touched) {
        return dayRateTotal < 15 && (me.provider.id === 1 || me.isBusinessConnected);
      }
      else if(e === 'hourRate' && !$scope.resource.kilometerRate.$touched) {
        return hourRate < 1.5 && (me.provider.id === 1 || me.isBusinessConnected);
      }
      else if(e === 'kilometerRate' && !$scope.resource.kilometerRate.$touched) {
        return kilometerRate < 0.05 && (me.provider.id === 1 || me.isBusinessConnected);
      }
      else {
        return kilometerRate < 0.05 || hourRate < 1.5 || dayRateTotal < 15 && (me.provider.id === 1 || me.isBusinessConnected);
      }
    };
  });
