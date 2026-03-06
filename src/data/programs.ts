export type Program = {
  slug: string;
  title: string;
  date: string;
  day: string;
  time: string;
  duration: string;
  tag: "Breathwork" | "Meditation" | "Yoga" | "Sound" | "Retreat";
  location: string;
  summary: string;
  description: string;
  highlights: string[];
  facilitator: string;
  seats: number;
  status: "Open" | "Filling" | "Closed";
};

export const PROGRAMS: Program[] = [
  {
    slug: "sunrise-breath-circle",
    title: "Sunrise breath circle",
    date: "Mar 11",
    day: "Mon",
    time: "7:00 AM",
    duration: "30 min",
    tag: "Breathwork",
    location: "Live · Studio A",
    summary: "Start your day with guided breathwork and steady intention.",
    description:
      "A gentle, rhythmic practice to expand lung capacity, soften the nervous system, and prepare your body for the day ahead.",
    highlights: [
      "Guided breath pacing",
      "Grounding intention setting",
      "Short integration journal prompt",
    ],
    facilitator: "Ravi Menon",
    seats: 24,
    status: "Open",
  },
  {
    slug: "flow-and-restore",
    title: "Flow & restore",
    date: "Mar 13",
    day: "Wed",
    time: "6:30 PM",
    duration: "45 min",
    tag: "Yoga",
    location: "Live · Studio B",
    summary: "Slow flow with longer holds to unwind and recover.",
    description:
      "Move through a calming sequence designed to release tension in the hips, shoulders, and spine, followed by restorative poses.",
    highlights: [
      "Slow, mindful transitions",
      "Supported restorative shapes",
      "Breath-led cooldown",
    ],
    facilitator: "Neha Rao",
    seats: 18,
    status: "Filling",
  },
  {
    slug: "weekend-reset",
    title: "Weekend reset",
    date: "Mar 15",
    day: "Sat",
    time: "9:00 AM",
    duration: "60 min",
    tag: "Meditation",
    location: "Live · Hall 2",
    summary: "A full-body reset with meditation and light movement.",
    description:
      "Reconnect with your breath and body through a gentle sequence that blends guided meditation, soft stretching, and stillness.",
    highlights: [
      "Breath + body scan",
      "Guided visualization",
      "Closing stillness",
    ],
    facilitator: "Kiran Shah",
    seats: 20,
    status: "Open",
  },
  {
    slug: "sound-bath-immersion",
    title: "Sound bath immersion",
    date: "Mar 18",
    day: "Tue",
    time: "8:00 PM",
    duration: "50 min",
    tag: "Sound",
    location: "Live · Studio C",
    summary: "A deep sonic journey for nervous system release.",
    description:
      "Immerse in layered sound bowls and chimes to quiet the mind and invite restorative rest.",
    highlights: [
      "Crystal bowl soundscape",
      "Guided settling",
      "Long-form relaxation",
    ],
    facilitator: "Meera Das",
    seats: 16,
    status: "Open",
  },
  {
    slug: "stillness-retreat-preview",
    title: "Stillness retreat preview",
    date: "Mar 22",
    day: "Sat",
    time: "5:30 PM",
    duration: "75 min",
    tag: "Retreat",
    location: "Live · Atrium",
    summary: "Preview our retreat practices with a longer session.",
    description:
      "Experience a taste of the Journey retreat format with breath, reflection, and deep rest.",
    highlights: [
      "Retreat-style sequence",
      "Silent reflection",
      "Group integration",
    ],
    facilitator: "Anjali Singh",
    seats: 30,
    status: "Open",
  },
  {
    slug: "evening-mantra-circle",
    title: "Evening mantra circle",
    date: "Mar 24",
    day: "Mon",
    time: "7:15 PM",
    duration: "40 min",
    tag: "Meditation",
    location: "Live · Studio A",
    summary: "A collective mantra practice to close the day.",
    description:
      "Chant, breathe, and settle into stillness with a guided mantra flow designed to soften the edges of the day.",
    highlights: [
      "Guided mantra repetition",
      "Breath-led pauses",
      "Quiet closing reflection",
    ],
    facilitator: "Priya Nair",
    seats: 25,
    status: "Open",
  },
  {
    slug: "lunar-breath-journey",
    title: "Lunar breath journey",
    date: "Mar 27",
    day: "Thu",
    time: "6:00 AM",
    duration: "35 min",
    tag: "Breathwork",
    location: "Live · Garden Deck",
    summary: "Soft, lunar-inspired breathwork to center and ground.",
    description:
      "A gentle morning practice that balances the nervous system and builds steady energy.",
    highlights: [
      "Gentle breath ratios",
      "Moon-inspired intention",
      "Quiet closing",
    ],
    facilitator: "Arun Iyer",
    seats: 20,
    status: "Open",
  },
  {
    slug: "restorative-flow",
    title: "Restorative flow",
    date: "Mar 29",
    day: "Sat",
    time: "5:00 PM",
    duration: "55 min",
    tag: "Yoga",
    location: "Live · Studio B",
    summary: "Slow movement and long holds to reset your body.",
    description:
      "Move through a soft flow that transitions into deep restorative postures to release tension.",
    highlights: [
      "Slow flow warm-up",
      "Long restorative holds",
      "Guided breath cues",
    ],
    facilitator: "Divya Sharma",
    seats: 22,
    status: "Open",
  },
  {
    slug: "happiness-program",
    title: "Happiness Program",
    date: "Apr 3",
    day: "Thu",
    time: "6:00 PM",
    duration: "3 days",
    tag: "Retreat",
    location: "Live · Main Hall",
    summary: "A multi-day immersion to reconnect with joy and inner calm.",
    description:
      "Explore breathwork, guided meditation, and reflective practices designed to elevate wellbeing and build lasting inner resilience.",
    highlights: [
      "Breathwork foundations",
      "Guided meditation sessions",
      "Integration + community circle",
    ],
    facilitator: "Art of Living Faculty",
    seats: 40,
    status: "Open",
  },
];

export const getProgramBySlug = (slug: string) =>
  PROGRAMS.find((program) => program.slug === slug);
