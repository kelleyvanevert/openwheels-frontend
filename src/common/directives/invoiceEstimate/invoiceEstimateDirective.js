'use strict';

/**
 * Kelley van Evert, 22 nov 2018
 * API:
 *   <invoice-estimate
 *      booking         :: { resource, beginRequested, endRequested, riskReduction }
 *   />
 */
angular.module('invoiceEstimateDirective', [])

.directive('invoiceEstimate', function invoiceEstimate ($log) {

  // The directive
  // =====

  return {
    restrict: 'E',
    scope: {
      booking: '=',
    },
    templateUrl: 'directives/invoiceEstimate/invoiceEstimate.tpl.html',
    replace: true,
    controller: ['$scope', '$element', 'invoice2Service', function ($scope, $element, invoice2Service) {

      // loading iff !price
      $scope.price = null;

      $scope.showPriceDetails = false;
      $scope.setShowPriceDetails = function (b) {
        $scope.showPriceDetails = b;
      };

      $scope.calculation = {
        done: false,
      };

      $scope.booking.numAdditionalDrivers = 0;

      invoice2Service.calculatePrice({
        resource: $scope.booking.resource.id,
        timeFrame: {
          startDate: $scope.booking.beginRequested,
          endDate: $scope.booking.endRequested,
        },
        includeRedemption: $scope.booking.riskReduction,
        contract: $scope.booking.contract ? $scope.booking.contract.id : undefined,
      }).then(function (price) {
        $scope.price = price;
        update();
        updateKmEstimate();
      });

      function update () {
        var d = moment.duration(moment($scope.booking.endRequested).diff(moment($scope.booking.beginRequested)));
        if ($scope.price) {

          var calculation = $scope.calculation;

          // CALCULATE

          // parameters
          calculation.dayRate = $scope.booking.resource.price.dayRateTotal;
          calculation.hourRate = $scope.booking.resource.price.hourRate;
          calculation.riskReductionPrice = $scope.price.default_price_decrease_own_risk;

          // how many days, and remaining hours in the timeframe
          calculation.numDays = d.asDays();
          calculation.numRemainingHours = d.asHours() % 24;

          // how many times does the hour rate fit into the day rate?
          calculation.hourRate_in_dayRate = calculation.dayRate / calculation.hourRate;

          // how many times we apply the day and hour rate, resp.
          // taking into account that remaining hours may not exceed the day rate
          calculation.num_dayRate = Math.floor(calculation.numDays); // === time_days @ invoice2.calculatePrice
          calculation.num_hourRate = calculation.numRemainingHours; // === time_hours @ invoice2.calculatePrice
          calculation.remainingHoursExceedDayRate = false;
          if (calculation.num_hourRate * calculation.hourRate > calculation.dayRate) {
            calculation.num_dayRate += 1;
            calculation.num_hourRate = 0;
            calculation.remainingHoursExceedDayRate = true;
          }

          calculation.rent = (calculation.num_dayRate * calculation.dayRate) + (calculation.num_hourRate * calculation.hourRate);

          calculation.subTotal = calculation.rent;

          // risk reduction (optionally applied)
          calculation.applyRiskReduction = $scope.booking.riskReduction;
          if (calculation.applyRiskReduction) {
            calculation.num_riskReductionPrice = Math.ceil(calculation.numDays);
            calculation.riskReductionTotal = calculation.num_riskReductionPrice * calculation.riskReductionPrice;
          } else {
            calculation.num_riskReductionPrice = 0;
            calculation.riskReductionTotal = 0;
          }
          calculation.subTotal += calculation.riskReductionTotal;

          // additional drivers
          calculation.numAdditionalDrivers = $scope.booking.numAdditionalDrivers;
          calculation.pricePerAdditionalDriver = $scope.price.default_price_additional_driver;
          calculation.additionalDriversTotal = (calculation.pricePerAdditionalDriver * calculation.numAdditionalDrivers);
          calculation.subTotal += calculation.additionalDriversTotal;

          // SET new price object

          calculation.bookingFee = $scope.price.booking_fee;
          calculation.total = calculation.subTotal + calculation.bookingFee;

          calculation.done = true;

          if (calculation.automaticKilometerEstimate === undefined) {
            calculation.automaticKilometerEstimate = Math.ceil(calculation.numDays * 150 + calculation.numRemainingHours * 15);
            calculation.kilometerEstimate = calculation.automaticKilometerEstimate;
            calculation.maxKmEstimate = Math.ceil(Math.max(300, calculation.automaticKilometerEstimate + 50));
            //setTimeout(function () {
            //  $element.find('#kilometerEstimate').attr('max', calculation.maxKmEstimate);
            //  $log.log(calculation.maxKmEstimate, $element, $element.find('#kilometerEstimate')[0]);
            //}, 100);
          }
        }
      }

      $scope.$watch('[booking.numAdditionalDrivers, booking.beginRequested, booking.endRequested, booking.riskReduction]', update);

      function totalForKmEstimate (estimatedKms) {

        var subcalculation = {};
        subcalculation.fuelCosts = $scope.price.fuel_per_kilometer * estimatedKms;

        subcalculation.freeKms = Math.floor($scope.calculation.numDays * 100 + $scope.calculation.numRemainingHours * 10);
        subcalculation.paidKms = Math.max(0, estimatedKms - subcalculation.freeKms);
        subcalculation.kmCosts = parseFloat($scope.booking.resource.price.kilometerRate) * subcalculation.paidKms;

        subcalculation.total = $scope.calculation.total + subcalculation.fuelCosts + subcalculation.kmCosts;

        return subcalculation;
      }

      function updateKmEstimate () {

        var calculation = $scope.calculation;
        
        calculation.uponUserEstimate = totalForKmEstimate(calculation.kilometerEstimate);
        calculation.uponMyWheelsEstimate = totalForKmEstimate(calculation.automaticKilometerEstimate);
      }
      $scope.updateKmEstimate = updateKmEstimate;

    }],
  };

});

/*
{
  // deprecated
  day_fee: 0,
  insurance: 0,

  // global parameters
  booking_fee: 2.5,
  default_estimate_km_day: 150,
  default_estimate_km_hour: 15,
  default_price_additional_driver: 1.25,
  default_price_decrease_own_risk: 3.5,
  default_free_km_day: 100,
  default_free_km_hour: 10,

  // complicated
  discount: 0,

  // timeframe specific
  estimate_km_total: 90,
  time_days: 0,
  time_hours: 6,
  redemption: 0, // E

  // car specific (already have these)
  free_km_day: 0, // boolean
  fuel_per_kilometer: 0, // E/km

  rent: 15,
  sub_total: 15,
  total: 17.5,
}
*/