'use strict';

angular.module('owm.finance.kmpoints', [])

.controller('KmPointsController', function ($window, $q, $state, $scope, account2Service, appConfig, alertService, voucherService,
  paymentService, bookingService, me, Analytics, metaInfoService) {

  metaInfoService.set({url: appConfig.serverUrl + '/beheerdersvergoeding'});
  metaInfoService.set({canonical: 'https://mywheels.nl/beheerdersvergoeding'});

});
