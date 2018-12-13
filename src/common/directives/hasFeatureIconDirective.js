'use strict';

(function () {

  var labels = {
    'has': [
      'nee',
      'ja',
    ],
    'allow': [
      'niet toegestaan',
      'toegestaan',
    ],
  };

  angular.module('hasFeatureIconDirective', [])

  .directive('hasFeatureIcon', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        has: '=', // boolean
        type: '@', // "has", "allow"
      },
      template: '<span class="has-feature-icon" ng-class="{ has: has, hasnot: !has }">' +
        '<ng-md-icon ng-if="has" icon="check_circle" alt="{{ label }}" aria-hidden="true"></ng-md-icon>' +
        '<ng-md-icon ng-if="!has" icon="cancel" alt="{{ label }}" aria-hidden="true"></ng-md-icon>' +
        ' {{ label }}' +
      '</span>',
      controller: function ($scope) {
        $scope.label = (labels[$scope.type] || labels.has)[$scope.has ? 1 : 0];
      },
    };
  })
  ;

}());