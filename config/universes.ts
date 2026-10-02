/**
 * The six universes, straight from the website specification (section 6).
 *
 * Kickstarter figures come from section 8, which the spec names as the single
 * source of truth — older numbers elsewhere in the notes are deliberately ignored.
 * [PLACEHOLDER] marks content the spec still lists as missing.
 */

export type Character = {
  name: string;
  /** Codename printed above the bio, where the universe uses one */
  alias?: string;
  copy: string;
  power?: string;
  role: string;
  image: string;
};

export type Issue = {
  title: string;
  raised?: string;
  backers?: number;
  goal?: string;
  /** Percent of goal, e.g. 545 */
  funded?: number;
  ran?: string;
  /** Shown when there are no figures yet */
  status?: string;
};

export type CtaButton = { label: string; href: string };

export type Universe = {
  slug: string;
  name: string;
  /** Sits above the name, e.g. "The Kat Chronicle" */
  overline?: string;
  /** Short label for the nav and cards */
  shortName: string;
  genre: string;
  hook: string;
  /** Section 6 palette. `ink` is the page ground, `paper` the text on it. */
  palette: { ink: string; paper: string; accent: string; accentSoft: string };
  /** Which display face from `fonts/universes.ts` this page sets */
  display: 'rye' | 'bebas' | 'cinzel' | 'rajdhani' | 'anton' | 'garamond';
  /** Spec's design-direction notes, surfaced in the page as production notes */
  direction: { type: string; motion: string; cursor: string; reveal: string; gallery: string };
  hero: { poster: string; videoNote: string };
  story: { headline: string; text: string; more?: string };
  characters: Character[];
  gallery: { title: string; images: { src: string; caption: string }[]; note?: string };
  campaign: Issue[];
  face: { name: string; tag: string; bio: string; href: string; image: string } | null;
  cta: { headline: string; buttons: CtaButton[] };
  signup: { line: string };
};

