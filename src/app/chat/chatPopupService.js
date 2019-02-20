'use strict';

angular.module('owm.chat.service', [])

.factory('chatPopupService', function ($log, $uibModal, $timeout, authService) {

  var modalInstance;

  function openPopup (otherPersonName, otherPersonId) {
    if (!authService.user.isAuthenticated) {
      $log.debug('Login is required for chatting');
      return;
    }
    modalInstance = $uibModal.open({
      templateUrl: 'chat/chatPopup.tpl.html',
      controller : 'ChatPopupController',
      windowClass: 'modal-chat',
      resolve: {
        popupTitle: function () { return 'Gesprek met ' + otherPersonName; },
        personId  : function () { return otherPersonId; },
      }
    });
  }

  function dismiss () {
    modalInstance.dismiss();
  }

  function scrollToBottom () {
    $timeout(function () {
      var measureElm = angular.element('.modal-chat .chat-height-measure');
      var scrollContainer = angular.element('.modal-chat .chat-content');
      scrollContainer.scrollTop(measureElm.height());
    }, 0);
  }

  function focusInput () {
    $timeout(function () {
      angular.element('.modal-chat .chat-input').focus();
    }, 0);
  }

  return {
    openPopup: openPopup,
    dismiss: dismiss,
    scrollToBottom: scrollToBottom,
    focusInput: focusInput
  };

})
;
