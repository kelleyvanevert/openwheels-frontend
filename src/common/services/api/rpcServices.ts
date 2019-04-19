'use strict';

import {
  IContract,
  IProviderInfo,
  IPlace,
} from "../../types";

abstract class MWService {
  m: (methodName: string, isAnonymous?: boolean, middleware?) => any;

  constructor (api, namespace) {
    this.m = function (name, isAnonymous?, middleware?) {
      return api.createRpcMethod(namespace + '.' + name, isAnonymous);
    };
  }
}

class ProviderInfoService extends MWService {
  constructor (api) {
    super(api, "providerinfo");
  }

  getInfo2 = this.m("getInfoByProvider", undefined, info => {
    if (!info.extraInfo) {
      info.extraInfo = {};
    }
    if (!info.extraInfo.personProfileBlacklist) {
      info.extraInfo.personProfileBlacklist = {};
    }
    return info;
  }) as (params: { provider: number; }) => Promise<IProviderInfo>;
}

class PlaceService extends MWService {
  constructor (api) {
    super(api, "place");
  }

  search = this.m("search") as (params: { place: string; }) => Promise<IPlace>;
}

class ContractService extends MWService {
  constructor (api) {
    super(api, "contract");
  }

  get = this.m("get");
  all = this.m("all");
  alter = this.m("alter");
  create = this.m("create");
  allTypes = this.m("allTypes");

  forDriver     = this.m("forDriver")     as (params: { person: number; }) => Promise<IContract[]>;
  forContractor = this.m("forContractor") as (params: { person: number; }) => Promise<IContract[]>;

  forBooking = this.m("forBooking");
  addPerson = this.m("addPerson");
  removePerson = this.m("removePerson");
  invitePerson = this.m("invitePerson");
  requestContract = this.m("requestContract");
}

class PersonService extends MWService {
  constructor (api) {
    super(api, "person");
  }

  /* REQUIRES parameter version=2 (version 1 deprecated on 13-5-2015) */
  get = this.m("get");

  /* REQUIRES parameter version=2 (version 1 deprecated on 19-5-2015) */
  me = this.m("me");

  /* REQUIRES parameter version=2 (version 1 deprecated on 19-5-2015) */
  meAnonymous = this.m("me", true);

  validateEmail = this.m("validateEmail");
  alter = this.m("alter");
  search = this.m("search");
  dropPhoneWithPhoneId = this.m("dropPhoneWithPhoneId");
  alterPhoneWithPhoneId = this.m("alterPhoneWithPhoneId");
  addPhoneWithPersonId = this.m("addPhoneWithPersonId");
  alterEmail = this.m("alterEmail");
  sendResetPassword = this.m("sendResetPassword");
  resetPassword = this.m("resetPassword");
  addLicenseImages = this.m("addLicenseImages");
  setProfileImage = this.m("setProfileImage");
  emailBookingLink = this.m("emailBookingLink");
  emailPreferenceToNone = this.m("emailPreferenceToNone");
  sendVerificationCode = this.m("sendVerificationCode");
  verifyPhoneNumber = this.m("verifyPhoneNumber");
  addPhoneNumber = this.m("addPhoneNumber");
}


angular.module("rpcServices", [])

.service("personService", PersonService)
.service("placeService", PlaceService)
.service("contractService", ContractService)

.service('chipcardService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('chipcard.' + name);
  };
  this.forPerson = m('forPerson');
  this.create = m('create');
  this.alter = m('alter');
  this.getFish = m('getFish');
  this.createFish = m('createFish');
  this.deleteFish = m('deleteFish');
  this.block = m('block');
  this.unblock = m('unblock');
})

