'use strict';

angular.module('owm.components')

.directive('requestInfoForm', function (
  $log,

  Analytics,

  personService,
  formSubmissionService
) {
  return {
    restrict: 'E',
    scope: {
      me: '=', // optional

      // White-list certain hard-coded extra fields
      extraFields: '=',

      submitText: '@',
      trackEvent: '@',
      formName: '@',
    },
    templateUrl: 'components/requestInfoForm/requestInfoForm.tpl.html',
    controller: function ($scope) {

      $scope.extraFields = $scope.extraFields || {};

      $scope.formEntry = {
        numEmployees: '',
        numCars: '',
        model: '',
        comment: '',
        streetNumber: '',
      };
      $scope.formSendStatus = false;

      personService.meAnonymous().then(autoFill).catch(function () {});

      function autoFill (user) {
        if ($scope.form && $scope.form.$pristine) {
          $scope.formEntry.email = user.email;
          $scope.formEntry.firstName = user.firstName;
          $scope.formEntry.surname = (user.preposition ? (user.preposition + ' ') : '') + user.surname;
          $scope.formEntry.zipcode = user.zipcode;
          if ($scope.extraFields.streetNumber) {
            $scope.formEntry.streetNumber = user.streetNumber;
          }
          if (user.phoneNumbers && user.phoneNumbers.length > 0) {
            var preferred = user.phoneNumbers[0].number;
            for (var i = 0; i < user.phoneNumbers.length; i++) {
              if (user.phoneNumbers[i].type === 'mobile') {
                preferred = user.phoneNumbers[i].number;
              }
            }
            $scope.formEntry.phoneNumber = preferred;
          }
        } else {
          // noop
        }
      }

      $scope.submit = function () {
        if ($scope.form.$valid) {
          $scope.formSendStatus = 'sending';

          formSubmissionService.send({
            type: $scope.formName || 'mw_request_info_form',
            email: $scope.formEntry.email,
            firstName: $scope.formEntry.firstName,
            surname: $scope.formEntry.surname,
            zipcode: $scope.formEntry.zipcode,
            phoneNumber: $scope.formEntry.phoneNumber,
            extraInfo: Object.keys($scope.extraFields).reduce((extraInfo, field) => {
              extraInfo[field] = $scope.formEntry[field];
              return extraInfo;
            }, {}),
          })
          .then(function (r) {
            $scope.formSendStatus = 'success';
            if ($scope.trackEvent) {
              Analytics.trackEvent('forms', $scope.trackEvent || 'mw_request_info_form', undefined, undefined, true);
            }
          })
          .catch(function (e) {
            $scope.formSendStatus = 'error';
            if ($scope.trackEvent) {
              Analytics.trackEvent('exceptions', $scope.trackEvent || 'mw_request_info_form', undefined, undefined, true);
            }
          })
          .finally(function () {
            // hi
          });
        }
      };

    },
  };
});
