
angular.module("owm.components")

.component("listItemFavorite", {
  templateUrl: "components/listItemFavorite/listItemFavorite.tpl.html",
  bindings: {
    resource: "=",
  },
  controller: function ($scope) {
    $scope.citySlug = (this.resource.city || '').toLowerCase().replace(/ /g, '-');
  },
});
