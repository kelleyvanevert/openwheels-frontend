'use strict';

angular.module('owm.chat', [
  'owm.chat.service',
  'owm.chat.controller'
])

.directive('chatContainer', function chatContainer (
  $timeout, $q, $filter, $log,
  authService, chatPopupService, messageService, alertService,
  Analytics
) {

  // The directive
  // =====

  return {
    restrict: 'E',
    replace: true,
    scope: {
      personId: '=',
    },
    templateUrl: 'chat/chatContainer.tpl.html',
    controller: function ($scope, $element) {

      var me = authService.user.identity;
      if (!me) {
        throw 'ERR';
      }

      var INITIAL_MESSAGE_COUNT        = 20;
      var OLDER_MESSAGES_COUNT         = 20;
      var SHOW_REFRESH_BUTTON_AFTER_MS = 15000;
      var AUTO_REFRESH_AFTER_MS        = 60000;

      var autoRefreshTimeout, refreshButtonTimeout;

      $scope.me = me;
      $scope.messages = [];
      $scope.message = '';
      $scope.isLoading = false;
      $scope.isAutoRefreshing = false;
      $scope.showRefreshButton = false;
      $scope.showBeforeButton = false;

      getConversation();

      function scrollToBottom () {
        var measureElm = $element.find('.chat-height-measure');
        var scrollContainer = $element.find('.chat-content');
        scrollContainer.scrollTop(measureElm.height());
      }

      function focusInput () {
        $element.find('.chat-input').focus();
      }

      function getConversation () {
        $scope.isLoading = true;

        messageService.getConversationWith({
          person: $scope.personId,
          max : INITIAL_MESSAGE_COUNT
        })
        .then(function (messages) {
          $scope.messages = messages && messages.length ? $filter('orderBy')(messages, 'id') : [];
          $scope.lastUpdate = moment();

          if ($scope.messages.length >= INITIAL_MESSAGE_COUNT) {
            $scope.showBeforeButton = true;
          }

          $timeout(focusInput, 0);
          $timeout(scrollToBottom, 500);

          restartRefreshButtonTimeout();
          restartAutoRefreshTimeout();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isLoading = false;
          $timeout(scrollToBottom, 0);
          $timeout(focusInput, 0);
        });
      }

      function getOlderMessages () {
        if (!$scope.messages.length) {
          var dfd = $q.defer();
          dfd.resolve(0);
          return dfd.promise();
        }

        return messageService.getMessagesBefore({
          message: $scope.messages[0].id,
          person: $scope.personId,
          max: OLDER_MESSAGES_COUNT
        })
        .then(function (messages) {
          var count = 0;
          if (messages && messages.length) {
            angular.forEach($filter('orderBy')(messages, 'id', true), function (message) {
              $scope.messages.unshift(message);
              count++;
            });
          }
          if (count < OLDER_MESSAGES_COUNT) {
            $scope.showBeforeButton = false;
          }
          return count;
        });
      }

      function getNewerMessages () {
        if (!$scope.messages.length) {
          return getConversation();
        }

        return messageService.getMessagesAfter({
          message: $scope.messages[$scope.messages.length - 1].id,
          person : $scope.personId
        })
        .then(function (messages) {
          var count = 0;
          angular.forEach($filter('orderBy')(messages, 'id'), function (message) {
            $scope.messages.push(message);
            count++;
          });
          $scope.$emit('chat_event', {
            action: 'newer_messages_loaded',
            most_recent_message: $scope.messages[$scope.messages.length - 1],
            otherPersonId: $scope.personId,
          });
          $scope.lastUpdate = moment();
          $timeout(scrollToBottom, 100);

          return count;
        });
      }

      $scope.sendMessage = function (message) {
        $scope.isLoading = true;
        $scope.showRefreshButton = false;
        $timeout.cancel(autoRefreshTimeout);
        chatPopupService.scrollToBottom();

        var params = {
          recipient: $scope.personId,
          text: message
        };
        messageService.sendMessageTo(params)
        .then(function () {
          Analytics.trackEvent('discovery', 'send_message', null, undefined, true);
          $scope.$emit('chat_event', {
            action: 'message_sent',
            message_text: $scope.message,
            otherPersonId: $scope.personId,
          });
          $scope.message = '';
          return getNewerMessages();
        })
        .catch(function (err) {
          alertService.addError(err);
        })
        .finally(function () {
          $scope.isLoading = false;

          scrollToBottom();
          $timeout(focusInput, 0);

          restartRefreshButtonTimeout();
          restartAutoRefreshTimeout();
        });
      };

      $scope.getOlderMessages = function () {
        $scope.isBeforeLoading = true;
        getOlderMessages().finally(function () {
          $scope.isBeforeLoading = false;
        });
      };

      $scope.refresh = function () {
        $scope.isLoading = true;
        $timeout.cancel(autoRefreshTimeout);

        getNewerMessages().then(function (numberOfNewMessages) {
          scrollToBottom();
        })
        .finally(function () {
          $scope.isLoading = false;

          restartRefreshButtonTimeout();
          restartAutoRefreshTimeout();

          scrollToBottom();
          $timeout(focusInput, 0);
        });
      };

      function restartRefreshButtonTimeout () {
        $timeout.cancel(refreshButtonTimeout);

        $scope.showRefreshButton = false;
        refreshButtonTimeout = $timeout(function () {
          if ($scope.messages.length) {
            $scope.showRefreshButton = true;
          }
        }, SHOW_REFRESH_BUTTON_AFTER_MS);
      }

      function restartAutoRefreshTimeout () {
        $timeout.cancel(autoRefreshTimeout);

        autoRefreshTimeout = $timeout(function () {
          $scope.showRefreshButton = false;
          $scope.isLoading = true;

          getNewerMessages().then(function (numberOfNewMessages) {
            if (numberOfNewMessages > 0) {
              scrollToBottom();
            }
          }).finally(function () {
            $scope.isLoading = false;
            restartRefreshButtonTimeout();
            restartAutoRefreshTimeout();
          });
        }, AUTO_REFRESH_AFTER_MS);
      }

      $scope.$on('$destroy', function () {
        $timeout.cancel(autoRefreshTimeout);
      });

    },
  };

})
;