'use strict';

angular.module('owm.shell')

.controller('FooterController', function ($scope, $rootScope, $window, $translate) {
  $scope.currentLanguage = function() {
    return $translate.use();
  };

  $scope.changeLanguage = function (langKey) {
    $translate.use(langKey);
    $window.moment.lang(langKey);
  };
});
