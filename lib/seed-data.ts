// Placeholder catalog data for the ChemCorp group.
// 15 subsidiary brands, each with ~12 base chemicals x 2 grade variants = ~360 SKUs.
// Replace names/images with the client's real product list when available.

export interface BrandSeed {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  color: string;
  category: string;
  chemicals: string[];
}

export const GRADE_VARIANTS: {
  grade: string;
  priceFactor: number;
  packaging: string;
  unit: string;
  packSizeKg: number;
  minOrderQty: number;
}[] = [
  { grade: "Technical Grade", priceFactor: 1.0, packaging: "50 kg drum", unit: "drum", packSizeKg: 50, minOrderQty: 5 },
  { grade: "Industrial Grade", priceFactor: 1.35, packaging: "25 kg bag", unit: "bag", packSizeKg: 25, minOrderQty: 10 },
];

export const BRAND_SEEDS: BrandSeed[] = [
  {
    name: "SolvoTech",
    slug: "solvotech",
    tagline: "High-purity industrial solvents",
    description:
      "SolvoTech supplies bulk industrial solvents for coatings, adhesives, pharma extraction and general manufacturing, with consistent batch-to-batch purity.",
    color: "#0369A1",
    category: "Industrial Solvents",
    chemicals: [
      "Acetone", "Toluene", "Isopropyl Alcohol 99%", "Methylene Chloride", "Ethyl Acetate",
      "Xylene (Mixed Isomers)", "Methanol", "N-Butanol", "MEK (Methyl Ethyl Ketone)",
      "Cyclohexanone", "Diacetone Alcohol", "Butyl Cellosolve",
    ],
  },
  {
    name: "AquaPure Solutions",
    slug: "aquapure-solutions",
    tagline: "Water treatment chemistry that works",
    description:
      "AquaPure Solutions manufactures coagulants, flocculants and disinfection chemicals for municipal water, effluent treatment plants and cooling towers.",
    color: "#0891B2",
    category: "Water Treatment",
    chemicals: [
      "Poly Aluminium Chloride 30%", "Alum (Ferric)", "Sodium Hypochlorite 12%", "Chlorine Dioxide Tablets",
      "Polyacrylamide (Anionic)", "Polyacrylamide (Cationic)", "Antiscalant RO-100", "Sodium Metabisulphite",
      "Calcium Hypochlorite 65%", "Ferric Chloride 40%", "Cooling Tower Biocide CT-22", "pH Booster Alkaline",
    ],
  },
  {
    name: "PolyChem Industries",
    slug: "polychem-industries",
    tagline: "Polymers, resins & compounds",
    description:
      "PolyChem Industries produces commodity and specialty polymer resins, masterbatches and plasticizers for extrusion, moulding and packaging converters.",
    color: "#7C3AED",
    category: "Polymers & Resins",
    chemicals: [
      "Epoxy Resin LY-556", "Polyester Resin (Unsaturated)", "PVC Resin K-67", "LDPE Granules",
      "HDPE Granules", "Polyurethane Prepolymer", "Acrylic Emulsion 46%", "Phenolic Resin Novolac",
      "DOP Plasticizer", "Silicone Emulsion 35%", "EVA Copolymer 18%", "Alkyd Resin Long Oil",
    ],
  },
  {
    name: "AgroVita Chemicals",
    slug: "agrovita-chemicals",
    tagline: "Crop science & agri inputs",
    description:
      "AgroVita Chemicals formulates fertilizer intermediates, micronutrients and crop-protection actives for agri-input companies and co-operatives.",
    color: "#16A34A",
    category: "Agrochemicals",
    chemicals: [
      "Zinc Sulphate Monohydrate", "Chelated Micronutrient Mix EDTA", "Humic Acid 98%", "Potassium Humate Flakes",
      "Seaweed Extract Powder", "Sulphur 90% WDG", "Ferrous Sulphate Heptahydrate", "Magnesium Sulphate",
      "Boron 20% (Disodium Octaborate)", "Amino Acid 80% Powder", "Fulvic Acid 90%", "Calcium Nitrate Granular",
    ],
  },
  {
    name: "NovaSynth Labs",
    slug: "novasynth-labs",
    tagline: "Pharma intermediates & APIs",
    description:
      "NovaSynth Labs synthesises pharmaceutical intermediates and fine chemicals under strict quality systems, serving formulation and API manufacturers.",
    color: "#DC2626",
    category: "Pharma Intermediates",
    chemicals: [
      "Para Amino Phenol", "Salicylic Acid IP", "Benzyl Chloride", "4-Chloroacetoacetate Ethyl",
      "Meta Chloro Benzaldehyde", "Guanidine Nitrate", "Thionyl Chloride", "Benzocaine Base",
      "Citric Acid Anhydrous IP", "Sodium Starch Glycolate", "Povidone K-30", "Propylene Glycol IP",
    ],
  },
  {
    name: "PigmentPro",
    slug: "pigmentpro",
    tagline: "Colour for every industry",
    description:
      "PigmentPro manufactures organic and inorganic pigments, dyes and optical brighteners for inks, paints, plastics and textile printing.",
    color: "#EA580C",
    category: "Dyes & Pigments",
    chemicals: [
      "Titanium Dioxide Rutile", "Phthalocyanine Blue 15:3", "Phthalocyanine Green 7", "Carbon Black N-330",
      "Red Oxide Pigment 130", "Yellow Iron Oxide 313", "Ultramarine Blue 462", "Pigment Red 48:2",
      "Optical Brightener OB-1", "Direct Black 22 Dye", "Reactive Red M5B", "Chrome Yellow Medium",
    ],
  },
  {
    name: "CleanChem Surfactants",
    slug: "cleanchem-surfactants",
    tagline: "Surfactants & cleaning actives",
    description:
      "CleanChem Surfactants supplies anionic and non-ionic surfactants, builders and specialty actives to detergent, personal care and institutional cleaning brands.",
    color: "#2563EB",
    category: "Surfactants & Cleaning",
    chemicals: [
      "LABSA 96%", "SLES 70%", "Caustic Soda Flakes", "Soda Ash Light",
      "CAPB (Cocamidopropyl Betaine)", "CDEA (Coconut Diethanolamide)", "NP-9 Ethoxylate", "Sodium Tripolyphosphate",
      "Citric Acid Monohydrate", "EDTA Tetrasodium", "Benzalkonium Chloride 80%", "Sodium Lauryl Sulphate Needles",
    ],
  },
  {
    name: "MetalGuard Coatings",
    slug: "metalguard-coatings",
    tagline: "Metal treatment & protection",
    description:
      "MetalGuard Coatings produces pickling, phosphating, electroplating and anti-corrosion chemistries for automotive, fabrication and galvanizing lines.",
    color: "#475569",
    category: "Metal Treatment",
    chemicals: [
      "Zinc Phosphate Solution", "Hydrochloric Acid 33%", "Nitric Acid 68%", "Chromic Acid Flakes",
      "Nickel Sulphamate Solution", "Degreaser Alkaline MG-40", "Rust Converter RC-11", "Passivation Solution Trivalent",
      "Copper Sulphate Pentahydrate", "Zinc Chloride Solution 50%", "Anti-Rust Oil Grade 2", "Phosphoric Acid 85%",
    ],
  },
  {
    name: "BioCatal Enzymes",
    slug: "biocatal-enzymes",
    tagline: "Enzymes & bio-processing",
    description:
      "BioCatal Enzymes develops enzyme concentrates and bio-catalysts for textile processing, food, leather, and effluent bio-remediation applications.",
    color: "#059669",
    category: "Enzymes & Biotech",
    chemicals: [
      "Alpha Amylase Concentrate", "Cellulase Acid Wash", "Protease Alkaline", "Lipase Concentrate 20K",
      "Catalase Liquid", "Pectinase Fruit Grade", "Xylanase Bakery Grade", "Bio-Scouring Enzyme TX-4",
      "Effluent Bio-Culture Blend", "Glucoamylase 300L", "Papain Powder 6000 TU", "Bromelain 2400 GDU",
    ],
  },
  {
    name: "PetroLube Specialties",
    slug: "petrolube-specialties",
    tagline: "Lubricants & petro-specialties",
    description:
      "PetroLube Specialties blends base oils, greases, metalworking fluids and process oils for machining shops, mills and OEM maintenance programmes.",
    color: "#B45309",
    category: "Lubricants & Petrochem",
    chemicals: [
      "Base Oil SN-500", "Hydraulic Oil 68", "Cutting Oil Soluble", "Gear Oil EP-90",
      "White Oil Pharma Grade", "Rubber Process Oil Aromatic", "Lithium Grease EP-2", "Transformer Oil Inhibited",
      "Paraffin Wax Semi-Refined", "Petroleum Jelly White", "Slack Wax Heavy", "Neat Cutting Oil 22",
    ],
  },
  {
    name: "FineReagents",
    slug: "finereagents",
    tagline: "Laboratory & analytical reagents",
    description:
      "FineReagents packages AR/LR grade reagents, buffers and volumetric solutions for QC laboratories, research institutes and diagnostics manufacturers.",
    color: "#9333EA",
    category: "Lab Reagents",
    chemicals: [
      "Sulphuric Acid AR", "Sodium Hydroxide Pellets AR", "Potassium Permanganate AR", "Silver Nitrate AR",
      "Buffer Solution pH 7.00", "Buffer Solution pH 4.00", "EDTA Disodium AR", "Ammonium Hydroxide 25% AR",
      "Iodine Resublimed AR", "Sodium Thiosulphate 0.1N", "Phenolphthalein Indicator", "Karl Fischer Reagent 5mg",
    ],
  },
  {
    name: "TexChem Auxiliaries",
    slug: "texchem-auxiliaries",
    tagline: "Textile processing auxiliaries",
    description:
      "TexChem Auxiliaries supplies pre-treatment, dyeing and finishing auxiliaries to process houses and garment finishers across knits and wovens.",
    color: "#DB2777",
    category: "Textile Chemicals",
    chemicals: [
      "Wetting Agent NI Conc", "Levelling Agent Acid Dye", "Fixing Agent Formaldehyde-Free", "Silicone Softener Micro",
      "Antifoam Silicone 30%", "Sequestering Agent TC-9", "Peroxide Stabilizer Organic", "Soaping Agent Reactive",
      "Cationic Softener Flakes", "Stiffening Finish PVA", "Anti-Pilling Enzyme Finish", "OBA for Cotton BSU",
    ],
  },
  {
    name: "FoodGrade Additives",
    slug: "foodgrade-additives",
    tagline: "Food-safe ingredients & additives",
    description:
      "FoodGrade Additives supplies FSSAI-compliant preservatives, acidulants, emulsifiers and fortification premixes to food and beverage processors.",
    color: "#65A30D",
    category: "Food Additives",
    chemicals: [
      "Citric Acid Anhydrous FG", "Sodium Benzoate FG", "Potassium Sorbate Granular", "Ascorbic Acid FG",
      "Sodium Bicarbonate FG", "Calcium Propionate FG", "Xanthan Gum 200 Mesh", "Guar Gum Food Grade",
      "Lecithin Soya Liquid", "Malic Acid FG", "Vitamin Premix Bakery", "Sorbitol 70% Solution",
    ],
  },
  {
    name: "ConstructChem",
    slug: "constructchem",
    tagline: "Construction chemistry & admixtures",
    description:
      "ConstructChem manufactures concrete admixtures, waterproofing systems, grouts and curing compounds for infrastructure and real-estate projects.",
    color: "#0D9488",
    category: "Construction Chemicals",
    chemicals: [
      "PCE Superplasticizer 40%", "SNF Superplasticizer Powder", "Integral Waterproofing Liquid", "Crystalline Waterproofing Powder",
      "Epoxy Grout 3-Component", "Non-Shrink Grout NS-60", "Curing Compound Wax Based", "Concrete Bonding Agent SBR",
      "Tile Adhesive Polymer AD-30", "Anti-Corrosion Rebar Coat", "Polysulphide Sealant Gun Grade", "Air Entraining Agent AE-2",
    ],
  },
  {
    name: "ElectroChem Materials",
    slug: "electrochem-materials",
    tagline: "Electronic & specialty materials",
    description:
      "ElectroChem Materials produces high-purity process chemicals, fluxes and conformal coatings for PCB fabrication, battery and semiconductor assembly.",
    color: "#4F46E5",
    category: "Electronic Chemicals",
    chemicals: [
      "Isopropyl Alcohol Electronic Grade", "Flux No-Clean RMA", "Solder Paste Sn63/Pb37", "Conformal Coating Acrylic",
      "Etchant Ferric Chloride PCB", "Developer Solution Alkaline", "Photoresist Dry Film", "Thermal Paste Silicone 3W",
      "Lithium Carbonate Battery Grade", "Nickel Foam Electrode Sheet", "Silver Conductive Paint", "Deionised Water 18MΩ",
    ],
  },
];
