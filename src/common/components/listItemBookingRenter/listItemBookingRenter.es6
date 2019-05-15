
angular.module("owm.components")

.component("listItemBookingRenter", {
  templateUrl: "components/listItemBookingRenter/listItemBookingRenter.tpl.html",
  bindings: {
    booking: "=",
    me: "=", // (jsut to determine whether 'extra driver' or not)
  },
  controller: ['$scope', 'API_DATE_FORMAT', function ($scope, API_DATE_FORMAT) {
    $scope.now = moment().format(API_DATE_FORMAT);
  }],
});
