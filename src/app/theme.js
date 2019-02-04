'use strict';

angular.module('openwheels')

.config (function ($mdThemingProvider) {

  // GENERATED WITH http://angular-md-color.com/
  //
  // MyWheels huisstijl:
  // #5FAAC8 blue (verhuren)
  // #82B955 green (huren)
  // #E6A500 orange (informatie)
  // #E65A37 red
  // #5A5A5A gray

  var customPrimary = { // blue
    '50': '#bedce9',
    '100': '#abd2e2',
    '200': '#98c8dc',
    '300': '#85bed5',
    '400': '#72b4cf',
    '500': '#5FAAC8',
    '600': '#4ca0c1',
    '700': '#3e94b6',
    '800': '#3884a3',
    '900': '#317590',
    'A100': '#d1e6ef',
    'A200': '#e4f1f6',
    'A400': '#f7fbfc',
    'A700': '#2b657d'
  };

  var customAccent = { // orange
    '50': '#ffcb47',
    '100': '#ffc739',
    '200': '#fdc330',
    '300': '#ffbf1d',
    '400': '#eeb219',
    '500': '#e6aa12',
    '600': '#e0a510',
    '700': '#cd980f',
    '800': '#b9890c',
    '900': '#a2780a',
    'A100': '#ffbf1d',
    'A200': '#ffcb47',
    'A400': '#ffd56b',
    'A700': '#9a720c',
  };

  var customWarn = { // red
    '50': '#f4b7a8',
    '100': '#f1a592',
    '200': '#ee927b',
    '300': '#ec7f64',
    '400': '#e96d4e',
    '500': '#E65A37',
    '600': '#e34720',
    '700': '#d03e1a',
    '800': '#b93817',
    '900': '#a33114',
    'A100': '#f7cabf',
    'A200': '#faddd6',
    'A400': '#fdf0ec',
    'A700': '#8c2a12'
  };

  $mdThemingProvider.definePalette('customPrimary', customPrimary);
  $mdThemingProvider.definePalette('customAccent', customAccent);
  $mdThemingProvider.definePalette('customWarn', customWarn);

  $mdThemingProvider.theme('default')
    .primaryPalette('customPrimary')
    .accentPalette('customAccent')
    .warnPalette('customWarn');

});
