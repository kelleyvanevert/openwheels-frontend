'use strict';

angular.module('owm.person.dashboard.v1', [])

.controller('PersonDashboardHeroController', function ($scope, $sce, $state, resourceQueryService, homeAddressPrefill) {

  $scope.search = { text: '' };
  
  $scope.homeAddressPrefill = homeAddressPrefill;

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
