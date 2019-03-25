'use strict';

angular.module('owm.resource.edit', [
  'owm.resource.edit.data',
  'owm.resource.edit.sharing_settings',
  'owm.resource.edit.price',
  'owm.resource.edit.members',
  'owm.resource.edit.location',
  'owm.resource.edit.pictures'
])

.controller('ResourceEditController', function ($timeout, $state, $scope, me, resource, members, metaInfoService, appConfig,
  currentSectionId,
  isBeheerder
) {

  metaInfoService.set({url: appConfig.serverUrl + '/auto/' + resource.id + '/wijzigen'});
  metaInfoService.set({canonical: 'https://mywheels.nl/auto/' + resource.id + '/wijzigen'});

  // PERMISSION CHECK
  // Redirect if not owner or contactperson
  $scope.hasPermission = false;
  if (resource.owner.id !== me.id && resource.contactPerson.id !== me.id) {
    $state.go('owm.resource.show', {
      resourceId: resource.id,
      city: (resource.city || '').toLowerCase().replace(/ /g, '-')
    });
  } else {
    $scope.hasPermission = true;
  }

  $scope.isBeheerder = isBeheerder;
  var beheer = isBeheerder(me, resource);

  $scope.sections = [
    { id: 'specificaties', title: 'Specificaties', icon: 'directions_car' },
    { id: 'instellingen', title: 'Instellingen', icon: 'settings' },
    beheer ? undefined : { id: 'prijs', title: 'Huurprijs', icon: 'euro_symbol' },
    { id: 'fotos', title: 'Foto\'s', icon: 'photo_library' },
    { id: 'locatie', title: 'Locatie', icon: 'location_on' },
    { id: 'vrienden', title: 'Vrienden van deze auto', icon: 'people' },
    beheer ? undefined : { id: 'kortingscodes', title: 'Kortingscodes', icon: 'local_offer' },
  ].filter(function (b) { return !!b; });

  function onNav () {
    $scope.currentSection = _.find($scope.sections, function (sect) {
      return sect.id === currentSectionId;
    }) || $scope.sections[0];
  }
	$scope.$on('$stateChangeSuccess', onNav);

  $scope.navToSection = function (section) {
    $scope.currentSection = section;
    $state.transitionTo('owm.resource.edit', { resourceId: resource.id, section: section.id }, { notify: false, reload: false });
    $('html,body').scrollTop(0);
  };

  $scope.me = me;
  $scope.resource = resource;
  $scope.members = members;
  $scope.isLocationCollapsed = true;

  // $scope.hiddenCards = {};

  // if ($scope.resource.isAvailableOthers !== false) {
  //   $scope.hiddenCards.friends = true;
  // }
  // if ($scope.features.friendsOfCar !== false) {
  //   $scope.hiddenCards.friends = false;
  // }

  $scope.toggleLocation = function () {
    $scope.isLocationCollapsed = !!!$scope.isLocationCollapsed;
    if (!$scope.isLocationCollapsed) {
      // notify google maps to redraw itself when container is fully expanded
      $timeout(function () {
        $scope.$broadcast('collapseContainerVisible');
      }, 0);
    }
  };

  // $scope.$on('ResourceEditSharingsettings:AvailableOthersChange', function (event, isAvailableOthers) {
  //   if (!isAvailableOthers) {
  //     delete $scope.hiddenCards.friends;
  //   } else {
  //     $scope.hiddenCards.friends = true;
  //   }
  // });
});