.service('resourceService', function (api) {
  var m = function (name, isAnonymous = false) {
    return api.createRpcMethod('resource.' + name, isAnonymous);
  };
  this.all = m('all');
  this.get = m('get');
  this.alter = m('alter');
  this.select = m('select');
  this.forOwner = m('forOwner');
  this.search = m('search');
  this.searchV2 = m('searchV2');
  this.searchV3 = m('searchV3');
  this.searchMapV1 = m('searchMapV1');
  this.create = m('create');
  this.getMembers = m('getMembers');
  this.addMember = m('addMember');
  this.removeMember = m('removeMember');
  this.invitePerson = m('invitePerson');
  this.addPicture = m('addPicture');
  this.removePicture = m('removePicture');
  this.alterPicture = m('alterPicture');
  this.checkAvailability = m('checkAvalibility', true);
  this.getFavorites = m('getFavorites');
  this.addFavorite = m('addFavorite');
  this.removeFavorite = m('removeFavorite');
  this.getMemberResources = m('getMemberResources');
  this.addProperty = m('addProperty');
  this.removeProperty = m('remProperty');
  this.createParkingpermit = m('createParkingpermit');
  this.alterParkingpermit = m('alterParkingpermit');
  this.removeParkingpermit = m('removeParkingpermit');
  this.getParkingpermits = m('getParkingpermits');
})

.service('bookingService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('booking.' + name);
  };
  this.alterRequest = m('alterRequest');
  this.addDriver = m('addDriver');
  this.removeDriver = m('removeDriver');
  this.driversForBooking = m('driversForBooking');
  this.acceptRequest = m('acceptRequest');
  this.rejectRequest = m('rejectRequest');
  this.create = m('create');
  this.get = m('get');
  this.alter = m('alter');
  this.stop = m('stop');
  this.cancel = m('cancel');
  this.setTrip = m('setTrip');
  this.finishTrip = m('finishTrip');
  this.forResource = m('forResource');
  this.forOwner = m('forOwner');
  this.getBookingList = m('getBookingList');
  this.clearDrivers= m('clearDrivers');
})

.service('boardcomputerService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('boardcomputer.' + name);
  };
  this.control = m('control');
  this.currentLocation = m('currentLocation');
})

.service('invoiceService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invoice.' + name);
  };
  this.get = m('get');
  this.allGroups = m('allGroups');
  this.paymentsForPerson = m('paymentsForPerson');
})

.service('invoice2Service', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invoice2.' + name);
  };
  this.getSent = m('getSent');
  this.getReceived = m('getReceived'); // status = paid | unpaid | both
  this.getUngroupedForPerson = m('getUngroupedForPerson');
  this.calculateBookingPrice = m('calculateBookingPrice'); // status = paid | unpaid | both
  this.createSenderInvoiceGroup = m('createSenderInvoiceGroup');
  this.createRecipientInvoiceGroup = m('createRecipientInvoiceGroup');
  this.calculatePrice = m('calculatePrice');
  this.getInvoiceGroup = m('getInvoiceGroup');
})

.service('accountService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('account.' + name);
  };
  this.get = m('get');
  this.alter = m('alter');
})
.service('account2Service', function (api) {
  var m = function (name) {
    return api.createRpcMethod('account2.' + name);
  };
  this.forMe = m('forMe');
})

.service('actionService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('actions.' + name);
  };
  this.all = m('all');
  this.delete = m('delete');
})

.service('declarationService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('declaration.' + name);
  };
  this.create = m('create');
  this.forBooking = m('forBooking');
})

.service('idealService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('ideal.' + name);
  };
  this.payInvoiceGroup = m('payInvoiceGroup');
})

.service('voucherService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('voucher.' + name);
  };
  this.search = m('search');
  this.calculateRequiredCredit = m('calculateRequiredCredit');
  this.calculateCredit = m('calculateCredit');
  this.calculateDebt = m('calculateDebt');
  this.createVoucher = m('createVoucher');
  this.calculateRequiredCreditForBooking = m('calculateRequiredCreditForBooking');
})

.service('ratingService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('rating.' + name);
  };
  this.getPrefill = m('getPrefill');
  this.create = m('create');
  this.getResourceRatings = m('getResourceRatings');
  this.getDriverRatings = m('getDriverRatings');
  this.commentOnRating = m('commentOnRating');
})

.service('anwbService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('anwb.' + name);
  };
  this.setAnwbNumber = m('setAnwbNumber');
})