/* Placeholder art until the real assets land. Seeded so each slot stays put between reloads. */
const art = (seed: string, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const universes: Universe[] = [
  {
    slug: 'venom-vixens',
    name: 'Venom Vixens',
    shortName: 'Venom Vixens',
    genre: 'Wild west',
    hook: 'Five outlaws. Cursed wine. New powers.',
    palette: { ink: '#2A1810', paper: '#D9B382', accent: '#B5482A', accentSoft: '#E0A93B' },
    display: 'rye',
    direction: {
      type: 'Display: Rye or similar weathered wood-type. Body: Alegreya Sans. Wanted-poster headlines with torn paper edges.',
      motion: 'Scroll travels along a train track from the heist to Dusthaven. Dust drifts across the frame. Sections shift dusk-to-night.',
      cursor: 'Bullet-hole cursor that leaves a fading mark on click. Optional: wind, distant train, spurs.',
      reveal:
        'A "Widow\'s Kiss" pour: purple-green liquid fills her silhouette, her animal markings appear, then the full artwork takes over.',
      gallery: 'Wanted posters on a saloon wall. Click peels the poster forward to full screen; arrows slide to the next.',
    },
    hero: {
      poster: art('noc-venom-hero', 1920, 1080),
      videoNote: 'Video → story snippets → atmosphere → the five women.',
    },
    story: {
      headline: 'Cursed & Savage',
      text: 'In the lawless town of Dusthaven, five outlaw women set their sights on a gold train carrying enough treasure to change their lives. The heist goes to plan until they find a mysterious bottle among the loot: Widow\'s Kiss. One drink later, everything changes. By sunrise, Jess, Ling, Mandy, Tasha and Frankie have awakened to strange new powers and bodies they barely recognize. And somewhere in Dusthaven, the man they came to rob is about to find out what they\'ve become.',
      more: 'But the transformation is only the beginning. With old scores to settle and a dangerous secret now running through their veins, the five women are about to discover that their biggest score may have given them something far more powerful than gold.',
    },
    characters: [
      {
        name: 'Jessica "Jess" Malone',
        alias: 'Viperess',
        copy: "The woman who calls the shots. Cool-headed and always three moves ahead, Jess knows when to wait and when to strike. She doesn't chase her prey. She lets it come to her. With Widow's Kiss in her veins, that patience becomes something far more dangerous.",
        power: 'Venomous bite',
        role: 'Leader',
        image: art('noc-venom-jess', 900, 1200),
      },
      {
        name: 'Amanda "Mandy" Reed',
        alias: 'Stingra',
        copy: "Some women pick fights. Mandy lives for them. Hot-headed, reckless, and always ready to throw the first punch, Mandy never backs down from a fight. She runs on adrenaline and loves the chaos. With Widow's Kiss in her veins, she now has a sting that can stop anyone in their tracks.",
        power: 'Paralysing sting',
        role: 'Enforcer',
        image: art('noc-venom-mandy', 900, 1200),
      },
      {
        name: 'Wei Ling Zhao',
        alias: 'Arachne',
        copy: "The quiet one is usually the dangerous one. Ling doesn't waste words or make careless moves. She watches, waits, and lets her targets walk straight into the trap. Patient and precise, she's the one who sees the move coming before anyone else does. With Widow's Kiss in her veins, her silk and webs make sure there's nowhere left to run.",
        power: 'Web & silk manipulation',
        role: 'Strategist',
        image: art('noc-venom-ling', 900, 1200),
      },
      {
        name: 'Latasha "Tasha" Washington',
        alias: 'Queen Bee',
        copy: "She doesn't enter a room. She owns it. Confident, commanding, and impossible to ignore, Tasha naturally takes control wherever she goes. She doesn't need to raise her voice to be heard. One look is enough. And when the Queen calls, the swarm answers.",
        power: 'Venomous stinger & swarm control',
        role: 'The Queen',
        image: art('noc-venom-tasha', 900, 1200),
      },
      {
        name: 'Francesca "Frankie" Bianchi',
        alias: 'Dracona',
        copy: "Subtle was never really her thing. Rough, rowdy, and completely unfiltered, Frankie is the muscle of the Vixens. She'd rather throw a punch than make a plan, and she's never been afraid to get her hands dirty. With Widow's Kiss in her veins, those hands just got a whole lot more dangerous.",
        power: 'Venomous bite & claws',
        role: 'Brute force',
        image: art('noc-venom-frankie', 900, 1200),
      },
    ],
    gallery: {
      title: 'A Taste of What\'s Inside',
      note: 'Covers first, then interior pages, so the wall reads like a story. Previews stay non-explicit.',
      images: [
        { src: art('noc-venom-g1'), caption: 'Cover · Issue #1' },
        { src: art('noc-venom-g2'), caption: 'Variant cover' },
        { src: art('noc-venom-g3'), caption: 'The gold train' },
        { src: art('noc-venom-g4'), caption: "Widow's Kiss" },
        { src: art('noc-venom-g5'), caption: 'Dusthaven' },
        { src: art('noc-venom-g6'), caption: 'Interior page' },
        { src: art('noc-venom-g7'), caption: 'Interior page' },
        { src: art('noc-venom-g8'), caption: 'Black and white' },
      ],
    },
    campaign: [
      {
        title: 'Venom Vixens #1',
        raised: '$10,895',
        backers: 287,
        goal: '$2,000',
        funded: 545,
        ran: 'Aug 14 – Sep 14, 2026',
      },
      { title: 'Venom Vixens #2', status: '[PLACEHOLDER] title, synopsis and status' },
    ],
    face: null,
    cta: {
      headline: 'They took the gold. Now take home the story.',
      buttons: [{ label: 'Get Venom Vixens', href: '#' }],
    },
    signup: { line: 'Ride with us. Get the next drop first.' },
  },

  {
    slug: 'agent-scarlett',
    name: 'Agent Scarlett',
    shortName: 'Agent Scarlett',
    genre: 'Spy',
    hook: 'Infiltrating a facility hiding tech that could control nations.',
    palette: { ink: '#0B0B0F', paper: '#E9E6DF', accent: '#C4122F', accentSoft: '#8A8F98' },
    display: 'bebas',
    direction: {
      type: 'Display: Bebas Neue or Oswald, stencil-style. Body and labels: IBM Plex Mono (typewriter dossier).',
      motion: 'Hard cuts and laser-grid wipes. Sections are case-file tabs. Text partly redacted with black bars that lift on hover.',
      cursor: 'Round spotlight that reveals redacted text. Optional: low hum, shutter clicks.',
      reveal:
        'A dossier flips open, redaction bars slide away, the agent steps into a doorway of light, and a red DECLASSIFIED stamp lands beside the name.',
      gallery: 'Wall of surveillance monitors. Click a feed to zoom into the full artwork with scanlines; arrows switch cameras.',
    },
    hero: {
      poster: art('noc-scarlett-hero', 1920, 1080),
      videoNote: 'Tech-facility infiltration, spy-thriller pacing.',
    },
    story: {
      headline: 'Where seduction is the sharpest weapon',
      text: 'Agent Scarlett infiltrates a secret tech facility hiding technology that could control nations. Step into a universe of danger, desire, secrets and unexpected alliances. Follow characters with their own agendas as they navigate worlds where nothing is ever quite what it seems. The deeper you go, the more there is to uncover.',
    },
    characters: [
      {
        name: 'Agent Scarlett',
        copy: 'The central operative of Honey Trap. A seductive and highly capable agent who uses charm, intelligence and deception as weapons.',
        role: 'Undercover agent',
        image: art('noc-scarlett-c1', 900, 1200),
      },
      {
        name: 'Kat',
        copy: 'A higher-ranking operative within the same world. Her experience and position place her above Scarlett in the agency hierarchy.',
        role: 'Senior undercover agent',
        image: art('noc-scarlett-c2', 900, 1200),
      },
      {
        name: '[PLACEHOLDER] name',
        alias: 'Feline companion',
        copy: "Scarlett's feline companion, but with a deeper identity and presence within the story.",
        role: '[PLACEHOLDER] role',
        image: art('noc-scarlett-c3', 900, 1200),
      },
      {
        name: 'Dr. Aria Chen',
        copy: "A doctor whose involvement connects her to the events and larger mystery surrounding Scarlett's mission.",
        role: 'Doctor / scientist',
        image: art('noc-scarlett-c4', 900, 1200),
      },
    ],
    gallery: {
      title: 'Case Files 01–05',
      images: [
        { src: art('noc-scarlett-g1'), caption: 'Rooftop surveillance' },
        { src: art('noc-scarlett-g2'), caption: 'Pop-art gun close-up' },
        { src: art('noc-scarlett-g3'), caption: 'Tank sequence' },
        { src: art('noc-scarlett-g4'), caption: 'Red-costume portrait' },
        { src: art('noc-scarlett-g5'), caption: 'Green containment chamber' },
      ],
    },
    campaign: [
      {
        title: 'Agent Scarlett: Honey Trap #1',
        raised: '$15,648',
        backers: 286,
        goal: '$2,000',
        funded: 782,
        ran: 'Jun 18 – Jul 18, 2026',
      },
    ],
    face: {
      name: 'Kat Marie',
      tag: 'Collaborator',
      bio: '[PLACEHOLDER] 2–3 sentence bio, pending Kat Marie\'s approval.',
      href: '#',
      image: art('noc-scarlett-face', 1000, 1250),
    },
    cta: {
      headline: "The mission doesn't end here. Get closer to Agent Scarlett and own a piece of the story.",
      buttons: [{ label: 'Get Agent Scarlett', href: '#' }],
    },
    signup: { line: 'Get the next briefing.' },
  },

  {
    slug: 'silk-sting',
    name: 'The Silk Sting',
    overline: 'The Kat Chronicle',
    shortName: 'Silk Sting',
    genre: 'Spy / thriller',
    hook: "She let them take her. Now she's Cargo #07.",
    palette: { ink: '#14091A', paper: '#E8D9C4', accent: '#C9A227', accentSoft: '#6B1E3F' },
    display: 'cinzel',
    direction: {
      type: 'Display: Cinzel or a high-contrast serif. Body: Cormorant Garamond at a readable size. Gold hairline rules and numbered lots.',
      motion: 'Fine silk threads draw across the screen as you scroll, tying sections together. Slow, deliberate transitions, like an auction reveal.',
      cursor: 'Small auction paddle showing a lot number on hover. Optional: muffled crowd, a gavel.',
      reveal: "A cargo tag (#07) swings into view, flips, and a mask lifts to reveal the character. Tag numbers become each character's label.",
      gallery: 'Numbered auction lots in gilt frames. Click a lot to open full screen; arrows step to the next lot.',
    },
    hero: {
      poster: art('noc-silk-hero', 1920, 1080),
      videoNote: 'Cargo tags, masked figures, gold-lit arenas.',
    },
    story: {
      headline: 'She let them take her',
      text: 'Elite agent Kat deliberately allows herself to be captured by the Silk, a ruthless organization that abducts women and forces them into deadly, high-stakes games for anonymous bidders. Disguised as Cargo #07, she must survive every trial while secretly investigating the organization from within. But her unusual composure has been noticed, and one of the Silk\'s most powerful figures wants to break her. The games were only the beginning.',
    },
    characters: [
      {
        name: 'Kat',
        alias: 'Cargo #07',
        copy: 'An elite agent who lets herself be captured to take down the Silk from the inside. Unnervingly composed, and always one step ahead of the games.',
        role: 'Undercover agent',
        image: art('noc-silk-c1', 900, 1200),
      },
      {
        name: 'Prisha',
        copy: "A young captive who quickly becomes Kat's ally. Kat protects her at every turn.",
        role: 'Ally',
        image: art('noc-silk-c2', 900, 1200),
      },
      {
        name: 'Vesna',
        alias: 'Silk #01',
        copy: "One of the Silk's highest-ranking figures. Struck by Kat's composure, she becomes determined to break her and claim her.",
        role: 'Antagonist',
        image: art('noc-silk-c3', 900, 1200),
      },
      {
        name: 'The Masked Enforcers',
        copy: "The Silk's masked guards. Feared by the contestants, and not quite what they seem.",
        role: "The Silk's enforcers",
        image: art('noc-silk-c4', 900, 1200),
      },
    ],
    gallery: {
      title: 'The Lots',
      note: '[PLACEHOLDER] no images supplied. Structure as lots: covers, arena sequences, character portraits, concept art.',
      images: [
        { src: art('noc-silk-g1'), caption: 'Lot 01' },
        { src: art('noc-silk-g2'), caption: 'Lot 02' },
        { src: art('noc-silk-g3'), caption: 'Lot 03' },
        { src: art('noc-silk-g4'), caption: 'Lot 04' },
      ],
    },
    campaign: [{ title: 'The Silk Sting', status: 'Campaign coming soon' }],
    face: {
      name: 'Kat Marie',
      tag: 'Collaborator',
      bio: 'The face behind the mask. [PLACEHOLDER] bio, pending confirmation.',
      href: '#',
      image: art('noc-silk-face', 1000, 1250),
    },
    cta: {
      headline: 'Take her place at the table. Follow Kat inside the Silk.',
      buttons: [{ label: 'Follow on Kickstarter', href: '#' }],
    },
    signup: { line: 'Get on the list. Discreetly.' },
  },

  {
    slug: 'boundless-loop',
    name: 'The Boundless Loop',
    shortName: 'Boundless Loop',
    genre: 'Gaming',
    hook: 'The perfect world you designed becomes your prison.',
    palette: { ink: '#05060F', paper: '#E6F6FF', accent: '#00F0FF', accentSoft: '#FF2BD6' },
    display: 'rajdhani',
    direction: {
      type: 'Display: Rajdhani or Orbitron-style geometric caps. Body and UI: JetBrains Mono. Everything sits inside thin HUD frames.',
      motion: 'A loop counter in the corner rises as you scroll. Sections change with glitch and corruption effects; moving between pages plays a "respawn".',
      cursor: 'Crosshair cursor. Optional: digital hum, respawn chime.',
      reveal: 'Character-select screen: portrait compiles out of falling code, stat bars fill, a class tag appears. Bios read like patch notes.',
      gallery: 'Save files. Images load like save slots or inventory items; opening one glitches it in. "Next level" arrows.',
    },
    hero: {
      poster: art('noc-loop-hero', 1920, 1080),
      videoNote: "The Labyrinth's shifting reality and death loops.",
    },
    story: {
      headline: 'What if the perfect world you designed became your personal prison?',
      text: 'In a world where reality exists inside a constantly evolving digital labyrinth, Elara Vance finds herself pulled into a game she once helped create. But this is no ordinary game. The Labyrinth learns from every move, adapts to every attempt at escape, and traps those inside in a cycle where death is never the end. The deeper they go, the harder it becomes to tell where the game ends and reality begins.',
      more: 'As Elara searches for a way out, she encounters others who have been trapped within the system, each carrying their own secrets and reasons for surviving. Together, they must navigate a world filled with corrupted code, deadly creatures, shifting realities, and a system that seems to be becoming more powerful with every loop.',
    },
    characters: [
      {
        name: 'Elara Vance',
        copy: "The mind behind The Labyrinth. Elara understands its code, systems and mechanics better than anyone else. But being its creator doesn't make her safe inside it. As the Labyrinth begins behaving in ways she never designed, her knowledge becomes her greatest weapon.",
        role: 'Lead developer',
        image: art('noc-loop-c1', 900, 1200),
      },
      {
        name: 'Luna',
        copy: 'Trapped inside The Labyrinth since Patch 0.4. With no powers or special abilities, she has survived by staying hidden, studying the system, and learning how the game behaves. She knows more about surviving it than almost anyone.',
        power: 'None',
        role: 'Beta tester',
        image: art('noc-loop-c2', 900, 1200),
      },
      {
        name: 'Lyra',
        copy: 'At first, exactly what Elara needs: an ally who knows how to fight and navigate the Labyrinth. But Lyra is playing a much deeper game. Beneath the helpful support-class persona is someone with a very different allegiance.',
        power: 'Archery',
        role: 'Archer / support class NPC',
        image: art('noc-loop-c3', 900, 1200),
      },
      {
        name: 'Slade',
        copy: "Fast, relentless and nearly impossible to predict, one of the Labyrinth's most dangerous hostile entities. Every encounter with him is a fight to stay alive.",
        power: 'Speed',
        role: 'Speedster',
        image: art('noc-loop-c4', 900, 1200),
      },
      {
        name: 'Warden Kai',
        copy: 'Serves the hierarchy that controls The Labyrinth, and understands one of its most important rules: every restart makes the game smarter. His warning hints that escaping may require more than surviving.',
        role: 'Warden',
        image: art('noc-loop-c5', 900, 1200),
      },
      {
        name: 'Seraphina',
        copy: 'Cold and ruthless, the unforgiving nature of the system. She sees those trapped inside as pieces in a game, and takes particular pleasure in watching them break.',
        role: 'Warden',
        image: art('noc-loop-c6', 900, 1200),
      },
      {
        name: 'High Lord Malakor',
        copy: "At the top of the Labyrinth's hierarchy: the power and authority of the system itself, overseeing a world where the rules are absolute.",
        role: 'Supreme figure of the system',
        image: art('noc-loop-c7', 900, 1200),
      },
    ],
    gallery: {
      title: 'Save Files',
      note: '[PLACEHOLDER] images not supplied. Use character renders, Issue #1 pages and covers, and Issue #2 teaser art.',
      images: [
        { src: art('noc-loop-g1'), caption: 'Save 01' },
        { src: art('noc-loop-g2'), caption: 'Save 02' },
        { src: art('noc-loop-g3'), caption: 'Save 03' },
        { src: art('noc-loop-g4'), caption: 'Save 04' },
      ],
    },
    campaign: [
      {
        title: 'The Boundless Loop #1',
        raised: '$2,575',
        backers: 68,
        goal: '$1,000',
        funded: 258,
        ran: 'Oct 15 – Nov 14, 2025',
      },
      { title: 'Issue #2: Cyber Under City', status: 'Coming soon · Bound by the city. Broken by the loop.' },
    ],
    face: null,
    cta: {
      headline: 'Bound by the city. Broken by the loop.',
      buttons: [
        { label: 'Follow Issue #2 on Kickstarter', href: '#' },
        { label: 'Get Issue #1', href: '#' },
      ],
    },
    signup: { line: 'Rejoin the loop.' },
  },

  {
    slug: 'chains-of-fate',
    name: 'Chains of Fate',
    shortName: 'Chains of Fate',
    genre: 'Superhero',
    hook: 'Heroes of legend, trapped in a witch duo\'s tournament.',
    palette: { ink: '#1B1B24', paper: '#EDE9F5', accent: '#F2B705', accentSoft: '#D6247F' },
    display: 'anton',
    direction: {
      type: 'Display: Anton or a tall condensed poster face. Body: Barlow. Halftone dots and bold outlines.',
      motion: 'Diagonal comic-panel wipes between sections. Chain links drop across the screen and lock as dividers. Impact frames on click.',
      cursor: 'Chain-link cursor that snaps taut on a character. Optional: clanking chains, arena crowd.',
      reveal: 'Tournament lock-in: chains snap, the fighter card slams into the bracket with a shockwave. The two witch queens get a split-screen VS reveal.',
      gallery: 'Fighter cards in the tournament bracket. Click to enlarge; next artwork wipes in on a diagonal panel.',
    },
    hero: {
      poster: art('noc-chains-hero', 1920, 1080),
      videoNote: 'The tournament arena and the witch queens.',
    },
    story: {
      headline: 'Your favorite heroes of legend and ink are about to become slaves for the witch duo\'s entertainment.',
      text: 'Heroes of legend find themselves trapped in a twisted game controlled by a powerful witch duo. As the tournament begins, survival means playing by their rules. In Chains of Fate #2: The Tournament Begins, Queens Vex and Scorpia force fifty elite fighters into heated restraint matches for freedom or permanent capture.',
    },
    characters: [
      {
        name: 'Queen Vex',
        copy: "One half of the witch duo who runs the tournament and holds every fighter's fate. [PLACEHOLDER] full bio, powers, look.",
        power: '[PLACEHOLDER]',
        role: 'Witch queen · Tournament master',
        image: art('noc-chains-c1', 900, 1200),
      },
      {
        name: 'Queen Scorpia',
        copy: 'The other half of the witch duo. [PLACEHOLDER] full bio, powers, look.',
        power: '[PLACEHOLDER]',
        role: 'Witch queen · Tournament master',
        image: art('noc-chains-c2', 900, 1200),
      },
      {
        name: '[PLACEHOLDER] featured fighters',
        copy: 'Fighters to feature: name, origin, powers and role, using the same fields as the other universes. The spec suggests a 50-slot bracket where revealed fighters are lit and the rest unlock with each issue.',
        role: '[PLACEHOLDER]',
        image: art('noc-chains-c3', 900, 1200),
      },
    ],
    gallery: {
      title: 'The Bracket',
      note: '[PLACEHOLDER] images not supplied. Use the Issue #1 covers and pages and the Issue #2 teaser art.',
      images: [
        { src: art('noc-chains-g1'), caption: 'Cover · Issue #1' },
        { src: art('noc-chains-g2'), caption: 'Interior page' },
        { src: art('noc-chains-g3'), caption: 'Interior page' },
        { src: art('noc-chains-g4'), caption: 'Issue #2 teaser' },
      ],
    },
    campaign: [
      {
        title: 'Chains of Fate #1',
        raised: '$7,086',
        backers: 146,
        goal: '$2,000',
        funded: 354,
        ran: 'Jan 22 – Mar 1, 2026',
      },
      { title: '#2: The Tournament Begins', status: 'Coming soon · campaign page is live as "coming soon"' },
    ],
    face: null,
    cta: {
      headline: 'The tournament begins. Will you play by their rules?',
      buttons: [
        { label: 'Follow Issue #2 on Kickstarter', href: '#' },
        { label: 'Join on Patreon', href: '#' },
      ],
    },
    signup: { line: 'Enter the tournament list.' },
  },

  {
    slug: 'living-library',
    name: 'The Living Library',
    shortName: 'Living Library',
    genre: '[PLACEHOLDER] genre to confirm',
    hook: '[PLACEHOLDER] one-line intro',
    /* Proposed palette: the spec notes this one is a proposal, not from the notes */
    palette: { ink: '#2B2118', paper: '#EFE4CC', accent: '#6B4A2B', accentSoft: '#C9A227' },
    display: 'garamond',
    direction: {
      type: '[PLACEHOLDER] type not specified',
      motion: 'The only light universe: parchment, bookshelves that slide sideways, ink that draws itself.',
      cursor: '[PLACEHOLDER] cursor not specified',
      reveal: '[PLACEHOLDER] character reveal not specified',
      gallery: '[PLACEHOLDER] gallery treatment not specified',
    },
    hero: { poster: art('noc-library-hero', 1920, 1080), videoNote: '[PLACEHOLDER] video' },
    story: {
      headline: '[PLACEHOLDER] headline',
      text: '[PLACEHOLDER] story summary. The spec lists this universe as content-pending: genre, copy, characters, gallery, campaign and collaborator all still to be supplied.',
    },
    characters: [],
    gallery: {
      title: 'The Stacks',
      note: '[PLACEHOLDER] images not supplied.',
      images: [
        { src: art('noc-library-g1'), caption: '[PLACEHOLDER]' },
        { src: art('noc-library-g2'), caption: '[PLACEHOLDER]' },
        { src: art('noc-library-g3'), caption: '[PLACEHOLDER]' },
      ],
    },
    campaign: [{ title: 'The Living Library', status: 'Campaign coming soon' }],
    face: null,
    cta: { headline: '[PLACEHOLDER] headline', buttons: [{ label: 'Follow on Kickstarter', href: '#' }] },
    signup: { line: '[PLACEHOLDER] signup line' },
  },
];

export const getUniverse = (slug: string) => universes.find((u) => u.slug === slug);

/** Studio totals from section 8, which the spec names as the single source of truth. */
export const studioStats = {
  raised: '$36,204',
  raisedLabel: '$36,000+ raised across our Kickstarter campaigns',
  pledges: 787,
  pledgesLabel: '780+ backer pledges',
  issuesFunded: 4,
  issuesComing: 2,
};
