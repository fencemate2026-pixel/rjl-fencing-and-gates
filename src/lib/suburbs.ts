export type Suburb = {
  slug: string;
  name: string;
  postcode: string;
  council: string;
  region: string;
  km: number;
  angle: string;
};

export const REGIONS = [
  "Northern suburbs",
  "Inner north & east",
  "North-west & Hume",
  "East & Yarra",
  "Inner west",
  "South & south-east",
  "Outer 100 km",
] as const;

export const SUBURBS: Suburb[] = [
  { slug: "bundoora", name: "Bundoora", postcode: "3083", council: "Banyule / Whittlesea / Darebin", region: "Northern suburbs", km: 0, angle: "Our home suburb — university streets, established brick homes and new townhouses around La Trobe. We know the councils, the clay and the typical 1.8–2.0 m boundary heights." },
  { slug: "mill-park", name: "Mill Park", postcode: "3082", council: "Whittlesea", region: "Northern suburbs", km: 4, angle: "Family homes and cul-de-sacs that still want Colorbond privacy on the rear and a presentable steel or timber frontage." },
  { slug: "greensborough", name: "Greensborough", postcode: "3088", council: "Banyule / Nillumbik", region: "Northern suburbs", km: 6, angle: "Sloping blocks above the Plenty River — retaining walls, stepped paling and pool barriers are everyday work here." },
  { slug: "epping", name: "Epping", postcode: "3076", council: "Whittlesea", region: "Northern suburbs", km: 8, angle: "A mix of older weatherboard and new estates. Colorbond, automatic sliding gates and side returns are the typical brief." },
  { slug: "preston", name: "Preston", postcode: "3072", council: "Darebin", region: "Inner north & east", km: 9, angle: "Period frontages that need picket or tubular steel, plus rear Colorbond for privacy on tighter blocks." },
  { slug: "reservoir", name: "Reservoir", postcode: "3073", council: "Darebin", region: "Northern suburbs", km: 7, angle: "Wide streets, post-war homes and laneway access — palisade and automated gates are increasingly requested." },
  { slug: "thomastown", name: "Thomastown", postcode: "3074", council: "Whittlesea", region: "Northern suburbs", km: 6, angle: "Residential streets beside the industrial belt. Steel, Colorbond and driveway automation sit alongside the group’s commercial workshop." },
  { slug: "lalor", name: "Lalor", postcode: "3075", council: "Whittlesea", region: "Northern suburbs", km: 7, angle: "Established family homes needing paling replacement, Colorbond upgrades and simple swing-gate automation." },
  { slug: "south-morang", name: "South Morang", postcode: "3752", council: "Whittlesea", region: "Northern suburbs", km: 8, angle: "Newer estates with design guidelines — we match Colorbond colours, estate heights and covenant frontages." },
  { slug: "watsonia", name: "Watsonia", postcode: "3087", council: "Banyule", region: "Northern suburbs", km: 5, angle: "Leafy Banyule streets where timber, steel picket and low front fences still have to satisfy council character rules." },
  { slug: "macleod", name: "Macleod", postcode: "3085", council: "Banyule", region: "Northern suburbs", km: 4, angle: "Near the golf course and railway — sloping sites, pool fences and quiet street frontages." },
  { slug: "rosanna", name: "Rosanna", postcode: "3084", council: "Banyule", region: "Inner north & east", km: 6, angle: "Californian bungalows and brick veneers that suit tubular steel, timber picket and discreet automation." },
  { slug: "heidelberg", name: "Heidelberg", postcode: "3084", council: "Banyule", region: "Inner north & east", km: 8, angle: "Hospital precinct and river flats. Pool compliance, retaining and architectural steel for renovated homes." },
  { slug: "ivanhoe", name: "Ivanhoe", postcode: "3079", council: "Banyule", region: "Inner north & east", km: 10, angle: "Heritage overlays and generous gardens. Wrought iron, picket and custom steel with matching pedestrian gates." },
  { slug: "eltham", name: "Eltham", postcode: "3095", council: "Nillumbik", region: "East & Yarra", km: 10, angle: "Mudbrick, bush gardens and Nillumbik character rules. Timber, steel and pool fencing that respects the landscape." },
  { slug: "diamond-creek", name: "Diamond Creek", postcode: "3089", council: "Nillumbik", region: "East & Yarra", km: 12, angle: "Semi-rural lots and new estates — longer runs of Colorbond, acreage gates and concrete sleeper walls." },
  { slug: "doncaster", name: "Doncaster", postcode: "3108", council: "Manningham", region: "East & Yarra", km: 14, angle: "Brick two-storeys and pool-heavy backyards. Glass and aluminium pool fencing plus automated driveway gates." },
  { slug: "templestowe", name: "Templestowe", postcode: "3106", council: "Manningham", region: "East & Yarra", km: 14, angle: "Acreage-feel blocks on the Yarra. Palisade, steel entrance gates and engineered retaining on slopes." },
  { slug: "northcote", name: "Northcote", postcode: "3070", council: "Darebin", region: "Inner north & east", km: 12, angle: "Narrow Victorian lots, side returns and laneways. Custom steel, slat screens and compact sliding gates." },
  { slug: "thornbury", name: "Thornbury", postcode: "3071", council: "Darebin", region: "Inner north & east", km: 11, angle: "Weatherboard cottages needing picket fronts and solid rear privacy without overwhelming the street." },
  { slug: "coburg", name: "Coburg", postcode: "3058", council: "Merri-bek", region: "Inner north & east", km: 12, angle: "Period homes and new townhouses. Council-friendly front fences with Colorbond or steel behind." },
  { slug: "brunswick", name: "Brunswick", postcode: "3056", council: "Merri-bek", region: "Inner north & east", km: 14, angle: "Tight access, rear lanes and planning overlays. We fabricate gates that actually fit the opening." },
  { slug: "fawkner", name: "Fawkner", postcode: "3060", council: "Merri-bek", region: "Northern suburbs", km: 10, angle: "Practical paling and Colorbond replacements, with more homeowners adding automation each year." },
  { slug: "glenroy", name: "Glenroy", postcode: "3046", council: "Merri-bek", region: "North-west & Hume", km: 14, angle: "Post-war homes on decent blocks — long Colorbond runs, new driveways and swing-gate motors." },
  { slug: "pascoe-vale", name: "Pascoe Vale", postcode: "3044", council: "Merri-bek", region: "North-west & Hume", km: 13, angle: "Californian bungalows and new infill. Steel picket and slat fronts that keep the street polite." },
  { slug: "essendon", name: "Essendon", postcode: "3040", council: "Moonee Valley", region: "Inner west", km: 16, angle: "Grand frontages, tennis-court pool fences and automated gates sized for wider driveways." },
  { slug: "moonee-ponds", name: "Moonee Ponds", postcode: "3039", council: "Moonee Valley", region: "Inner west", km: 16, angle: "Heritage streets around the creek. Picket, wrought iron and discreet operators on existing gates." },
  { slug: "kew", name: "Kew", postcode: "3101", council: "Boroondara", region: "Inner north & east", km: 14, angle: "Boroondara character overlays. Architectural steel, glass pool fencing and quiet sliding gates." },
  { slug: "hawthorn", name: "Hawthorn", postcode: "3122", council: "Boroondara", region: "Inner north & east", km: 16, angle: "Terrace and mansion lots. Custom metalwork, pedestrian gates and AS 1926 pool barriers." },
  { slug: "balwyn", name: "Balwyn", postcode: "3103", council: "Boroondara", region: "East & Yarra", km: 16, angle: "Garden suburbs with pools and high side fences. Colour-matched Colorbond and blade screening." },
  { slug: "box-hill", name: "Box Hill", postcode: "3128", council: "Whitehorse", region: "East & Yarra", km: 18, angle: "Mixed density — townhouse side gates, apartment-adjacent palisade and family Colorbond." },
  { slug: "craigieburn", name: "Craigieburn", postcode: "3064", council: "Hume", region: "North-west & Hume", km: 18, angle: "Growth-corridor estates with strict design guidelines. We install to developer colour and height boards." },
  { slug: "mernda", name: "Mernda", postcode: "3754", council: "Whittlesea", region: "Northern suburbs", km: 16, angle: "New estates north of South Morang. Colorbond, estate gates and sleeper walls on filled blocks." },
  { slug: "doreen", name: "Doreen", postcode: "3754", council: "Whittlesea", region: "Northern suburbs", km: 18, angle: "Larger lots at the urban edge. Longer fence runs, rural-style entrance gates and retaining." },
  { slug: "whittlesea", name: "Whittlesea", postcode: "3757", council: "Whittlesea", region: "Northern suburbs", km: 28, angle: "Township and acreage. Farm gates, palisade, Colorbond and automation on long driveways." },
  { slug: "hurstbridge", name: "Hurstbridge", postcode: "3099", council: "Nillumbik", region: "East & Yarra", km: 20, angle: "Bushfire-aware materials, timber character and steel that sits in a treed street." },
  { slug: "heidelberg-west", name: "Heidelberg West", postcode: "3081", council: "Banyule", region: "Northern suburbs", km: 7, angle: "Housing-commission heritage and new infill. Durable Colorbond, steel and compliant pool fences." },
  { slug: "kingsbury", name: "Kingsbury", postcode: "3083", council: "Darebin", region: "Northern suburbs", km: 3, angle: "Beside La Trobe — student rentals and family homes sharing the same 3083 postcode as our workshop suburb." },
  { slug: "viewbank", name: "Viewbank", postcode: "3084", council: "Banyule", region: "Inner north & east", km: 7, angle: "Quiet Banyule streets with pools and fall across the block — stepped fences and sleeper walls." },
  { slug: "montmorency", name: "Montmorency", postcode: "3094", council: "Banyule", region: "East & Yarra", km: 9, angle: "Steep, leafy blocks. Retaining, timber and steel that follow the contour rather than fighting it." },
  { slug: "richmond", name: "Richmond", postcode: "3121", council: "Yarra", region: "Inner north & east", km: 16, angle: "Warehouse conversions and tight street frontages. Custom steel, pedestrian gates and body-corporate work." },
  { slug: "fitzroy", name: "Fitzroy", postcode: "3065", council: "Yarra", region: "Inner north & east", km: 14, angle: "Laneway living. Compact automated gates, palisade and powder-coated steel on heritage brick." },
  { slug: "collingwood", name: "Collingwood", postcode: "3066", council: "Yarra", region: "Inner north & east", km: 14, angle: "Similar brief to Fitzroy — access, graffiti-resistant coatings and gates that clear the right of way." },
  { slug: "carlton", name: "Carlton", postcode: "3053", council: "Melbourne", region: "Inner north & east", km: 14, angle: "Terrace houses, small courtyards and planning controls. Low front fences and secure side gates." },
  { slug: "footscray", name: "Footscray", postcode: "3011", council: "Maribyrnong", region: "Inner west", km: 22, angle: "Inner-west weatherboards and new apartments. Colorbond, steel and strata boom or swing gates." },
  { slug: "williamstown", name: "Williamstown", postcode: "3016", council: "Hobsons Bay", region: "Inner west", km: 28, angle: "Coastal salt air. Hot-dip galvanised steel, marine-grade hardware and period-appropriate picket." },
  { slug: "sunbury", name: "Sunbury", postcode: "3429", council: "Hume", region: "North-west & Hume", km: 38, angle: "Township plus acreage. Rural entrance gates, Colorbond, palisade and solar-friendly automation." },
  { slug: "werribee", name: "Werribee", postcode: "3030", council: "Wyndham", region: "Outer 100 km", km: 42, angle: "Western growth corridor. Estate Colorbond, automatic sliding gates and sleeper walls on new fills." },
  { slug: "point-cook", name: "Point Cook", postcode: "3030", council: "Wyndham", region: "Outer 100 km", km: 40, angle: "Masterplanned streets with colour boards. We install to estate guidelines and add automation later if needed." },
  { slug: "glen-waverley", name: "Glen Waverley", postcode: "3150", council: "Monash", region: "South & south-east", km: 28, angle: "Family homes and pools. Glass pool fencing, Colorbond and quiet sliding gates on wider blocks." },
  { slug: "ringwood", name: "Ringwood", postcode: "3134", council: "Maroondah", region: "East & Yarra", km: 24, angle: "Eastland precinct and surrounding hills. Mixed timber, steel and retaining on falling sites." },
  { slug: "dandenong", name: "Dandenong", postcode: "3175", council: "Greater Dandenong", region: "South & south-east", km: 36, angle: "Residential pockets beside industrial land. Palisade, Colorbond and automated driveway gates." },
  { slug: "frankston", name: "Frankston", postcode: "3199", council: "Frankston", region: "South & south-east", km: 48, angle: "Bayside weather and sloping coastal blocks. Galvanised steel, pool compliance and Colorbond." },
  { slug: "berwick", name: "Berwick", postcode: "3806", council: "Casey", region: "South & south-east", km: 48, angle: "Family estates and larger lots. Colorbond, estate fencing and automatic gates within the 100 km radius." },
  { slug: "pakenham", name: "Pakenham", postcode: "3810", council: "Cardinia", region: "Outer 100 km", km: 58, angle: "Growth-corridor homes and semi-rural edges. Long Colorbond runs and rural-style entrance gates." },
  { slug: "lilydale", name: "Lilydale", postcode: "3140", council: "Yarra Ranges", region: "East & Yarra", km: 32, angle: "Gateway to the Yarra Ranges. Timber character, steel farm gates and bushfire-aware materials." },
  { slug: "wallan", name: "Wallan", postcode: "3756", council: "Mitchell", region: "Outer 100 km", km: 42, angle: "North of Whittlesea. Acreage fencing, Colorbond and automation on long rural driveways." },
  { slug: "geelong", name: "Geelong", postcode: "3220", council: "Greater Geelong", region: "Outer 100 km", km: 82, angle: "Within the 100 km radius from Bundoora. Larger residential and coastal jobs are assessed by project, then fabricated in Melbourne." },
  { slug: "mornington", name: "Mornington", postcode: "3931", council: "Mornington Peninsula", region: "Outer 100 km", km: 72, angle: "Peninsula weather, coastal hardware and holiday-home automation — quoted as a project within the 100 km service area." },
  { slug: "broadmeadows", name: "Broadmeadows", postcode: "3047", council: "Hume", region: "North-west & Hume", km: 14, angle: "Practical, durable paling and Colorbond with optional palisade where security is the brief." },
  { slug: "greenvale", name: "Greenvale", postcode: "3059", council: "Hume", region: "North-west & Hume", km: 18, angle: "Lakeside estates and larger lots. Automatic gates, Colorbond and pool fencing are common packages." },
  { slug: "warrandyte", name: "Warrandyte", postcode: "3113", council: "Manningham", region: "East & Yarra", km: 20, angle: "Bush blocks and BAL considerations. Steel, palisade and timber specified for fire and fall." },
];

