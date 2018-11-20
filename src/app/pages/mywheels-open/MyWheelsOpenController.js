'use strict';

angular.module('owm-landing.mywheels-open', ['slick'])

.controller('MyWheelsOpenController', function ($scope, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/mywheels-open'});
  metaInfoService.set({canonical: 'https://mywheels.nl' + '/mywheels-open'});

  metaInfoService.set({
    title: 'MyWheels Open: Verhuur je auto altijd',
    description: 'Laat buren, vrienden en anderen nog makkelijker jouw auto huren. Geen sleuteloverdracht, automatische kilometerregistratie en zorgeloos je auto verhuren waar je ook bent.',
  });

});
