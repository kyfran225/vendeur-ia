import { COUNTRIES, CountryData } from "./data/countries.js";

/**
 * Normalise un numéro local de Côte d'Ivoire (CI) en gérant la transition 8 chiffres -> 10 chiffres (Plan 2021).
 */
export function normalizeCILocal(local: string): string {
  const digits = (local || "").replace(/\D/g, "");
  if (!digits) return "";

  // Déjà au format standard 10 chiffres
  if (digits.length === 10) {
    return digits;
  }

  // Ancien format 8 chiffres -> Restauration du préfixe opérateur
  if (digits.length === 8) {
    // Moov (01) : 01, 02, 03, 40-43, 50-53, 70-73
    if (/^(01|02|03|40|41|42|43|50|51|52|53|70|71|72|73)/.test(digits)) {
      return `01${digits}`;
    }
    // MTN (05) : 04, 05, 06, 44-46, 54-56, 74-76, 84-86
    if (/^(04|05|06|44|45|46|54|55|56|74|75|76|84|85|86)/.test(digits)) {
      return `05${digits}`;
    }
    // Orange (07) : 07, 08, 09, 47-49, 57-59, 77-79, 87-89
    if (/^(07|08|09|47|48|49|57|58|59|77|78|79|87|88|89)/.test(digits)) {
      return `07${digits}`;
    }
    // Fixes Moov / MTN
    if (/^(20|21|22|23|24)/.test(digits)) {
      return `21${digits}`;
    }
    // Fixes Orange
    if (/^(25|26|27)/.test(digits)) {
      return `25${digits}`;
    }
    // Repli par défaut sur Moov
    return `01${digits}`;
  }

  // Format 9 chiffres (ex: 505111157 ou 102273966 -> omission du 0 initial)
  if (digits.length === 9) {
    return `0${digits}`;
  }

  return digits;
}

export interface ParsedPhone {
  country: CountryData;
  local: string;
  normalizedLocal: string;
  e164: string;
  formatted: string;
  rawDigits: string;
}

/**
 * Analyse et extrait le pays, l'indicatif et le numéro local avec détection intelligente de préfixe.
 */
export function parsePhoneNumber(phoneStr?: string, defaultCountryCode = "CI"): ParsedPhone {
  const defaultCountry = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
  if (!phoneStr) {
    return {
      country: defaultCountry,
      local: "",
      normalizedLocal: "",
      e164: "",
      formatted: "",
      rawDigits: ""
    };
  }

  const rawDigits = phoneStr.replace(/\D/g, "");
  if (!rawDigits) {
    return {
      country: defaultCountry,
      local: "",
      normalizedLocal: "",
      e164: "",
      formatted: "",
      rawDigits: ""
    };
  }

  // Trier les indicatifs par ordre de longueur décroissante (+225, +221, +33, +1...)
  const sortedCountries = [...COUNTRIES].sort(
    (a, b) => b.dialCode.replace(/\D/g, "").length - a.dialCode.replace(/\D/g, "").length
  );

  let matchedCountry = defaultCountry;
  let localDigits = rawDigits;

  for (const c of sortedCountries) {
    const rawDial = c.dialCode.replace(/\D/g, "");
    if (rawDigits.startsWith(rawDial) && rawDigits.length > rawDial.length) {
      matchedCountry = c;
      localDigits = rawDigits.slice(rawDial.length);
      break;
    }
  }

  // Normalisation spécifique au pays
  let normalizedLocal = localDigits;
  if (matchedCountry.code === "CI") {
    normalizedLocal = normalizeCILocal(localDigits);
  }

  const dialClean = matchedCountry.dialCode.replace(/\D/g, "");
  const e164 = `+${dialClean}${normalizedLocal}`;
  const formatted = formatDisplayPhone(e164, matchedCountry.code);

  return {
    country: matchedCountry,
    local: normalizedLocal,
    normalizedLocal,
    e164,
    formatted,
    rawDigits
  };
}

