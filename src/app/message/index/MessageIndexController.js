'use strict';

angular.module('owm.message.index', [])

.controller('MessageIndexController', function ($filter, $scope, chatPopupService, me, conversations, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/messages'});
  metaInfoService.set({canonical: 'https://mywheels.nl/messages'});

  $scope.me = me;
  $scope.conversations = conversations;

  $scope.selectConversation = function (conversation) {
    var otherPerson = conversation.sender.id === me.id ? conversation.recipient : conversation.sender;

    chatPopupService.openPopup($filter('fullname')(otherPerson),
      otherPerson.id,
      null, // resourceId
      null  // bookingId
    );
  };

})
;
