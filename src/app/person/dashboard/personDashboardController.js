'use strict';

angular.module('owm.person.dashboard', [])

.controller('PersonDashboardController', function ($q, $scope, $sce, $state, me, bookingList, rentalList, actions, person,
  homeAddressPrefill, $filter,
  authService, bookingService, alertService, boardcomputerService, actionService, resourceService, resourceQueryService,
  blogItems, $localStorage, personService, dialogService, $translate, $timeout, Analytics, metaInfoService, appConfig, $window) {

  metaInfoService.set({url: appConfig.serverUrl + '/dashboard'});
  metaInfoService.set({canonical: 'https://mywheels.nl/dashboard'});

  $scope.person = person;

  // if the user has any succesful bookings in the past, or any (open) booking (requests) in the future
  $scope.hasBooked = ($scope.person.numberOfBookings + bookingList.totalBookings) > 0;
  
  $scope.homeAddressPrefill = homeAddressPrefill;

/*
  $scope.dashboardLinks = [];
  if (me.provider.id === 1 && me.preference) {
    if (me.preference !== 'owner') {
      $scope.dashboardLinks = [
        { sref: 'owm.trips', title: $filter('translate')('MY_TRIPS') },
        { sref: 'owm.finance.v4', title: $filter('translate')('MY_FINANCE') },
        { sref: 'owm.message', title: $filter('translate')('MY_MESSAGES') },
        { sref: 'invite', title: $filter('translate')('INVITE_FRIENDS_MENU') },
        { sref: 'owm.person.aboutme', title: $filter('translate')('MY_MEMBER_PAGE') },
      ];
    }
    else if (me.preference === 'owner' && resource.length > 0) {
      $scope.dashboardLinks = [
        { sref: 'owm.trips', title: $filter('translate')('TRIPS_BOOKINGS_FOR_OWNER') },
        { sref: '' },
        { sref: 'owm.resource.own', title: $filter('translate')('RESOURCE_EDIT_CALENDAR') },
        { sref: 'owm.resource.own', title: $filter('translate')('MY_RESOURCES') },
        { sref: 'invite', title: $filter('translate')('INVITE_FRIENDS_MENU') },
        { sref: 'owm.finance.v4', title: $filter('translate')('MY_FINANCE') },
      ];
    }
  }
            <md-tab ng-if="resources.length === 1"><md-tab-label>
              <a ng-href="{{ $state.href('owm.resource.calendar', { city: resources[0].city, resourceId: resources[0].id }) }}">{{ 'RESOURCE_EDIT_CALENDAR' | translate }}</a>
            </md-tab-label></md-tab>


          <md-tabs class="shortcut" ng-if="me.preference === 'owner' && resources.length === 0">
            <md-tab><md-tab-label>
              <a ui-sref="list-your-car">{{ 'CREATE_RESOURCE_BUTTON' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.trips">{{ 'TRIPS_BOOKINGS_FOR_OWNER' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.finance.v4">{{ 'MY_FINANCE' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="invite">{{ 'INVITE_FRIENDS_MENU' | translate }}</a>
            </md-tab-label></md-tab>
          </md-tabs>

        </div>
      </div>

      <!-- SHORTCUT DEELAUTO -->
      <div class="card" ng-if="me.provider.id === 5 && me.preference">
        <div class="card-body no-padding">

          <md-tabs class="shortcut" ng-if="me.preference === 'owner' && resources.length === 0">
            <md-tab><md-tab-label>
              <a ui-sref="owm.resource.own">{{ 'CREATE_RESOURCE_BUTTON' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.person.profile">{{ 'ADD_PROFILE_PERSONAL' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.finance.contributie">{{ 'PAY_SUBSCRIPTION' | translate }}</a>
            </md-tab-label></md-tab>
          </md-tabs>

          <md-tabs class="shortcut" ng-if="me.preference === 'owner' && resources.length > 0">
            <md-tab><md-tab-label>
              <a ui-sref="owm.resource.own">{{ 'ADD_PARKING_PERMIT' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.resource.own">{{ 'ADD_MEMBERS' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.person.profile">{{ 'ADD_PROFILE_PERSONAL' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.finance.contributie">{{ 'PAY_SUBSCRIPTION' | translate }}</a>
            </md-tab-label></md-tab>
          </md-tabs>

          <md-tabs class="shortcut" ng-if="me.preference !== 'owner'">
            <md-tab><md-tab-label>
              <a ui-sref="owm.person.profile">{{ 'ADD_PROFILE_PERSONAL' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a ui-sref="owm.finance.contributie">{{ 'PAY_SUBSCRIPTION' | translate }}</a>
            </md-tab-label></md-tab>
            <md-tab><md-tab-label>
              <a href="{{ 'NAVBAR.HOW_IT_WORKS_URL' | translate }}">{{ 'NAVBAR.HOW_IT_WORKS' | translate }}</a>
            </md-tab-label></md-tab>
          </md-tabs>
*/

  // If booking_before_signup in local storage exists that means we have been redirected to this page after facebook signup
  // decide where to go next and try to guess user preference. If we do not know what flow to redirect
  // to, we present the user a modal and ask what he/she wants to do
  //
  // Else show normal dashboard/intro page
  if($localStorage.booking_before_signup) {
    var data = angular.copy($localStorage.booking_before_signup);
    delete $localStorage.booking_before_signup;
    if(data.flow === 'add_resource') {
      setPreference('owner');
      $state.go('owm.resource.create.carInfo', data);
    } else if(data.flow === 'booking') {
      setPreference('renter');
      $state.go('owm.person.details', data);
    } else if(data.flow === 'subscribe_resource_show') {
      setPreference('renter');
      $state.go('owm.resource.show', data);
    } else if (!me.preference){
      showModal()
      .then(redirect);
    }
  } else {
    if(me.status === 'new' && !me.preference && !me.extraDriver) {
      showModal()
      .then(redirect);
    } else if(me.status === 'new' && me.preference !== 'owner' && !me.extraDriver) {
      $state.go('owm.person.intro');
    }
  }

  function redirect(a) {
    if(me.preference === 'renter' || me.preference === 'both') {
      $state.go('owm.person.intro');
    } else {
      $timeout(function() {
        actionService.all({
          person: me.id
        })
        .then(function(res) {
          angular.extend($scope.actions, res);
        });
      });
    }
  }

  $scope.goToMyWheelsOpen = function() {
    window.open('/open','_blank');
  };

  $scope.goToInviteFriends = function() {
    $state.go('invite');
  };

  function setPreference(pref) {
    if(!me.preference) {
      return personService.alter({person: me.id, newProps: {preference: pref}})
      .then(function(res) {
        me = res;
        return me;
      })
      .catch(function(err) {
      })
      ;
    }
  }

  function showModal() {
    var initOptions = function () {
      return [{
        label: $translate.instant('USER_PREFERENCE_RENTER'),
        value: 'renter'
      }, {
        label: $translate.instant('USER_PREFERENCE_OWNER'),
        value: 'owner'
      }, {
        label: $translate.instant('USER_PREFERENCE_BOTH'),
        value: 'both'
      }];
    };

    initOptions = initOptions();
    return dialogService.showModal({templateUrl: 'person/dashboard/preference-dialog.tpl.html'}, {
      me: me,
      preferenceOptions: initOptions,
    })
    .then(setPreference);
  }

  $scope.me = me;
  $scope.blogItems = blogItems;
  $scope.bookings = bookingList.bookings;
  $scope.totalBookings = bookingList.totalBookings;
  $scope.rentals = rentalList.bookings;
  $scope.totalRentals = rentalList.totalBookings;
  $scope.actions = actions;
  $scope.favoriteResources = null;
  $scope.membersResources = null;
  $scope.search = {
    text: ''
  };
  if (me.preference !== 'owner') {
    loadFavoriteResources();
    loadMemberResources();
  }

  if (me.preference !== 'renter') {
    loadResources();
  }

  if(me.registerSource === 'facebook_register') {
    Analytics.trackEvent('person', 'created', me.id, undefined, true);
    saveRegisterSource('facebook_login');
  }

  //Syntus Utrecht offer for MyWheels Open
  if ($scope.me.zipcode) {
    $scope.zipcode = $scope.me.zipcode.substring(0, 4);
    $scope.MyWheelsOpenUtrecht = ($scope.zipcode >= 3400 && $scope.zipcode <= 4133 && ['Culemborg', 'Den Haag', '\'s-Gravenhage'].indexOf($scope.me.city) < 0) ? true : false;
  } else {
    $scope.MyWheelsOpenUtrecht = false;
  }

  $scope.renderHtml = function (html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.doSearch = function (placeDetails) {
    if (placeDetails) {
      resourceQueryService.setText($scope.search.text);
      resourceQueryService.setLocation({
        latitude: placeDetails.geometry.location.lat(),
        longitude: placeDetails.geometry.location.lng()
      });
    }
    $state.go('owm.resource.search.list', resourceQueryService.createStateParams());
  };


  $scope.deleteAction = function (action) {
    alertService.load();
    actionService.delete({
        action: action.id
      })
      .then(function (result) {
        if (result.deleted === true) {
          $scope.actions.splice($scope.actions.indexOf(action), 1);
        } else {
          return $q.reject(new Error('De actie kan niet worden verwijderd.'));
        }
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
      });
  };

  function saveRegisterSource(result) {
    var params = {
      person: me.id,
      newProps: {
        registerSource: result
      }
    };

    alertService.load();
    $scope.busy = true;
    personService.alter(params).then(function () {

    })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        alertService.loaded();
        $scope.busy = false;
      });
  }

  function loadResources() {
    resourceService.forOwner({
        person: me.id,
        removed: false
      }).then(function (resources) {
        $scope.resources = resources || [];
      })
      .catch(function () {
        $scope.resources = [];
      });
  }

  function loadFavoriteResources() {
    resourceService.getFavorites({
        maxResults: 5
      }).then(function (favoriteResources) {
        $scope.favoriteResources = favoriteResources || [];
      })
      .catch(function () {
        $scope.favoriteResources = [];
      });
  }

  function loadMemberResources() {
    resourceService.getMemberResources({
      person: $scope.me.id
    })
    .then(function (membersResources) {
      $scope.membersResources = membersResources || [];
    })
    .catch(function () {
      $scope.membersResources = [];
    });
  }

  $scope.selectFavoriteResource = function (resource) {
    $state.go('owm.resource.show', {
      resourceId: resource.id,
      city: (resource.city || '').toLowerCase().replace(/ /g, '-')
    });
  };

});
