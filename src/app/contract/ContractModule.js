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
      me: ['authService', function (authService) {
        return authService.me();
      }],
    },
  });
});
