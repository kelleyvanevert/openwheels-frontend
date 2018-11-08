'use strict';

angular.module('bootstrapDateTimePickerDirective', [])

.run(function ($rootScope) {})

.directive('bootstrapDateTimePicker', function ($rootScope, $log,
  API_DATE_FORMAT, FRONT_DATE_FORMAT, DATE_TIME_PICKER_FORMAT) {

  return {
    require: '',
    restrict: 'AE',
    scope: {
//      ngModel: '=',
      a: '@'
    },
    link: function ($scope, $element, attrs) {
      $log.log('hello from bootstrapDateTimePicker', '$scope', $scope, '$element', $element, 'attrs', attrs);
      $element.find('input').datetimepicker({
        format: DATE_TIME_PICKER_FORMAT,
        locale: 'nl',
        stepping: 15, // minute step size
        minDate: moment().subtract(1, 'years'),
        maxDate: moment().add(1, 'years'),
        useCurrent: true,
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
        //showTodayButton: true,
        showClose: true,
        focusOnShow: false, // (!) important for mobile
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
      });
    }
  };
});
