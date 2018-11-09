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
    },
    link: function ($scope, $element, attrs) {
      //$log.log('hello from bootstrapDateTimePicker', '$scope', $scope, '$element', $element, 'attrs', attrs);
      $window.openDateTimePickers = $window.openDateTimePickers || [];

      const input = $element.find('input');

      if (!$window._closeDateTimePickerHandlerInstalled) {
        $($window).on('click', function (e) {
          const mobile = !$rootScope.isWindowSizeSM;
          if (mobile && e.target !== input[0]) {
            $window.openDateTimePickers.map(function (el) {
              const c = $(el).data('DateTimePicker');
              if (!c) {
                $log.log('problem finding dtc for', el);
              }
              $log.log('hiding MYSELF manually instead of blur');
              c.hide();
            });
          }
        });
        $window._closeDateTimePickerHandlerInstalled = true;
      }

      input.on('dp.show', function () {
        $window.openDateTimePickers.push(input[0]);
      });
      input.on('dp.hide', function () {
        input[0].dispatchEvent(new CustomEvent('input'));
        const i = $window.openDateTimePickers.indexOf(input[0]);
        if (i >= 0) {
          $window.openDateTimePickers.splice(i, 1);
        }
      });
      input.on('dp.accept', function () {
        $scope.$emit('dp-accent');
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
        const mobile = !$rootScope.isWindowSizeSM;
        if (mobile) {
          const c = input.data('DateTimePicker');
          input.blur();
          e.stopPropagation();
          c.show();
          $window.openDateTimePickers.map(function (el) {
            if (el !== input[0]) {
              $log.log('hiding OTHER manually instead of blur');
              $(el).data('DateTimePicker').hide();
            }
          });
          $('html, body').stop().animate({
            scrollTop: Math.max(0, input.offset().top - 50),
          }, 500, 'swing');
          //return false;
        }
      });
    }
  };
});
