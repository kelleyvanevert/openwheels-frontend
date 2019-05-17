'use strict';

angular.module('owm.message.index', [])

.controller('MessageIndexController', function (
  $timeout,
  appConfig, me,
  messageService, metaInfoService,
  $scope, $rootScope, $q
) {

  metaInfoService.set({url: appConfig.serverUrl + '/messages'});
  metaInfoService.set({canonical: 'https://mywheels.nl/messages'});

  $scope.me = me;

  const PAGE_SIZE = 15;

  $scope.loading = true;
  $scope.error = false;
  $scope.conversations = [];
  $scope.detailFocus = false; // for mobile

  $scope.hasMore = false;

  $scope.fetchNextPage = function () {
    return $q(function (resolve, reject) {
      $scope.loading = true;

      const offset = $scope.conversations.length;
      const limit = PAGE_SIZE;
      messageService.getMyConversations({ offset, limit }).then(({ result, total }) => {
        result.forEach((conversation, i) => {
          conversation.other = (conversation.sender.id !== me.id) ? conversation.sender : conversation.recipient;
          $scope.conversations[offset + i] = conversation;
        });
        if (total && total > $scope.conversations.length) {
          $scope.hasMore = true;
        } else if (total && total <= $scope.conversations.length) {
          $scope.hasMore = false;
        }

        $scope.loading = false;
        resolve(result);
      });
    });
  }

  // kick-off
  $scope.fetchNextPage().then(firstPage => {
    if ($rootScope.isWindowSizeMD && firstPage.length > 0) {
      // only automatically select the first conversation if on desktop
      $scope.selectedConversation = firstPage[0];
      $scope.detailFocus = true;
    }
    $scope.loading = false;
  }).catch(() => {
    $scope.error = true;
    $scope.loading = false;
  });

  $scope.selectedConversation = null;

  $scope.selectConversation = function (conversation) {
    $scope.selectedConversation = null;
    $timeout(function () {
      $scope.selectedConversation = conversation;
      $scope.detailFocus = true;
    }, 100);
  };

  $scope.focusMaster = function () {
    $scope.detailFocus = false;
    $scope.selectedConversation = null;
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
