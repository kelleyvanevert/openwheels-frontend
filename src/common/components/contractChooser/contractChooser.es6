'use strict';

angular.module('owm.components')

.directive('contractChooser', function (
  $state,
  $log,
  $mdMedia,

  alertService,

  contractService,
  depositService
) {
  return {
    restrict: 'E',
    scope: {
      me: '=',
      disableAutoRequestGo: '=',
      disableChoice: '=',
      enableCompany: '=',
    },
    templateUrl: 'components/contractChooser/contractChooser.tpl.html',
    controller: function ($scope) {

      $scope.$mdMedia = $mdMedia;

      $scope.contractTypes = {
        go: 60,
        member: 62,
        premium: 63,
        company: 120,
      };

      function computeHas (contracts) {
        return Object.entries($scope.contractTypes).reduce((has, [name, id]) => {
          has[name] = contracts.some(c => c.type.id === id);
          return has;
        }, {});
      }

      function init (contracts) {
        $scope.contracts = contracts;
        $scope.has = computeHas(contracts);

        if (contracts.length === 0 && !$scope.disableAutoRequestGo) {
          depositService.requestContractAndPay({
            person: $scope.me.id,
            contractType: 60,
            contract: null,
          })
          .then(() => {
            alertService.loaded();
            alertService.add('success', 'Je hebt nu een GO contract', 9000);
          });
        }
      }

      init([]);

      if ($scope.me) {
        contractService.forContractor({
          person: $scope.me.id
        })
        .then(init);
      }

      $scope.select = contractTypeName => {
        if (!$scope.me) {
          $log.log('do something else');
        }
        else {
          alertService.load();

          $log.log('requesting contract type:', contractTypeName);

          depositService.requestContractAndPay({
            person: $scope.me.id,
            contractType: $scope.contractTypes[contractTypeName],
            contract: $scope.contracts[0].id,
          })
          .then(goToNextPage)
          .catch(handleError);
        }
      };

      function goToNextPage (res) {
        if (res === 'accept') {
          alertService.loaded();
          alertService.add('success', 'Contractwissel is geslaagd', 9000);
          $state.go('owm.person.profile.contract');
        }
        else if (res === 'new') {
          $state.go('owm.finance.vouchers');
        }
        else {
          alertService.add('danger', 'Er is iets niet helemaal goed gegaan');
        }
      }

      function handleError (err) {
        alertService.loaded();
        alertService.add(err.level || 'danger', err.message);
      }

    },
  };
});
