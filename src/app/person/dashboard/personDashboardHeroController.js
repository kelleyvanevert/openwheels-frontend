'use strict';

angular.module('owm.person.dashboard.v1', [])

.controller('PersonDashboardHeroController', function ($q, $scope, $sce, $state, me, authService, resourceService, resourceQueryService, blogItems) {

  $scope.search = { text: '' };
  
  if(me.streetName && me.streetNumber && me.city) {
    $scope.homeAddress = me.streetName + ' ' + me.streetNumber + ', ' + me.city;
  } else if (me.streetName && me.city) {
    $scope.homeAddress = me.streetName + ' ' + me.city;
  } else if (me.city) {
    $scope.homeAddress = me.city;
  }


  $scope.renderHtml = function(html_code) {
    return $sce.trustAsHtml(html_code);
  };

  $scope.doSearch = function (placeDetails) {
    if (placeDetails) {
      resourceQueryService.setText($scope.search.text);
      resourceQueryService.setLocation({
        latitude : placeDetails.geometry.location.lat(),
        longitude: placeDetails.geometry.location.lng()
      });
    }
    $state.go('owm.resource.search.list', resourceQueryService.createStateParams());
  };
})
;
