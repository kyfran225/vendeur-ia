export interface DeliveryZoneSuggestion {
  name: string;
  suggestedPrice: number;
}

export interface CityData {
  name: string;
  countryCode: string;
  zones: DeliveryZoneSuggestion[];
}

export const CITY_SUGGESTIONS: Record<string, CityData> = {
  "Abidjan": {
    name: "Abidjan",
    countryCode: "CI",
    zones: [
      { name: "Cocody (Riviera, Angré)", suggestedPrice: 1500 },
      { name: "Plateau", suggestedPrice: 1000 },
      { name: "Marcory / Zone 4", suggestedPrice: 1000 },
      { name: "Yopougon", suggestedPrice: 2000 },
      { name: "Koumassi", suggestedPrice: 1500 },
      { name: "Bingerville", suggestedPrice: 2500 }
    ]
  },
  "Dakar": {
    name: "Dakar",
    countryCode: "SN",
    zones: [
      { name: "Plateau", suggestedPrice: 1500 },
      { name: "Almadies / Ngor", suggestedPrice: 2000 },
      { name: "Guédiawaye", suggestedPrice: 2500 },
      { name: "Pikine", suggestedPrice: 2500 },
      { name: "Mermoz / Sacré-Cœur", suggestedPrice: 1500 },
      { name: "Rufisque", suggestedPrice: 4000 }
    ]
  },
  "Douala": {
    name: "Douala",
    countryCode: "CM",
    zones: [
      { name: "Akwa", suggestedPrice: 1000 },
      { name: "Bonapriso", suggestedPrice: 1000 },
      { name: "Bonamoussadi", suggestedPrice: 1500 },
      { name: "Logbessou", suggestedPrice: 2000 },
      { name: "Village", suggestedPrice: 1500 }
    ]
  },
  "Bamako": {
    name: "Bamako",
    countryCode: "ML",
    zones: [
      { name: "ACI 2000", suggestedPrice: 1000 },
      { name: "Badalabougou", suggestedPrice: 1000 },
      { name: "Hamdallaye", suggestedPrice: 1000 },
      { name: "Sébénikoro", suggestedPrice: 2000 },
      { name: "Kalaban Koro", suggestedPrice: 2000 }
    ]
  },
  "Lomé": {
    name: "Lomé",
    countryCode: "TG",
    zones: [
      { name: "Deckon", suggestedPrice: 1000 },
      { name: "Agoè", suggestedPrice: 2000 },
      { name: "Bè", suggestedPrice: 1000 },
      { name: "Nyékonakpoè", suggestedPrice: 1000 },
      { name: "Adidogomé", suggestedPrice: 2000 }
    ]
  },
  "Cotonou": {
    name: "Cotonou",
    countryCode: "BJ",
    zones: [
      { name: "Ganhi", suggestedPrice: 1000 },
      { name: "Haie Vive", suggestedPrice: 1000 },
      { name: "Akpakpa", suggestedPrice: 1500 },
      { name: "Fidjrossè", suggestedPrice: 1500 },
      { name: "Calavi", suggestedPrice: 3000 }
    ]
  },
  "Accra": {
    name: "Accra",
    countryCode: "GH",
    zones: [
      { name: "East Legon", suggestedPrice: 30 },
      { name: "Osu", suggestedPrice: 20 },
      { name: "Cantonments", suggestedPrice: 20 },
      { name: "Airport Residential Area", suggestedPrice: 25 },
      { name: "Spintex", suggestedPrice: 40 },
      { name: "Dzworwulu", suggestedPrice: 25 }
    ]
  }
};

export const getZonesForCity = (cityName: string): DeliveryZoneSuggestion[] => {
  if (!cityName) return [];

  // Normalize city name to match keys
  const key = Object.keys(CITY_SUGGESTIONS).find(k =>
    k.toLowerCase() === cityName.toLowerCase() ||
    cityName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(cityName.toLowerCase())
  );
  return key ? CITY_SUGGESTIONS[key].zones : [];
};
