'use strict';

angular.module('owm.components')

.directive('businessWelcomePage', function (
  $state,
  $log,
  $timeout,

  alertService,

  personService,
  authService,
  dutchZipcodeService
) {
  return {
    restrict: 'E',
    scope: {
      me: '=',
    },
    templateUrl: 'components/businessWelcomePage/businessWelcomePage.tpl.html',
    controller: function ($scope, $rootScope, blacklistFilterPersonProps) {

      $scope.person = angular.copy($scope.me);

      const dateTimeConfig = {
        // showAccept: true,
        focusOnShow: false, // (!) important for mobile
        useCurrent: true,
        toolbarPlacement: 'bottom',
      };

      const dateConfig = $scope.dateConfig = {
        ...dateTimeConfig,
        format: 'DD-MM-YYYY',
        widgetPositioning: { // with knowledge of the html (!)
          horizontal: 'auto', // 'left',
          vertical: 'bottom',
        },
        width: '20em',
      };

      $scope.step = 0;
      $scope.loading = false;
      // if ($scope.person.firstName && $scope.person.surname && $scope.person.zipcode && $scope.person.streetNumber) {
      //   $scope.step = 1;
      // }

      $scope.next = function (form) {
        if (!form.$valid) {
          angular.forEach(form.$error, field => {
            angular.forEach(field, errorField => {
              errorField.$setTouched();
            });
          });
          return;
        }
        $scope.apiError = null;

        let newProps;
        $scope.loading = true;

        if ($scope.step === 0) {
          newProps = blacklistFilterPersonProps(_.pick($scope.person, [
            "firstName",
            "preposition",
            "surname",
            "zipcode",
            "streetNumber",
            "city",
            "streetName",
            "latitude",
            "longitude",
          ]));
        } else if ($scope.step === 1) {
          newProps = blacklistFilterPersonProps(_.pick($scope.person, [
            "driverLicenseNumber",
            "drivingLicenseValidUntil",
            "dateOfBirth",
            "male",
            "externalIdentifier",
          ]));
          newProps.flowCompleted = true;
        }

        personService.alter({
          person: $scope.person.id,
          newProps,
        })
        .then(updatedPerson => {
          $scope.step++;
        })
        .catch(error => {
          $scope.apiError = error.message;
        })
        .finally(() => {
          $scope.loading = false;
        });
      };

      $scope.ensureFlowCompleted = () => {
        authService.user.identity.flowCompleted = true;
      };

      var phoneNumber = {
        ensure: function () {
          if (!$scope.person.phoneNumbers || !$scope.person.phoneNumbers.length) {
            phoneNumber.add();
          }
        },
        add: function () {
          $scope.person.phoneNumbers = $scope.person.phoneNumbers || [];
          $scope.person.phoneNumbers.push({
            number: '',
            type: 'mobile'
          });
        }
      };

      phoneNumber.ensure();

      $scope.phoneUpdate = profileForm => phoneNumbers => {
        profileForm.$setValidity("phoneNumber", phoneNumbers.reduce((anyVerified, pn) => pn.verified || anyVerified, false));
      };

      $scope.$watch('[person.zipcode, person.streetNumber]', ([zipcode, streetNumber]) => {
        if (!zipcode || !streetNumber) {
          return;
        }

        $scope.zipcodeAutocompleting = true;

        dutchZipcodeService.autocomplete({
          country: "nl",
          zipcode: zipcode.replace(/ /g, ""),
          streetNumber,
        })
        .then(([ { city, street, lat, lng } ]) => {
          /*jshint sub: true */
          $scope.person.city = city;
          $scope.person.streetName = street;
          $scope.person.latitude = lat;
          $scope.person.longitude = lng;
        })
        .catch(error => {
          if ($scope.person.zipcode !== zipcode || $scope.person.streetNumber !== streetNumber) {
            //resolved too late
            return;
          }
          $scope.person.city = null;
          $scope.person.streetName = null;
          $scope.person.latitude = null;
          $scope.person.longitude = null;
        })
        .finally(() => {
          $scope.zipcodeAutocompleting = false;
        });
      }, true);

      $scope.setLicenseDateValidUntil = form => {
        const date = moment(form.licenseDateValidUntil.$viewValue, dateConfig.format);
        const valid = date.isValid() && date.isAfter(moment());
        form.licenseDateValidUntil.$setValidity("validAndFuture", valid);
        $scope.person.drivingLicenseValidUntil = date.format("YYYY-MM-DD");
      };

      $scope.setDateOfBirth = form => {
        const date = moment(form.dateOfBirth.$viewValue, dateConfig.format);
        const valid = date.isValid() && date.isBefore(moment());
        form.dateOfBirth.$setValidity("validAndPast", valid);
        $scope.person.dateOfBirth = date.format("YYYY-MM-DD");
      };

    },
  };
});
