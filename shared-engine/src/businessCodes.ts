export interface TaxBusinessCode {
  code: string;
  nature: string;
  category: string;
}

export const taxBusinessCodes: TaxBusinessCode[] = [
  // Agriculture, Animal Husbandry & Forestry
  { code: '01001', nature: 'Growing and manufacturing of tea', category: 'Agriculture & Forestry' },
  { code: '01002', nature: 'Growing and manufacturing of coffee', category: 'Agriculture & Forestry' },
  { code: '01003', nature: 'Growing and manufacturing of rubber', category: 'Agriculture & Forestry' },
  { code: '01004', nature: 'Market gardening and horticulture specialties', category: 'Agriculture & Forestry' },
  { code: '01005', nature: 'Growing of other crops', category: 'Agriculture & Forestry' },
  { code: '01006', nature: 'Farming of animals (animal husbandry)', category: 'Agriculture & Forestry' },
  { code: '01007', nature: 'Poultry and egg production', category: 'Agriculture & Forestry' },
  { code: '01008', nature: 'Agricultural and animal husbandry services', category: 'Agriculture & Forestry' },
  { code: '01009', nature: 'Forestry, logging and related service activities', category: 'Agriculture & Forestry' },

  // Fishing & Aquaculture
  { code: '02001', nature: 'Fishing on commercial basis in inland waters', category: 'Fishing' },
  { code: '02002', nature: 'Fishing on commercial basis in ocean and coastal waters', category: 'Fishing' },
  { code: '02003', nature: 'Fish farming / Aquaculture', category: 'Fishing' },

  // Mining & Quarrying
  { code: '03001', nature: 'Mining of coal and lignite', category: 'Mining & Quarrying' },
  { code: '03002', nature: 'Extraction of crude petroleum and natural gas', category: 'Mining & Quarrying' },
  { code: '03003', nature: 'Mining of iron ores', category: 'Mining & Quarrying' },
  { code: '03004', nature: 'Mining of non-ferrous metal ores (except iron)', category: 'Mining & Quarrying' },
  { code: '03005', nature: 'Quarrying of stone, sand and clay', category: 'Mining & Quarrying' },

  // Manufacturing (Food, Textiles, Leather, Wood, Paper)
  { code: '04001', nature: 'Manufacture of food products and beverages', category: 'Manufacturing' },
  { code: '04002', nature: 'Manufacture of tobacco products', category: 'Manufacturing' },
  { code: '04003', nature: 'Manufacture of textiles', category: 'Manufacturing' },
  { code: '04004', nature: 'Manufacture of wearing apparel', category: 'Manufacturing' },
  { code: '04005', nature: 'Manufacture of leather products', category: 'Manufacturing' },
  { code: '04006', nature: 'Manufacture of wood products', category: 'Manufacturing' },
  { code: '04007', nature: 'Manufacture of paper and paper products', category: 'Manufacturing' },
  { code: '04008', nature: 'Publishing, printing and reproduction of recorded media', category: 'Manufacturing' },

  // Manufacturing (Chemicals, Metals, Machinery, Vehicles)
  { code: '05001', nature: 'Manufacture of chemicals and chemical products', category: 'Manufacturing' },
  { code: '05002', nature: 'Manufacture of rubber and plastic products', category: 'Manufacturing' },
  { code: '05003', nature: 'Manufacture of metal products (except machinery)', category: 'Manufacturing' },
  { code: '05004', nature: 'Manufacture of machinery and equipment', category: 'Manufacturing' },
  { code: '05005', nature: 'Manufacture of motor vehicles and trailers', category: 'Manufacturing' },
  { code: '05006', nature: 'Manufacture of other transport equipment', category: 'Manufacturing' },
  { code: '05007', nature: 'Manufacture of furniture / manufacturing n.e.c.', category: 'Manufacturing' },

  // Electricity, Gas & Water
  { code: '07001', nature: 'Electricity generation, transmission and distribution', category: 'Electricity, Gas & Water' },
  { code: '07002', nature: 'Manufacture and distribution of gas', category: 'Electricity, Gas & Water' },
  { code: '07003', nature: 'Water collection, treatment and supply', category: 'Electricity, Gas & Water' },

  // Construction
  { code: '06001', nature: 'Site preparation works', category: 'Construction' },
  { code: '06002', nature: 'Building of complete constructions or parts – civil contractors', category: 'Construction' },
  { code: '06003', nature: 'Building installation activities (electrical, plumbing, etc.)', category: 'Construction' },
  { code: '06004', nature: 'Building completion activities (plastering, painting, tiling, etc.)', category: 'Construction' },
  { code: '06005', nature: 'Construction and maintenance of roads, rails, bridges, tunnels, ports, runways, etc.', category: 'Construction' },
  { code: '06006', nature: 'Renting of construction or demolition equipment with operator', category: 'Construction' },
  { code: '06007', nature: 'Other construction activity n.e.c.', category: 'Construction' },

  // Wholesale & Retail Trade
  { code: '08001', nature: 'Wholesale trade of agricultural raw materials', category: 'Wholesale & Retail Trade' },
  { code: '08002', nature: 'Wholesale trade of food, beverages and tobacco', category: 'Wholesale & Retail Trade' },
  { code: '08003', nature: 'Wholesale trade of textiles, clothing and leather', category: 'Wholesale & Retail Trade' },
  { code: '08004', nature: 'Wholesale trade of household goods', category: 'Wholesale & Retail Trade' },
  { code: '08005', nature: 'Wholesale trade of metal, ore, chemical', category: 'Wholesale & Retail Trade' },
  { code: '08006', nature: 'Wholesale trade of machinery and equipment', category: 'Wholesale & Retail Trade' },
  { code: '08007', nature: 'Other wholesale trade', category: 'Wholesale & Retail Trade' },
  { code: '08008', nature: 'Retail trade of food, beverage and tobacco', category: 'Wholesale & Retail Trade' },
  { code: '08009', nature: 'Retail trade of textiles, apparel and footwear', category: 'Wholesale & Retail Trade' },
  { code: '08010', nature: 'Retail trade of household appliances, furniture', category: 'Wholesale & Retail Trade' },
  { code: '08011', nature: 'Retail trade of hardware, paint and glass', category: 'Wholesale & Retail Trade' },
  { code: '08012', nature: 'Retail trade of petrol, diesel and CNG', category: 'Wholesale & Retail Trade' },
  { code: '08013', nature: 'Retail trade of pharmaceutical and medical goods', category: 'Wholesale & Retail Trade' },
  { code: '08014', nature: 'Other retail trade', category: 'Wholesale & Retail Trade' },

  // Hotels & Restaurants
  { code: '09001', nature: 'Hotels, rooming houses and other lodging places', category: 'Hotels & Restaurants' },
  { code: '09002', nature: 'Restaurants, bars and canteens', category: 'Hotels & Restaurants' },

  // Transport, Storage & Communication
  { code: '10001', nature: 'Transport by road (trucks, lorries, taxi, tempo, etc.)', category: 'Transport & Storage' },
  { code: '10002', nature: 'Transport by water', category: 'Transport & Storage' },
  { code: '10003', nature: 'Transport by air', category: 'Transport & Storage' },
  { code: '10004', nature: 'Supporting and auxiliary transport activities', category: 'Transport & Storage' },
  { code: '10005', nature: 'Storage and warehousing', category: 'Transport & Storage' },
  { code: '10006', nature: 'Post and courier activities', category: 'Transport & Storage' },
  { code: '10007', nature: 'Telecommunications', category: 'Transport & Storage' },

  // Financial Intermediation
  { code: '11001', nature: 'Financial intermediation (banking, deposits)', category: 'Financial Intermediation' },
  { code: '11002', nature: 'Insurance and pension funding (except social security)', category: 'Financial Intermediation' },
  { code: '11003', nature: 'Activities auxiliary to financial intermediation (advisors, brokers)', category: 'Financial Intermediation' },

  // Real Estate & Renting
  { code: '12001', nature: 'Real estate activities (buying, selling, renting)', category: 'Real Estate & Renting' },
  { code: '12002', nature: 'Renting of machinery and equipment without operator', category: 'Real Estate & Renting' },

  // Education, Health & Social Work
  { code: '13001', nature: 'Primary, secondary and higher education', category: 'Education & Health' },
  { code: '13002', nature: 'Technical and vocational education', category: 'Education & Health' },
  { code: '13003', nature: 'Human health activities (hospitals, clinics)', category: 'Education & Health' },
  { code: '13004', nature: 'Veterinary activities', category: 'Education & Health' },
  { code: '13005', nature: 'Social work activities', category: 'Education & Health' },

  // Other Community & Personal Services
  { code: '14001', nature: 'Hairdressing and other beauty treatment', category: 'Other Services' },
  { code: '14002', nature: 'Laundry, cleaning and dyeing of textiles', category: 'Other Services' },
  { code: '14003', nature: 'Funeral and related activities', category: 'Other Services' },
  { code: '14004', nature: 'Sporting and other recreational activities', category: 'Other Services' },
  { code: '14005', nature: 'Tailoring and dressmaking', category: 'Other Services' },
  { code: '14010', nature: 'Other personal service activities n.e.c.', category: 'Other Services' },

  // Professional Services (44ADA / Other)
  { code: '16001', nature: 'Legal profession', category: 'Professional Services' },
  { code: '16002', nature: 'Accounting, auditing and bookkeeping', category: 'Professional Services' },
  { code: '16003', nature: 'Tax consultancy', category: 'Professional Services' },
  { code: '16004', nature: 'Architectural profession', category: 'Professional Services' },
  { code: '16005', nature: 'Engineering/technical consultancy', category: 'Professional Services' },
  { code: '16007', nature: 'Medical profession (Doctors, Dentists, etc.)', category: 'Professional Services' },
  { code: '16008', nature: 'Nursing, physiotherapy and other health paramedical', category: 'Professional Services' },
  { code: '16013', nature: 'Software development', category: 'Professional Services' },
  { code: '16014', nature: 'IT enabled services (BPO, call centers)', category: 'Professional Services' },
  { code: '16019', nature: 'Advertising and market research', category: 'Professional Services' },
  { code: '16020', nature: 'Fashion design, interior decoration', category: 'Professional Services' },
  { code: '16021', nature: 'Content creators, influencers, freelance writers', category: 'Professional Services' },
  { code: '16022', nature: 'Other professional services', category: 'Professional Services' },

  // Stock Market & Trading
  { code: '21008', nature: 'Digital Marketing & Online Advertising', category: 'Stock Market & Trading' },
  { code: '21009', nature: 'Intraday Share Trading (Speculative)', category: 'Stock Market & Trading' },
  { code: '21010', nature: 'Futures and Options (F&O) Trading', category: 'Stock Market & Trading' },
  { code: '21011', nature: 'Delivery-based Share Trading (Non-speculative)', category: 'Stock Market & Trading' },
  { code: '21012', nature: 'Other financial trading activities', category: 'Stock Market & Trading' }
];
