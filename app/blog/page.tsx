import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Blog | Padel Tips, Junior Coaching & Academy News | NextGen Padel",
  description:
    "Padel tips for kids, junior coaching advice, parent guides, tournament news and academy updates from NextGen Padel Academy in Pretoria.",
  alternates: { canonical: "https://nextgenpadel.co.za/blog" },
  openGraph: {
    title: "Blog | NextGen Padel Academy Pretoria",
    description:
      "Padel tips, junior coaching advice and academy news from NextGen Padel Academy in Pretoria — Brooklyn, Menlo Park, Moreleta Park and Garsfontein.",
    url: "https://nextgenpadel.co.za/blog",
  },
}

const CATEGORIES = [
  { label: "Padel Tips", slug: "padel-tips", description: "Technique, tactics and training tips for junior padel players." },
  { label: "Junior Coaching", slug: "junior-coaching", description: "Insights from our coaching team on developing young padel talent." },
  { label: "Parent Advice", slug: "parent-advice", description: "How to support your child's padel journey from the sidelines." },
  { label: "Tournament News", slug: "tournament-news", description: "Results, fixtures and updates from junior padel tournaments in Pretoria." },
  { label: "Holiday Camps", slug: "holiday-camps", description: "Everything about our padel holiday camps in Pretoria." },
  { label: "Academy News", slug: "academy-news", description: "Latest news, club expansions and announcements from NextGen Padel Academy." },
]

// Placeholder posts — replace with CMS/database content when available
const POSTS = [
  {
    slug: "getting-started-with-padel",
    category: "Padel Tips",
    title: "Getting Started with Padel: A Beginner's Guide for Kids in Pretoria",
    excerpt:
      "Everything your child needs to know before their first padel lesson — equipment, rules, and what to expect at NextGen Padel Academy.",
    date: "2026-06-01",
    readTime: "4 min read",
  },
  {
    slug: "why-padel-is-the-fastest-growing-sport-for-kids",
    category: "Junior Coaching",
    title: "Why Padel is the Fastest-Growing Sport for Kids in Pretoria",
    excerpt:
      "Padel combines the social nature of tennis with easy-to-learn gameplay. Here is why thousands of families across Brooklyn, Menlo Park, Moreleta Park and Pretoria are choosing padel.",
    date: "2026-05-15",
    readTime: "3 min read",
  },
  {
    slug: "how-to-support-your-child-at-sport",
    category: "Parent Advice",
    title: "How to Be the Best Padel Parent: Supporting Your Child Without Pressure",
    excerpt:
      "Our coaches share their top tips for parents on encouraging young athletes at padel lessons without adding unwanted pressure.",
    date: "2026-05-01",
    readTime: "5 min read",
  },
  {
    slug: "holiday-camp-winter-2026",
    category: "Holiday Camps",
    title: "Winter Holiday Padel Camp 2026 — Pretoria",
    excerpt:
      "Our winter holiday camp is back! Three days of padel, fun and skills development for kids aged 4–17 across Pretoria — Brooklyn, Menlo Park, Moreleta Park and Garsfontein.",
    date: "2026-04-20",
    readTime: "2 min read",
  },
]

export default function BlogPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Academy Blog
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Padel Tips, News &amp; Coaching Advice</h1>
        <p className="mt-2 text-xl font-black text-lime">From Pretoria&#39;s Junior Padel Academy</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Coaching insights, parent guides, tournament news and holiday camp updates from NextGen Padel Academy in Pretoria.
        </p>
      </section>

      {/* Categories */}
      <section className="border-b border-border bg-muted px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <span
                key={cat.slug}
                className="rounded-full bg-card border border-border px-4 py-1.5 text-xs font-bold text-navy"
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime-foreground">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h2 className="font-black text-navy text-base leading-snug sm:text-lg">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground flex-1">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <time className="text-xs text-muted-foreground" dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-lime hover:underline"
                  >
                    Read more
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          More articles coming soon. In the meantime,{" "}
          <Link href="/contact" className="font-bold text-navy hover:underline">
            contact us
          </Link>{" "}
          with any questions about our padel coaching programmes in Pretoria.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-lime px-4 py-12 text-center sm:py-16">
        <h2 className="text-2xl font-black text-navy sm:text-3xl">Ready to Start Your Child&#39;s Padel Journey?</h2>
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
