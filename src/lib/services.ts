export type Service = {
  slug: string;
  nav: string;
  title: string;
  h1: string;
  em: string;
  eyebrow: string;
  excerpt: string;
  description: string;
  keywords: string;
  image: string;
  imageAlt: string;
  bullets: string[];
  sections: { heading: string; copy: string; points?: string[] }[];
};

export const SERVICES: Service[] = [
  {
    slug: "timber-colorbond",
    nav: "Timber & Colorbond",
    title: "Timber & Colorbond Fencing Bundoora | Free Quotes | RJL Fencing",
    h1: "Timber paling and Colorbond fencing",
    em: "built for Melbourne weather.",
    eyebrow: "Boundary fencing · Bundoora",
    excerpt:
      "Classic timber paling and modern Colorbond steel fencing. Durable, low maintenance, wide colour range. 10-year workmanship warranty.",
    description:
      "Timber paling and Colorbond fencing specialists in Bundoora and within 100 km. Treated pine, 30+ Colorbond colours, free site quotes. Call 0412 467 840.",
    keywords:
      "timber fencing Bundoora, Colorbond fencing Bundoora, paling fence Melbourne, Colorbond fence installation northern suburbs",
    image: "/images/service-timber.webp",
    imageAlt: "Modern Melbourne home with a dark slat boundary fence and automatic driveway gate",
    bullets: [
      "Premium treated pine — H4 and H3 treatments",
      "Traditional paling, picket or slat styles",
      "Custom heights from 1.2 m to 2.4 m",
      "30+ Colorbond colours, never needs painting",
      "Termite-proof, fire-resistant steel option",
      "10-year workmanship warranty",
    ],
    sections: [
      {
        heading: "Timber fencing",
        copy: "Timber fencing is the classic choice for Melbourne homes — natural beauty, privacy and versatility. Our paling fences use premium treated pine specified for Australian weather, then stained or painted to sit with the house rather than against it.",
        points: [
          "Premium treated pine — H4 and H3 treatments available",
          "Traditional paling, picket or slat styles",
          "Custom heights from 1.2 m to 2.4 m",
          "Stain or paint to match the home",
          "10-year warranty on materials and workmanship",
        ],
      },
      {
        heading: "Colorbond steel fencing",
        copy: "Colorbond is the low-maintenance answer for modern homes. Australian steel that resists rust, termites and fire, with full privacy and a colour range that tracks current Melbourne streetscapes.",
        points: [
          "30+ modern colours",
          "Termite proof, fire resistant and rust resistant",
          "Never needs painting",
          "Full privacy with no gaps",
          "15+ year manufacturer warranty against corrosion",
        ],
      },
      {
        heading: "Why homeowners choose RJL",
        copy: "We are a family-owned fencing company working from Bundoora, not a sales desk. Quotes are free, installers are licensed, and every job is scoped on site so heights, falls and neighbour boundaries are resolved before we start.",
      },
    ],
  },
  {
    slug: "steel-fencing-gates",
    nav: "Steel fencing & gates",
    title: "Steel Fencing & Gates Bundoora | Custom Steel, Sliding & Swing Gates | RJL",
    h1: "Custom steel fencing and gates",
    em: "handcrafted in Melbourne.",
    eyebrow: "Architectural steel · 10-year warranty",
    excerpt:
      "Designer steel fencing, tubular gates and architectural metalwork. Powder coated any colour. Australian BlueScope steel, 10-year warranty.",
    description:
      "Custom steel fencing and automatic gates in Bundoora. Tubular, slat, picket, blade, laser-cut and wrought iron. Powder coated. 10-year warranty. Call 0412 467 840.",
    keywords:
      "steel fencing Bundoora, custom steel gates Melbourne, tubular fence, slat screen fence, laser cut gate Bundoora",
    image: "/images/service-steel.webp",
    imageAlt: "Custom powder-coated steel sliding gate fabricated by RJL",
    bullets: [
      "100% Australian-made using BlueScope steel",
      "Custom fabrication to your exact specifications",
      "Powder coating in any RAL or Dulux colour",
      "10-year warranty on custom steel gates and panels",
      "Fully licensed, insured and VBA registered",
    ],
    sections: [
      {
        heading: "Premium Australian steel fencing",
        copy: "Steel fencing balances strength, security and style. Whether you need a sleek modern fence, a classic picket, or a fully automated gate, RJL fabricates custom work from premium Australian BlueScope steel in our local workshop — powder-coated to your colour and installed by our own team.",
      },
      {
        heading: "Why steel",
        copy: "Unlike timber, steel will not rot, warp or be attacked by termites. Unlike Colorbond sheet, steel opens unlimited customisation — laser-cut designs, decorative spears, blade screens and matching pedestrian gates.",
        points: [
          "Termite proof, fire resistant and rot proof",
          "Never needs painting or staining",
          "Withstands Melbourne weather",
          "Lifts street appeal and property value",
          "Fully recyclable",
        ],
      },
      {
        heading: "Steel fencing styles",
        copy: "Tubular, slat screen, picket, blade and louvre, laser-cut feature panels and wrought iron. Front boundaries, pool enclosures and side returns can all share one powder-coated colour so the street frontage reads as a single piece of work.",
        points: [
          "Tubular steel — horizontal or vertical rails, spear or flat tops",
          "Slat screens — privacy with architectural lines and airflow",
          "Steel pickets — cottage charm that will never rot",
          "Blade and louvre — award-winning privacy with hidden fixings",
          "Laser-cut — house numbers, patterns and feature panels",
          "Wrought iron — scrolls and finials for period homes",
        ],
      },
    ],
  },
  {
    slug: "automatic-gates",
    nav: "Automatic gates",
    title: "Automatic Gates Bundoora | Sliding & Swing | CAME & Beninca | RJL",
    h1: "Automatic sliding and swing gates",
    em: "for everyday residential access.",
    eyebrow: "Driveway automation · CAME & Beninca",
    excerpt:
      "Sliding and swing gates with CAME and Beninca automation. Remote, keypad and smartphone control. Safety sensors and battery backup.",
    description:
      "Automatic driveway gates in Bundoora and within 100 km. Sliding and swing, CAME and Beninca motors, smartphone control, safety sensors. Free quote. 0412 467 840.",
    keywords:
      "automatic gates Bundoora, sliding gate Melbourne, swing gate automation, CAME gates, Beninca installer northern suburbs",
    image: "/images/service-ogscene.webp",
    imageAlt: "Automated steel sliding gate on a Melbourne residential frontage at dusk",
    bullets: [
      "Sliding gates for narrow driveways",
      "Swing gates for wide, classic frontages",
      "Remote, keypad and smartphone app",
      "Safety sensors and obstacle detection",
      "Battery backup for power outages",
      "Matching pedestrian gates",
    ],
    sections: [
      {
        heading: "Gates that match the fence",
        copy: "Automatic gates are increasingly the first thing visitors see. We design the gate with the fence — slat infill, picket, laser-cut or solid privacy — so the driveway reads as architecture, not an add-on.",
      },
      {
        heading: "CAME and Beninca automation",
        copy: "We install CAME and Beninca systems, two of the most trusted names in Australian gate motors. Operators are sized to the leaf weight and duty cycle, then commissioned with safety edges, photocells and a documented handover.",
        points: [
          "CAME BX, BK and BY series motors",
          "Beninca BULL and DU.IT heavy-duty operators",
          "RFID readers and PIN keypads",
          "Video intercom and smartphone app control",
          "3-year manufacturer warranty on motors",
        ],
      },
      {
        heading: "Custom gate designs",
        copy: "Slat infill sliding gates for contemporary homes, picket swing gates for heritage streets, laser-cut feature gates with house numbers, solid privacy panels for side access, and matching pedestrian leaves.",
      },
    ],
  },
  {
    slug: "pool-fencing",
    nav: "Pool fencing",
    title: "Pool Fencing Bundoora | AS 1926.1 Compliant | Glass, Batten & Steel | RJL",
    h1: "AS 1926.1 compliant pool fencing",
    em: "that still looks like design.",
    eyebrow: "Pool safety barriers · VBA registered",
    excerpt:
      "Compliant glass, Colorbond, aluminium, perforated metal and curved batten pool fencing. AS 1926 certified. Form 23 certificates available.",
    description:
      "AS 1926.1 compliant pool fencing in Bundoora. Frameless glass, aluminium, steel, perforated metal and curved batten. VBA registered. Free compliance advice. 0412 467 840.",
    keywords:
      "pool fencing Bundoora, AS 1926.1 pool fence Melbourne, glass pool fence, curved batten pool fencing, VBA pool barrier",
    image: "/images/service-pool.webp",
    imageAlt: "Compliant decorative pool fencing installed by RJL",
    bullets: [
      "AS 1926.1:2012 and 2024 updates",
      "VBA registered installers",
      "Self-closing, self-latching gates",
      "Form 23 compliance certificates",
      "4-year inspection cycle support",
      "10-year warranty on custom steel and aluminium",
    ],
    sections: [
      {
        heading: "Safety is not optional",
        copy: "In Victoria, every pool or spa holding more than 300 mm of water must have a compliant safety barrier. RJL designs, supplies and installs fences that meet AS 1926.1 while still sitting with the garden, the house and the way you actually use the backyard.",
      },
      {
        heading: "Melbourne pool fence regulations",
        copy: "Since 1 December 2019, pool and spa owners in Victoria must register their pool with council and have it inspected every four years. We help you pass that inspection the first time.",
        points: [
          "Minimum fence height 1.2 m from finished ground level",
          "No gaps larger than 100 mm",
          "Gates self-closing and self-latching from any position",
          "Non-climbable zone of 900 mm",
          "CPR signage visible from the pool area",
          "Latch release 1500 mm or shielded",
        ],
      },
      {
        heading: "Styles",
        copy: "Frameless 12 mm toughened glass, powder-coated aluminium slat or picket, perforated metal designer panels, award-nominated curved batten, steel and wrought iron, and removable mesh for young families.",
      },
    ],
  },
  {
    slug: "retaining-walls",
    nav: "Retaining walls",
    title: "Concrete Retaining Walls Bundoora | Engineering & Earthmoving | RJL",
    h1: "Concrete sleeper retaining walls",
    em: "with in-house earthmoving.",
    eyebrow: "Structural walls · Permits managed",
    excerpt:
      "Timber, concrete sleeper and brick retaining walls. In-house excavators, structural drawings, council permits. Engineered for Melbourne clay.",
    description:
      "Concrete sleeper retaining walls in Bundoora. In-house earthmoving, structural engineering, council permits, 50 MPa sleepers, 10-year warranty. Call 0412 467 840.",
    keywords:
      "retaining walls Bundoora, concrete sleeper wall Melbourne, retaining wall permits Victoria, earthmoving fencing company",
    image: "/images/service-retaining.webp",
    imageAlt: "Engineered concrete sleeper retaining wall with fencing above",
    bullets: [
      "In-house excavators and bobcats — no subcontractor delays",
      "Structural engineering drawings and certification",
      "Council permit applications managed",
      "50 MPa reinforced concrete sleepers",
      "Ag-pipe, gravel and geofabric drainage",
      "10-year structural warranty",
    ],
    sections: [
      {
        heading: "Your complete retaining wall partner",
        copy: "Unlike most fencing companies, RJL owns excavators, bobcats and compactors. We take a wall from excavation to finished cap without a chain of subcontractors — faster, cleaner, and one warranty.",
      },
      {
        heading: "Why concrete sleepers",
        copy: "Melbourne’s wet winters, dry summers and reactive clay punish timber. 50 MPa reinforced sleepers are termite-proof, fire-resistant and built for 30+ years. Walls can be capped with Colorbond or aluminium fencing in the same visit.",
      },
      {
        heading: "When you need a permit",
        copy: "Walls under 1 m often need no permit if they do not support a structure and sit more than 1.5 m from a boundary. From 1 m, building permits and engineering typically apply. We prepare drawings, lodge applications and meet the building surveyor so you are not navigating Victorian regs alone.",
      },
    ],
  },
  {
    slug: "palisade-fencing",
    nav: "Palisade fencing",
    title: "Palisade Fencing Bundoora | High-Security Residential | RJL",
    h1: "Palisade fencing for homes",
    em: "that need a harder boundary.",
    eyebrow: "Security palisade · Powder coated",
    excerpt:
      "High-security palisade fencing for added property protection. Powder coated to any colour. Ideal for acreage, corner blocks and rear boundaries.",
    description:
      "Residential palisade fencing in Bundoora and within 100 km. Steel palisade powder-coated any colour, security tops, matching gates. Free quote. 0412 467 840.",
    keywords:
      "palisade fencing Bundoora, security fence Melbourne residential, palisade gate, high security fence northern suburbs",
    image: "/images/service-palisade.webp",
    imageAlt: "Powder-coated steel palisade fencing for property protection",
    bullets: [
      "Steel palisade with triple-point or rounded tops",
      "Powder coated to any colour",
      "Matching palisade gates, manual or automated",
      "Difficult to climb, cut or scale",
      "Suitable for acreage, rear lanes and corner blocks",
    ],
    sections: [
      {
        heading: "Security that still looks considered",
        copy: "Palisade is the residential answer when a paling fence is not enough — rear laneways, corner blocks, acreage and homes that have already had an intrusion. We powder-coat palisade so it sits with the house rather than looking industrial.",
      },
      {
        heading: "Specified, not generic",
        copy: "Pale heights, pale sections, post centres and topping are set to the risk, not a catalogue default. Gates can be automated with the same CAME or Beninca hardware we use on architectural steel.",
      },
    ],
  },
  {
    slug: "gate-automation",
    nav: "Gate automation",
    title: "Gate Automation Bundoora | Motorise Existing Gates | RJL",
    h1: "Motorise the gates you already have",
    em: "or commission a new operator.",
    eyebrow: "Retrofit automation · Safety first",
    excerpt:
      "Motorise existing swing or sliding gates. Safety sensors, battery backup and professional installation. CAME and Beninca certified.",
    description:
      "Gate automation in Bundoora. Retrofit motors to existing gates, safety sensors, battery backup, smartphone control. CAME and Beninca. Call 0412 467 840.",
    keywords:
      "gate automation Bundoora, motorise existing gate Melbourne, gate motor installation, photocells, backup battery gate",
    image: "/images/service-automation.webp",
    imageAlt: "Gate automation motor and safety equipment installed by RJL",
    bullets: [
      "Retrofit to sound existing gates",
      "New operators sized to leaf weight",
      "Photocells, safety edges and obstacle detection",
      "Battery backup and solar options",
      "Intercom, keypad and app control",
    ],
    sections: [
      {
        heading: "If the gate is sound, we can automate it",
        copy: "Many Melbourne homes already have a well-made swing or sliding gate that is opened by hand. We assess hinges, tracks, stops and clearances, then specify a motor that will not twist a leaf it was never designed to move.",
      },
      {
        heading: "Safety is part of the install",
        copy: "Automation without photocells and edges is not a finished job. We commission to manufacturer settings, explain the manual release, and leave you with a system that is safe around children, pets and sloping driveways.",
      },
    ],
  },
  {
    slug: "boom-gates",
    nav: "Boom gates",
    title: "Residential & Strata Boom Gates Bundoora | RJL Fencing",
    h1: "Boom gates for driveways",
    em: "and residential car parks.",
    eyebrow: "Strata & townhouse access",
    excerpt:
      "Residential and strata boom gates for driveways and car parks. Solar power options, access control and 10-year structural support.",
    description:
      "Residential and strata boom gates in Bundoora and within 100 km. Townhouse, apartment and driveway barriers with access control. Call 0412 467 840.",
    keywords:
      "boom gates Bundoora, residential boom gate Melbourne, strata car park barrier, solar boom gate",
    image: "/images/project-boom.webp",
    imageAlt: "Boom gate installation for a residential and strata driveway",
    bullets: [
      "Strata and townhouse car parks",
      "Single-home driveway barriers where needed",
      "Loop detectors, remotes and intercom",
      "Solar power options",
      "Servicing and 24/7 call-out via the RJL group",
    ],
    sections: [
      {
        heading: "Control the car park without a guard",
        copy: "Boom gates suit townhouse developments, small strata schemes and long rural driveways where a full sliding gate is the wrong tool. We size the arm, specify loops and access control, and coordinate with owners’ corporations when required.",
      },
      {
        heading: "One group, residential and commercial",
        copy: "Larger commercial boom and traffic-management gates are delivered by RJL Commercial Group. Residential and small-strata work stays with this team — same fabrication standard, same family.",
      },
    ],
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}
