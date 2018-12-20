'use strict';

angular.module('filters.util', [])

.filter('toSentenceCase', function () {
  return function (text) {
    var txt = text || '';
    return txt.slice(0,1).toUpperCase() + txt.slice(1);
  };
})

.filter('toTitleCase', function () {
  return function (text) {
    var words = (text || '').split(' ');
    var word;
    for (var i=0; i < words.length; i++) {
      word = words[i];
      words[i] = word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
    }
    return words.join(' ');
  };
})

.filter('surroundWith', function () {
  return function (text, before, after) {
    return text ? before + text + after : '';
  };
})

.filter('formatKilometers', function ($filter) {
  return function (km) {
    if (km >= 1) {
      return $filter('number')(km, 1) + ' km';
    } else {
      return Math.round(km * 1000) + ' m';
    }
  };
})

.filter('containsAnyOf', function () {
  return function (arr, other) {
    if (!angular.isArray(arr) || !angular.isArray(other)) { return false; }
    return arr.filter(function (item) {
      return other.indexOf(item) >= 0;
    }).length > 0;
  };
})

.filter('wasBookedTimes', function ($translate) {
  return function (count) {
    count = count || 0;
    if (count > 50) {
      return 'Meer dan 50 keer verhuurd';
    }
    else if (count > 20) {
      return 'Meer dan 20 keer verhuurd';
    }
    else if (count > 10) {
      return 'Meer dan 10 keer verhuurd';
    }
    else if (count > 3) {
      return 'Meer dan 3 keer verhuurd';
    }
    else {
      return 'Minder dan 4 keer verhuurd';
    }
  };
})

.filter('hasBookedTimes', function ($translate) {
  return function (count) {
    count = count || 0;
    if (count > 50) {
      return 'Meer dan 50 keer gehuurd';
    }
    else if (count > 20) {
      return 'Meer dan 20 keer gehuurd';
    }
    else if (count > 10) {
      return 'Meer dan 10 keer gehuurd';
    }
    else if (count > 3) {
      return 'Meer dan 3 keer gehuurd';
    }
    else {
      return 'Minder dan 4 keer gehuurd';
    }
  };
})

.filter('trustAsHtml', ['$sce', function ($sce) {
  return function (text) {
    return $sce.trustAsHtml(text);
  };
}])
;
