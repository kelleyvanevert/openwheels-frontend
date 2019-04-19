
import { datetime, RatingTotals } from "./misc";

export interface IPerson {
  id: number
  status: "new" | "active" | "book-only" | "blocked" | "unsubscribed"
  preference: "owner" | "renter" | "both"
  created: datetime
  provider: { id: number }

  // contact/personal details
  firstName: string
  preposition: string
  surName: string
  email: string
  dateOfBirth: datetime

  // settings
  isCompany: boolean
  companyName: string

  // other info
  numberOfBookings: number
  rating_totals: RatingTotals
}

/*
about: null
badges: []
bankCheck: false
bookConfirmation: true
city: "Hilversum"
companyName: null
country: "Nederland"
created: "2019-04-19 09:18"
dateOfBirth: "1985-03-08 00:00"
driverLicense: "kantoor map"
driverLicenseBack: null
driverLicenseNumber: "2156483405"
driverLicenseStatus: "ok"
drivingLicenseSince: null
drivingLicenseValidUntil: null
email: "mywheelsadmin@test.mywheels.nl"
emailInvoice: false
emailPreference: "all"
emailVerified: true
externalIdentifier: null
extraDriver: false
facebookSurname: null
facebookUid: null
firstName: "Mywheels"
flowCompleted: false
googleAuthenticatorSecret: null
id: 14
invited: []
invoiceAdress: null
ipadress: null
isBusinessConnected: false
isCompany: false
isEmailConfidential: false
latitude: 52.090793
linkedinUid: null
longitude: 5.111107
male: true
notifyByMessage: true
numberOfBookings: 0
pausePayouts: true
phoneNumbers: [,…]
pictureUrl: null
platform: null
preference: "both"
preposition: null
private: false
profileImage: null
provider: {id: 1}
rating_totals: {cleanliness: -1, punctuality: -1, quality: -1, satisfaction: -1, senders: 0}
redeemed: false
registerSource: null
remark: null
role: "ROLE_ADMIN"
slug: null
status: "active"
streetName: "Stationsplein"
streetNumber: "97"
surname: "Admin"
twitterUid: null
visibility: "members"
zipcode: "1234AB"
*/