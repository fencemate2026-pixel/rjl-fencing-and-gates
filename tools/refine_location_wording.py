"""Keep Bundoora coverage discreet rather than repeating it in promotional copy."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPLACEMENTS = {
    'Residential Fencing Contractors &amp; Auto Driveway Gates Bundoora | RJL': 'Residential Fencing &amp; Automatic Driveway Gates | RJL',
    'Fencing contractors · Bundoora &amp; Melbourne': 'Residential fencing &amp; gate specialists',
    'built for Bundoora homes.': 'designed around your home.',
    'Serving Bundoora. Planned for each property.': 'Local expertise. Planned for each property.',
    '>Fencing in Bundoora</a>': '>Explore residential fencing</a>',
    'Should I choose timber or Colorbond fencing in Bundoora?': 'Should I choose timber or Colorbond fencing for my home?',
    'Custom steel fencing &amp; gates for Bundoora homes': 'Custom steel fencing &amp; gates for your home',
    'Custom steel fencing & gates for Bundoora homes': 'Custom steel fencing & gates for your home',
    'Concrete sleeper retaining walls from Bundoora across Melbourne’s north, north-east and north-west': 'Concrete sleeper retaining walls, planned around your property',
    'Residential gate automation · Bundoora &amp; Melbourne': 'Residential gate automation · Melbourne',
    'Pool &amp; glass fencing · Bundoora &amp; Melbourne': 'Pool &amp; glass fencing · Melbourne',
    'Custom driveway gates · Bundoora &amp; Melbourne': 'Custom driveway gates · Melbourne',
    'Boundary fencing · Bundoora &amp; Melbourne': 'Boundary fencing · Melbourne',
    'Bundoora boundary fencing': 'Residential boundary fencing',
    'Bundoora fencing, gates &amp; retaining': 'Bundoora · Residential services',
    'Residential fencing and gates in Bundoora': 'Residential fencing and gates, tailored to your property',
    'Your Bundoora fencing contractor': 'Your local fencing specialist',
    'Bundoora property checks': 'Property checks before work begins',
    'Bundoora fencing FAQ': 'Common fencing questions',
    'Request a Bundoora residential fencing quote.': 'Request a residential fencing quote.',
    'Does RJL install sliding and double gates in Bundoora?': 'Does RJL install sliding and double gates?',
    'Does RJL install frameless glass pool fencing in Bundoora?': 'Does RJL install frameless glass pool fencing?',
    'Does RJL build concrete sleeper retaining walls in Bundoora?': 'Does RJL build concrete sleeper retaining walls?',
    'Does RJL make custom steel fencing and gates in Bundoora?': 'Does RJL make custom steel fencing and gates?',
    'Does RJL replace old timber fences in Bundoora?': 'Does RJL replace old timber fences?',
    'What residential fencing does RJL install in Bundoora?': 'What residential fencing does RJL install?',
    'Does RJL install automatic driveway gates in Bundoora?': 'Does RJL install automatic driveway gates?',
    'How do I request a fencing quote in Bundoora?': 'How do I request a fencing quote?',
    'Explore residential gate automation in Bundoora': 'Explore residential gate automation',
    'Explore fencing in Bundoora': 'Explore residential fencing',
    'See all residential fencing services in Bundoora': 'See all residential fencing services',
    'across Bundoora and Melbourne’s northern suburbs': 'across Melbourne’s northern suburbs',
    'across Bundoora and Melbourne’s north': 'across Melbourne’s north',
    'for Bundoora and Melbourne homes': 'for Melbourne homes',
    'for homes in Bundoora and across Melbourne’s north, north-east and north-west': 'for homes across Melbourne’s north, north-east and north-west',
    'from RJL in Bundoora and across Melbourne’s north, north-east and north-west': 'from RJL across Melbourne’s north, north-east and north-west',
    'Family-led fence, gate and retaining-wall solutions from Bundoora,': 'Family-led fence, gate and retaining-wall solutions,',
    'Family-led boundary fencing, pool barriers and custom gates from Bundoora,': 'Family-led boundary fencing, pool barriers and custom gates,',
    'Request a Fencing Quote in Bundoora | RJL Fencing': 'Request a Fencing &amp; Gate Quote | RJL Fencing',
    'Fencing Questions Bundoora | Residential FAQ | RJL Fencing': 'Residential Fencing Questions | FAQ | RJL Fencing',
    'Gate Automation Bundoora | Automatic Driveway Gates | RJL': 'Gate Automation | Automatic Driveway Gates | RJL',
    'Automatic Driveway Gates Bundoora | RJL': 'Automatic Driveway Gates | RJL',
    'Concrete Sleeper Retaining Walls Bundoora | RJL Fencing': 'Concrete Sleeper Retaining Walls | RJL Fencing',
    'Concrete Sleeper Retaining Walls Bundoora | RJL': 'Concrete Sleeper Retaining Walls | RJL',
    'Steel Fencing &amp; Gates Bundoora | Custom Made | RJL Fencing': 'Custom Steel Fencing &amp; Gates | RJL Fencing',
    'Fencing Bundoora | Residential Fences &amp; Gates | RJL': 'Residential Fencing &amp; Gates | RJL',
}


def refine_location_wording(site):
    changed = []
    for page in sorted(site.rglob('*.html')):
        if page.name.startswith('__'):
            continue
        before = page.read_text()
        after = before
        for old, new in REPLACEMENTS.items():
            after = after.replace(old, new)
        if after != before:
            page.write_text(after)
            changed.append(str(page.relative_to(site)))
    print(f'Refined location wording on {len(changed)} pages.')
    return changed


if __name__ == '__main__':
    refine_location_wording(ROOT / 'site')