/**
 * Formate un numéro de téléphone avec l'indicatif international '+' et un espacement aéré et lisible.
 * Toujours préfixé de '+' et de l'indicatif pays (ex: '+225 05 05 11 11 57', '+33 6 12 34 56 78').
 */
export function formatDisplayPhone(phoneStr?: string, defaultCountryCode = "CI"): string {
  if (!phoneStr) return "";
  const cleaned = phoneStr.trim();
  if (!cleaned) return "";

  const rawDigits = cleaned.replace(/\D/g, "");
  if (!rawDigits) return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;

  const defaultCountry = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];

  // Trier les indicatifs par longueur décroissante
  const sortedCountries = [...COUNTRIES].sort(
    (a, b) => b.dialCode.replace(/\D/g, "").length - a.dialCode.replace(/\D/g, "").length
  );

  let country = defaultCountry;
  let local = rawDigits;

  for (const c of sortedCountries) {
    const rawDial = c.dialCode.replace(/\D/g, "");
    if (rawDigits.startsWith(rawDial) && rawDigits.length > rawDial.length) {
      country = c;
      local = rawDigits.slice(rawDial.length);
      break;
    }
  }

  // Côte d'Ivoire
  if (country.code === "CI") {
    const norm = normalizeCILocal(local);
    if (norm.length === 10) {
      return `${country.dialCode} ${norm.slice(0, 2)} ${norm.slice(2, 4)} ${norm.slice(4, 6)} ${norm.slice(6, 8)} ${norm.slice(8, 10)}`;
    }
    if (local.length === 8) {
      return `${country.dialCode} ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)}`;
    }
  }

  // Sénégal (9 chiffres ex: 77 123 45 67)
  if (country.code === "SN" && local.length === 9) {
    return `${country.dialCode} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  }

  // France (9 ou 10 chiffres ex: 6 12 34 56 78 ou 06 12 34 56 78)
  if (country.code === "FR") {
    const frDigits = local.startsWith("0") ? local.slice(1) : local;
    if (frDigits.length === 9) {
      return `${country.dialCode} ${frDigits.slice(0, 1)} ${frDigits.slice(1, 3)} ${frDigits.slice(3, 5)} ${frDigits.slice(5, 7)} ${frDigits.slice(7, 9)}`;
    }
  }

  // Belgique (9 chiffres ex: 470 12 34 56)
  if (country.code === "BE") {
    const beDigits = local.startsWith("0") ? local.slice(1) : local;
    if (beDigits.length === 9) {
      return `${country.dialCode} ${beDigits.slice(0, 3)} ${beDigits.slice(3, 5)} ${beDigits.slice(5, 7)} ${beDigits.slice(7, 9)}`;
    }
  }

  // USA / Canada (10 chiffres ex: 212 555 0199)
  if (country.code === "US" || country.code === "CA") {
    if (local.length === 10) {
      return `${country.dialCode} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 10)}`;
    }
  }

  // Royaume-Uni (10 chiffres ex: 79 11 12 34 56)
  if (country.code === "GB") {
    const gbDigits = local.startsWith("0") ? local.slice(1) : local;
    if (gbDigits.length === 10) {
      return `${country.dialCode} ${gbDigits.slice(0, 4)} ${gbDigits.slice(4, 7)} ${gbDigits.slice(7, 10)}`;
    }
  }

  // Formatage générique par blocs de 2 ou 3 chiffres
  if (local.length === 8) {
    return `${country.dialCode} ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)}`;
  }
  if (local.length === 9) {
    return `${country.dialCode} ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  }
  if (local.length === 10) {
    return `${country.dialCode} ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }

  return `${country.dialCode} ${local}`;
}

/**
 * Génère l'ensemble exhaustif de variantes de numéros pour la recherche d'identifiant,
 * les WebSockets et les webhooks WhatsApp.
 */
export function generatePhoneVariants(phone: string): string[] {
  if (!phone) return [];
  const digits = phone.replace(/\D/g, "");
  if (!digits) return [];

  const variants = new Set<string>();

  // 1. Version exacte en chiffres
  variants.add(digits);
  variants.add(`+${digits}`);

  // 2. Traitement Côte d'Ivoire
  if (digits.startsWith("225")) {
    const local = digits.slice(3);
    variants.add(local);
    variants.add(`+225${local}`);
    variants.add(`225${local}`);

    const normalizedCI = normalizeCILocal(local);
    variants.add(normalizedCI);
    variants.add(`225${normalizedCI}`);
    variants.add(`+225${normalizedCI}`);

    if (normalizedCI.startsWith("0")) {
      variants.add(normalizedCI.slice(1));
      variants.add(`225${normalizedCI.slice(1)}`);
      variants.add(`+225${normalizedCI.slice(1)}`);
    }

    // Si 10 chiffres (ex: 0102273966 ou 0505111157), générer l'ancien équivalent 8 chiffres (ex: 02273966 ou 05111157)
    if (normalizedCI.length === 10 && /^(01|05|07|21|25)/.test(normalizedCI)) {
      const legacy8 = normalizedCI.slice(2);
      variants.add(legacy8);
      variants.add(`225${legacy8}`);
      variants.add(`+225${legacy8}`);
    }
  } else {
    // Si l'indicatif 225 n'était pas inclus
    const normalizedCI = normalizeCILocal(digits);
    variants.add(`225${digits}`);
    variants.add(`+225${digits}`);
    variants.add(normalizedCI);
    variants.add(`225${normalizedCI}`);
    variants.add(`+225${normalizedCI}`);

    if (digits.startsWith("0")) {
      variants.add(digits.slice(1));
      variants.add(`225${digits.slice(1)}`);
      variants.add(`+225${digits.slice(1)}`);
    }
  }

  // 3. Détection pour autres pays dans la liste COUNTRIES
  for (const c of COUNTRIES) {
    const rawDial = c.dialCode.replace(/\D/g, "");
    if (digits.startsWith(rawDial) && digits.length > rawDial.length) {
      const subLocal = digits.slice(rawDial.length);
      variants.add(subLocal);
      variants.add(`+${rawDial}${subLocal}`);
      variants.add(`${rawDial}${subLocal}`);
      if (subLocal.startsWith("0")) {
        variants.add(subLocal.slice(1));
      }
    }
  }

  return Array.from(variants);
}

export const FOUNDER_NUMBERS = [
  "2250505111157", "0505111157", "22505111157", "05111157", "505111157", "5111157"
];

export function isFounderNumber(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\+\(\)]/g, "");
  return FOUNDER_NUMBERS.some(fn => clean.endsWith(fn) || fn.endsWith(clean));
}

/**
 * Convertit un numéro ou un identifiant en JID WhatsApp valide (ex: '2250141033935@s.whatsapp.net')
 * et en numéro de destinataire internationalisé pour Meta API (ex: '2250141033935').
 */
export function formatToWhatsAppRecipient(phoneOrJid: string, defaultCountry = "CI"): { jid: string; cleanPhone: string } {
  if (!phoneOrJid) return { jid: "", cleanPhone: "" };

  const trimmed = phoneOrJid.trim();

  // 1. Groupes / Diffusions / Chaînes WhatsApp
  if (trimmed.includes("@g.us") || trimmed.includes("@broadcast") || trimmed.includes("@newsletter")) {
    return { jid: trimmed, cleanPhone: trimmed.split("@")[0] };
  }

  // 2. WhatsApp LID (Linked Devices)
  if (trimmed.includes("@lid")) {
    return { jid: trimmed, cleanPhone: trimmed.split("@")[0] };
  }

  // 3. Extraction du préfixe utilisateur (avant le @s.whatsapp.net éventuel)
  const userPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const digits = userPart.replace(/\D/g, "");

  if (!digits) {
    return { jid: trimmed, cleanPhone: trimmed };
  }

  const parsed = parsePhoneNumber(digits, defaultCountry);
  const internationalDigits = parsed.e164 ? parsed.e164.replace(/\D/g, "") : digits;

  return {
    jid: `${internationalDigits}@s.whatsapp.net`,
    cleanPhone: internationalDigits
  };
}
