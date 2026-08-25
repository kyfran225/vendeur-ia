import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  getCountryByCode,
  getProvidersForCountry,
  CURRENCIES_DATA,
  convertCurrencyAmount,
  parsePhoneNumber,
  formatDisplayPhone
} from "@vendeur-ia/core";

describe("Countries & Official Payment Corridors", () => {
  it("should contain all key UEMOA, African, and international countries", () => {
    const countryCodes = COUNTRIES.map((c) => c.code);
    expect(countryCodes).toContain("CI");
    expect(countryCodes).toContain("SN");
    expect(countryCodes).toContain("ML");
    expect(countryCodes).toContain("BF");
    expect(countryCodes).toContain("BJ");
    expect(countryCodes).toContain("TG");
    expect(countryCodes).toContain("FR");
    expect(countryCodes).toContain("BE");
    expect(countryCodes).toContain("US");
    expect(countryCodes).toContain("CA");
    expect(countryCodes).toContain("GB");
  });

  it("should return official cross-border corridor providers for France", () => {
    const frProviders = getProvidersForCountry("FR");
    const providerIds = frProviders.map((p) => p.id);
    expect(providerIds).toContain("sendwave");
    expect(providerIds).toContain("taptapsend");
    expect(providerIds).toContain("orange_money_europe");
    expect(providerIds).toContain("bank_transfer");
    expect(providerIds).toContain("card");

    const sendwave = frProviders.find((p) => p.id === "sendwave");
    expect(sendwave?.type).toBe("remittance");
    expect(sendwave?.corridorNote).toBeDefined();
  });

  it("should return official providers for Côte d'Ivoire with local & cross-border notes", () => {
    const ciProviders = getProvidersForCountry("CI");
    const providerIds = ciProviders.map((p) => p.id);
    expect(providerIds).toContain("wave");
    expect(providerIds).toContain("orange_money");
    expect(providerIds).toContain("mtn_momo");
    expect(providerIds).toContain("moov_money");
    expect(providerIds).toContain("bank_transfer");
  });

  it("should handle currency conversion between XOF, EUR, USD, GBP and CAD", () => {
    expect(CURRENCIES_DATA.EUR).toBeDefined();
    expect(CURRENCIES_DATA.GBP).toBeDefined();
    expect(CURRENCIES_DATA.CAD).toBeDefined();
    expect(CURRENCIES_DATA.USD).toBeDefined();

    const xofFromEur = convertCurrencyAmount(10, "EUR", "XOF");
    expect(xofFromEur).toBeGreaterThan(6000);

    const eurFromXof = convertCurrencyAmount(6559, "XOF", "EUR");
    expect(eurFromXof).toBeCloseTo(10, 0);
  });

  it("should parse and format international phone numbers accurately", () => {
    // France
    const frPhone = parsePhoneNumber("+33612345678");
    expect(frPhone.country.code).toBe("FR");
    expect(formatDisplayPhone("+33612345678", "FR")).toBe("+33 6 12 34 56 78");

    // Côte d'Ivoire
    const ciPhone = parsePhoneNumber("+2250707070707");
    expect(ciPhone.country.code).toBe("CI");
    expect(formatDisplayPhone("+2250707070707", "CI")).toBe("+225 07 07 07 07 07");

    // Sénégal
    const snPhone = parsePhoneNumber("+221771234567");
    expect(snPhone.country.code).toBe("SN");
    expect(formatDisplayPhone("+221771234567", "SN")).toBe("+221 77 123 45 67");

    // USA
    const usPhone = parsePhoneNumber("+12125550199");
    expect(usPhone.country.code).toBe("US");
    expect(formatDisplayPhone("+12125550199", "US")).toBe("+1 212 555 0199");
  });
});
