'use strict';

angular.module('owm.message.index', [])

.controller('MessageIndexController', function (
  $log, $filter, $timeout,
  appConfig, me,
  messageService, chatPopupService, metaInfoService,
  $scope
) {

  metaInfoService.set({url: appConfig.serverUrl + '/messages'});
  metaInfoService.set({canonical: 'https://mywheels.nl/messages'});

  $scope.me = me;

  $scope.loading = true;
  $scope.error = false;
  $scope.conversations = [];

  messageService.getMyConversations()
  .then(function (conversations) {
    conversations.forEach(function (conversation) {
      conversation.other = (conversation.sender.id !== me.id) ? conversation.sender : conversation.recipient;
    });
    conversations = _.sortBy(conversations, 'date').reverse();

    $scope.conversations = conversations;
    if ($scope.conversations.length > 0) {
      $scope.selectedConversation = $scope.conversations[0];
    }
    $scope.loading = false;
  })
  .catch(function () {
    $scope.error = true;
    $scope.loading = false;
  });

  $scope.selectedConversation = null;

  $scope.selectConversation = function (conversation) {
    $scope.selectedConversation = null;
    $timeout(function () {
      $scope.selectedConversation = conversation;
    }, 100);
  };

  $scope.$on('chat_event', function (event, data) {
    if (data.action === 'newer_messages_loaded') {
      $scope.conversations.forEach(function (conversation) {
        if (conversation.other.id === data.otherPersonId) {
          conversation.date = data.most_recent_message.date;
          conversation.text = data.most_recent_message.text;
          conversation.sender = data.most_recent_message.sender;
          conversation.recipient = data.most_recent_message.recipient;
        }
      });
    }
  });

})
;
