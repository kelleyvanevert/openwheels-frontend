'use strict';
angular.module('owm.person')

.controller('PersonContractIndexController', function ($q, $filter, $uibModal, $translate, $scope, $log,
  authService, dialogService, alertService, personService, contractService, me, Analytics, metaInfoService, appConfig, extraDriverService) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard/profile/contracts'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard/profile/contracts'});

  $scope.busy = false;
  $scope.isLoadingContracts = true;
  $scope.ownContracts = [];
  $scope.ownContractsCopy = [];
  $scope.otherContracts = [];
  $scope.personsOnContracts = [];
  $scope.hasMoreToLoad = false;
  $scope.isLoadingMore = false;
  $scope.showLoaderSpinner = false;

  $scope.age = -1;
  if(authService.user.isAuthenticated && authService.user.identity.dateOfBirth) {
    var dob = moment(authService.user.identity.dateOfBirth);
    $scope.age  = Math.abs(dob.diff(moment(), 'years'));
  }

  loadContracts().finally(function () {
    $scope.isLoadingContracts = false;
  });

  function loadContracts () {
    var ownContractsPromise = contractService.forContractor({ person: me.id });
    var otherContractsPromise = contractService.forDriver({ person: me.id });

    //alertService.load();
    return $q.all([ownContractsPromise, otherContractsPromise])
    .then(function (result) {
      $scope.ownContracts = result[0];
      $scope.ownContractsCopy = angular.copy(result[0]);
      $scope.otherContracts = $filter('filter')(result[1], function (c) {
        return c.contractor.id !== me.id;
      });
      $scope.isLoadingContracts = false;
    })
    .finally(function () {
      //alertService.loaded();
    });
  }

  $scope.getContractPersons = function (contract) {
    return $filter('filter')(contract.persons, function (person) {
      return person.id !== me.id;
    });
  };

  var limit = 25;
  var offset = 0;

  $scope.loadMoreExtraDriverRequestsForContract = function(contract) {

    $scope.showLoaderSpinner = true;
    offset += limit;
    $scope.getExtraDriverRequestsForContract(contract);

  };

  $scope.getExtraDriverRequestsForContract = function(contract) {
    extraDriverService.getRequestsForContract({
      contract : contract.id,
      limit: limit,
      offset: offset
    })
    .then(function (data) {

      angular.forEach(data.result, function(val, key) {
        $scope.personsOnContracts.push(val);
      });

      $scope.hasMoreToLoad = (data.result.length >= limit);
      $scope.showLoaderSpinner = false;

      return $scope.personsOnContracts;
    })
    .catch(function (err) {
      return $scope.personsOnContracts;
    })
    .finally(function () {
    });
  };

  $scope.saveContract = function ($index, form) {
    var original = $scope.ownContractsCopy[$index];
    var contract = $scope.ownContracts[$index];
    var newProps = {};
    if (contract.ownRiskWaiver !== original.ownRiskWaiver) {
      newProps.ownRiskWaiver = contract.ownRiskWaiver;
    }
    if (Object.keys(newProps).length <= 0) {
      return;
    }

    $scope.busy = true;
    contractService.alter({
      id : contract.id,
      newProps: newProps
    })
    .then(function (saved) {
      alertService.addSaveSuccess();
      angular.extend(original, saved);
      angular.extend(contract, saved);
      form.$setPristine();
    })
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      $scope.busy = false;
    });
  };

  $scope.endContract = function ($index) {
    var original = $scope.ownContractsCopy[$index];
    var contract = $scope.ownContracts[$index];

    dialogService.showModal(null, {
      closeButtonText: $translate.instant('CANCEL'),
      actionButtonText: $translate.instant('CONFIRM'),
      headerText: $translate.instant('CONTRACT_END_ACTION'),
      bodyText: $translate.instant('CONTRACT_END_CONFIRM_DESC')
    })
    .then(function () {
      $scope.busy = true;
      contractService.alter({
        id: contract.id,
        newProps: {
          status: 'ended'
        }
      })
      .then(function (saved) {
        Analytics.trackEvent('person', 'contract_ended', contract.id, undefined, true);
        alertService.addSaveSuccess();
        angular.extend(contract, saved);
        angular.extend(original, saved);
        $scope.ownContracts = $filter('filter')($scope.ownContracts, { status: 'active' });
        $scope.ownContractsCopy = angular.copy($scope.ownContracts);
        $scope.isLoadingContracts = true;
        loadContracts();
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        $scope.busy = false;
      });
    });
  };

  function findSinglePerson (email) {
    return personService.search({
      search: email
    }).then(function(results) {
      if (results && results.length) {
        // HACK: put email address (missing in api response)
        results[0].email = email;
        return results[0];
      } else {
        return $q.reject();
      }
    });
  }

  $scope.addPerson = function (index) {
    var contract = $scope.ownContracts[index];
    var email = contract.emailToAdd;
    
    if (me.email === email) {
      alertService.addError({
        message: 'Je kunt jezelf niet toevoegen op je eigen contract',
      });
      return;
    }

    alertService.load();
    extraDriverService.invitePersonForContract({
      contract: contract.id,
      email: email
    })
      .then(function (person) {

        $scope.personsOnContracts.push({
          'status' : 'invited',
          'recipient' : person
        });

        contract.emailToAdd = null;
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
      });
  };

  $scope.removePerson = function (contract, person) {
    var contractId = contract.id;
    var personId = person.id;

    dialogService.showModal(null, {
      closeButtonText: 'Annuleren',
      actionButtonText: 'Akkoord',
      headerText: 'Persoon van contract verwijderen',
      bodyText: 'Weet je zeker dat je deze persoon van je contract wilt verwijderen?'
    }).then(function (result) {
      alertService.load();
      extraDriverService.removePersonFromContract({
        contract: contractId,
        person: personId
      })
      .then(function () {
        // on success, remove from list
        angular.forEach($scope.personsOnContracts, function (request, index) {
          if (request.recipient.id === personId) {
            $scope.personsOnContracts.splice(index, 1);
          }
        });
      })
      .finally(function () {
        alertService.loaded();
      });
    });
  };

});
