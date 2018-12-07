'use strict';

/**
 * Kelley van Evert, 7 dec 2018
 * API:
 *   <leave-review-teaser
 *      sref         (@)  :: goto state on click
 *      state-params (=)  :: use these params when going to state
 *   />
 */
angular.module('leaveReviewTeaserDirective', [])

.directive('leaveReviewTeaser', function leaveReviewTeaser ($log) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      sref: '=',
      stateParams: '=',
      type: '=',
    },
    templateUrl: 'directives/leaveReviewTeaser/leaveReviewTeaser.tpl.html',
    replace: true,
    controller: ['$scope', function leaveReviewTeaserController ($scope) {

      $scope.activated = false;

      $scope.deactivate = function () {
        $scope.activated = false;
      };

      if ($scope.type === 'rating') {
        $scope.rating = 0;

        $scope.setRating = function (newRating) {
          $scope.rating = newRating;
          $scope.activated = true;
        };

        $scope.srefForRating = function (rating) {
          var params = angular.extend({}, $scope.stateParams, { setrating: rating });
          return $scope.sref + '(' + JSON.stringify(params) + ')';
        };
      }

      if ($scope.type === 'satisfaction') {
        $scope.satisfaction = 'neutral';
        $scope.satisfactionIcons = {
          'negative': 'thumb_down',
          'neutral': 'thumb_down',
          'positive': 'thumb_up',
        };

        $scope.setSatisfaction = function (newSatisfaction) {
          $scope.satisfaction = newSatisfaction;
          $scope.activated = true;
        };

        $scope.srefForSatisfaction = function (satisfaction) {
          var params = angular.extend({}, $scope.stateParams, { setsatisfaction: satisfaction });
          return $scope.sref + '(' + JSON.stringify(params) + ')';
        };
      }
    }],
  };

});