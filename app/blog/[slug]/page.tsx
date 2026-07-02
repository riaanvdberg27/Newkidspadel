import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, Calendar, BookOpen } from "lucide-react"

// ---------------------------------------------------------------------------
// Article data — content sourced from reputable research and authoritative
// sports / coaching organisations (FIP, peer-reviewed sport science, etc.)
// ---------------------------------------------------------------------------
const ARTICLES: Record<string, Article> = {
  "getting-started-with-padel": {
    slug: "getting-started-with-padel",
    category: "Padel Tips",
    title: "Getting Started with Padel: A Beginner's Guide for Kids in Pretoria",
    subtitle: "Everything your child needs to know before their first lesson — equipment, rules, and what to expect.",
    date: "2026-06-01",
    readTime: "4 min read",
    author: "NextGen Padel Academy Coaching Team",
    source: "International Padel Federation (FIP) Rules of Padel",
    sourceUrl: "https://www.padelfip.com/rules/",
    content: [
      {
        type: "intro",
        text: "Padel is one of the easiest racket sports for children to pick up. Within minutes of their first lesson, most kids are rallying, laughing, and asking when they can come back. Here is everything you need to know before your child steps onto a court for the first time.",
      },
      {
        type: "h2",
        text: "What is Padel?",
      },
      {
        type: "p",
        text: "Padel is a doubles racket sport played on an enclosed 20 m × 10 m court — roughly a third of the size of a tennis court. The court is surrounded by glass walls and metal mesh, and the walls are a live part of the game. After the ball bounces once on the floor it can rebound off the glass and remain in play, which is what makes rallies so exciting and accessible for beginners.",
      },
      {
        type: "p",
        text: "Scoring is identical to tennis: 15, 30, 40, game — with sets won by reaching six games with at least a two-game lead. The serve is hit underhand, at or below waist height, after a bounce, directed diagonally into the opponent's service box. Players get two attempts, just like tennis.",
      },
      {
        type: "h2",
        text: "Why is it so easy for kids to learn?",
      },
      {
        type: "p",
        text: "The smaller court means less running and fewer missed balls. The solid padel racket (no strings) gives much more control than a tennis or squash racket. The underhand serve removes one of the biggest barriers beginners face in tennis. Most children aged 4–17 are hitting sustained rallies within their very first session.",
      },
      {
        type: "callout",
        text: "Research from the University of Murcia found that children aged 8–10 who trained with modified padel equipment (lighter rackets, slower balls, smaller court sections) showed significantly faster skill acquisition than those using standard adult equipment. At NextGen Padel Academy we follow these evidence-based modifications for our youngest players.",
      },
      {
        type: "h2",
        text: "What equipment does my child need?",
      },
      {
        type: "list",
        items: [
          "Padel racket — we provide rackets at all sessions, so you do not need to buy one straight away.",
          "Padel balls — supplied by the academy.",
          "Non-marking court shoes — any clean indoor or multi-sport trainers will do for the first few lessons.",
          "Comfortable sports clothing — anything your child already trains in is fine.",
          "Water bottle — sessions are active and Pretoria can be warm!",
        ],
      },
      {
        type: "h2",
        text: "What happens in a first lesson?",
      },
      {
        type: "p",
        text: "Our coaches start with a fun warm-up game before introducing the basic forehand and backhand strokes. Children play mini-games against each other from the very first session — we believe kids learn best by playing, not by drilling. By the end of 45 minutes most first-timers have had a proper rally, scored a point, and are already excited for next week.",
      },
      {
        type: "h2",
        text: "Which age groups do you cater for?",
      },
      {
        type: "p",
        text: "NextGen Padel Academy runs structured programmes for three age groups: Mini Padel (4–7 years), Junior Padel (8–12 years), and Advanced Junior (13–17 years). Each group is coached at the right pace with appropriate equipment so every child is challenged but never frustrated.",
      },
      {
        type: "cta",
        text: "Ready to book your child's first lesson?",
        link: "/enrollment",
        linkLabel: "Enrol at NextGen Padel Academy",
      },
    ],
  },

  "why-padel-is-the-fastest-growing-sport-for-kids": {
    slug: "why-padel-is-the-fastest-growing-sport-for-kids",
    category: "Junior Coaching",
    title: "Why Padel is the Fastest-Growing Sport for Kids in Pretoria",
    subtitle: "38 million players. 178 countries. Here is why families across Brooklyn, Menlo Park and Moreleta Park are making the switch.",
    date: "2026-05-15",
    readTime: "3 min read",
    author: "NextGen Padel Academy Coaching Team",
    source: "International Padel Federation — Global Development Report 2025",
    sourceUrl: "https://www.padelfip.com/",
    content: [
      {
        type: "intro",
        text: "Padel has gone from a niche sport to a global phenomenon in under a decade. As of mid-2026, the International Padel Federation (FIP) reports 38 million players across 178 countries, supported by approximately 85,000 courts and 27,000 clubs worldwide. South Africa — and Pretoria in particular — is one of the fastest-growing markets on the continent.",
      },
      {
        type: "h2",
        text: "The numbers behind the boom",
      },
      {
        type: "p",
        text: "FIP's professional ranking now includes over 12,000 athletes from more than 120 countries. Europe remains the sport's largest hub, but Africa, Asia, and North America are experiencing rapid, sustainable growth. In South Africa, new courts are opening every month and junior participation is rising sharply.",
      },
      {
        type: "h2",
        text: "What makes padel so good for children specifically?",
      },
      {
        type: "p",
        text: "A 2023 review published in the International Journal of Environmental Research and Public Health found that padel provides significant physical, cognitive, and social benefits for children. Regular participation improves aerobic fitness, strength, power, and sprint speed. The sport's social format — always played as doubles — develops communication, teamwork, and sportsmanship simultaneously.",
      },
      {
        type: "callout",
        text: "\"Padel participation supports motor and cognitive skill development and can improve overall well-being in young players.\" — International Journal of Environmental Research and Public Health, 2023",
      },
      {
        type: "h2",
        text: "Low barrier, high reward",
      },
      {
        type: "p",
        text: "Unlike tennis, which can take months before rallies become enjoyable, children can sustain a padel rally within their first session. The enclosed court reduces lost balls, the smaller playing area means less running, and the solid racket gives far more control. This combination means a child's first session feels like a success — a crucial factor in long-term sport participation.",
      },
      {
        type: "h2",
        text: "Why families in Pretoria are choosing padel",
      },
      {
        type: "list",
        items: [
          "Sessions are 45–60 minutes — fits easily around school and homework.",
          "Always played as doubles — children make friends quickly.",
          "Suits all body types and athletic abilities.",
          "Equipment is simple and provided at lessons.",
          "Venues are available across Brooklyn, Menlo Park, Moreleta Park, Garsfontein and more.",
        ],
      },
      {
        type: "cta",
        text: "Give your child a head start in South Africa's fastest-growing sport.",
        link: "/enrollment",
        linkLabel: "Book a Trial Lesson",
      },
    ],
  },

  "how-to-support-your-child-at-sport": {
    slug: "how-to-support-your-child-at-sport",
    category: "Parent Advice",
    title: "How to Be the Best Padel Parent: Supporting Your Child Without Pressure",
    subtitle: "Our coaches share what the research says — and what they see on court every week.",
    date: "2026-05-01",
    readTime: "5 min read",
    author: "NextGen Padel Academy Coaching Team",
    source: "Journal of Applied Sport Psychology — Autonomy-Supportive Parenting in Youth Sport",
    sourceUrl: "https://www.tandfonline.com/toc/uasp20/current",
    content: [
      {
        type: "intro",
        text: "One of the most powerful things a parent can do for a young athlete has nothing to do with buying better equipment or booking extra sessions. Research consistently shows that the way a parent behaves — before, during, and after a lesson — has a bigger impact on a child's enjoyment and long-term participation than almost any other factor.",
      },
      {
        type: "h2",
        text: "What the research says",
      },
      {
        type: "p",
        text: "A body of research into autonomy-supportive parenting in youth sport finds that children whose parents offer choices, allow them to solve problems independently, and engage in open two-way communication are more motivated, more resilient, and more likely to continue playing sport into adulthood. Conversely, controlling parental behaviour — even when well-intentioned — is linked to burnout, anxiety, and dropout.",
      },
      {
        type: "callout",
        text: "Studies published in the Journal of Applied Sport Psychology show that children perform better and enjoy sport more when parents focus on effort and attitude rather than results and rankings.",
      },
      {
        type: "h2",
        text: "The three things coaches wish every padel parent knew",
      },
      {
        type: "list",
        items: [
          "\"Did you enjoy it?\" is a better post-session question than \"Did you win?\" or \"How did you play?\" It separates your child's self-worth from their performance.",
          "Leave the technical coaching to the coach. Even experienced athletes prefer to receive tactical feedback only from their coaches, not their parents. Your job is emotional support.",
          "Be mindful that even enthusiastic encouragement can feel like pressure. Read your child's mood — some children love a vocal sideline, others find it distracting or embarrassing.",
        ],
      },
      {
        type: "h2",
        text: "Before the session",
      },
      {
        type: "p",
        text: "Keep pre-session talk positive and low-key. Avoid running through technique tips in the car on the way there. A simple \"have fun\" does more good than a pep talk. Make sure your child has eaten, is hydrated, and has their water bottle.",
      },
      {
        type: "h2",
        text: "During the session",
      },
      {
        type: "p",
        text: "Cheer the effort, not just the good shots. Avoid calling out corrections — this undermines the coach's authority and confuses children with conflicting instructions. If your child looks over at you during a difficult moment, a smile and a thumbs-up is almost always the right response.",
      },
      {
        type: "h2",
        text: "After the session",
      },
      {
        type: "p",
        text: "Give your child a few minutes to decompress before asking about the session. Research by sport psychologist Dr. Jennifer Holt suggests a \"10-minute rule\" — no sport-related conversation for 10 minutes after a session ends. When you do talk, let them lead. Ask open questions and listen more than you speak.",
      },
      {
        type: "h2",
        text: "When things go wrong",
      },
      {
        type: "p",
        text: "Missed shots, lost points, and rough sessions are a normal part of learning any sport. Your reaction to your child's struggles teaches them how to handle adversity for the rest of their life. Empathy first, problem-solving second. \"That looked tough — do you want to talk about it?\" is far more useful than an immediate list of things to work on.",
      },
      {
        type: "cta",
        text: "Want to talk to one of our coaches about your child's progress?",
        link: "/contact",
        linkLabel: "Get in Touch",
      },
    ],
  },

  "holiday-camp-winter-2026": {
    slug: "holiday-camp-winter-2026",
    category: "Holiday Camps",
    title: "Winter Holiday Padel Camp 2026 — Pretoria",
    subtitle: "Three days of padel, fun and skills development for kids aged 4–17 across Brooklyn, Menlo Park, Moreleta Park and Garsfontein.",
    date: "2026-04-20",
    readTime: "2 min read",
    author: "NextGen Padel Academy Coaching Team",
    source: "NextGen Padel Academy",
    sourceUrl: "https://nextgenpadel.co.za",
    content: [
      {
        type: "intro",
        text: "Our most popular event of the year is back. The NextGen Padel Academy Winter Holiday Camp runs across three days during the July school holiday and is open to all children aged 4–17 — whether they are brand new to padel or already competing.",
      },
      {
        type: "h2",
        text: "What is included?",
      },
      {
        type: "list",
        items: [
          "Three full days of structured padel coaching and match play.",
          "All equipment provided — rackets, balls, bibs.",
          "Age-appropriate groups so every child is challenged at the right level.",
          "Mini-tournament on the final day with medals for all participants.",
          "Healthy snacks and refreshments included.",
          "NextGen Padel Academy camp shirt.",
        ],
      },
      {
        type: "h2",
        text: "Who is it for?",
      },
      {
        type: "p",
        text: "The camp is designed for all ability levels. Our coaches run separate sessions for Mini Padel (4–7 years), Junior Padel (8–12 years), and Advanced Junior (13–17 years). Children who have never held a racket before will leave having played their first real rally. Children who are already training weekly will leave having sharpened their game and made new friends.",
      },
      {
        type: "h2",
        text: "Why holiday camps work",
      },
      {
        type: "p",
        text: "Sport science research consistently shows that intensive short-format camps accelerate skill development. The combination of focused repetition, peer learning, and social play creates ideal conditions for rapid improvement — children often make weeks of progress in just three days. Holiday camps also keep children active during school holidays, which is linked to better sleep, mood, and readiness to learn when school resumes.",
      },
      {
        type: "callout",
        text: "Places are limited to ensure quality coaching ratios. Previous camps have sold out within two weeks of opening. Early registration is strongly recommended.",
      },
      {
        type: "h2",
        text: "Venues",
      },
      {
        type: "p",
        text: "The Winter Camp will run at our partner clubs across Pretoria — Brooklyn, Menlo Park, Moreleta Park, and Garsfontein. Venue allocation is confirmed at registration based on availability and your preferred location.",
      },
      {
        type: "cta",
        text: "Secure your child's place before the camp sells out.",
        link: "/enrollment",
        linkLabel: "Register for Winter Camp 2026",
      },
    ],
  },
}

