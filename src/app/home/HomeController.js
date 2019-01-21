'use strict';

angular.module('owm.home', ['owm.resource', 'slick'])

//Module in app/pages/pagesModule.js
.controller('HomeController', function ($scope, $translate, $location, resourceQueryService,
  $window, $timeout, $state, resourceService, $localStorage, $http, metaInfoService, appConfig,
  makeHomeAddressPrefill,
  authService, tokenSilentRefreshService) {

  metaInfoService.set({url: appConfig.serverUrl});
  metaInfoService.set({canonical: 'https://mywheels.nl'});

  $scope.homeAddressPrefill = '';

  $scope.$watch(function () {
    return $translate.use();
  }, function (lang) {
    if (lang) {
      $scope.lang = lang;
    }
  });

  $timeout(function () {
    if($localStorage.invitedBySlug) {
      $scope.invitedBySlug = $localStorage.invitedBySlug;
    }
  }, 1000);

  $scope.goToMyWheelsOpen = function() {
    window.open('/open','_blank');
  };

  loadBlogItems();

  function loadBlogItems () {
    $http({
      method: 'GET',
      url: 'https://mywheels.nl/blog/feed/json'
    })
    .then(function (response) {
      var maxResults = 4;
      if (response.data && response.data.items) {
        $scope.blogItems = response.data.items.slice(0, maxResults);
      }
    })
    .catch(function () {
      $scope.blogItems = [];
    });
  }

  //get resources for slider if page is loaded
  // angular.element($window.document).ready(function () {
  //   getFeaturedResources();
  // });

  // function getFeaturedResources() {
  //   resourceService.all({
  //     'onlyFeatured': 'true'
  //   })
  //   .then(function (res) {
  //     $scope.resources_slider = res;
  //   });
  // }

  $scope.gotoProfile = function (resource) {
    $state.go('owm.resource.show', {
      city: (resource.city || '').toLowerCase().replace(/ /g, '-'),
      resourceId: resource.id
    });
  };

  $scope.search = {
    text: ''
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

  // Automatically log in, if possible
  if (!authService.user.isAuthenticated) {
    tokenSilentRefreshService.silentRefresh().then(function (token) {
      // this does the rest of the magic
      // (state is automatically reloaded, I believe, and at least
      //  the root scope's user variable is changed,
      //  triggering a re-render of the toolbar and menu)
      authService.notifyFreshToken(token, true);

      $scope.homeAddressPrefill = makeHomeAddressPrefill(authService.user.identity);
    });
  }

});
