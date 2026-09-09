export interface AfricanLocation {
  id: string;
  name: string;
  type: 'neighborhood' | 'commune' | 'city' | 'landmark' | 'street';
  commune?: string;
  city: string;
  countryCode: string;
  countryName: string;
  formattedAddress: string;
  aliases?: string[];
  coordinates?: [number, number]; // [lng, lat]
}

export const WEST_AND_CENTRAL_AFRICA_LOCATIONS: AfricanLocation[] = [
  // =========================================================================
  // 1. CÔTE D'IVOIRE (CI) - ABIDJAN & INTERIOR
  // =========================================================================
  // --- ABIDJAN : COCODY ---
  {
    id: "ci-abj-coc-angre-8",
    name: "Angré 8ème Tranche",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré 8ème Tranche, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["angre 8", "8eme tranche", "huitieme tranche", "angre huitieme", "pharmacie 8eme tranche"],
    coordinates: [-3.9782, 5.3985]
  },
  {
    id: "ci-abj-coc-angre-7",
    name: "Angré 7ème Tranche",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré 7ème Tranche, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["angre 7", "7eme tranche", "septieme tranche", "station zinsou", "carrefour zinsou"],
    coordinates: [-3.9851, 5.3921]
  },
  {
    id: "ci-abj-coc-angre-9",
    name: "Angré 9ème Tranche",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré 9ème Tranche, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["angre 9", "9eme tranche", "neuvieme tranche", "terminus 81", "terminus 82"],
    coordinates: [-3.9712, 5.4055]
  },
  {
    id: "ci-abj-coc-angre-chateau",
    name: "Angré Château",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré Château d'Eau, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["angre chateau", "chateau d'eau angre", "rond point chateau", "petro ivoire chateau"],
    coordinates: [-3.9822, 5.4011]
  },
  {
    id: "ci-abj-coc-angre-djibi",
    name: "Angré Djibi / Oscars",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré Djibi, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["djibi", "angre oscars", "carrefour oscars", "mahout", "djibi 1", "djibi 2", "djibi 3"],
    coordinates: [-3.9689, 5.412]
  },
  {
    id: "ci-abj-coc-angre-chu",
    name: "Angré Nouveau CHU",
    type: "landmark",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "CHU d'Angré, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["chu angre", "hopital angre", "nouveau chu angre"],
    coordinates: [-3.9642, 5.4078]
  },
  {
    id: "ci-abj-coc-angre-petroivoire",
    name: "Angré Pétro Ivoire / Star",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Angré Pétro Ivoire, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["petro ivoire angre", "cite star angre", "angre star 11", "angre star 9"],
    coordinates: [-3.9875, 5.3955]
  },
  {
    id: "ci-abj-coc-palmeraie",
    name: "Riviera Palmeraie",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera Palmeraie, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["palmeraie", "rond point palmeraie", "carrefour faya", "palmeraie saint viateur", "triangle palmeraie"],
    coordinates: [-3.9542, 5.3722]
  },
  {
    id: "ci-abj-coc-bonoumin",
    name: "Riviera Bonoumin",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera Bonoumin, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["bonoumin", "bonoumin abidjan mall", "abidjan mall", "carrefour doraville"],
    coordinates: [-3.9721, 5.3695]
  },
  {
    id: "ci-abj-coc-faya",
    name: "Riviera Faya / Nouveau Camp",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera Faya, Route de Bingerville, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["faya", "carrefour faya", "cite genie 2000", "cite feh kesse", "nouveau camp akouedo", "cite sir faya"],
    coordinates: [-3.9312, 5.3755]
  },
  {
    id: "ci-abj-coc-attoban",
    name: "Riviera Attoban",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera Attoban, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["attoban", "carrefour dorade", "30eme arrondissement attoban", "saint joseph artisan"],
    coordinates: [-3.9789, 5.3765]
  },
  {
    id: "ci-abj-coc-riviera3",
    name: "Riviera 3 / Cap Nord",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera 3, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["riviera 3", "cap nord", "lycee francais blaise pascal", "lycee americain", "cite allabra", "carrefour lycee francais"],
    coordinates: [-3.9654, 5.3611]
  },
  {
    id: "ci-abj-coc-riviera2",
    name: "Riviera 2",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera 2, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["riviera 2", "carrefour riviera 2", "sainte famille riviera 2", "cite eeci"],
    coordinates: [-3.9812, 5.3524]
  },
  {
    id: "ci-abj-coc-golf",
    name: "Riviera Golf / Beverly Hills",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Riviera Golf, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["riviera golf", "hotel du golf", "grande mosquee de la riviera golf", "golf hotel", "ambassade usa"],
    coordinates: [-3.9765, 5.3421]
  },
  {
    id: "ci-abj-coc-abatta",
    name: "Abatta / M'Badon / M'Pouto",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Abatta, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["abatta", "mbadon", "mpouto", "carrefour abatta", "abatta village", "cite sir abatta"],
    coordinates: [-3.9185, 5.3615]
  },
  {
    id: "ci-abj-coc-2plateaux-vallons",
    name: "Deux-Plateaux Vallons",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Deux-Plateaux Les Vallons, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["vallons", "les vallons", "rue des jardins vallons", "2 plateaux vallons", "paul vallons"],
    coordinates: [-3.9985, 5.3685]
  },
  {
    id: "ci-abj-coc-2plateaux-aghien",
    name: "Deux-Plateaux Aghien / Las Palmas",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Deux-Plateaux Aghien, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["aghien", "las palmas", "carrefour las palmas", "carrefour aghien", "latrille aghien"],
    coordinates: [-3.9942, 5.3812]
  },
  {
    id: "ci-abj-coc-2plateaux-ruedesjardins",
    name: "Deux-Plateaux Rue des Jardins",
    type: "street",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Rue des Jardins, Deux-Plateaux, Cocody, Abidjan, Côte d'Ivoire",
    aliases: ["rue des jardins", "sococe 2 plateaux", "patisserie abondance", "sococe"],
    coordinates: [-4.0012, 5.3645]
  },
  {
    id: "ci-abj-coc-danga",
    name: "Cocody Danga / Ambassades",
    type: "neighborhood",
    commune: "Cocody",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Cocody Danga, Abidjan, Côte d'Ivoire",
    aliases: ["danga", "cocody ambassades", "cite des arts cocody", "lycee classique", "lycee sainte marie", "universite fhb cocody", "saint jean cocody"],
    coordinates: [-4.0054, 5.3485]
  },

  // --- ABIDJAN : MARCORY ---
  {
    id: "ci-abj-mar-zone4c",
    name: "Marcory Zone 4C",
    type: "neighborhood",
    commune: "Marcory",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Zone 4C, Marcory, Abidjan, Côte d'Ivoire",
    aliases: ["zone 4", "zone 4c", "rue paul langevin", "rue thomas edison", "rue du docteur calmette", "rue du 7 decembre"],
    coordinates: [-3.9875, 5.2912]
  },
  {
    id: "ci-abj-mar-bietry",
    name: "Marcory Biétry",
    type: "neighborhood",
    commune: "Marcory",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Biétry, Marcory, Abidjan, Côte d'Ivoire",
    aliases: ["bietry", "boulevard de marseille bietry", "village sos bietry", "notre dame de bietry"],
    coordinates: [-3.9745, 5.2865]
  },
  {
    id: "ci-abj-mar-residentiel",
    name: "Marcory Résidentiel / Hibiscus",
    type: "neighborhood",
    commune: "Marcory",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Marcory Résidentiel, Abidjan, Côte d'Ivoire",
    aliases: ["marcory residentiel", "cite hibiscus", "sicogi marcory", "injs", "champroux"],
    coordinates: [-3.9925, 5.3025]
  },
  {
    id: "ci-abj-mar-grandcarrefour",
    name: "Grand Carrefour de Marcory / VGE",
    type: "landmark",
    commune: "Marcory",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Boulevard VGE, Marcory, Abidjan, Côte d'Ivoire",
    aliases: ["grand carrefour marcory", "cap sud", "prima center", "orca deco vge", "marche de marcory"],
    coordinates: [-3.9965, 5.3045]
  },
  {
    id: "ci-abj-mar-anoumabo",
    name: "Marcory Anoumabo / Aliodan",
    type: "neighborhood",
    commune: "Marcory",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Anoumabo, Marcory, Abidjan, Côte d'Ivoire",
    aliases: ["anoumabo", "aliodan", "femua", "magic system anoumabo"],
    coordinates: [-3.9725, 5.3095]
  },

  // --- ABIDJAN : YOPOUGON ---
  {
    id: "ci-abj-yop-maroc",
    name: "Yopougon Maroc",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Yopougon Maroc, Abidjan, Côte d'Ivoire",
    aliases: ["yop maroc", "maroc yopougon", "carrefour anador maroc", "pharmacie du maroc", "maroc antenne"],
    coordinates: [-4.0812, 5.3524]
  },
  {
    id: "ci-abj-yop-niangonsud",
    name: "Yopougon Niangon Sud",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Niangon Sud, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["niangon sud", "niangon sud 1ere tranche", "niangon sud 2eme tranche", "academie niangon", "lubafrique"],
    coordinates: [-4.0954, 5.3285]
  },
  {
    id: "ci-abj-yop-niangonnord",
    name: "Yopougon Niangon Nord / Lokoua",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Niangon Nord, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["niangon nord", "niangon a gauche", "lokoua", "cite verte niangon"],
    coordinates: [-4.0988, 5.3412]
  },
  {
    id: "ci-abj-yop-selmer",
    name: "Yopougon Selmer / Ficgayo",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Selmer, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["yop selmer", "ficgayo", "place ficgayo", "saint andre yopougon", "complexe sportif yopougon", "mairie centrale yopougon"],
    coordinates: [-4.0685, 5.3395]
  },
  {
    id: "ci-abj-yop-toitrouge",
    name: "Yopougon Toit Rouge / Bel Air",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Toit Rouge, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["toit rouge", "bel air yopougon", "sideci", "carrefour siporex", "siporex yopougon", "terminus 40"],
    coordinates: [-4.0612, 5.3485]
  },
  {
    id: "ci-abj-yop-millionnaire",
    name: "Yopougon Millionnaire / Gesco",
    type: "neighborhood",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Millionnaire, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["millionnaire yopougon", "gesco", "yopougon gesco", "peage de gesco", "koute village"],
    coordinates: [-4.0982, 5.3685]
  },
  {
    id: "ci-abj-yop-cosmos",
    name: "Cosmos Yopougon / Carrefour Keneya",
    type: "landmark",
    commune: "Yopougon",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Boulevard Principal, Yopougon, Abidjan, Côte d'Ivoire",
    aliases: ["cosmos yopougon", "centre commercial cosmos", "carrefour keneya", "chu yopougon", "palais de justice yopougon", "rue princesse"],
    coordinates: [-4.0725, 5.3455]
  },

  // --- ABIDJAN : PLATEAU ---
  {
    id: "ci-abj-pla-centre",
    name: "Plateau Centre des Affaires",
    type: "neighborhood",
    commune: "Plateau",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Plateau, Abidjan, Côte d'Ivoire",
    aliases: ["plateau", "cite administrative plateau", "tour a", "tour b", "tour c", "tour d", "tour e", "avenue chardy", "boulevard de la republique", "boulevard carde", "avenue nogues", "place de la republique"],
    coordinates: [-4.0205, 5.3265]
  },
  {
    id: "ci-abj-pla-cathedrale",
    name: "Cathédrale Saint-Paul / CCIA",
    type: "landmark",
    commune: "Plateau",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Boulevard Angoulvant, Plateau, Abidjan, Côte d'Ivoire",
    aliases: ["cathedrale saint paul", "immeuble ccia", "pyramide plateau", "stade felix houphouet boigny", "felicia", "camp gallieni"],
    coordinates: [-4.0185, 5.3312]
  },

  // --- ABIDJAN : KOUMASSI ---
  {
    id: "ci-abj-kou-remblais",
    name: "Koumassi Remblais",
    type: "neighborhood",
    commune: "Koumassi",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Koumassi Remblais, Abidjan, Côte d'Ivoire",
    aliases: ["remblais", "koumassi remblais", "carrefour 05 koumassi", "terminus 05", "prodomo koumassi", "cite houphouet boigny"],
    coordinates: [-3.9525, 5.2985]
  },
  {
    id: "ci-abj-kou-sopim",
    name: "Koumassi SOPIM / Grand Campement",
    type: "neighborhood",
    commune: "Koumassi",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Koumassi SOPIM, Abidjan, Côte d'Ivoire",
    aliases: ["koumassi sopim", "grand campement", "quartier divo koumassi", "place inchallah", "zone industrielle koumassi"],
    coordinates: [-3.9451, 5.3055]
  },

  // --- ABIDJAN : TREICHVILLE ---
  {
    id: "ci-abj-tre-centre",
    name: "Treichville Centre / Rue 12",
    type: "neighborhood",
    commune: "Treichville",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Treichville, Abidjan, Côte d'Ivoire",
    aliases: ["treichville", "rue 12 treichville", "avenue 16", "avenue 21", "marche de treichville", "carrefour solibra", "palais des sports treichville", "chu de treichville", "gare de bassam"],
    coordinates: [-4.0085, 5.3042]
  },

  // --- ABIDJAN : PORT-BOUËT ---
  {
    id: "ci-abj-por-gonzagueville",
    name: "Port-Bouët Gonzagueville",
    type: "neighborhood",
    commune: "Port-Bouët",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Gonzagueville, Port-Bouët, Abidjan, Côte d'Ivoire",
    aliases: ["gonzagueville", "gonzague", "corridor gonzagueville", "anani port bouet", "jean folly"],
    coordinates: [-3.9125, 5.2512]
  },
  {
    id: "ci-abj-por-vridi",
    name: "Port-Bouët Vridi / Sir",
    type: "neighborhood",
    commune: "Port-Bouët",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Vridi, Port-Bouët, Abidjan, Côte d'Ivoire",
    aliases: ["vridi", "vridi canal", "vridi sir", "zone industrielle vridi", "vridi cite", "plage de vridi"],
    coordinates: [-4.0012, 5.2654]
  },
  {
    id: "ci-abj-por-aeroport",
    name: "Aéroport International FHB / Rond-Point Akwaba",
    type: "landmark",
    commune: "Port-Bouët",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Aéroport Félix Houphouët-Boigny, Port-Bouët, Abidjan, Côte d'Ivoire",
    aliases: ["aeroport abidjan", "rond point akwaba", "carrefour akwaba", "derriere wharf", "abattoir port bouet"],
    coordinates: [-3.9355, 5.2612]
  },

  // --- ABIDJAN : ADJAMÉ ---
  {
    id: "ci-abj-adj-220",
    name: "Adjamé 220 Logements / Liberté",
    type: "neighborhood",
    commune: "Adjamé",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "220 Logements, Adjamé, Abidjan, Côte d'Ivoire",
    aliases: ["220 logements", "adjame liberte", "marche forum adjame", "gare nord sotra", "williamsville adjame", "mirador adjame", "carrefour renault", "indénie"],
    coordinates: [-4.0245, 5.3565]
  },

  // --- ABIDJAN : ABOBO ---
  {
    id: "ci-abj-abo-centre",
    name: "Abobo Baoulé / Rond-Point Mairie",
    type: "neighborhood",
    commune: "Abobo",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Abobo Baoulé, Abidjan, Côte d'Ivoire",
    aliases: ["abobo", "abobo baoule", "abobo samake", "abobo pk 18", "abobo avocatier", "abobo ndotre", "abobo dokui", "abobo sagbe", "gare abobo"],
    coordinates: [-4.0154, 5.4185]
  },

  // --- ABIDJAN : BINGERVILLE ---
  {
    id: "ci-abj-bin-centre",
    name: "Bingerville Centre / Feh Kessé",
    type: "commune",
    commune: "Bingerville",
    city: "Abidjan",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Bingerville, Abidjan, Côte d'Ivoire",
    aliases: ["bingerville", "feh kesse", "jardin botanique bingerville", "empt bingerville", "cite marine", "savane bingerville"],
    coordinates: [-3.8855, 5.3585]
  },

  // --- VILLES DE L'INTÉRIEUR (CÔTE D'IVOIRE) ---
  {
    id: "ci-vil-yamoussoukro",
    name: "Yamoussoukro",
    type: "city",
    city: "Yamoussoukro",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Yamoussoukro, Côte d'Ivoire",
    aliases: ["yakro", "basilique notre dame", "fondation felix houphouet boigny", "inphb", "morofe", "assabou", "habitat yakro", "200 logements yakro"],
    coordinates: [-5.2767, 6.8276]
  },
  {
    id: "ci-vil-bouake",
    name: "Bouaké",
    type: "city",
    city: "Bouaké",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Bouaké, Côte d'Ivoire",
    aliases: ["bouake", "bouake commerce", "bouake kennedy", "bouake nimbo", "air france bouake", "ngattakro", "dar es salam bouake"],
    coordinates: [-5.0305, 7.6895]
  },
  {
    id: "ci-vil-sanpedro",
    name: "San Pedro",
    type: "city",
    city: "San Pedro",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "San Pedro, Côte d'Ivoire",
    aliases: ["san pedro", "balmer san pedro", "bardot san pedro", "port de san pedro", "seweke"],
    coordinates: [-6.6433, 4.7485]
  },
  {
    id: "ci-vil-grandbassam",
    name: "Grand-Bassam",
    type: "city",
    city: "Grand-Bassam",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Grand-Bassam, Côte d'Ivoire",
    aliases: ["bassam", "quartier france bassam", "imperial bassam", "moossou", "rosiers bassam", "plage bassam"],
    coordinates: [-3.7385, 5.2112]
  },
  {
    id: "ci-vil-assinie",
    name: "Assinie / Assinie-Mafia",
    type: "city",
    city: "Assinie",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Assinie-Mafia, Côte d'Ivoire",
    aliases: ["assinie", "assinie mafia", "assinie france", "km 9 assinie", "passe dassinie"],
    coordinates: [-3.2855, 5.1325]
  },
  {
    id: "ci-vil-korhogo",
    name: "Korhogo",
    type: "city",
    city: "Korhogo",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Korhogo, Savanes, Côte d'Ivoire",
    aliases: ["korhogo", "koko korhogo", "soba korhogo", "mont korhogo"],
    coordinates: [-5.6295, 9.4585]
  },
  {
    id: "ci-vil-daloa",
    name: "Daloa",
    type: "city",
    city: "Daloa",
    countryCode: "CI",
    countryName: "Côte d'Ivoire",
    formattedAddress: "Daloa, Haut-Sassandra, Côte d'Ivoire",
    aliases: ["daloa", "tazibouo", "lobia daloa"],
    coordinates: [-6.4525, 6.8775]
  },

  // =========================================================================
  // 2. SÉNÉGAL (SN) - DAKAR & VILLES
  // =========================================================================
  // --- DAKAR : ALMADIES / NGOR / OUAKAM ---
  {
    id: "sn-dak-alm-almadies",
    name: "Les Almadies",
    type: "neighborhood",
    commune: "Almadies",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Les Almadies, Dakar, Sénégal",
    aliases: ["almadies", "pointe des almadies", "zone des ambassades almadies", "route des almadies", "king fahd palace"],
    coordinates: [-17.5255, 14.7455]
  },
  {
    id: "sn-dak-alm-ngor",
    name: "Ngor / Île de Ngor / Virage",
    type: "neighborhood",
    commune: "Almadies",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Ngor, Dakar, Sénégal",
    aliases: ["ngor", "ile de ngor", "le virage", "ngor village", "plage de ngor"],
    coordinates: [-17.5142, 14.7545]
  },
  {
    id: "sn-dak-alm-ouakam",
    name: "Ouakam / Monument Renaissance / Mamelles",
    type: "neighborhood",
    commune: "Ouakam",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Ouakam, Dakar, Sénégal",
    aliases: ["ouakam", "mamelles", "phare des mamelles", "monument de la renaissance africaine", "cite comico ouakam"],
    coordinates: [-17.4895, 14.7212]
  },
  {
    id: "sn-dak-alm-yoff",
    name: "Yoff / BCEAO / Virage",
    type: "neighborhood",
    commune: "Yoff",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Yoff, Dakar, Sénégal",
    aliases: ["yoff", "plage bceao", "yoff tonghor", "cite biagui", "cite touba almadies", "aeroport lss"],
    coordinates: [-17.4685, 14.7585]
  },

  // --- DAKAR : MERMOZ / SACRÉ-CŒUR / POINT E ---
  {
    id: "sn-dak-mer-mermoz",
    name: "Mermoz / Cité Keur Gorgui",
    type: "neighborhood",
    commune: "Mermoz-Sacré-Cœur",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Mermoz, Dakar, Sénégal",
    aliases: ["mermoz", "cite keur gorgui", "keur gorgui", "siege sonatel", "mermoz pyrotechnie", "vane mermoz"],
    coordinates: [-17.4725, 14.7085]
  },
  {
    id: "sn-dak-mer-sacrecoeur",
    name: "Sacré-Cœur 1, 2, 3",
    type: "neighborhood",
    commune: "Mermoz-Sacré-Cœur",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Sacré-Cœur, Dakar, Sénégal",
    aliases: ["sacre coeur", "sacre coeur 1", "sacre coeur 2", "sacre coeur 3", "boulangerie jaune sacre coeur", "sacre coeur pyrotechnie"],
    coordinates: [-17.4654, 14.7142]
  },
  {
    id: "sn-dak-fan-pointe",
    name: "Point E / Fann Résidence",
    type: "neighborhood",
    commune: "Fann-Point E-Amitié",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Point E, Dakar, Sénégal",
    aliases: ["point e", "fann residence", "fann hock", "universite ucad", "hopital fann", "piscine olympique point e"],
    coordinates: [-17.4685, 14.6925]
  },

  // --- DAKAR : PLATEAU / MÉDINA ---
  {
    id: "sn-dak-pla-plateau",
    name: "Dakar Plateau / Centre-Ville",
    type: "neighborhood",
    commune: "Dakar Plateau",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Plateau, Dakar, Sénégal",
    aliases: ["dakar plateau", "place de lindependance dakar", "palais presidentiel dakar", "marche kermel", "sandaga", "marche sandaga", "port de dakar", "embarcadere goree", "avenue ponty"],
    coordinates: [-17.4325, 14.6712]
  },
  {
    id: "sn-dak-med-medina",
    name: "La Médina / Gueule Tapée / Colobane",
    type: "neighborhood",
    commune: "Médina",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Médina, Dakar, Sénégal",
    aliases: ["medina", "medina dakar", "gueule tapee", "colobane", "marche colobane", "rebeuss", "tilene", "marche tilene"],
    coordinates: [-17.4485, 14.6854]
  },

  // --- DAKAR : LIBERTÉ / SICAP / MARISTES / KEUR MASSAR ---
  {
    id: "sn-dak-sic-liberte",
    name: "SICAP Liberté (1 à 6) / Dieuppeul",
    type: "neighborhood",
    commune: "Grand Dakar",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "SICAP Liberté, Dakar, Sénégal",
    aliases: ["liberte 6", "liberte 5", "liberte 4", "liberte 3", "liberte 2", "liberte 1", "dieuppeul", "rond point liberte 6", "castors dakar", "derkle"],
    coordinates: [-17.4585, 14.7185]
  },
  {
    id: "sn-dak-han-maristes",
    name: "Hann Maristes / Parc de Hann",
    type: "neighborhood",
    commune: "Hann Bel-Air",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Hann Maristes, Dakar, Sénégal",
    aliases: ["maristes", "hann maristes", "maristes 1", "maristes 2", "cours sainte marie de hann", "parc zoologique de hann"],
    coordinates: [-17.4385, 14.7285]
  },
  {
    id: "sn-dak-gyo-grandyoff",
    name: "Grand Yoff / Scat Urbam / Cité Mixta",
    type: "neighborhood",
    commune: "Grand Yoff",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Grand Yoff, Dakar, Sénégal",
    aliases: ["grand yoff", "scat urbam", "cite mixta", "stade leopold sedar senghor", "khar yalla"],
    coordinates: [-17.4512, 14.7385]
  },
  {
    id: "sn-dak-pik-pikine",
    name: "Pikine / Guédiawaye / Thiaroye",
    type: "neighborhood",
    commune: "Pikine",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Pikine, Dakar, Sénégal",
    aliases: ["pikine", "guediawaye", "thiaroye", "pikine icotaf", "tally boumack", "hamo 4", "golf sud", "fadia", "sam notaire"],
    coordinates: [-17.3955, 14.7545]
  },
  {
    id: "sn-dak-km-keurmassar",
    name: "Keur Massar / Rufisque / Diamniadio",
    type: "commune",
    commune: "Keur Massar",
    city: "Dakar",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Keur Massar, Dakar, Sénégal",
    aliases: ["keur massar", "rufisque", "diamniadio", "cite fass mbao", "lac rose", "pole urbain diamniadio", "dakar arena"],
    coordinates: [-17.3125, 14.7812]
  },

  // --- VILLES DU SÉNÉGAL ---
  {
    id: "sn-vil-thies",
    name: "Thiès",
    type: "city",
    city: "Thiès",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Thiès, Sénégal",
    aliases: ["thies", "dixieme thies", "grand standing thies", "cite lamy", "randoulene", "medina fall"],
    coordinates: [-16.926, 14.79]
  },
  {
    id: "sn-vil-saly",
    name: "Saly Portudal / Mbour",
    type: "city",
    city: "Mbour",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Saly Portudal, Petite Côte, Sénégal",
    aliases: ["saly", "saly portudal", "mbour", "saly niakh niakhal", "saly carrefour", "somone", "ngaparou", "la somone"],
    coordinates: [-16.995, 14.442]
  },
  {
    id: "sn-vil-saintlouis",
    name: "Saint-Louis (Ndar)",
    type: "city",
    city: "Saint-Louis",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Saint-Louis, Sénégal",
    aliases: ["saint louis", "ndar", "pont faidherbe", "sor saint louis", "guet ndar", "ile de saint louis", "bango"],
    coordinates: [-16.502, 16.02]
  },
  {
    id: "sn-vil-touba",
    name: "Touba / Mbacké",
    type: "city",
    city: "Touba",
    countryCode: "SN",
    countryName: "Sénégal",
    formattedAddress: "Touba, Sénégal",
    aliases: ["touba", "mbacke", "grande mosquee de touba", "magal de touba", "darou mousty"],
    coordinates: [-15.885, 14.865]
  },

  // =========================================================================
  // 3. BÉNIN (BJ) - COTONOU & CALAVI
  // =========================================================================
  {
    id: "bj-cot-haievive",
    name: "Haie Vive / Cocotiers / Les Ambassades",
    type: "neighborhood",
    commune: "Cotonou",
    city: "Cotonou",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Haie Vive, Cotonou, Bénin",
    aliases: ["haie vive", "les cocotiers", "zone des ambassades cotonou", "aeroport de cotonou cadjehoun", "cadjehoun"],
    coordinates: [2.4012, 6.3585]
  },
  {
    id: "bj-cot-ganhi",
    name: "Ganhi / Centre Commercial / Saint-Michel",
    type: "neighborhood",
    commune: "Cotonou",
    city: "Cotonou",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Ganhi, Cotonou, Bénin",
    aliases: ["ganhi", "marche dantokpa", "dantokpa", "saint michel cotonou", "jonquet", "zongo cotonou", "port autonome de cotonou"],
    coordinates: [2.4355, 6.3645]
  },
  {
    id: "bj-cot-fidjrosse",
    name: "Fidjrossè / Plage / Calvaire",
    type: "neighborhood",
    commune: "Cotonou",
    city: "Cotonou",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Fidjrossè, Cotonou, Bénin",
    aliases: ["fidjrosse", "fidjrosse plage", "fidjrosse calvaire", "akogbato", "houenoussou", "route des peches"],
    coordinates: [2.3712, 6.3612]
  },
  {
    id: "bj-cot-akpakpa",
    name: "Akpakpa / Cité Vie Nouvelle / Suru Léré",
    type: "neighborhood",
    commune: "Cotonou",
    city: "Cotonou",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Akpakpa, Cotonou, Bénin",
    aliases: ["akpakpa", "akpakpa dodome", "pk3 akpakpa", "avotrou", "suru lere", "jak akpakpa", "cite vie nouvelle"],
    coordinates: [2.4585, 6.3755]
  },
  {
    id: "bj-cot-kouhounou",
    name: "Kouhounou / Stade de l'Amitié / Agla",
    type: "neighborhood",
    commune: "Cotonou",
    city: "Cotonou",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Kouhounou, Cotonou, Bénin",
    aliases: ["kouhounou", "stade de lamitie", "stade gm kerekou", "agla", "menontin", "fifadji", "sainte rita cotonou", "vedoko"],
    coordinates: [2.3885, 6.3812]
  },
  {
    id: "bj-cal-calavi",
    name: "Abomey-Calavi / Godomey / Tankpè",
    type: "commune",
    commune: "Abomey-Calavi",
    city: "Abomey-Calavi",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Abomey-Calavi, Bénin",
    aliases: ["abomey calavi", "calavi", "godomey", "tankpe", "uac calavi", "universite dabomey calavi", "arconville", "bidossessi", "akassato"],
    coordinates: [2.3555, 6.4485]
  },
  {
    id: "bj-vil-portonovo",
    name: "Porto-Novo (Capitale)",
    type: "city",
    city: "Porto-Novo",
    countryCode: "BJ",
    countryName: "Bénin",
    formattedAddress: "Porto-Novo, Bénin",
    aliases: ["porto novo", "ouando", "marche ouando", "adjina", "tokpota"],
    coordinates: [2.6055, 6.4975]
  },

  // =========================================================================
  // 4. TOGO (TG) - LOMÉ & VILLES
  // =========================================================================
  {
    id: "tg-lom-deckon",
    name: "Deckon / Assivito / Grand Marché",
    type: "neighborhood",
    commune: "Golfe",
    city: "Lomé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Deckon, Lomé, Togo",
    aliases: ["deckon", "assivito", "grand marche de lome", "nyekonakpoe", "kodjoviakope", "marche aux fetiches", "boulevard du 13 janvier", "plage de lome"],
    coordinates: [1.2185, 6.1312]
  },
  {
    id: "tg-lom-agoe",
    name: "Agoè (Nyivé, Cacaveli, Assiyéyé)",
    type: "neighborhood",
    commune: "Agoè-Nyivé",
    city: "Lomé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Agoè-Nyivé, Lomé, Togo",
    aliases: ["agoe", "agoe nyive", "agoe assiyeye", "agoe cacaveli", "agoe telessou", "agoe logope", "carrefour deux lions", "carrefour bleu agoe"],
    coordinates: [1.1925, 6.2085]
  },
  {
    id: "tg-lom-tokoin",
    name: "Tokoin (Casablanca, Forever, Hôpital)",
    type: "neighborhood",
    commune: "Golfe",
    city: "Lomé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Tokoin, Lomé, Togo",
    aliases: ["tokoin", "tokoin casablanca", "tokoin forever", "chu sylvanus olympio", "chu tokoin", "tokoin doumassesse", "tokoin tame"],
    coordinates: [1.2125, 6.1555]
  },
  {
    id: "tg-lom-hedzranawoe",
    name: "Hedzranawoé / Aéroport / Kégué",
    type: "neighborhood",
    commune: "Golfe",
    city: "Lomé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Hedzranawoé, Lomé, Togo",
    aliases: ["hedzranawoe", "marche hedzranawoe", "aeroport gnassingbe eyadema", "stade de kegue", "kegue", "cite oua"],
    coordinates: [1.2412, 6.1755]
  },
  {
    id: "tg-lom-adidogome",
    name: "Adidogomé / Totsi / Avédji",
    type: "neighborhood",
    commune: "Golfe",
    city: "Lomé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Adidogomé, Lomé, Togo",
    aliases: ["adidogome", "totsi", "avedji", "carrefour limousin", "djidjole", "sebe"],
    coordinates: [1.1685, 6.1685]
  },
  {
    id: "tg-vil-kpalime",
    name: "Kpalimé",
    type: "city",
    city: "Kpalimé",
    countryCode: "TG",
    countryName: "Togo",
    formattedAddress: "Kpalimé, Kloto, Togo",
    aliases: ["kpalime", "mont agou", "cascade de kime"],
    coordinates: [0.6312, 6.9085]
  },

  // =========================================================================
  // 5. MALI (ML) - BAMAKO
  // =========================================================================
  {
    id: "ml-bam-aci2000",
    name: "ACI 2000 / Hamdallaye",
    type: "neighborhood",
    commune: "Commune IV",
    city: "Bamako",
    countryCode: "ML",
    countryName: "Mali",
    formattedAddress: "ACI 2000, Bamako, Mali",
    aliases: ["aci 2000", "hamdallaye aci 2000", "monument de la paix", "place du cinquantenaire", "centre commercial aci 2000"],
    coordinates: [-8.0312, 12.6355]
  },
  {
    id: "ml-bam-badalabougou",
    name: "Badalabougou / Quartier du Fleuve",
    type: "neighborhood",
    commune: "Commune V",
    city: "Bamako",
    countryCode: "ML",
    countryName: "Mali",
    formattedAddress: "Badalabougou, Bamako, Mali",
    aliases: ["badalabougou", "badala", "quartier du fleuve bamako", "palais de la culture bamako", "pont des martyrs", "colline de badala"],
    coordinates: [-7.9925, 12.6212]
  },
  {
    id: "ml-bam-faladie",
    name: "Faladié / Sogoniko / Banankabougou",
    type: "neighborhood",
    commune: "Commune VI",
    city: "Bamako",
    countryCode: "ML",
    countryName: "Mali",
    formattedAddress: "Faladié, Bamako, Mali",
    aliases: ["faladie", "sogoniko", "gare de sogoniko", "banankabougou", "magnambougou", "tour de l'afrique"],
    coordinates: [-7.9542, 12.5985]
  },
  {
    id: "ml-bam-hippodrome",
    name: "Hippodrome / Korofina / Médina Coura",
    type: "neighborhood",
    commune: "Commune II",
    city: "Bamako",
    countryCode: "ML",
    countryName: "Mali",
    formattedAddress: "Hippodrome, Bamako, Mali",
    aliases: ["hippodrome", "hippodrome 1", "hippodrome 2", "korofina", "medina coura", "grand marche de bamako", "bozola"],
    coordinates: [-7.9785, 12.6585]
  },
  {
    id: "ml-bam-sebenikoro",
    name: "Sébénikoro / Djicoroni Para / Baco Djicoroni",
    type: "neighborhood",
    commune: "Commune IV & V",
    city: "Bamako",
    countryCode: "ML",
    countryName: "Mali",
    formattedAddress: "Sébénikoro, Bamako, Mali",
    aliases: ["sebenikoro", "djicoroni para", "baco djicoroni", "baco djicoroni aci", "golf bamako", "kalaban coura", "kalaban koro"],
    coordinates: [-8.0685, 12.6112]
  },

  // =========================================================================
  // 6. BURKINA FASO (BF) - OUAGADOUGOU
  // =========================================================================
  {
    id: "bf-oua-ouaga2000",
    name: "Ouaga 2000 / Zone Résidentielle",
    type: "neighborhood",
    commune: "Ouagadougou",
    city: "Ouagadougou",
    countryCode: "BF",
    countryName: "Burkina Faso",
    formattedAddress: "Ouaga 2000, Ouagadougou, Burkina Faso",
    aliases: ["ouaga 2000", "palais de kosyam", "monument des martyrs ouaga", "hotel laico ouaga 2000", "salle des banquets"],
    coordinates: [-1.5012, 12.3125]
  },
  {
    id: "bf-oua-koulouba",
    name: "Koulouba / Centre-Ville / Grand Marché (Rood Woko)",
    type: "neighborhood",
    commune: "Ouagadougou",
    city: "Ouagadougou",
    countryCode: "BF",
    countryName: "Burkina Faso",
    formattedAddress: "Koulouba, Ouagadougou, Burkina Faso",
    aliases: ["koulouba", "centre ville ouaga", "rood woko", "grand marche ouaga", "place de la nation ouaga", "avenue kwame nkrumah"],
    coordinates: [-1.5245, 12.3685]
  },
  {
    id: "bf-oua-gounghin",
    name: "Gounghin / Pissy / Cissin",
    type: "neighborhood",
    commune: "Ouagadougou",
    city: "Ouagadougou",
    countryCode: "BF",
    countryName: "Burkina Faso",
    formattedAddress: "Gounghin, Ouagadougou, Burkina Faso",
    aliases: ["gounghin", "gounghin nord", "gounghin sud", "pissy", "cissin", "stade du 4 aout"],
    coordinates: [-1.5585, 12.3555]
  },
  {
    id: "bf-oua-dassasgho",
    name: "Dassasgho / 1200 Logements / Wayalghin / Wemtenga",
    type: "neighborhood",
    commune: "Ouagadougou",
    city: "Ouagadougou",
    countryCode: "BF",
    countryName: "Burkina Faso",
    formattedAddress: "Dassasgho, Ouagadougou, Burkina Faso",
    aliases: ["dassasgho", "1200 logements", "wayalghin", "wemtenga", "zogona", "universite joseph ki zerbo"],
    coordinates: [-1.4885, 12.3785]
  },
  {
    id: "bf-vil-bobo",
    name: "Bobo-Dioulasso (Sya)",
    type: "city",
    city: "Bobo-Dioulasso",
    countryCode: "BF",
    countryName: "Burkina Faso",
    formattedAddress: "Bobo-Dioulasso, Houet, Burkina Faso",
    aliases: ["bobo", "bobo dioulasso", "sya", "accart ville bobo", "koko bobo", "bolomakote", "farakan", "grande mosquee de bobo dioulasso"],
    coordinates: [-4.2975, 11.1775]
  },

  // =========================================================================
  // 7. GUINÉE (GN) - CONAKRY
  // =========================================================================
  {
    id: "gn-con-kaloum",
    name: "Kaloum / Centre Administratif",
    type: "commune",
    commune: "Kaloum",
    city: "Conakry",
    countryCode: "GN",
    countryName: "Guinée",
    formattedAddress: "Kaloum, Conakry, Guinée",
    aliases: ["kaloum", "almamya", "sandervalia", "boulbinet", "coronthie", "port autonome de conakry", "palais du peuple conakry", "marche niger"],
    coordinates: [-13.7125, 9.5125]
  },
  {
    id: "gn-con-ratoma",
    name: "Ratoma (Kipé, Lambanyi, Nongo, Taouyah)",
    type: "commune",
    commune: "Ratoma",
    city: "Conakry",
    countryCode: "GN",
    countryName: "Guinée",
    formattedAddress: "Ratoma, Conakry, Guinée",
    aliases: ["ratoma", "kipe", "lambanyi", "nongo", "taouyah", "stade de nongo", "centre commercial prima center conakry", "bambeto", "cosa"],
    coordinates: [-13.6285, 9.6145]
  },
  {
    id: "gn-con-dixinn",
    name: "Dixinn (Minière, Landréah, Camayenne)",
    type: "commune",
    commune: "Dixinn",
    city: "Conakry",
    countryCode: "GN",
    countryName: "Guinée",
    formattedAddress: "Dixinn, Conakry, Guinée",
    aliases: ["dixinn", "miniere conakry", "landreah", "camayenne", "grande mosquee faycal", "stade du 28 septembre", "universite gamal abdel nasser"],
    coordinates: [-13.6785, 9.5545]
  },
  {
    id: "gn-con-matam",
    name: "Matam / Madina (Grand Marché Madina)",
    type: "commune",
    commune: "Matam",
    city: "Conakry",
    countryCode: "GN",
    countryName: "Guinée",
    formattedAddress: "Matam, Conakry, Guinée",
    aliases: ["matam", "madina", "marche madina", "bonfi", "carriere conakry"],
    coordinates: [-13.6542, 9.5412]
  },

  // =========================================================================
  // 8. CAMEROUN (CM) - DOUALA & YAOUNDÉ
  // =========================================================================
  {
    id: "cm-dla-akwa",
    name: "Akwa / Boulevard de la Liberté / Bonanjo",
    type: "neighborhood",
    commune: "Douala 1er",
    city: "Douala",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Akwa, Douala, Cameroun",
    aliases: ["akwa", "bonanjo", "boulevard de la liberte", "rond point 4e", "bonanjo centre administratif", "port de douala"],
    coordinates: [9.6925, 4.0512]
  },
  {
    id: "cm-dla-bonapriso",
    name: "Bonapriso / Rue Koloko / Rue Njo-Njo",
    type: "neighborhood",
    commune: "Douala 1er",
    city: "Douala",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Bonapriso, Douala, Cameroun",
    aliases: ["bonapriso", "rue njo njo", "rue koloko", "bali douala", "aeroport international de douala"],
    coordinates: [9.6985, 4.0285]
  },
  {
    id: "cm-dla-bonamoussadi",
    name: "Bonamoussadi / Makepe / Kotto / Denver",
    type: "neighborhood",
    commune: "Douala 5e",
    city: "Douala",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Bonamoussadi, Douala, Cameroun",
    aliases: ["bonamoussadi", "makepe", "kotto", "denver douala", "carrefour maetur", "rond point kotto", "logpom"],
    coordinates: [9.7385, 4.0885]
  },
  {
    id: "cm-yde-bastos",
    name: "Bastos / Quartier des Ambassades",
    type: "neighborhood",
    commune: "Yaoundé 1er",
    city: "Yaoundé",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Bastos, Yaoundé, Cameroun",
    aliases: ["bastos", "rond point bastos", "golf yaounde", "ambassade usa bastos", "ambassade de france bastos"],
    coordinates: [11.5125, 3.8885]
  },
  {
    id: "cm-yde-omnisports",
    name: "Omnisports / Essos / Mvomeka",
    type: "neighborhood",
    commune: "Yaoundé 5e",
    city: "Yaoundé",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Omnisports, Yaoundé, Cameroun",
    aliases: ["omnisports yaounde", "stade ahmadou ahidjo", "essos", "ngousso", "hopital general yaounde"],
    coordinates: [11.5385, 3.8785]
  },
  {
    id: "cm-yde-biyemassi",
    name: "Biyem-Assi / Mendong",
    type: "neighborhood",
    commune: "Yaoundé 6e",
    city: "Yaoundé",
    countryCode: "CM",
    countryName: "Cameroun",
    formattedAddress: "Biyem-Assi, Yaoundé, Cameroun",
    aliases: ["biyem assi", "mendong", "rond point biyem assi", "acacia biyem assi"],
    coordinates: [11.4812, 3.8425]
  },

  // =========================================================================
  // 9. NIGER (NE) - NIAMEY
  // =========================================================================
  {
    id: "ne-nia-plateau",
    name: "Plateau / Yantala / Koira Kano",
    type: "neighborhood",
    commune: "Niamey 1",
    city: "Niamey",
    countryCode: "NE",
    countryName: "Niger",
    formattedAddress: "Plateau, Niamey, Niger",
    aliases: ["niamey plateau", "yantala", "koira kano", "koira tegui", "palais presidentiel niamey", "grand hotel niamey"],
    coordinates: [2.0955, 13.5185]
  },
  {
    id: "ne-nia-grandmarche",
    name: "Grand Marché / Nouveau Marché / Wadata",
    type: "neighborhood",
    commune: "Niamey 2 & 3",
    city: "Niamey",
    countryCode: "NE",
    countryName: "Niger",
    formattedAddress: "Grand Marché, Niamey, Niger",
    aliases: ["grand marche niamey", "nouveau marche niamey", "wadata", "katako", "stade general seyni kountche"],
    coordinates: [2.1155, 13.5225]
  },

  // =========================================================================
  // 10. GHANA (GH) - ACCRA
  // =========================================================================
  {
    id: "gh-acc-eastlegon",
    name: "East Legon / Lagos Avenue",
    type: "neighborhood",
    commune: "Ayawaso West",
    city: "Accra",
    countryCode: "GH",
    countryName: "Ghana",
    formattedAddress: "East Legon, Accra, Ghana",
    aliases: ["east legon", "lagos avenue", "anc shopping mall", "underbridge east legon", "mensvic"],
    coordinates: [-0.1585, 5.6385]
  },
  {
    id: "gh-acc-osu",
    name: "Osu / Oxford Street / Cantonments",
    type: "neighborhood",
    commune: "Korle Klottey",
    city: "Accra",
    countryCode: "GH",
    countryName: "Ghana",
    formattedAddress: "Osu, Oxford Street, Accra, Ghana",
    aliases: ["osu", "oxford street accra", "cantonments", "labone", "danquah circle", "osu castle"],
    coordinates: [-0.1785, 5.5585]
  },
  {
    id: "gh-acc-airport",
    name: "Airport Residential Area / Dzorwulu",
    type: "neighborhood",
    commune: "Ayawaso Central",
    city: "Accra",
    countryCode: "GH",
    countryName: "Ghana",
    formattedAddress: "Airport Residential Area, Accra, Ghana",
    aliases: ["airport residential", "kotoka international airport", "dzorwulu", "roman ridge", "marina mall accra"],
    coordinates: [-0.1812, 5.6012]
  },
  {
    id: "gh-acc-spintex",
    name: "Spintex Road / Baatsona",
    type: "street",
    commune: "Ledzokuku",
    city: "Accra",
    countryCode: "GH",
    countryName: "Ghana",
    formattedAddress: "Spintex Road, Accra, Ghana",
    aliases: ["spintex", "spintex road", "baatsona", "junction mall", "sakumono", "community 18"],
    coordinates: [-0.1085, 5.6285]
  },

  // =========================================================================
  // 11. GABON (GA) - LIBREVILLE
  // =========================================================================
  {
    id: "ga-lbv-centre",
    name: "Centre-Ville / Louis / Batterie 4 / Sablière",
    type: "neighborhood",
    commune: "Libreville",
    city: "Libreville",
    countryCode: "GA",
    countryName: "Gabon",
    formattedAddress: "Louis, Batterie 4, Libreville, Gabon",
    aliases: ["louis libreville", "batterie 4", "la sabliere", "bord de mer libreville", "trois manguiers", "aeroport leon mba"],
    coordinates: [9.4385, 0.4085]
  },
  {
    id: "ga-lbv-montbouet",
    name: "Mont-Bouët / Oloumi / Lalala / Glass",
    type: "neighborhood",
    commune: "Libreville",
    city: "Libreville",
    countryCode: "GA",
    countryName: "Gabon",
    formattedAddress: "Mont-Bouët, Libreville, Gabon",
    aliases: ["grand marche mont bouet", "marche mont bouet", "oloumi", "lalala", "glass libreville", "pk8 libreville", "nzeng ayong", "charbonnages libreville"],
    coordinates: [9.4585, 0.3885]
  },

  // =========================================================================
  // 12. RDC - CONGO (CD) - KINSHASA
  // =========================================================================
  {
    id: "cd-kin-gombe",
    name: "Gombe / Boulevard du 30 Juin",
    type: "commune",
    commune: "Gombe",
    city: "Kinshasa",
    countryCode: "CD",
    countryName: "Congo (RDC)",
    formattedAddress: "Gombe, Boulevard du 30 Juin, Kinshasa, RDC",
    aliases: ["gombe", "la gombe", "boulevard du 30 juin", "place de la gare kinshasa", "hotel fleuve congo", "palais de la nation kinshasa"],
    coordinates: [15.3055, -4.3025]
  },
  {
    id: "cd-kin-ngaliema",
    name: "Ngaliema / Macampagne / Mont Fleury / UPN",
    type: "commune",
    commune: "Ngaliema",
    city: "Kinshasa",
    countryCode: "CD",
    countryName: "Congo (RDC)",
    formattedAddress: "Macampagne, Ngaliema, Kinshasa, RDC",
    aliases: ["ngaliema", "macampagne", "ma campagne", "binza ozone", "binza pigeon", "mont fleury", "upn kinshasa", "kintambo magasin"],
    coordinates: [15.2585, -4.3412]
  },
  {
    id: "cd-kin-limete",
    name: "Limete / Échangeur / Résidentiel",
    type: "commune",
    commune: "Limete",
    city: "Kinshasa",
    countryCode: "CD",
    countryName: "Congo (RDC)",
    formattedAddress: "Limete Résidentiel, Kinshasa, RDC",
    aliases: ["limete", "limete residentiel", "limete industriel", "echangeur de limete", "7eme rue limete", "1ère rue limete"],
    coordinates: [15.3412, -4.3585]
  },
  {
    id: "cd-kin-matonge",
    name: "Kalamu (Matonge / Victoire)",
    type: "neighborhood",
    commune: "Kalamu",
    city: "Kinshasa",
    countryCode: "CD",
    countryName: "Congo (RDC)",
    formattedAddress: "Matonge, Place Victoire, Kalamu, Kinshasa, RDC",
    aliases: ["matonge", "place victoire kinshasa", "rond point victoire", "bandalungwa", "lemba", "matete"],
    coordinates: [15.3185, -4.3385]
  }
];

