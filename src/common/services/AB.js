'use strict';

angular.module('AB', ['Cookies'])

// This A/B testing service just keeps book of a key-value dictionary
//  standing for the currently running experiments.
// This object is `$rootScope.experiments`, and it's synchronized
//  with cookies/localstorage, and also saved to the GTM dataLayer.
// Use the helper `window.experiment = $rootScope.experiment` to
//  set up / change an experiment.

.service('AB', function ($rootScope, Cookies) {

  // lib

  var dataLayer = window.dataLayer = window.dataLayer || [];
  $rootScope.experiments = {};
  dataLayer.push({ experiments: $rootScope.experiments });

  window.experiment = $rootScope.experiment = function (k, v, apply) {
    if ($rootScope.experiments[k] !== v) {
      var o = {};
      o['experiment_' + k] = v;
      dataLayer.push(o);
      $rootScope.experiments[k] = v;
      Cookies.set('experiments', JSON.stringify($rootScope.experiments));
      if (apply) {
        $rootScope.$apply();
      }
    }
  };

  try {
    var exp = Cookies.get('experiments');
    if (exp) {
      exp = JSON.parse(exp);
      for (var k in exp) {
        if (exp.hasOwnProperty(k)) {
          $rootScope.experiment(k, exp[k]);
        }
      }
    }
  } catch (err) {
    // noop
  }


  // currently running experiments
  // (none)

});
