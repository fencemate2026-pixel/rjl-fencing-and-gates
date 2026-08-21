export const SITE = {
  name: "RJL Fencing & Gates",
  legalName: "RJL Fencing Pty Ltd",
  shortName: "RJL",
  tagline: "Residential fencing, gates and automation — built in Melbourne.",
  description:
    "Family-owned residential fencing, custom steel gates, Colorbond, pool fencing, retaining walls and gate automation within 100 km of Bundoora. 10-year warranty. Hall of Fame inductee Chris Alebakis.",
  origin: "https://www.rjlfencingandgates.com.au",
  phone: "0412 467 840",
  phoneTel: "+61412467840",
  email: "info@rjlfencing.com.au",
  abn: "82 159 036 781",
  warranty: "10-year warranty on custom steel gates and panels",
  liability: "$20 million public liability",
  founded: 1990,
  experienceYears: 35,
  address: {
    street: "13 Oxley Avenue",
    suburb: "Bundoora",
    region: "VIC",
    postcode: "3083",
    country: "AU",
    full: "13 Oxley Avenue, Bundoora VIC 3083",
  },
  geo: {
    latitude: -37.6994,
    longitude: 145.0598,
  },
  radiusKm: 100,
  hours: [
    { days: "Monday – Friday", hours: "7:00 am – 5:00 pm" },
    { days: "Saturday", hours: "8:00 am – 1:00 pm" },
    { days: "Sunday", hours: "Emergency call-outs only" },
  ],
  openingHoursSpec: [
    "Mo-Fr 07:00-17:00",
    "Sa 08:00-13:00",
  ],
  social: {
    instagram: "https://www.instagram.com/rjlfencing/",
    facebook: "https://www.facebook.com/Alltypesoffencingandgates",
  },
  commercial: {
    name: "RJL Commercial Group",
    url: "https://www.rjlcommercialgroup.com",
    phone: "0400 101 132",
  },
  mapEmbed:
    "https://maps.google.com/maps?q=13%20Oxley%20Avenue%20Bundoora%20VIC%203083&z=15&output=embed",
  mapLink:
    "https://www.google.com/maps/search/?api=1&query=13%20Oxley%20Avenue%2C%20Bundoora%20VIC%203083",
} as const;

export const NAV = [
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Timber & Colorbond", href: "/services/timber-colorbond" },
      { label: "Steel fencing & gates", href: "/services/steel-fencing-gates" },
      { label: "Automatic gates", href: "/services/automatic-gates" },
      { label: "Pool fencing", href: "/services/pool-fencing" },
      { label: "Retaining walls", href: "/services/retaining-walls" },
      { label: "Palisade fencing", href: "/services/palisade-fencing" },
      { label: "Gate automation", href: "/services/gate-automation" },
      { label: "Boom gates", href: "/services/boom-gates" },
    ],
  },
  { label: "Areas", href: "/service-areas" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
] as const;

export const TRUST_ITEMS = [
  "Melbourne-made steelwork",
  "Licensed & insured",
  "Family-led since 1990",
  "10-year structural warranty",
] as const;

export const STATS = [
  { value: "35+", label: "Years in the trade" },
  { value: "100 km", label: "From Bundoora" },
  { value: "1000+", label: "Homes completed" },
  { value: "$20m", label: "Public liability" },
] as const;

export const AWARDS = [
  {
    year: "Hall of Fame",
    title: "Chris Alebakis — Industry Legend",
    copy: "Owner of RJL Fencing Pty Ltd, inducted into the Australian Fencing Awards Hall of Fame for outstanding contribution to the fencing industry.",
  },
  {
    year: "2025",
    title: "Australian FENCING Awards Finalist",
    copy: "Recognised as a finalist in the Security/Safety Fencing category at the 2025 Australian FENCING Awards.",
  },
  {
    year: "2023",
    title: "Australian Fencing Awards Winner",
    copy: "Proud winner of the Australian Fencing Awards — a first-time entry that recognised decades of trade leadership.",
  },
] as const;

export const PROCESS = [
  {
    step: "01",
    title: "Assess",
    copy: "We walk the boundary, check levels, soil, access and council rules, then confirm a fixed scope before any steel is cut.",
  },
  {
    step: "02",
    title: "Design",
    copy: "Custom gates and panels are drawn to your street frontage — colour, infill, automation and openings resolved as one package.",
  },
  {
    step: "03",
    title: "Fabricate",
    copy: "Steelwork is made in our Melbourne workshop from Australian BlueScope steel and powder-coated to the colour you choose.",
  },
  {
    step: "04",
    title: "Install",
    copy: "Licensed installers set posts, hang gates, commission motors and leave the site clean — with a 10-year warranty on custom steel.",
  },
] as const;

export const REVIEWS = [
  {
    quote:
      "Jarrod and his team did an incredible job from start to finish. Their professionalism onsite was second to none.",
    name: "Google review",
    meta: "5.0 · Residential client",
  },
  {
    quote:
      "RJL completed a boom gate installation at the Mildura Workers Club. Anybody looking for fencing including traffic management gates should definitely give Jarrod a call.",
    name: "Steve Banks",
    meta: "Chief Executive Officer, Mildura Workers Club",
  },
  {
    quote:
      "A family business that still turns up on site. The steelwork is Melbourne-made, the warranty is real, and the fence looks exactly as quoted.",
    name: "Homeowner",
    meta: "Bundoora · Custom steel & automation",
  },
] as const;

export const CLIENTS = [
  "Victoria Police",
  "Telstra",
  "Melbourne Airport",
  "La Trobe University",
  "Hertz",
  "Department of Housing",
] as const;
