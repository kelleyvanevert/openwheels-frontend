'use strict';

angular.module('owm.chat.controller', [])

.controller('ChatPopupController', function ($scope, chatPopupService, popupTitle, personId) {

  $scope.dismiss = chatPopupService.dismiss;

  $scope.popupTitle = popupTitle;
  $scope.personId = personId;
})
;