.service('paymentService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('payment.' + name);
  };
  this.pay = m('pay');
  this.payBooking = m('payBooking');
  this.payVoucher = m('payVoucher');
  this.payInvoiceGroup = m('payInvoiceGroup');
  this.getInvoiceGroups = m('getInvoiceGroups');
  this.payoutVoucher = m('payoutVoucher');
  this.payoutInvoiceGroup = m('payoutInvoicegroup');
})

.service('calendarService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('calender.' + name);
  };
  this.createBlock = m('createBlock');
  this.alterBlock = m('alterBlock');
  this.removeBlock = m('removeBlock');
  this.createPeriodic = m('createPeriodic');
  this.alterPeriodic = m('alterPeriodic');
  this.removePeriodic = m('removePeriodic');
  this.between = m('between');
  this.search = m('search');
})

.service('messageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('message.' + name);
  };
  this.sendMessageTo = m('sendMessageTo');
  // this.getMyConversations = m('getMyConversations');
  this.getConversationWith = m('getConversationWith');
  this.getMessagesAfter = m('getMessagesAfter');
  this.getMessagesBefore = m('getMessagesBefore');

  function sortFilterConversations (conversations) {
    // In the unlikely situation that multiple messages were
    //  sent in the same second in a particular conversation,
    //  these messages will both show up in the API call result.
    var had = {};
    conversations = _.sortBy(conversations, 'date').reverse().filter(function (message) {
      var between = [message.sender.id, message.recipient.id].join('-');
      if (had[between]) {
        return false;
      }
      had[between] = true;
      return true;
    });
    
    return conversations;
  }

  // `getInbox` is the updated `getMyConversations`
  var getInbox = m('getInbox');
  this.getMyConversations = function (params) {
    return getInbox(params).then(function (data) {
      if (data.length) {
        var arr = sortFilterConversations(data);
        return {
          result: arr,
          total: arr.length,
        };
      } else {
        return {
          result: sortFilterConversations(data.result),
          total: data.total,
        };
      }
    });
  };
})

.service('discountService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('discount.' + name);
  };
  this.create = m('create');
  this.get = m('get');
  this.search = m('search');
  this.isApplicable = m('isApplicable');
  this.getApplicableState = m('getApplicableState');
  this.apply = m('apply');
  this.disable = m('disable');
})

.service('discountUsageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('discount_usage.' + name);
  };
  this.search = m('search');
})

.service('inviteService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('invite.' + name);
  };
  this.getInvitedFriends = m('getInvitedFriends');
  this.inviteFriend = m('inviteFriend');
})

.service('extraDriverService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('extra_driver.' + name);
  };
  this.addDriver = m('addDriver');
  this.removeDriver = m('removeDriver');
  this.getRequest = m('getRequest');
  this.driversForBooking = m('driversForBooking');
  this.clearDrivers = m('clearDrivers');
  this.acceptRequest = m('acceptRequest');
  this.declineRequest = m('declineRequest');
  this.getRequestsForPerson = m('getRequestsForPerson');
  this.acceptContractRequest = m('acceptContractRequest');
  this.declineContractRequest = m('declineContractRequest');
  this.revokeContractRequest = m('revokeContractRequest');
  this.revokeBookingRequest = m('revokeBookingRequest');
  this.getRequestsForContract = m('getRequestsForContract');
  this.invitePersonForContract = m('invitePersonForContract');
  this.removePersonFromContract = m('removePersonFromContract');
  this.getExtraDriverBookingList = m('getExtraDriverBookingList');
  this.search = m('search');
})

.service('kmPointService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('kmpoint.' + name);
  };
  this.forPerson = m('forPerson');
})

.service('damageService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('damage.' + name);
  };
  this.addUserDamage = m('addUserDamage');
  this.dirty = m('dirty');
})

.service('instantPaymentService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('instant_payment.' + name);
  };
  this.getByIdAndToken = m('getByIdAndToken');
  this.createByIdAndToken = m('createByIdAndToken');
  this.create = m('create');
})

.service('formSubmissionService', function (api) {
  var m = function (name) {
    return api.createRpcMethod('form_submission.' + name);
  };
  var _send = m('send');
  this.send = function (params) {
    return _send({
      other: params,
    });
  };
})

.service('providerInfoService', ProviderInfoService)
;
