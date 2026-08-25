export interface PaymentProvider {
  id: string;
  label: string;
  color: string;
  type: 'mobile_money' | 'bank' | 'card' | 'remittance' | 'cash';
  corridorNote?: string;
  placeholder?: string;
  inputKind?: 'phone' | 'iban' | 'text' | 'link';
  supportedCurrencies?: string[];
}

export interface CountryData {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  currency: string;
  defaultCity: string;
  paymentProviders: PaymentProvider[];
}

export const COUNTRIES: CountryData[] = [
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flag: "https://flagcdn.com/w40/ci.png",
    currency: "XOF",
    defaultCity: "Abidjan",
    paymentProviders: [
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money', corridorNote: "Local & réceptions internationales (Sendwave, TapTap Send)", inputKind: "phone", placeholder: "07 00 00 00 00" },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local, UEMOA & réceptions Orange Money Europe / TapTap Send", inputKind: "phone", placeholder: "07 00 00 00 00" },
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', corridorNote: "Local & réceptions TapTap Send / Sendwave", inputKind: "phone", placeholder: "05 00 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', corridorNote: "Local & réceptions TapTap Send / OM Europe", inputKind: "phone", placeholder: "01 00 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', corridorNote: "RIB / Compte bancaire local ou international", inputKind: "iban", placeholder: "CI00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "+221",
    flag: "https://flagcdn.com/w40/sn.png",
    currency: "XOF",
    defaultCity: "Dakar",
    paymentProviders: [
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money', corridorNote: "Local, UEMOA (CI, ML, BF) & réceptions internationales", inputKind: "phone", placeholder: "77 000 00 00" },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local, UEMOA & Orange Money Europe", inputKind: "phone", placeholder: "77 000 00 00" },
      { id: "free_money", label: "Free Money", color: "bg-red-600", type: 'mobile_money', inputKind: "phone", placeholder: "76 000 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "SN00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "https://flagcdn.com/w40/fr.png",
    currency: "EUR",
    defaultCity: "Paris",
    paymentProviders: [
      { id: "sendwave", label: "Sendwave (vers Wave/OM/MTN)", color: "bg-sky-500", type: 'remittance', corridorNote: "Envoi direct instantané par CB vers Wave, Orange Money et MTN en Côte d'Ivoire & Afrique", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "taptapsend", label: "TapTap Send (vers Wave/OM/MTN)", color: "bg-emerald-500", type: 'remittance', corridorNote: "Envoi instantané par CB vers Wave, Orange Money, MTN et Moov en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "orange_money_europe", label: "Orange Money Europe", color: "bg-orange-500", type: 'remittance', corridorNote: "Envoi direct vers Orange Money, MTN et Moov en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro Orange Money destinataire" },
      { id: "bank_transfer", label: "Virement Bancaire (IBAN / SEPA)", color: "bg-slate-500", type: 'bank', corridorNote: "Virement bancaire européen SEPA", inputKind: "iban", placeholder: "FR76 3000 6000 0112 3456 7890 123" },
      { id: "wave", label: "Wave (Transfert direct)", color: "bg-sky-400", type: 'mobile_money', corridorNote: "Transfert vers compte Wave CI / Sénégal", inputKind: "phone", placeholder: "Numéro Wave destinataire" }
    ]
  },
  {
    code: "BE",
    name: "Belgique",
    dialCode: "+32",
    flag: "https://flagcdn.com/w40/be.png",
    currency: "EUR",
    defaultCity: "Bruxelles",
    paymentProviders: [
      { id: "taptapsend", label: "TapTap Send (vers Wave/OM/MTN)", color: "bg-emerald-500", type: 'remittance', corridorNote: "Envoi instantané par CB vers Wave, OM, MTN en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "sendwave", label: "Sendwave (vers Wave/OM/MTN)", color: "bg-sky-500", type: 'remittance', corridorNote: "Envoi direct par CB vers Wave, Orange Money et MTN en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "orange_money_europe", label: "Orange Money Europe", color: "bg-orange-500", type: 'remittance', corridorNote: "Envoi direct vers Orange Money, MTN et Moov en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro Orange Money destinataire" },
      { id: "bank_transfer", label: "Virement Bancaire (IBAN / SEPA)", color: "bg-slate-500", type: 'bank', corridorNote: "Virement bancaire européen SEPA", inputKind: "iban", placeholder: "BE68 5390 0754 7034" }
    ]
  },
  {
    code: "US",
    name: "États-Unis",
    dialCode: "+1",
    flag: "https://flagcdn.com/w40/us.png",
    currency: "USD",
    defaultCity: "New York",
    paymentProviders: [
      { id: "sendwave", label: "Sendwave (to Wave/OM/MTN)", color: "bg-sky-500", type: 'remittance', corridorNote: "Instant debit card transfer to Wave, Orange Money & MTN in Côte d'Ivoire", inputKind: "phone", placeholder: "Recipient Mobile Money number" },
      { id: "taptapsend", label: "TapTap Send (to Wave/OM/MTN)", color: "bg-emerald-500", type: 'remittance', corridorNote: "Direct transfer to Wave, OM, MTN in Côte d'Ivoire", inputKind: "phone", placeholder: "Recipient Mobile Money number" },
      { id: "zelle", label: "Zelle", color: "bg-purple-600", type: 'cash', corridorNote: "US local instant payment", inputKind: "text", placeholder: "Email or US phone registered with Zelle" },
      { id: "bank_transfer", label: "Bank Wire / ACH", color: "bg-slate-500", type: 'bank', corridorNote: "US Bank routing & account details", inputKind: "iban", placeholder: "Routing & Account Number" }
    ]
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "https://flagcdn.com/w40/ca.png",
    currency: "CAD",
    defaultCity: "Montréal",
    paymentProviders: [
      { id: "sendwave", label: "Sendwave (vers Wave/OM/MTN)", color: "bg-sky-500", type: 'remittance', corridorNote: "Transfert instantané vers Wave, Orange Money & MTN en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "taptapsend", label: "TapTap Send (vers Wave/OM/MTN)", color: "bg-emerald-500", type: 'remittance', corridorNote: "Envoi direct vers Wave, Orange Money, MTN en Côte d'Ivoire", inputKind: "phone", placeholder: "Numéro mobile money destinataire" },
      { id: "interac", label: "Virement Interac", color: "bg-amber-600", type: 'bank', corridorNote: "Transfert Interac au Canada", inputKind: "text", placeholder: "Courriel ou numéro Interac" },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "Transit, Institution & Folio" }
    ]
  },
  {
    code: "GB",
    name: "Royaume-Uni",
    dialCode: "+44",
    flag: "https://flagcdn.com/w40/gb.png",
    currency: "GBP",
    defaultCity: "Londres",
    paymentProviders: [
      { id: "taptapsend", label: "TapTap Send (to Wave/OM/MTN)", color: "bg-emerald-500", type: 'remittance', corridorNote: "Direct transfer to Wave, Orange Money, MTN in Côte d'Ivoire", inputKind: "phone", placeholder: "Recipient Mobile Money number" },
      { id: "sendwave", label: "Sendwave (to Wave/OM/MTN)", color: "bg-sky-500", type: 'remittance', corridorNote: "Instant debit card transfer to Wave, Orange Money & MTN", inputKind: "phone", placeholder: "Recipient Mobile Money number" },
      { id: "bank_transfer", label: "UK Bank Transfer", color: "bg-slate-500", type: 'bank', corridorNote: "UK Faster Payments / Sort Code & Account Number", inputKind: "iban", placeholder: "Sort Code & Account Number / IBAN" }
    ]
  },
  {
    code: "ML",
    name: "Mali",
    dialCode: "+223",
    flag: "https://flagcdn.com/w40/ml.png",
    currency: "XOF",
    defaultCity: "Bamako",
    paymentProviders: [
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local, UEMOA & Orange Money Europe", inputKind: "phone", placeholder: "70 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "60 00 00 00" },
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money', corridorNote: "Local & zone UEMOA", inputKind: "phone", placeholder: "70 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "ML00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "BF",
    name: "Burkina Faso",
    dialCode: "+226",
    flag: "https://flagcdn.com/w40/bf.png",
    currency: "XOF",
    defaultCity: "Ouagadougou",
    paymentProviders: [
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local, UEMOA & Orange Money Europe", inputKind: "phone", placeholder: "70 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "60 00 00 00" },
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money', corridorNote: "Local & zone UEMOA", inputKind: "phone", placeholder: "70 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "BF00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flag: "https://flagcdn.com/w40/bj.png",
    currency: "XOF",
    defaultCity: "Cotonou",
    paymentProviders: [
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', inputKind: "phone", placeholder: "97 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "95 00 00 00" },
      { id: "celtiis_cash", label: "Celtiis Cash", color: "bg-emerald-500", type: 'mobile_money', inputKind: "phone", placeholder: "40 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "BJ00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    flag: "https://flagcdn.com/w40/tg.png",
    currency: "XOF",
    defaultCity: "Lomé",
    paymentProviders: [
      { id: "tmoney", label: "TMoney", color: "bg-yellow-400", type: 'mobile_money', inputKind: "phone", placeholder: "90 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "98 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "TG00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "NE",
    name: "Niger",
    dialCode: "+227",
    flag: "https://flagcdn.com/w40/ne.png",
    currency: "XOF",
    defaultCity: "Niamey",
    paymentProviders: [
      { id: "airtel_money", label: "Airtel Money", color: "bg-red-600", type: 'mobile_money', inputKind: "phone", placeholder: "90 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "96 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "NE00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "GW",
    name: "Guinée-Bissau",
    dialCode: "+245",
    flag: "https://flagcdn.com/w40/gw.png",
    currency: "XOF",
    defaultCity: "Bissau",
    paymentProviders: [
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', inputKind: "phone", placeholder: "95 000 00 00" },
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', inputKind: "phone", placeholder: "96 000 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "GW00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "CM",
    name: "Cameroun",
    dialCode: "+237",
    flag: "https://flagcdn.com/w40/cm.png",
    currency: "XAF",
    defaultCity: "Douala",
    paymentProviders: [
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', corridorNote: "Local & réceptions TapTap Send / Sendwave", inputKind: "phone", placeholder: "6 00 00 00 00" },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local & réceptions Orange Money Europe / TapTap Send", inputKind: "phone", placeholder: "6 00 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "CM00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "GA",
    name: "Gabon",
    dialCode: "+241",
    flag: "https://flagcdn.com/w40/ga.png",
    currency: "XAF",
    defaultCity: "Libreville",
    paymentProviders: [
      { id: "airtel_money", label: "Airtel Money", color: "bg-red-600", type: 'mobile_money', inputKind: "phone", placeholder: "070 00 00 00" },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money', inputKind: "phone", placeholder: "060 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "GA00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "GN",
    name: "Guinée",
    dialCode: "+224",
    flag: "https://flagcdn.com/w40/gn.png",
    currency: "GNF",
    defaultCity: "Conakry",
    paymentProviders: [
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', corridorNote: "Local & Orange Money Europe", inputKind: "phone", placeholder: "620 00 00 00" },
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', inputKind: "phone", placeholder: "660 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "GN00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "GH",
    name: "Ghana",
    dialCode: "+233",
    flag: "https://flagcdn.com/w40/gh.png",
    currency: "GHS",
    defaultCity: "Accra",
    paymentProviders: [
      { id: "mtn_ghana", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money', inputKind: "phone", placeholder: "024 000 0000" },
      { id: "vodafone_cash", label: "Telecel Cash", color: "bg-red-600", type: 'mobile_money', inputKind: "phone", placeholder: "020 000 0000" },
      { id: "airteltigo_money", label: "AT Money", color: "bg-blue-500", type: 'mobile_money', inputKind: "phone", placeholder: "027 000 0000" },
      { id: "bank_transfer", label: "Bank Transfer", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "GH00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "CD",
    name: "Congo (RDC)",
    dialCode: "+243",
    flag: "https://flagcdn.com/w40/cd.png",
    currency: "CDF",
    defaultCity: "Kinshasa",
    paymentProviders: [
      { id: "m-pesa", label: "M-Pesa", color: "bg-red-600", type: 'mobile_money', inputKind: "phone", placeholder: "081 000 0000" },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money', inputKind: "phone", placeholder: "089 000 0000" },
      { id: "airtel_money", label: "Airtel Money", color: "bg-red-500", type: 'mobile_money', inputKind: "phone", placeholder: "099 000 0000" },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "CD00 0000 0000 0000 0000 0000" }
    ]
  },
  {
    code: "MA",
    name: "Maroc",
    dialCode: "+212",
    flag: "https://flagcdn.com/w40/ma.png",
    currency: "MAD",
    defaultCity: "Casablanca",
    paymentProviders: [
      { id: "wafacash", label: "Cash Plus / Wafacash", color: "bg-emerald-600", type: 'cash', inputKind: "phone", placeholder: "06 00 00 00 00" },
      { id: "bank_transfer", label: "Virement Bancaire (RIB)", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "24 chiffres RIB marocain" }
    ]
  }
];

export const getCountryByCode = (code: string) => COUNTRIES.find(c => c.code === code);

export const getProvidersForCountry = (code: string): PaymentProvider[] => {
  const country = getCountryByCode(code);
  const providers: PaymentProvider[] = country ? [...country.paymentProviders] : [
    { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank', inputKind: "iban", placeholder: "IBAN / RIB / Coordonnées bancaires" }
  ];

  // Add universal providers
  if (!providers.find(p => p.id === "card")) {
    providers.push({
      id: "card",
      label: "Carte Bancaire",
      color: "bg-emerald-500",
      type: 'card',
      corridorNote: "Visa / Mastercard / Lien de paiement sécurisé",
      inputKind: "link",
      placeholder: "Lien de paiement sécurisé ou instructions"
    });
  }
  if (!providers.find(p => p.id === "other")) {
    providers.push({
      id: "other",
      label: "Autre (Préciser)",
      color: "bg-slate-400",
      type: 'cash',
      corridorNote: "Canal personnalisé ou accord direct",
      inputKind: "text",
      placeholder: "Détails du mode de paiement"
    });
  }

  return providers;
};
