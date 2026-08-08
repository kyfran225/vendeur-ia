export interface PaymentProvider {
  id: string;
  label: string;
  color: string;
  type: 'mobile_money' | 'bank' | 'card' | 'cash';
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
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money' },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "wave", label: "Wave", color: "bg-sky-400", type: 'mobile_money' },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "free_money", label: "Free Money", color: "bg-red-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "tmoney", label: "TMoney", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "moov_money", label: "Moov Money", color: "bg-blue-600", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
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
      { id: "mtn_ghana", label: "MTN MoMo", color: "bg-yellow-400", type: 'mobile_money' },
      { id: "vodafone_cash", label: "Telecel Cash", color: "bg-red-600", type: 'mobile_money' },
      { id: "airteltigo_money", label: "AT Money", color: "bg-blue-500", type: 'mobile_money' },
      { id: "bank_transfer", label: "Bank Transfer", color: "bg-slate-500", type: 'bank' }
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
      { id: "m-pesa", label: "M-Pesa", color: "bg-red-600", type: 'mobile_money' },
      { id: "orange_money", label: "Orange Money", color: "bg-orange-500", type: 'mobile_money' },
      { id: "airtel_money", label: "Airtel Money", color: "bg-red-500", type: 'mobile_money' },
      { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' }
    ]
  }
];

export const getCountryByCode = (code: string) => COUNTRIES.find(c => c.code === code);

export const getProvidersForCountry = (code: string) => {
  const country = getCountryByCode(code);
  const providers = country ? [...country.paymentProviders] : [
    { id: "bank_transfer", label: "Virement Bancaire", color: "bg-slate-500", type: 'bank' as const },
  ];

  // Add universal providers
  if (!providers.find(p => p.id === "card")) {
    providers.push({ id: "card", label: "Carte Bancaire", color: "bg-emerald-500", type: 'card' as const });
  }
  if (!providers.find(p => p.id === "other")) {
    providers.push({ id: "other", label: "Autre (Préciser)", color: "bg-slate-400", type: 'cash' as const });
  }

  return providers;
};
