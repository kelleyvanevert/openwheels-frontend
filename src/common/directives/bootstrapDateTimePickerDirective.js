'use strict';

angular.module('bootstrapDateTimePickerDirective', [])

.run(function ($rootScope) {})

.directive('bootstrapDateTimePicker', function ($rootScope, $log, $window) {

  return {
    require: '',
    restrict: 'AE',
    scope: {
//      ngModel: '=',
      config: '=bootstrapDateTimePicker',
      scrollToClosest: '=',
      mobile: '=',
      dtpAutoshow: '@',
      dtpBroadcastAccept: '@',
    },
    link: function ($scope, $element, attrs) {
      //$log.log('hello from bootstrapDateTimePicker', '$scope', $scope, '$element', $element, 'attrs', attrs);
      $window.openDateTimePickers = $window.openDateTimePickers || [];

      if (typeof $scope.config.widgetParent === 'string') {
        var a = $element.find($scope.config.widgetParent);
        if (a.length) {
          $scope.config.widgetParent = a;
        } else {
          var b = $element.closest($scope.config.widgetParent);
          if (b.length) {
            $scope.config.widgetParent = b;
          } else {
            delete $scope.config.widgetParent;
          }
        }
      }

      var input = $element.find('input');

      if ($scope.dtpAutoshow) {
        $scope.$on($scope.dtpAutoshow, function () {
          if ($scope.mobile) {
            input.data('DateTimePicker').show();
          } else {
            input.focus();
          }
        });
      }

      if (!$window._blurReplacementHandler) {
        $($window).on('click', function (e) {
          if ($scope.mobile && e.target !== input[0]) {
            //$log.log(' [blur replace] closing:', $window.openDateTimePickers.length);
            $window.openDateTimePickers.map(function (el) {
              var c = $(el).data('DateTimePicker');
              if (!c) {
                //$log.log('problem finding dtc for', el);
              }
              //$log.log('hiding '+el.id+' manually instead of blur');
              c.hide();
            });
          }
        });
        $window._blurReplacementHandler = true;
      }

      input.on('dp.change', function (e) {
        if (e.oldDate) {
          var c = angular.element(input).controller('ngModel');//.$setTouched(true);
          var viewVal = (e.date ? e.date.format($scope.config.format) : '');
          c.$setTouched(true);      // ??
          c.$setViewValue(viewVal); // ??
        }
      });
      input.on('dp.show', function (e) {
        $window.openDateTimePickers.push(input[0]);
      });
      input.on('dp.hide', function (e) {
        //input[0].dispatchEvent(new CustomEvent('input')); // didn't work
        if (e.date) {
          var c = angular.element(input).controller('ngModel');//.$setTouched(true);
          var viewVal = (e.date ? e.date.format($scope.config.format) : '');
          c.$setTouched(true);      // ??
          c.$setViewValue(viewVal); // ??
        }

        var i = $window.openDateTimePickers.indexOf(input[0]);
        if (i >= 0) {
          $window.openDateTimePickers.splice(i, 1);
        }
      });
      input.on('dp.accept', function (e) {
        if ($scope.dtpBroadcastAccept) {
          //$log.log('I ('+$scope.config.format+') just broadcasted', $scope.dtpBroadcastAccept);
          $rootScope.$broadcast($scope.dtpBroadcastAccept);
        }
      });

      input.datetimepicker(Object.assign({
        format: $scope.config.viewFormat || 'DD-MM-YYYY HH:mm',
        locale: 'nl',
        icons: {
          time: 'material-icons material-icon-hack time',
          date: 'material-icons material-icon-hack date',
          up: 'material-icons material-icon-hack up',
          down: 'material-icons material-icon-hack down',
          previous: 'material-icons material-icon-hack previous',
          next: 'material-icons material-icon-hack next',
          today: 'material-icons material-icon-hack today',
          clear: 'material-icons material-icon-hack clear',
          close: 'material-icons material-icon-hack close',
          accept: 'material-icons material-icon-hack accept',
        },
        tooltips: {
          selectTime: 'Selecteer tijd',
          today: 'Selecteer vandaag',
          clear: 'Verwijder datum',
          close: 'Sluiten',
          accept: 'Accepteren',
          selectMonth: 'Selecteer maand',
          prevMonth: 'Vorige maand',
          nextMonth: 'Volgende maand',
          selectYear: 'Selecteer jaar',
          prevYear: 'Vorige jaar',
          nextYear: 'Volgende jaar',
          selectDecade: 'Selecteer decennium',
          prevDecade: 'Vorige decennium',
          nextDecade: 'Volgende decennium',
          prevCentury: 'Vorige eeuw',
          nextCentury: 'Volgende eeuw',
        },
      }, $scope.config));

      $element.on('click', function (e) {
        if ($scope.mobile) {
          var c = input.data('DateTimePicker');
          input.blur();
          e.stopPropagation();
          c.show();
          $window.openDateTimePickers.map(function (el) {
            if (el !== input[0]) {
              $log.log('hiding OTHER:'+el.id+' manually instead of blur');
              $(el).data('DateTimePicker').hide();
            }
          });
          var el = input;
          if ($scope.scrollToClosest) {
            el = input.closest($scope.scrollToClosest);
            //$log.log('found closest', el);
            if (!el.length) {
              //$log.log('cannot find', $scope.scrollToClosest);
              el = input;
            }
            $('html, body').stop().animate({ scrollTop: el.offset().top - 10 }, 500, 'swing');
          }
          //return false;
        }
      });
    }
  };
});
