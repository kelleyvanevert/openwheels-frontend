'use strict';

angular.module('owm.booking', [
  'owm.booking.list',
  'owm.booking.list-rental',
  'owm.booking.show',
  'owm.booking.rating',
  'owm.booking.administer'
])

.config(function config($stateProvider) {

  $stateProvider

  .state('owm.booking', {
    abstract: true,
    url: '/booking/:bookingId?start&end&orderStatusId&cont',
    views: {
      'main@shell': {
        template: '<div ui-view></div>'
      }
    },
    data: {
      denyAnonymous: true
    },
    resolve: {
      me: ['authService', function (authService) {
        return authService.me();
      }],
      booking: ['$stateParams', 'bookingService', function ($stateParams, bookingService) {
        return bookingService.get({
          id: $stateParams.bookingId
        });
      }],
      contract: ['$stateParams', 'contractService', function ($stateParams, contractService) {
        return contractService.forBooking({
          booking: $stateParams.bookingId
        })
        .then(function(contract) {
          contract.type.canHaveDeclaration = false;
          if(contract.type.id === 50 || contract.type.id === 60 || contract.type.id === 62 || contract.type.id === 63 || contract.type.id === 64 || contract.type.id === 75) {
            contract.type.canHaveDeclaration = true;
          }
          return contract;
        });
      }],
      resource: ['booking', function (booking) {
        return booking.resource;
      }],
      perspective: ['me', 'contract', 'booking', 'resource', function (me, contract, booking, resource) {

        var perspective = {};


        // First, the facts
        // ================

        // Jij bent de eigenaar van het contract waarop de boeking gemaakt is
        //  (of je de boeking nu zelf hebt gemaakt, of dat dat iemand op jouw contract was).
        perspective.isContractHolder = (contract.contractor.id === me.id);

        // Jij bent degene die de boeking heeft gemaakt
        //  (of dat nu op je eigen contract is, of iemand anders' contract).
        perspective.isRenter = (booking.person.id === me.id);

        // Jij bent de eigenaar van de auto.
        // (Je kunt tegelijkertijd ook de huurder zijn! B.v. bij MW Open.)
        perspective.isOwner = (resource.owner.id === me.id);

        perspective.isContractor = perspective.isContractHolder && !perspective.isRenter;


        // Then, the UI logic
        // ==================

        // In principe zijn 7 van de 8 combinaties hiervan zijn mogelijk,
        //  maar we willen toch maar 1 'view'
        if (perspective.isRenter) {
          // - not owner + not contract holder => "contractant" i.e. renting on someone else's contract
          // - not owner +     contract holder => normal rent
          // -     owner + not contract holder => [a bit weird but technically possible]
          //                                      renting your own car on someone else's contract
          //                                      (possibly this is your work-contract or something...)
          // -     owner +     contract holder => renting your own car
          //                                      (normal for the lease-construction)
          perspective.pageView = 'renting';
        }
        else if (perspective.isOwner) {
          // - not contract holder => normal renting out situation
          // -     contract holder => [weird but technically possible]
          //                          someone is renting your car on your contract
          //                          (maybe the child of someone in a lease construction or something...)
          perspective.pageView = 'rentingOut';
        }
        else /*if (perspective.isContractHolder)*/ {
          // you are the contract-holder, and you're now viewing
          //  this rental action
          perspective.pageView = 'renting';
        }


        return perspective;
      }],
      details: ['me', 'contract', 'booking', function (me, contract, booking) {

        var details = {};

        details.bookingStarted = moment().isAfter(moment(booking.beginBooking));
        details.bookingEnded = moment().isAfter(moment(booking.endBooking));
        details.bookingRequestEnded = moment().isAfter(moment(booking.endRequested));
        details.bookingStartsWithinOneHour = moment().isAfter(moment(booking.beginBooking).add(-1, 'hour'));
        details.bookingEndedReally = moment().isAfter(moment(booking.endBooking).add(1, 'hour'));
        details.bookingRequestEndedReally = moment().isAfter(moment(booking.endRequested).add(1, 'hour'));
        details.requested = (booking.status === 'requested');
        details.accepted = (booking.status === 'accepted');
        details.firstTime = (booking.person.numberOfBookings === 0);

        details.cancelled = booking.status.match(/cancelled/);
        details.rejected = booking.status.match(/rejected/);

        details.showBookOnlyNotice = !booking.ok && (booking.person.status === 'book-only');

        return details;
      }],
      account: ['account2Service', function (account2Service) {
        return account2Service.forMe()
        .then(function (list) {
          var any_approved = false;
          var any_disapproved_account = false;

          // list: Account[]
          //
          // interface Account {
          //   approved: boolean
          //   iban: string
          //   id: number
          //   lastName: string
          //   person: Person
          // }
          for (var i = 0; i < list.length; i++){
            if (list[i].approved === true) {
              any_approved = true;
            }
            if (list[i].approved === false) {
              any_disapproved_account = list[i];
            }
          }

          return {
            list: list,
            approved: !any_disapproved_account && any_approved,
            disapprovedAccount: any_disapproved_account,
          };
        });
      }],
      credit: ['voucherService', 'me', function (voucherService, me) {
        return voucherService.calculateCredit({ person: me.id })
        .then(function (credit) {
          return { value: credit };
        })
        .catch(function (err) {
          return { error: err };
        });
      }],
      debt: ['voucherService', 'me', function (voucherService, me) {
        return voucherService.calculateDebt({ person: me.id })
        .then(function (debt) {
          return { value: debt };
        })
        .catch(function (err) {
          return { error: err };
        });
      }],
      progress: ['account', 'booking', 'contract', 'resource', 'perspective', 'details', 'debt', 'credit', '$filter', function (account, booking, contract, resource, perspective, details, debt, credit, $filter) {

        if (perspective.pageView !== 'renting') {
          return null;
        }

        var progress = {};

        // STEPS
        // Figure out the current state of the reservation/booking process
        //  in order to show a step-wise (& progress)-based indication.
        // (Note: these are not linearly ordered!)

        if (details.firstTime) {
          // => in fact numberOfBookings is only incremented when approved,
          //    so we need to check debt :|
          if (debt.value === 0 && credit.value > 0) {
            details.firstTime = false;
          }
        }

        progress.showPaymentScreen = perspective.isContractHolder &&
          ((details.requested && details.firstTime) || booking.approved === 'BUY_VOUCHER') &&
          ['cancelled', 'owner_cancelled', 'rejected'].indexOf(booking.status) < 0;

        if (progress.showPaymentScreen && account.disapprovedAccount) {
          // => this person has tried to pay, but was disapproved
          progress.showPaymentScreen = false;
        }

        progress.steps = {
          accountCheck: {
            checked: true,
            stress: false,
            text: 'Account gecontroleerd',
          },
          reservation: {
            checked: true,
            stress: false,
            text: 'Reservering verstuurd',
          },
          accepted: {
            stress: false,
          },
          payment: (progress.showPaymentScreen || account.disapprovedAccount) ? {
            checked: false,
            stress: true,
            text: 'Reservering betalen',
            scrollTo: '#bookingPayment',
          } : {
            checked: true,
            stress: false,
            text: 'Reservering betaald',
          },
        };

        if (details.accepted) {
          progress.steps.accepted.checked = true;
          if (resource.isConfirmationRequiredOthers) {
            progress.steps.accepted.text = 'Geaccepteerd door eigenaar';
          } else {
            progress.steps.accepted.text = 'Automatisch geaccepteerd';
            //progress.steps.accepted.tooltip = 'Deze auto hoeft niet handmatig geaccepteerd te worden door de eigenaar';
          }
        } else {
          progress.steps.accepted.checked = false;
          progress.steps.accepted.text ='Nog niet geaccepteerd door eigenaar';
          if (progress.steps.payment.checked) {
            progress.steps.accepted.tooltip = 'Je kunt voor de zekerheid een alternatief overwegen. Andere openstaande reserveringen worden automatisch geannuleerd bij acceptatie.';
          } else {
            progress.steps.accepted.tooltip = 'Je kunt al wel betalen, zodat je direct op pad kunt zodra de reservering is geaccepteerd.';
          }
        }

        progress.list = [
          progress.steps.reservation,
          progress.steps.accepted,
          progress.steps.payment,
        ];
        
        if (details.showBookOnlyNotice) {
          progress.list.splice(1, 0, progress.steps.accountCheck);
          progress.steps.accountCheck.checked = false;
          progress.steps.accountCheck.stress = true;
          progress.steps.accountCheck.text = 'Handmatige account-check vereist';
        } else if (details.firstTime) {
          progress.list.unshift(progress.steps.accountCheck);
        }

        progress.percentage = 100 * (progress.list.filter(function (step) {
          return step.checked;
        }).length / progress.list.length);

        progress.reservationCompleted = progress.percentage >= 99;

        // Determine summary text
        if (!progress.steps.accepted.checked) {
          progress.summary = 'We hebben de reservering naar verhuurder ' + $filter('fullname')(booking.resource.owner) + ' gestuurd.';
          if (!progress.steps.payment.checked) {
            progress.summary += ' Je kunt alvast betalen. De reservering is dan direct definitief na acceptatie door ' + booking.resource.owner.firstName + '.';
          }
          else {
            progress.summary += ' Je ontvangt een mail als ' + booking.resource.owner.firstName + ' op je verzoek gereageerd heeft.';
          }
        }
        else if (progress.steps.accepted.checked && !progress.steps.payment.checked) {
          if (perspective.isContractHolder) {
            if (details.showBookOnlyNotice) {
              progress.summary = 'Je reservering is gemaakt. Je account moet nog handmatig gecontroleerd worden, maar je kunt wel alvast betalen.';
            } else {
              progress.summary = 'Je reservering is gemaakt. Je hoeft alleen nog de reservering te betalen.';
            }
          }
          else {
            progress.summary = 'Je reservering is gemaakt. Vraag aan ' + contract.contractor.firstName + ' om de reservering te betalen.';
          }
        }
        else if (progress.steps.accepted.checked && progress.steps.payment.checked) {
          if (details.showBookOnlyNotice) {
            progress.summary = 'De reservering is geaccepteerd en het bedrag is betaald. Je account moet wel nog handmatig gecontroleerd worden. Zodra dit is gedaan, kan je verzekerd op weg.';
          } else {
            progress.summary = 'De reservering is geaccepteerd en het bedrag is betaald. Alles is in orde voor je rit en je kan goed verzekerd op weg.';
          }
        }

        return progress;

      }],
      flowContinuation: ['$stateParams', '$sessionStorage', '$log', 'extraDriverService', 'booking', '$q', 'alertService', 'bookingService', function ($stateParams, $sessionStorage, $log, extraDriverService, booking, $q, alertService, bookingService) {

        var cont = $stateParams.cont;

        return $q(function (resolve, reject) {
          if (cont === 'alter_timeframe' && $sessionStorage.alterTimeframeChangeset) {
            $log.log('now, add these extra drivers:', $sessionStorage.alterTimeframeChangeset);
            bookingService.alterRequest({
              booking: booking.id,
              timeFrame: {
                startDate: $sessionStorage.alterTimeframeChangeset.beginRequested,
                endDate: $sessionStorage.alterTimeframeChangeset.endRequested,
              },
              remark: $sessionStorage.alterTimeframeChangeset.remarkRequester,
            })
            .then(function (updatedBooking) {
              angular.merge(booking, updatedBooking);
              if (updatedBooking.beginRequested) {
                alertService.add('success', 'De betaling is ontvangen, en de wijziging is aangevraagd bij de verhuurder.');
              } else {
                alertService.add('success', 'De betaling is ontvangen, en het huurverzoek is geaccepteerd.');
              }
              $sessionStorage.alterTimeframeChangeset = null;
              resolve({});
            })
            .catch(function (e) {
              alertService.addError(e);
              resolve({
                error: 'error_api_alter_timeframe',
              });
            });
          }
          else if (cont === 'add_extra_drivers' && $sessionStorage.addExtraDriversEmails) {
            $log.log('now, add these extra drivers:', $sessionStorage.addExtraDriversEmails);
            $q.all($sessionStorage.addExtraDriversEmails.map(function (email) {
              return extraDriverService.addDriver({
                booking: booking.id,
                email: email,
              });
            }))
            .then(function () {
              alertService.add('success', 'De betaling is ontvangen, en de extra bestuurders zijn uitgenodigd.', 4000);
              $sessionStorage.addExtraDriversEmails = null;
              resolve({});
            })
            .catch(function (e) {
              alertService.addError(e);
              resolve({
                error: 'error_api_add_extra_drivers',
              });
            });
          }
          else if (cont && cont.slice(0, 6) === 'error_') {
            resolve({
              error: cont,
            });
          }
          else {
            resolve({});
          }
        });
      }],
    },
  })

  .state('owm.booking.show', {
    url: '',
    views: {
      'main-full@shell': {
        templateUrl: 'booking/show/booking-show.tpl.html',
        controller: 'BookingShowController',
      },
    },
  })


  /**
   * Accept a booking & redirect to booking detail
   */
  .state('owm.booking.accept', {
    url: '/accept',
    onEnter: ['$state', '$stateParams', '$filter', 'alertService', 'bookingService', 'Analytics',
     function ($state ,  $stateParams ,  $filter ,  alertService ,  bookingService, Analytics) {

      var bookingId = $stateParams.bookingId;
      bookingService.acceptRequest({ booking: bookingId }).then(function (booking) {
        Analytics.trackEvent('booking', 'accepted', bookingId, 4, undefined, true);
        alertService.add('success', $filter('translate')('BOOKING.ACCEPT.SUCCESS'), 8000);
      })
      .catch(alertService.addError)
      .finally(function () {
        $state.go('owm.booking.show', { bookingId: bookingId });
      });
    }]
  })

  /**
   * Reject a booking & redirect to booking detail
   */
  .state('owm.booking.reject', {
    url: '/reject',
    onEnter: ['$state', '$stateParams', '$filter', 'alertService', 'bookingService', 'Analytics',
     function ($state ,  $stateParams ,  $filter ,  alertService ,  bookingService, Analytics) {

      var bookingId = $stateParams.bookingId;
      bookingService.rejectRequest({ booking: bookingId }).then(function (booking) {
        Analytics.trackEvent('booking', 'rejected', bookingId, undefined, true);
        alertService.add('success', $filter('translate')('BOOKING.REJECT.SUCCESS'), 8000);
      })
      .catch(alertService.addError)
      .finally(function () {
        $state.go('owm.booking.show', { bookingId: bookingId });
      });
    }]
  })

  .state('owm.booking.rating-renter', {
    url: '/rating/renter?setsatisfaction',
    templateUrl: 'booking/rating/booking-rating.tpl.html',
    controller: 'BookingRatingController',
    data: {
      requiredFeatures: ['ratings']
    },
    resolve: {
      rating: ['booking', 'ratingService', function (booking, ratingService) {
        return ratingService.getPrefill({ trip: booking.trip.id }).then(function (prefilledRating) {
          return prefilledRating || {};
        });
      }],
      userPerspective: function () {
        return 'renter';
      }
    }
  })

  .state('owm.booking.rating-owner', {
    url: '/rating/owner?setsatisfaction',
    templateUrl: 'booking/rating/booking-rating.tpl.html',
    controller: 'BookingRatingController',
    data: {
      requiredFeatures: ['ratings']
    },
    resolve: {
      rating: ['booking', 'ratingService', function (booking, ratingService) {
        return ratingService.getPrefill({ trip: booking.trip.id }).then(function (prefilledRating) {
          return prefilledRating || {};
        });
      }],
      userPerspective: function () {
        return 'owner';
      }
    }
  })

  .state('owm.booking.administer', {
    url: '/administer',
    templateUrl: 'booking/administer/booking-administer.tpl.html',
    controller: 'BookingAdministerController'
  })
  
  .state('owm.booking.finalize', {
    url: '/finalize',
    templateUrl: 'booking/administer/booking-finalize.tpl.html',
    controller: 'BookingFinalizeController'
  })
  ;

})
;
