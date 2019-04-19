
export interface IContractType {
  id: number;
  name: string;
  description: string;
}

export interface IContract {
  id: number;
  status: "active" | any;

  contractorId: number;
  contractor: IPerson;

  type: IContractType;

  sort: number;
  ownRiskWaiver?: "not" | "month" | "booking";
  multiBooking?: boolean;
  creditLimit: number;

  created: datetime;
}

/*
contractor: {id: 46, slug: "dimtest6503", preference: "renter", pictureUrl: null, firstName: "Dimtest",…}
contractorId: 46
created: "2019-04-19 09:35"
creditLimit: 250
id: 25
multiBooking: false
ownRiskWaiver: "not"
sort: 993
status: "active"
type: {id: 64, name: "MyWheels Dim", description: "MyWheels Dim for Invoice2 Module", bookingFee: "2.50",…}
validStatuses: null
*/