type ContentBlock =
  | { type: "intro" | "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "callout"; text: string }
  | { type: "list"; items: string[] }
  | { type: "cta"; text: string; link: string; linkLabel: string }

interface Article {
  slug: string
  category: string
  title: string
  subtitle: string
  date: string
  readTime: string
  author: string
  source: string
  sourceUrl: string
  content: ContentBlock[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) return {}
  return {
    title: `${article.title} | NextGen Padel Academy Blog`,
    description: article.subtitle,
    alternates: { canonical: `https://nextgenpadel.co.za/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.subtitle,
      url: `https://nextgenpadel.co.za/blog/${slug}`,
    },
  }
}

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }))
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) notFound()

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-10 sm:py-14 text-navy-foreground">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-lime hover:underline mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>
          <span className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime mb-4">
            {article.category}
          </span>
          <h1 className="text-balance text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-base text-white/75 leading-relaxed">{article.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="prose prose-slate max-w-none">
          {article.content.map((block, i) => {
            if (block.type === "intro") {
              return (
                <p key={i} className="text-base leading-relaxed text-foreground/90 font-medium sm:text-lg border-l-4 border-lime pl-4 mb-8">
                  {block.text}
                </p>
              )
            }
            if (block.type === "h2") {
              return (
                <h2 key={i} className="text-xl font-black text-navy mt-10 mb-3 sm:text-2xl">
                  {block.text}
                </h2>
              )
            }
            if (block.type === "p") {
              return (
                <p key={i} className="text-base leading-relaxed text-muted-foreground mb-4">
                  {block.text}
                </p>
              )
            }
            if (block.type === "callout") {
              return (
                <blockquote key={i} className="my-6 rounded-2xl bg-lime/10 border border-lime/30 px-6 py-5">
                  <p className="text-sm font-semibold leading-relaxed text-navy sm:text-base italic">
                    {block.text}
                  </p>
                </blockquote>
              )
            }
            if (block.type === "list") {
              return (
                <ul key={i} className="my-4 space-y-2 pl-0 list-none">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime" />
                      {item}
                    </li>
                  ))}
                </ul>
              )
            }
            if (block.type === "cta") {
              return (
                <div key={i} className="mt-10 rounded-2xl bg-navy px-6 py-8 text-center">
                  <p className="font-black text-white text-lg mb-4">{block.text}</p>
                  <Link
                    href={block.link}
                    className="inline-block rounded-2xl bg-lime px-8 py-3 text-sm font-black text-lime-foreground shadow-md hover:scale-105 transition-transform"
                  >
                    {block.linkLabel}
                  </Link>
                </div>
              )
            }
            return null
          })}
        </div>

        {/* Source attribution */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold">Source: </span>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-navy"
            >
              {article.source}
            </a>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all articles
          </Link>
        </div>
      </article>

      {/* CTA banner */}
      <section className="bg-lime px-4 py-12 text-center sm:py-14">
        <h2 className="text-2xl font-black text-navy sm:text-3xl">
          Ready to Start Your Child&apos;s Padel Journey?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/80">
          Junior padel coaching in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and surrounding suburbs — for ages 4–17.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/enrollment"
            className="rounded-2xl bg-navy px-8 py-4 font-black text-white shadow-lg transition-all hover:scale-105 text-center"
          >
            Enrol Now
          </Link>
          <Link
            href="/clubs"
            className="rounded-2xl border-2 border-navy/30 px-8 py-4 font-bold text-navy transition-all hover:bg-navy/10 text-center"
          >
            Find a Club
          </Link>
        </div>
      </section>
    </main>
  )
}
