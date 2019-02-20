'use strict';
angular.module('owm.contract', [
  'owm.contract.contractchoice'
])

.config(function($stateProvider) {
  $stateProvider.state('contractchoice', {
    url: '/contractkeuze',
    parent: 'owm',
    views: {
      'main-full@shell': {
        templateUrl: 'contract/contractchoice.tpl.html',
        controller: 'ContractChoiceController'
      }
    },
    data: {
      denyAnonymous: true
    },
    resolve: {
      person: ['authService', function (authService) {
        return authService.me();
      }],
      contracts: ['$stateParams', 'person', 'contractService', function ($stateParams, person, contractService) {
        return contractService.forContractor({
          person: person.id
        });
      }]
    },
  });
});
