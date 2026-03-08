import type { BlogRecord } from "@/lib/types";

type BlogSeed = Omit<BlogRecord, "id" | "createdAt" | "updatedAt">;

export const BLOGS: BlogSeed[] = [
  {
    slug: "best-meditation-practice-in-kathmandu-for-beginners",
    title: "Best Meditation Practice in Kathmandu for Beginners",
    excerpt:
      "A practical beginner guide to start meditation in Kathmandu with breath awareness, simple posture, and a steady daily rhythm.",
    content: `
      <h2>Why meditation matters in modern Kathmandu</h2>
      <p>Life in Kathmandu moves fast. Between work, study, family duties, traffic, and digital overload, the nervous system rarely gets full rest. A simple daily meditation practice can reduce stress, improve clarity, and support emotional balance.</p>
      <h2>Start with 10 minutes, not 60</h2>
      <p>Many people fail because they start too big. Begin with ten minutes in the morning and five minutes in the evening. Sit with a straight spine, close your eyes, and gently observe your breath. Keep it sustainable.</p>
      <h2>Simple routine to follow</h2>
      <ul>
        <li>Choose a fixed space at home.</li>
        <li>Practice at the same time each day.</li>
        <li>Keep your phone silent and away from your seat.</li>
        <li>End with one minute of gratitude.</li>
      </ul>
      <p>If thoughts come, do not fight them. Let them pass and return to the breath. Consistency, not intensity, gives long-term results.</p>
      <h2>How Art of Living Nepal supports beginners</h2>
      <p>At Journey - The Art of Living Nepal, guided sessions help beginners build confidence with proven meditation and breathwork methods. You do not need prior experience. You only need willingness to practice.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["meditation", "kathmandu", "beginners", "wellness"],
    seoTitle: "Best Meditation in Kathmandu for Beginners | Art of Living Nepal",
    seoDescription:
      "Learn a practical beginner meditation routine in Kathmandu with guidance from Journey - The Art of Living Nepal.",
    featured: true,
    status: "Published",
    publishedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    slug: "sudarshan-kriya-benefits-for-stress-and-sleep",
    title: "Sudarshan Kriya Benefits for Stress, Sleep, and Emotional Stability",
    excerpt:
      "Understand how Sudarshan Kriya helps regulate stress response, improve sleep quality, and support emotional resilience.",
    content: `
      <h2>What is Sudarshan Kriya?</h2>
      <p>Sudarshan Kriya is a structured rhythmic breathing practice taught in Art of Living programs. It combines specific breathing cycles that help calm the mind and release accumulated stress.</p>
      <h2>Stress and nervous system reset</h2>
      <p>When stress remains high for long periods, the body stays in survival mode. Regular breathwork helps shift toward a calmer state. Many practitioners report improved patience, reduced reactivity, and better focus.</p>
      <h2>Sleep and recovery</h2>
      <p>Poor sleep is often linked with anxiety and mental overactivity. A steady breathwork practice before evening rest can improve sleep onset and reduce frequent waking at night.</p>
      <h2>Who should learn from a trained instructor?</h2>
      <p>Anyone new to the practice should learn directly from certified instructors. Proper technique ensures safety, depth, and consistency. In Nepal, programs by Art of Living Nepal provide guided instruction and follow-up support.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1499728603263-13726abce5fd?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["sudarshan kriya", "breathwork", "stress relief", "sleep"],
    seoTitle: "Sudarshan Kriya Benefits for Stress and Sleep | Art of Living Nepal",
    seoDescription:
      "Explore how Sudarshan Kriya supports stress relief, sleep quality, and emotional wellbeing with guided practice.",
    featured: true,
    status: "Published",
    publishedAt: "2026-02-24T10:00:00.000Z",
  },
  {
    slug: "ayurveda-daily-routine-for-balance-and-energy",
    title: "Ayurveda Daily Routine for Better Digestion, Energy, and Calm",
    excerpt:
      "A practical Ayurvedic daily rhythm you can follow in Nepal to support digestion, immunity, and mental steadiness.",
    content: `
      <h2>Ayurveda starts with routine</h2>
      <p>Ayurveda emphasizes rhythm. Small daily habits aligned with natural cycles can reduce internal friction and support both physical and mental wellbeing.</p>
      <h2>Morning essentials</h2>
      <ul>
        <li>Wake up at a regular time.</li>
        <li>Hydrate with warm water.</li>
        <li>Do gentle stretches and a few minutes of breathwork.</li>
        <li>Eat a warm, easy-to-digest breakfast.</li>
      </ul>
      <h2>Food and digestion</h2>
      <p>Prefer fresh and seasonal meals where possible. Eat at regular times. Minimize heavy late dinners. Digestion quality influences mood, clarity, and immunity.</p>
      <h2>Evening calm-down</h2>
      <p>Reduce stimulating screens and intense discussions before sleep. Choose a light dinner, brief reflection, and a short meditation to close the day.</p>
      <p>Ayurveda is not a quick hack. It is a lifestyle of small, consistent choices.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["ayurveda", "daily routine", "wellness", "digestion"],
    seoTitle: "Ayurveda Daily Routine for Balance | Journey Nepal Blog",
    seoDescription:
      "Follow a practical Ayurvedic daily routine for better energy, digestion, and calm with tips from Journey.",
    featured: false,
    status: "Published",
    publishedAt: "2026-02-15T08:30:00.000Z",
  },
  {
    slug: "yoga-and-breathwork-for-mental-clarity",
    title: "Yoga and Breathwork for Mental Clarity and Emotional Strength",
    excerpt:
      "How yoga postures and guided breathing together improve clarity, energy, and emotional stability in daily life.",
    content: `
      <h2>Why combine yoga and breath?</h2>
      <p>Yoga and breathwork are most effective when practiced together. Movement prepares the body, while breath settles the nervous system and mind.</p>
      <h2>A simple 20-minute flow</h2>
      <ul>
        <li>5 minutes of gentle mobility and joint rotation.</li>
        <li>8 minutes of steady yoga postures.</li>
        <li>5 minutes of rhythmic breathing.</li>
        <li>2 minutes of silence.</li>
      </ul>
      <p>This integrated routine is practical for working professionals, students, and homemakers.</p>
      <h2>Consistency over complexity</h2>
      <p>You do not need advanced postures to get benefits. A clear routine done regularly brings better outcomes than occasional intense effort.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["yoga", "breathwork", "mental clarity", "spirituality"],
    seoTitle: "Yoga and Breathwork for Mental Clarity | Journey Blog",
    seoDescription:
      "Learn a practical yoga and breathing routine to improve clarity, stability, and energy each day.",
    featured: false,
    status: "Published",
    publishedAt: "2026-02-06T07:45:00.000Z",
  },
  {
    slug: "art-of-living-projects-in-nepal-community-impact",
    title: "Art of Living Projects in Nepal and Their Community Impact",
    excerpt:
      "A snapshot of service-oriented work in Nepal inspired by Art of Living values: stress relief, youth empowerment, and social wellbeing.",
    content: `
      <h2>Spirituality in action</h2>
      <p>Spiritual growth is meaningful when it supports society. Alongside personal wellbeing programs, Art of Living initiatives often focus on practical community support.</p>
      <h2>Areas of impact in Nepal</h2>
      <ul>
        <li>Wellbeing and stress-management sessions for youth and families.</li>
        <li>Volunteer-driven awareness and community support activities.</li>
        <li>Programs that encourage resilience, responsibility, and shared growth.</li>
      </ul>
      <h2>Why this matters now</h2>
      <p>In periods of social and economic pressure, emotional resilience is as important as material support. Breath, awareness, and service can create lasting positive change at scale.</p>
      <p>Journey - The Art of Living Nepal aims to bridge inner wellbeing and social contribution.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["art of living", "nepal", "community", "service"],
    seoTitle: "Art of Living Projects in Nepal | Community and Wellbeing",
    seoDescription:
      "Explore community-focused Art of Living initiatives in Nepal and how wellbeing practices support social impact.",
    featured: true,
    status: "Published",
    publishedAt: "2026-01-31T11:00:00.000Z",
  },
  {
    slug: "global-art-of-living-initiatives-wellbeing-and-service",
    title: "Global Art of Living Initiatives: Wellbeing, Education, and Service",
    excerpt:
      "How global Art of Living initiatives connect personal transformation with service, education, and social harmony.",
    content: `
      <h2>A global approach to wellbeing</h2>
      <p>Across countries, Art of Living programs have focused on stress-relief practices, human values education, and volunteer service models that support local communities.</p>
      <h2>Common pillars across regions</h2>
      <ul>
        <li>Breath and meditation practices for inner stability.</li>
        <li>Programs for youth leadership and emotional resilience.</li>
        <li>Community-first volunteer initiatives.</li>
      </ul>
      <h2>Relevance for Nepal</h2>
      <p>Global learnings become stronger when adapted to local culture and real community needs. Nepal can benefit from a balanced model that includes spiritual depth, practical skills, and collective responsibility.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["global projects", "art of living", "wellness", "service"],
    seoTitle: "Global Art of Living Initiatives for Wellbeing and Service",
    seoDescription:
      "Discover how global Art of Living initiatives combine meditation, education, and service for social wellbeing.",
    featured: false,
    status: "Published",
    publishedAt: "2026-01-22T09:15:00.000Z",
  },
  {
    slug: "spirituality-for-young-professionals-in-nepal",
    title: "Spirituality for Young Professionals in Nepal: Practical, Not Abstract",
    excerpt:
      "A grounded guide for professionals who want calm, purpose, and better decisions through spiritual practices.",
    content: `
      <h2>Spirituality and modern work can coexist</h2>
      <p>For many young professionals, spirituality can feel distant from career goals. In reality, practical spiritual disciplines improve focus, communication, and decision quality.</p>
      <h2>Three practical commitments</h2>
      <ul>
        <li>Ten minutes of morning silence before screen time.</li>
        <li>One conscious breathing break during mid-day stress.</li>
        <li>Evening reflection on actions, not just outcomes.</li>
      </ul>
      <p>These small practices strengthen emotional intelligence and reduce burnout risk.</p>
      <h2>From success to meaning</h2>
      <p>External success becomes sustainable when inner life is stable. Spirituality offers this inner stability through awareness, compassion, and discipline.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["spirituality", "nepal", "professionals", "mindfulness"],
    seoTitle: "Practical Spirituality for Young Professionals in Nepal",
    seoDescription:
      "Learn practical spiritual routines for young professionals in Nepal to reduce stress and improve clarity.",
    featured: false,
    status: "Published",
    publishedAt: "2026-01-14T10:00:00.000Z",
  },
  {
    slug: "meditation-and-yoga-retreat-preparation-guide-nepal",
    title: "Meditation and Yoga Retreat Preparation Guide for Nepal Participants",
    excerpt:
      "How to prepare mentally and physically before attending a meditation or yoga retreat in Nepal.",
    content: `
      <h2>Prepare before you arrive</h2>
      <p>A retreat works best when participants arrive with clear intention and realistic expectations. The goal is not perfection, but openness.</p>
      <h2>One-week pre-retreat checklist</h2>
      <ul>
        <li>Sleep on time for at least five nights before retreat day.</li>
        <li>Reduce caffeine and heavy late dinners.</li>
        <li>Practice 10 minutes of breath awareness daily.</li>
        <li>Write your intention in one sentence.</li>
      </ul>
      <h2>During retreat</h2>
      <p>Participate fully, avoid comparing your experience with others, and give yourself enough hydration and rest. Real transformation often feels subtle at first.</p>
    `,
    coverImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    author: "Journey Editorial Team",
    tags: ["retreat", "meditation", "yoga", "nepal"],
    seoTitle: "Meditation and Yoga Retreat Preparation Guide | Journey Nepal",
    seoDescription:
      "Prepare effectively for your meditation and yoga retreat in Nepal with this practical checklist and mindset guide.",
    featured: false,
    status: "Published",
    publishedAt: "2026-01-08T06:45:00.000Z",
  },
];
