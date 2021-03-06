'use strict';

angular.module('owmlanding.mywheels-zakelijk', ['slick'])

.controller('MyWheelsZakelijkController', function (metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/zakelijk'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/zakelijk'});

  metaInfoService.set({
    title: 'MyWheels Zakelijk',
    description: 'MyWheels Zakelijk',
  });

});
