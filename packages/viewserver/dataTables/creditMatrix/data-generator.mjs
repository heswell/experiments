let _id = 1;

const Org = organisation => ({organisation});
const org = [Org('Bigcorp'),Org('Fidelity'),Org('Hayes'),Org('Gordon'),Org('G & T')];

const Account = (orgId, accountId, accountName) => ({...org[orgId], accountId, accountName});
const Qty = (maxTenor, maxQuantity, usedQuantity) => ({maxTenor,maxQuantity:maxQuantity, usedQuantity, availableQuantity: maxQuantity - usedQuantity});
const CreditLine = (acc1, acc2, ccy, qty1, qty2, status) => ({
	id : _id++,
	...acc1,
	cptyOrganisation: acc2.organisation,
	cptyAccountId: acc2.accountId,
	cptyAccountName: acc2.accountName,
	ccy,
	...qty1,
	cptyMaxTenor: qty2.maxTenor,
	cptyMaxQuantity: qty2.maxQuantity,
	cptyUsedQuantity: qty2.usedQuantity,
	cptyAvailableQuantity: qty2.availableQuantity,
	status
});

const accA01 = Account(0, 1001, 'Account A 1001');
const accA02 = Account(0, 1002, 'Account A 1002');
const accA03 = Account(0, 1003, 'Account A 1003');
const accA04 = Account(0, 1004, 'Account A 1004');
const accA05 = Account(0, 1005, 'Account A 1005');

const accB06 = Account(1, 1006, 'Account B 1006');
const accB07 = Account(1, 1007, 'Account B 1007');
const accB08 = Account(1, 1008, 'Account B 1008');
const accB09 = Account(1, 1009, 'Account B 1009');
const accB10 = Account(1, 1010, 'Account B 1010');

const accC11 = Account(2, 1011, 'Account C 1011');
const accC12 = Account(2, 1012, 'Account C 1012');
const accC13 = Account(2, 1013, 'Account C 1013');
const accC14 = Account(2, 1014, 'Account C 1014');
const accC15 = Account(2, 1015, 'Account C 1015');

const accD16 = Account(3, 1016, 'Account D 1016');
const accD17 = Account(3, 1017, 'Account D 1017');
const accD18 = Account(3, 1018, 'Account D 1018');
const accD19 = Account(3, 1019, 'Account D 1019');
const accD20 = Account(3, 1020, 'Account D 1020');

const accE21 = Account(4, 1021, 'Account E 1021');
const accE22 = Account(4, 1022, 'Account E 1022');
const accE23 = Account(4, 1023, 'Account E 1023');
const accE24 = Account(4, 1024, 'Account E 1024');
const accE25 = Account(4, 1025, 'Account E 1025');

const Live = 'Live';

export const data = [
	CreditLine(accA01, accB06, 'Base', Qty('3M',200,30), Qty('3M',100, 0),Live),
	CreditLine(accA01, accB06, 'USD',  Qty('3M',100,30), Qty('3M',100, 0),Live),
	CreditLine(accA01, accB06, 'EUR',  Qty('3M',80,30), Qty('3M',100, 0),Live),
	CreditLine(accA01, accB06, 'GBP',  Qty('3M',50,30), Qty('3M',100, 0),Live),

	CreditLine(accA01, accB07, 'Base', Qty('3M',100,20), Qty('3M',100, 0),Live),
	CreditLine(accA01, accB07, 'EUR',  Qty('3M',700,20), Qty('3M',100, 0),Live),

	CreditLine(accA01, accC11, 'Base', Qty('3M',100,30), Qty('3M',100, 0),Live),
	CreditLine(accA01, accC11, 'USD',  Qty('3M',100,30), Qty('3M',100, 0),Live),

	CreditLine(accA01, accD16, 'Base', Qty('3M',100,70), Qty('3M',100, 0),Live),

	CreditLine(accA01, accE21, 'Base', Qty('3M',100,10), Qty('3M',100, 0),Live),

	CreditLine(accA02, accB06, 'Base', Qty('3M',100,30), Qty('3M',100, 0),Live),

	CreditLine(accA02, accB07, 'Base', Qty('3M',100,20), Qty('3M',100, 0),Live),

	CreditLine(accA02, accC11, 'Base', Qty('3M',100,30), Qty('3M',100, 0),Live),

	CreditLine(accA02, accD16, 'Base', Qty('3M',100,70), Qty('3M',100, 0),Live),

	CreditLine(accA02, accE21, 'Base', Qty('3M',100,10), Qty('3M',100, 0),Live)
];
