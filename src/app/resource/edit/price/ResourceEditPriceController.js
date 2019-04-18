'use strict';

angular.module('owm.resource.edit.price', [])

  .controller('ResourceEditPriceController', function ($filter, $scope, alertService, resourceService) {

// Require $scope.resource
    var master = $scope.resource;

// Work on a copy
    $scope.resource = angular.copy(master);

    $scope.save = function () {
      alertService.load();
      var newProps = $filter('returnDirtyItems')(angular.copy($scope.resource), $scope.form);

      if(newProps.refuelByRenter){
        newProps.fuelPerKilometer = 0;
      }

      resourceService.alter({
        id: $scope.resource.id,
        newProps: newProps
      })
        .then(function (resource) {
          if(resource.minimumAge !== $scope.resource.minimumAge && resource.price.dayRateTotal >= 45) {
            alertService.add('success', 'De minimum leeftijd van jouw auto is automatisch verhoogd naar ' + resource.minimumAge + ' omdat de dagprijs hoger dan 45 euro is.' , 5000);
          } else {
            alertService.addSaveSuccess();
          }

          // Update master
          angular.forEach(newProps, function (value, key) {
            master[key] = resource[key];
          });

          // Update working copy
          reset();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          alertService.loaded();
        });

    };

    $scope.reset = reset;

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

    function reset() {
      $scope.resource = angular.copy(master);
      $scope.form.$setPristine();
    }

  });
