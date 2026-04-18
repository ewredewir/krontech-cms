interface SeoHeadProps {
  jsonLd: object;
}

export function SeoHead({ jsonLd }: SeoHeadProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
