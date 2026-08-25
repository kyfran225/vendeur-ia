export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateAgainstXOF: number; // 1 XOF = X units of this currency
  roundDecimals: number; // 0 for XOF/GNF/XAF, 2 for EUR/USD/GHS/GBP/CAD
  minUnit: number; // minimum step (e.g., 50 for XOF, 0.5 for GHS, 0.01 for USD)
}

export const CURRENCIES_DATA: Record<string, CurrencyRate> = {
  XOF: { code: "XOF", name: "Franc CFA (UEMOA)", symbol: "FCFA", rateAgainstXOF: 1, roundDecimals: 0, minUnit: 5 },
  XAF: { code: "XAF", name: "Franc CFA (CEMAC)", symbol: "FCFA", rateAgainstXOF: 1, roundDecimals: 0, minUnit: 5 },
  GNF: { code: "GNF", name: "Franc Guinéen", symbol: "GNF", rateAgainstXOF: 14, roundDecimals: 0, minUnit: 500 },
  NGN: { code: "NGN", name: "Naira Nigérian", symbol: "₦", rateAgainstXOF: 2.5, roundDecimals: 0, minUnit: 50 },
  GHS: { code: "GHS", name: "Cedi Ghanéen", symbol: "GH₵", rateAgainstXOF: 0.025, roundDecimals: 2, minUnit: 0.5 },
  KES: { code: "KES", name: "Shilling Kenyan", symbol: "KSh", rateAgainstXOF: 0.22, roundDecimals: 0, minUnit: 10 },
  MAD: { code: "MAD", name: "Dirham Marocain", symbol: "DH", rateAgainstXOF: 0.016, roundDecimals: 2, minUnit: 1 },
  DZD: { code: "DZD", name: "Dinar Algérien", symbol: "DA", rateAgainstXOF: 0.22, roundDecimals: 0, minUnit: 10 },
  TND: { code: "TND", name: "Dinar Tunisien", symbol: "DT", rateAgainstXOF: 0.005, roundDecimals: 3, minUnit: 0.1 },
  CDF: { code: "CDF", name: "Franc Congolais", symbol: "FC", rateAgainstXOF: 4.6, roundDecimals: 0, minUnit: 50 },
  MRU: { code: "MRU", name: "Ouguiya Mauritanien", symbol: "UM", rateAgainstXOF: 0.065, roundDecimals: 1, minUnit: 1 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", rateAgainstXOF: 0.00152, roundDecimals: 2, minUnit: 0.1 },
  USD: { code: "USD", name: "Dollar US", symbol: "$", rateAgainstXOF: 0.00165, roundDecimals: 2, minUnit: 0.1 },
  GBP: { code: "GBP", name: "Livre Sterling", symbol: "£", rateAgainstXOF: 0.00128, roundDecimals: 2, minUnit: 0.1 },
  CAD: { code: "CAD", name: "Dollar Canadien", symbol: "CA$", rateAgainstXOF: 0.00227, roundDecimals: 2, minUnit: 0.1 },
  ZAR: { code: "ZAR", name: "Rand Sud-Africain", symbol: "R", rateAgainstXOF: 0.03, roundDecimals: 2, minUnit: 0.5 }
};

/**
 * Convert an amount from one currency to another using reference XOF rates.
 */
export function convertCurrencyAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (!amount || amount <= 0) return 0;
  const from = (fromCurrency || "XOF").toUpperCase();
  const to = (toCurrency || "XOF").toUpperCase();
  if (from === to) return amount;

  const fromData = CURRENCIES_DATA[from] || CURRENCIES_DATA.XOF;
  const toData = CURRENCIES_DATA[to] || CURRENCIES_DATA.XOF;

  // Convert from 'from' to XOF base
  const amountInXOF = amount / (fromData.rateAgainstXOF || 1);

  // Convert from XOF base to 'to'
  const rawConverted = amountInXOF * (toData.rateAgainstXOF || 1);

  if (toData.roundDecimals === 0) {
    // Round to clean integer according to currency steps
    if (rawConverted >= 1000) {
      // Round to nearest 50 or 100
      return Math.round(rawConverted / (toData.minUnit || 1)) * (toData.minUnit || 1);
    }
    return Math.round(rawConverted);
  } else {
    const factor = Math.pow(10, toData.roundDecimals);
    return Math.round(rawConverted * factor) / factor;
  }
}
