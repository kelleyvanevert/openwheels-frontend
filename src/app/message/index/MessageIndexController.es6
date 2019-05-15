'use strict';

angular.module('owm.message.index', [])

.controller('MessageIndexController', function (
  $timeout,
  appConfig, me,
  messageService, metaInfoService,
  $scope, $rootScope
) {

  metaInfoService.set({url: appConfig.serverUrl + '/messages'});
  metaInfoService.set({canonical: 'https://mywheels.nl/messages'});

  $scope.me = me;

  $scope.loading = true;
  $scope.error = false;
  $scope.conversations = [];
  $scope.detailFocus = false; // for mobile

  $scope.conversationsDynamic = {
    PAGE_SIZE: 5,
    total: 0,
    pageStatuses: {},
    async fetchPage (pageNumber) {
      const offset = pageNumber * this.PAGE_SIZE;
      const limit = this.PAGE_SIZE;
      const { result, total } = await messageService.getMyConversations({ offset, limit });
      if (result.length === 0 && pageNumber > 0) {
        return result;
      }
      this.total = total;
      result.forEach((conversation, i) => {
        conversation.other = (conversation.sender.id !== me.id) ? conversation.sender : conversation.recipient;
        $scope.conversations[offset + i] = conversation;
      });
      return result;
    },
    getItemAtIndex (i) {
      const item = $scope.conversations[i];
      if (item) {
        return item;
      } else {
        const pageNumber = Math.floor(i / this.PAGE_SIZE);
        if (!this.pageStatuses[pageNumber]) {
          this.pageStatuses[pageNumber] = true;
          this.fetchPage(pageNumber);
        }
      }
    },
    getLength () {
      return this.total;
    },
  };

  $scope.conversationsDynamic.fetchPage(0).then(firstPage => {
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
