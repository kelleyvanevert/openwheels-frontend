'use strict';

angular.module('owm.person.profile', [])

.controller('PersonProfileController', function ($scope, $filter, $timeout, $translate, person, alertService,
  hasBooked, $state, $log,
  API_DATE_FORMAT,
  personService, authService, dutchZipcodeService, metaInfoService, appConfig) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard/profile'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard/profile'});

  $scope.hasBooked = hasBooked;

  // deelauto 5

  $scope.sections = [
    { id: 'personal', title: 'Persoonsgegevens', icon: 'person' },
    { id: 'contact', title: 'Contactgegevens', icon: 'phone_android' },
    IS_DEELAUTO ? undefined : { id: 'profiel', title: 'Profiel', icon: 'account_circle' },
    (person.preference !== 'renter' || person.status === 'active') && !person.isBusinessConnected ?
      { id: 'bank', title: 'Bankrekening', icon: 'account_balance_wallet' } :
      undefined,
    { sref: 'owm.person.profile.contract', title: 'Contracten', icon: 'content_paste' },
    { sref: 'owm.person.profile.chipcard', title: 'Chipkaarten', icon: 'train' },
    { sref: 'owm.person.profile.invite-requests', title: 'Machtigingen', icon: 'person_add' },
  ].filter(function (b) { return !!b; });

  // This is definitely a bit hacky, but
  //  this controller is sometimes re-initialized, and sometimes not,
  //  depending on how the user navigates between the (conceptual, not state-) sub-pages.
  // Hence this way to making sure the the page structure is understood well on every nav action.
  function onNav () {
    if ($state.$current.name !== 'owm.person.profile') {
      $scope.highlight = '';
      $scope.currentSection = _.find($scope.sections, function (sect) {
        return sect.sref === $state.$current.name;
      });
    } else {
      $scope.highlight = $state.params.highlight || 'profiel';
      if ($scope.highlight === 'profiel' && IS_DEELAUTO) {
        $scope.highlight = 'personal';
      }
      $scope.currentSection = _.find($scope.sections, function (sect) {
        return sect.id === $scope.highlight;
      });
    }

    $scope.withSidebar = ($state.$current.name !== 'owm.person.profile.contractchoice');
  }
	$scope.$on('$stateChangeSuccess', onNav);

  var masterPerson = null;
  $scope.person = null;
  $scope.genderText = '';
  $scope.allowLicenseRelated = false;
  $scope.alerts = null;
  $scope.contactFormProcessing = false;

  initPerson(person);

  function initPerson (person) {
    masterPerson = person;
    $scope.person = angular.copy(person);

    // certain fields may only be edited if driver license is not yet checked by the office (see template)
    $scope.allowLicenseRelated = (person.driverLicenseStatus !== 'ok');

    // always show at least one phone number field
    ensurePhoneNumber();

    // Gender dropdown is bound to $scope.genderText instead of person.male
    // Binding to person.male doesn't work, because ng-options doesn't differentiate between false and null
    $scope.genderText = (person.male === true ? 'male' : (person.male === false ? 'female' : ''));

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
      form.dateOfBirth.$setViewValue(date.format("YYYY-MM-DD"));
      $scope.person.dateOfBirth = valid ? date.format("YYYY-MM-DD") : null;
      console.log($scope.person.dateOfBirth, valid);
    };

    $timeout(function () {
      $scope.personalDataForm.$setPristine();
      $scope.contactDataForm.$setPristine();
      $scope.settingsForm.$setPristine();
    }, 0);

    initAlerts();
  }

  function initAlerts () {
    var p = $scope.person;
    var alerts = {
      personalData: (!p.firstName || !p.surname || !p.dateOfBirth),
      contactData : (!p.streetName || !p.streetNumber || !p.city || (!p.phoneNumbers || !p.phoneNumbers.length)),
      licenseData : (p.status === 'new')
    };
    $scope.alerts = alerts;
  }

  function onSuccesfulFormSave (buggyPersonWithoutPhoneNumbers) {
    // reload person to get updated phone numbers, because backend returns a person without phoneNumbers
    authService.me(!!'forceReload').then(function (me) {
      alertService.addSaveSuccess();
      angular.merge(masterPerson, me);
      initPerson(me);
    });
  }

  // PERSONAL DATA
  $scope.submitPersonalDataForm = function() {
    alertService.closeAll();
    alertService.load();
    var newProps = $filter('returnDirtyItems')( angular.copy($scope.person), $scope.personalDataForm);
    personService.alter({
      id: person.id,
      newProps: newProps
    })
    .then(onSuccesfulFormSave)
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function() {
      alertService.loaded();
    });
  };

  // CONTACT DATA
  $scope.submitContactDataForm = function() {
    var newProps = $filter('returnDirtyItems')( angular.copy($scope.person), $scope.contactDataForm);

    //add fields not in form
    if(newProps.zipcode || newProps.streetNumber){
      newProps.streetName = $scope.person.streetName;
      newProps.city = $scope.person.city;
      newProps.latitude = $scope.person.latitude;
      newProps.longitude = $scope.person.longitude;
    }

    // add phone numbers (not automatically included by 'returnDirtyItems')
    var shouldSavePhoneNumbers = $scope.person.phoneNumbers && (!angular.equals(masterPerson.phoneNumbers, $scope.person.phoneNumbers));
    if (shouldSavePhoneNumbers) {
      angular.forEach($scope.person.phoneNumbers, function (phoneNumber) {
        if (phoneNumber.number) {
          newProps.phoneNumbers = newProps.phoneNumbers || [];
          newProps.phoneNumbers.push({
            id          : phoneNumber.id,
            number      : phoneNumber.number,
            confidential: phoneNumber.confidential
          });
        }
      });
    }

    if (!Object.keys(newProps).length) {
      // nothing to save
      $scope.contactDataForm.$setPristine();
      return;
    }

    alertService.closeAll();
    alertService.load();
    $scope.contactFormProcessing = true;
    personService.alter({
      id: person.id,
      newProps: newProps
    })
    .then(onSuccesfulFormSave)
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      $scope.contactFormProcessing = false;
      alertService.loaded();
    });
  };

  // SETTINGS
  $scope.submitSettingsForm = function() {
    var newProps = $filter('returnDirtyItems')( angular.copy($scope.person), $scope.settingsForm);

    alertService.closeAll();
    alertService.load();

    personService.alter({
      id: person.id,
      newProps: newProps
    })
    .then(onSuccesfulFormSave)
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function() {
      alertService.loaded();
    });
  };

  const dateTimeConfig = {
    // showAccept: true,
    focusOnShow: false, // (!) important for mobile
    useCurrent: true,
    toolbarPlacement: 'bottom',
  };

  const dateConfig = $scope.dateConfig = {
    ...dateTimeConfig,
    format: 'DD-MM-YYYY',
    // todo maxDate
    widgetPositioning: { // with knowledge of the html (!)
      horizontal: 'auto', // 'left',
      vertical: 'bottom',
    },
    width: '20em',
  };
  $scope.dateOfBirth_viewValue = moment($scope.person.dateOfBirth, API_DATE_FORMAT).format(dateConfig.format);
  $scope.$watch('dateOfBirth_viewValue', () => {
    $scope.person.dateOfBirth = moment($scope.dateOfBirth_viewValue, dateConfig.format).format(API_DATE_FORMAT);
  });

  $scope.$watch(function () {
    return $translate.use();
  }, function (lang) {
    if (lang) {
      $scope.visibilityOptions = [
        {label: $translate.instant('PROFILE_VISIBILITY_PUBLIC'), value: 'public'},
        {label: $translate.instant('PROFILE_VISIBILITY_RENTALRELATIONS'), value: 'rentalrelation_only'},
        {label: $translate.instant('PROFILE_VISIBILITY_MEMBERS'), value: 'members'}
      ];

      $scope.preferenceOptions = [
        {label: $translate.instant('USER_PREFERENCE_RENTER'), value: 'renter',},
        {label: $translate.instant('USER_PREFERENCE_OWNER'), value: 'owner'},
        {label: $translate.instant('USER_PREFERENCE_BOTH'), value: 'both'}
      ];

      $scope.emailPreferenceOptions = [
        {label: $translate.instant('EMAIL_PREFERENCE_ALL'), value: 'all'},
        {label: $translate.instant('EMAIL_PREFERENCE_SOME'), value: 'some'},
        {label: $translate.instant('EMAIL_PREFERENCE_MINIMUM'), value: 'min'}
      ];

      // note that the backend expects literal values 'België' or 'Nederland'
      $scope.countryOptions = [
        {label: 'Nederland', value: 'Nederland'},
        {label: 'België', value: 'België'}
      ];
    }
  });

  $scope.$watch('person.preference', function( newValue ){
    if( newValue === 'renter' ){
      $scope.person.slug = null;
    } else {
      $scope.person.slug = $scope.person.slug || masterPerson.slug;
    }
  });

  /*
   * remove all spaces
   */
  function stripWhitespace (str) {
    var out = str;
    while (out.indexOf(' ') >= 0) {
      out = out.replace(' ', '');
    }
    return out;
  }

  $scope.$watch('[person.zipcode, person.streetNumber]', function( newValue, oldValue ){
    var country;

    if( newValue !== oldValue ){
      if( !( newValue[0] && newValue[1] )) {
        return;
      }

      switch (($scope.person.country || '').toLowerCase()) {
        case 'nl':
        case 'nederland':
          country = 'nl';
          break;
        case 'be':
        case 'belgie':
        case 'belgië':
          country = 'be';
          break;
        default:
          country = 'nl';
      }

      $scope.zipcodeAutocompleting = true;
      dutchZipcodeService.autocomplete({
        country: country,
        zipcode: stripWhitespace(newValue[0]),
        streetNumber: newValue[1]
      })
      .then(function(data) {
        /*jshint sub: true */
        $scope.person.city = data[0].city;
        $scope.person.streetName = data[0].street;
        $scope.person.latitude = data[0].lat;
        $scope.person.longitude = data[0].lng;
      }, function(error) {
        if($scope.person.zipcode !== newValue[0] || $scope.person.streetNumber !== newValue[1] ) {
          //resolved too late
          return;
        }
        $scope.person.city = null;
        $scope.person.streetName = null;
        $scope.person.latitude = null;
        $scope.person.longitude = null;
      })
      .finally(function() {
        $scope.zipcodeAutocompleting = false;
      })
      ;
    }
  }, true);

  $scope.removePhone = function(phone, index) {
    if (!phone.id) {
      $scope.person.phoneNumbers.splice(index, 1);
      return;
    }
    alertService.closeAll();
    alertService.load();
    personService.dropPhoneWithPhoneId({
      id: phone.id
    })
    .then(function () {
      masterPerson.phoneNumbers.splice(index, 1);
      $scope.person.phoneNumbers.splice(index, 1);
      ensurePhoneNumber();
    })
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      alertService.loaded();
    });
  };

  $scope.addPhone = addPhone;
  function addPhone () {
    $scope.person.phoneNumbers = $scope.person.phoneNumbers || [];
    $scope.person.phoneNumbers.push({
      number: '',
      type: 'mobile'
    });
  }

  function ensurePhoneNumber () {
    if (!$scope.person.phoneNumbers || !$scope.person.phoneNumbers.length) {
      addPhone();
    }
  }

  $scope.uploadProfileImage = function (file) {
    $scope.profileImageSuccess = false;
    if (!file) { return; }

    alertService.closeAll();
    alertService.load();
    $scope.refreshProfileImage = true;

    personService.setProfileImage({
      person: $scope.person.id,
    }, {
      image: file
    })
    .then(function (person) {
      $scope.profileImageSuccess = true;
    })
    .catch(function (err) {
      alertService.addError(err);
    })
    .finally(function () {
      alertService.loaded();
      $scope.refreshProfileImage = false;
    });
  };

});
