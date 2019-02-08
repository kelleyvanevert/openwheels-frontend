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

    /*
    // tmp
    var otherPersonName = conversation.other.firstName;
    var otherPersonId = conversation.other.id;
    var resourceId = null;
    var bookingId = null;

    modalInstance = $uibModal.open({
      templateUrl: 'chat/chatPopup.tpl.html',
      controller : 'ChatPopupController',
      windowClass: 'modal-chat',
      resolve: {
        popupTitle: function () { return 'Gesprek met ' + otherPersonName; },
        me        : function () { return authService.user.identity; },
        personId  : function () { return otherPersonId; },
        resourceId: function () { return resourceId; },
        bookingId : function () { return bookingId; }
      }
    });
    */

    /*
    var otherPerson = conversation.sender.id === me.id ? conversation.recipient : conversation.sender;

    chatPopupService.openPopup($filter('fullname')(otherPerson),
      otherPerson.id,
      null, // resourceId
      null  // bookingId
    );
    */
  };

})
;
