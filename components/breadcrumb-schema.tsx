const SITE_URL = "https://nextgenpadel.co.za"

interface Crumb {
  name: string
  href: string
}

interface Props {
  crumbs: Crumb[]
}

/**
 * Renders invisible BreadcrumbList JSON-LD structured data.
 * The visual breadcrumb trail is handled separately by page layout if needed.
 */
export function BreadcrumbSchema({ crumbs }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: crumb.name,
        item: `${SITE_URL}${crumb.href}`,
      })),
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