/**
 * Remove diacritics / accents and normalize string for robust fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligent location search biased by merchant target country and city
 */
export function searchAfricanLocations(
  query: string,
  options?: {
    countryCode?: string;
    city?: string;
    limit?: number;
  }
): AfricanLocation[] {
  if (!query || query.trim().length < 1) return [];

  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(" ").filter(t => t.length > 0);
  const preferredCountry = options?.countryCode?.toUpperCase();
  const preferredCity = options?.city ? normalizeText(options.city) : undefined;
  const limit = options?.limit || 8;

  const scoredResults: { location: AfricanLocation; score: number }[] = [];

  for (const loc of WEST_AND_CENTRAL_AFRICA_LOCATIONS) {
    const normName = normalizeText(loc.name);
    const normCommune = loc.commune ? normalizeText(loc.commune) : "";
    const normCity = normalizeText(loc.city);
    const normCountry = normalizeText(loc.countryName);
    const normAddress = normalizeText(loc.formattedAddress);
    const aliases = (loc.aliases || []).map(a => normalizeText(a));

    let score = 0;

    // 1. Direct Exact match
    if (normName === normalizedQuery) {
      score += 120;
    } else if (normName.startsWith(normalizedQuery)) {
      score += 80;
    } else if (normName.includes(normalizedQuery)) {
      score += 50;
    }

    // 2. Alias exact / prefix match
    for (const alias of aliases) {
      if (alias === normalizedQuery) {
        score += 100;
        break;
      } else if (alias.startsWith(normalizedQuery)) {
        score += 70;
        break;
      } else if (alias.includes(normalizedQuery)) {
        score += 40;
        break;
      }
    }

    // 3. Token-based multi-word search (e.g. "angre 8", "zone 4", "palmeraie faya")
    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (
        normName.includes(token) ||
        aliases.some(a => a.includes(token)) ||
        normCommune.includes(token) ||
        normCity.includes(token) ||
        normCountry.includes(token)
      ) {
        matchedTokens++;
      }
    }

    if (matchedTokens === queryTokens.length) {
      score += 40 + (matchedTokens * 15);
    } else if (matchedTokens > 0) {
      score += matchedTokens * 10;
    }

    // If no match at all, skip
    if (score === 0 && !normAddress.includes(normalizedQuery)) {
      continue;
    }

    // 4. Boost if matching merchant's target Country / City
    if (preferredCountry && loc.countryCode === preferredCountry) {
      score += 60;
    }
    if (preferredCity && (normCity.includes(preferredCity) || preferredCity.includes(normCity))) {
      score += 35;
    }

    scoredResults.push({ location: loc, score });
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, limit).map(item => item.location);
}
