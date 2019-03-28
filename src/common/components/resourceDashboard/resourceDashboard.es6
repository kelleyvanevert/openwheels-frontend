'use strict';

angular.module('owm.components')

.directive('resourceDashboard', function (
  $state,
  appConfig,
  angularLoad,

  API_DATE_FORMAT,
  
  contractService,
  bookingService
) {
  return {
    restrict: 'E',
    scope: {
      me: '=',
    },
    templateUrl: 'components/resourceDashboard/resourceDashboard.tpl.html',
    controller: function ($scope, $element) {

      // PUBLIC

      const dateTimeConfig = {
        // showAccept: true,
        focusOnShow: false, // (!) important for mobile
        useCurrent: true,
        toolbarPlacement: 'bottom',
      };

      const dateConfig = $scope.dateConfig = {
        ...dateTimeConfig,
        format: 'DD-MM-YYYY',
        minDate: moment().startOf('day'),
        widgetPositioning: { // with knowledge of the html (!)
          horizontal: 'auto', // 'left',
          vertical: 'bottom',
        },
        width: '20em',
      };

      $scope.scales = {
        day: {
          text: '24 uur',
          interval: [1, "day"],
        },
        two_days: {
          text: '2 dagen',
          interval: [2, "day"],
        },
        week: {
          text: '1 week',
          interval: [1, "week"],
        },
      };

      $scope.loading = true;
      $scope.grouped = [];

      $scope.focus = {
        scale: "day",
        date: moment().format(dateConfig.format),
      };

      $scope.changeDate = function () {
        focusUpdated();
      };

      $scope.move = function (dir) {
        if (dir !== 'add' && dir !== 'subtract') {
          dir = 'add';
        }
        const curr = moment($scope.focus.date, dateConfig.format);
        $scope.focus.date = curr[dir](...$scope.scales[$scope.focus.scale].interval).format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setToday = function () {
        $scope.focus.date = moment().format(dateConfig.format);
        $scope.calendarForm.date.$setTouched(true);
        focusUpdated();
      };

      $scope.setScale = function (key) {
        $scope.focus.scale = key;
        focusUpdated();
      };

      $scope.refresh = function () {
        focusUpdated();
      };


      // PRIVATE

      const data = {};
      const settings = {
        rowHeight: 60,
        resourceWidth: 200,
        marginTop: 40,
        marginRight: 4,
        marginBottom: 5,

        vPad: 4,
      };
      const elements = {};

      async function focusUpdated () {
        console.log($scope.focus);
        const interval = $scope.scales[$scope.focus.scale].interval;
        data.startDate = moment($scope.focus.date, dateConfig.format).startOf(interval[1]);
        data.endDate = data.startDate.clone().add(...interval);

        $scope.loading = true;

        // TODO caching

        // Temporary API call (We're going to use the new `calender.search` later)
        const bookings = await bookingService.forOwner({
          person: $scope.me.id,
          timeFrame: {
            startDate: data.startDate.format(API_DATE_FORMAT),
            endDate: data.endDate.format(API_DATE_FORMAT),
          },
        });
        const grouped = Object.values(
          bookings.reduce((grouped, booking) => {
            if (!grouped[booking.resource.id]) {
              grouped[booking.resource.id] = {
                resource: booking.resource,
                bookings: [],
              };
            }
            grouped[booking.resource.id].bookings.push(booking);
            return grouped;
          }, {})
        );

        $scope.loading = false;
        $scope.grouped = grouped;

        redraw();

        $scope.$digest();
      }

      function redraw () {
        console.log("redraw");

        const W = data.W = elements.svg.node().clientWidth;
        const Y = Math.max(1, $scope.grouped.length);
        const H = Y * settings.rowHeight + settings.marginTop + settings.marginBottom;

        elements.container
          .style('height', H + 'px');
        
        elements.svg
          .attr("height", H)
          .attr("width", W)
          .attr("viewBox", `0 0 ${W} ${H}`);

        // VERTICAL LINES AND DATE/TIME AXIS
        const xScale = d3.scaleTime()
          .domain([data.startDate.toDate(), data.endDate.toDate()])
          .range([0, W - 200 - settings.marginRight]);
        const timeAxis = d3.axisTop(xScale)
          .tickSize(6 + H - settings.marginTop)
          .tickPadding(4)
          .tickFormat(data.multiFormat);
        elements.svg.select(".time_axis")
          .attr("transform", `translate(${settings.resourceWidth} ${H})`)
          .call(timeAxis);

        // HORIZONTAL LINES
        const yScale = d3.scaleLinear()
          .domain([0, Y])
          .range([0, H - settings.marginTop - settings.marginBottom]);
        const resouceAxis = d3.axisRight(yScale)
          .ticks(Y)
          .tickSize(W);
        elements.svg.select(".resource_axis")
          .attr("transform", `translate(0 ${settings.marginTop})`)
          .call(resouceAxis)
          .select(".domain").remove();
        
        // Reservations
        const all_bookings = _.flatten($scope.grouped.map((group, i) => {
          return group.bookings.map(booking => ({
            y: i,
            x0: moment(booking.beginBooking || booking.beginRequested, API_DATE_FORMAT),
            x1: moment(booking.endBooking || booking.endRequested, API_DATE_FORMAT),
            booking,
          }));
        }));

        const blocks = elements.calendar.selectAll(".block").data(all_bookings, ({ booking }) => booking.id);
        blocks.exit().remove();
        const new_blocks = blocks
          .enter()
            .append("a")
            .attr("href", "#")
            .attr("onclick", "return false;")
            .attr("class", "block");
        new_blocks.append("div").append("strong").text(({ booking }) => (booking.remarkRequester || "").slice(0, 50))
        new_blocks.merge(blocks)
            .style("top", ({ y }) => (yScale(y) + settings.vPad) + "px")
            .style("left", ({ x0 }) => xScale(x0.toDate()) + "px")
            .style("width", ({ x0, x1 }) => (xScale(x1.toDate()) - xScale(x0.toDate())) + "px")
            .style("height", (settings.rowHeight - 2*settings.vPad) + "px");
      }

      init();
      async function init () {

        const contracts = await contractService.forDriver({
          person: $scope.me.id
        });
        const isCompany = $scope.isCompany = contracts.reduce((isCompany, contract) => isCompany || contract.type.id === 120, false);
        if (!isCompany) {
          return;
        }

        await angularLoad.loadScript("https://cdnjs.cloudflare.com/ajax/libs/d3/5.9.2/d3.min.js");

        data.locale = d3.timeFormatLocale({
          "dateTime": "%d-%m-%Y %H:%M:%S",
          "date": "%d-%m-%Y",
          "time": "%H:%M:%S",
          "periods": ["AM", "PM"],
          "days": "zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag".split("|"),
          "shortDays": "zo|ma|di|wo|do|vr|za".split("|"),
          "months": "januari|februari|maart|april|mei|juni|juli|augustus|oktober|november|december".split("|"),
          "shortMonths": "jan|feb|mrt|apr|mei|jun|jul|aug|sept|okt|nov|dec".split("|"),
        });
        data.formatters = {
          ms: data.locale.format(".%L"),
          s: data.locale.format(":%S"),
          m: data.locale.format("%H:%M"),
          h: data.locale.format("%H:00"),
          d: data.locale.format("%a %d"),
          wk: data.locale.format("%b %d"),
          mo: data.locale.format("%B"),
          yr: data.locale.format("%Y"),
        };
        data.multiFormat = date => {
          return (
              d3.timeSecond(date) < date ? data.formatters.ms
              : d3.timeMinute(date) < date ? data.formatters.s
              : d3.timeHour(date) < date ? data.formatters.m
              : d3.timeDay(date) < date ? data.formatters.h
              : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? data.formatters.d : data.formatters.wk)
              : d3.timeYear(date) < date ? data.formatters.mo
              : data.formatters.yr
            )(date);
        };

        elements.container = d3.select($element.find('.resource_calendar')[0]);
        elements.svg = elements.container.select('svg');
        elements.calendar = elements.container.select('.calendar');

        d3.select(window).on("resize", () => {
          if (!data.W || data.W !== elements.svg.node().clientWidth) {
            redraw();
          }
        });

//        $scope.$digest();
        focusUpdated();
      }

    },
  };
});
