'use strict';

angular.module('bootstrapDateTimePickerDirective', [])

.run(function ($rootScope) {})

.directive('bootstrapDateTimePicker', function ($rootScope, $log) {

  return {
    require: '',
    restrict: 'AE',
    scope: {
//      ngModel: '=',
      config: '=bootstrapDateTimePicker',
    },
    link: function ($scope, $element, attrs) {
      $log.log('hello from bootstrapDateTimePicker', '$scope', $scope, '$element', $element, 'attrs', attrs);

      const input = $element.find('input');

      const r = input.datetimepicker(Object.assign({
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
          close: 'material-icons material-icon-hack accept',
        },
        tooltips: {
          selectTime: 'Selecteer tijd',
          today: 'Selecteer vandaag',
          clear: 'Verwijder datum',
          close: 'Sluiten',
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

      $log.log('r', r);

      $element.on('click', function (e) {
        const mobile = !$rootScope.isWindowSizeSM;
        if (true || mobile) {
          const c = input.data('DateTimePicker');
          $log.log('dtp', c, c.show);
          input.blur();
          e.stopPropagation();
          setTimeout(() => c.show(), 100);
          return false;
        }
      });
    }
  };
});