export function getSuburb(slug: string) {
  return SUBURBS.find((s) => s.slug === slug);
}

export function suburbsByRegion() {
  const map = new Map<string, Suburb[]>();
  for (const region of REGIONS) map.set(region, []);
  for (const s of SUBURBS) {
    const list = map.get(s.region) ?? [];
    list.push(s);
    map.set(s.region, list);
  }
  return [...map.entries()].filter(([, list]) => list.length > 0);
}

export function nearbySuburbs(suburb: Suburb, n = 8) {
  return SUBURBS.filter((s) => s.slug !== suburb.slug)
    .sort((a, b) => Math.abs(a.km - suburb.km) - Math.abs(b.km - suburb.km) || a.name.localeCompare(b.name))
    .slice(0, n);
}

export const EXTRA_SUBURBS = [
  "Watsonia North", "Plenty", "Briar Hill", "St Helena", "Research", "Wattle Glen", "Kangaroo Ground",
  "Lower Plenty", "Eaglemont", "Alphington", "Fairfield", "Clifton Hill", "Abbotsford", "Parkville",
  "Flemington", "Kensington", "Ascot Vale", "Strathmore", "Airport West", "Tullamarine", "Keilor",
  "St Albans", "Sunshine", "Yarraville", "Altona", "Newport", "Hoppers Crossing", "Melton",
  "Caroline Springs", "Gisborne", "Kilmore", "Wollert", "Doncaster East", "Donvale", "Nunawading",
  "Blackburn", "Mitcham", "Wantirna", "Croydon", "Mooroolbark", "Healesville", "Mount Waverley",
  "Oakleigh", "Clayton", "Springvale", "Noble Park", "Keysborough", "Cheltenham", "Bentleigh",
  "Brighton", "Caulfield", "St Kilda", "South Yarra", "Prahran", "Malvern", "Camberwell",
  "Canterbury", "Surrey Hills", "Port Melbourne", "Southbank", "Docklands", "Melbourne CBD",
  "Cranbourne", "Narre Warren", "Mount Eliza", "Lara", "Corio", "Bacchus Marsh",
];
