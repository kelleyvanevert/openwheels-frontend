
angular.module("owm.components")

.component("listItemBookingOwner", {
  templateUrl: "components/listItemBookingOwner/listItemBookingOwner.tpl.html",
  bindings: {
    booking: "=",
  },
  controller ($scope, API_DATE_FORMAT) {
    $scope.now = moment().format(API_DATE_FORMAT);
  },
});
