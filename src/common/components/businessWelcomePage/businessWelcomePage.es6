'use strict';

angular.module('owm.components')

.directive('businessWelcomePage', function (
  $state,
  $log,
  $timeout,
  $translate,
  API_DATE_FORMAT,

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
        viewMode: 'years',
      };

      $scope.numSteps = 2;
      const blacklisted = $rootScope.providerInfo.extraInfo.personProfileBlacklist;
      if (blacklisted.driverLicense && blacklisted.dateOfBirth && blacklisted.gender && blacklisted.externalIdentifier) {
        $scope.numSteps = 1;
      }

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
        }

        if ($scope.step + 1 === $scope.numSteps) {
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

      const m = $scope.person.dateOfBirth ? moment($scope.person.dateOfBirth, API_DATE_FORMAT) : null;
      $scope.dateOfBirth = m ? {
        day: m.date(),
        month: m.month() + 1,
        year: m.year(),
      } : {
        day: null,
        month: null,
        year: null,
      };

      $scope.months = [
        {label: $translate.instant('JANUARY'), value: 1},
        {label: $translate.instant('FEBRUARY'), value: 2},
        {label: $translate.instant('MARCH'), value: 3},
        {label: $translate.instant('APRIL'), value: 4},
        {label: $translate.instant('MAY'), value: 5},
        {label: $translate.instant('JUNE'), value: 6},
        {label: $translate.instant('JULY'), value: 7},
        {label: $translate.instant('AUGUST'), value: 8},
        {label: $translate.instant('SEPTEMBER'), value: 9},
        {label: $translate.instant('OCTOBER'), value: 10},
        {label: $translate.instant('NOVEMBER'), value: 11},
        {label: $translate.instant('DECEMBER'), value: 12},
      ];

      $scope.setDateOfBirth = form => {
        const date = moment([$scope.dateOfBirth.day, $scope.dateOfBirth.month, $scope.dateOfBirth.year].join("-"), "DD-MM-YYYY");
        const valid = !!($scope.dateOfBirth.day && $scope.dateOfBirth.month && $scope.dateOfBirth.year && date.isValid() && date.isBefore(moment()));
        form.dateOfBirth.$setValidity("validAndPast", valid);
        // form.dateOfBirth.$setViewValue(date.format("YYYY-MM-DD"));
        $scope.person.dateOfBirth = date.format("YYYY-MM-DD");
        console.log($scope.person.dateOfBirth, valid);
      };

    },
  };
});
