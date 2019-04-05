'use strict';
angular.module('owm.contract.contractchoice', [])

.controller('ContractChoiceController', function ($scope, me, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/contractkeuze'});
  metaInfoService.set({canonical: 'https://mywheels.nl/contractkeuze'});

  $scope.me = me;

});
