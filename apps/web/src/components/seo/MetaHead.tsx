import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG } from "@/lib/seoConfig";

export interface MetaHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  schemaRaw?: object | object[];
  noIndex?: boolean;
}

const DEFAULT_KEYWORDS = [
  'vendeur IA',
  'vendeuria',
  'vendeur IA whatsapp',
  'commercial virtuel whatsapp',
  'commercial virtuel instagram',
  'vente automatique whatsapp',
  'whatsapp business api',
  'bot vendeur whatsapp',
  'ia pour whatsapp',
  'relance automatique whatsapp',
  'automation vente e-commerce',
  'vendeur autonome ia',
  'intelligence artificielle whatsapp',
  'agents commerciaux ia'
];

const DEFAULT_TITLE = 'Vendeur IA | Votre Commercial Virtuel sur WhatsApp & Instagram';
const DEFAULT_DESCRIPTION = 'Vendeur IA : votre commercial virtuel sur WhatsApp & Instagram. Répondez, conseillez et vendez 24h/24, 7j/7.';
const DEFAULT_SITE_URL = SITE_CONFIG.baseUrl;
const DEFAULT_OG_IMAGE = `${SITE_CONFIG.baseUrl}${SITE_CONFIG.defaultOgImage}`;

export const MetaHead: React.FC<MetaHeadProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl = DEFAULT_SITE_URL,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  schemaRaw,
  noIndex = false,
}) => {
  const mergedKeywords = Array.from(new Set([...keywords, ...DEFAULT_KEYWORDS])).join(', ');

  // Schema.org standard pour Vendeur IA (SoftwareApplication & Organization)
  const defaultOrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Vendeur IA',
    'alternateName': ['Vendeur IA', 'VendeurIA', 'Vendeur IA WhatsApp'],
    'url': DEFAULT_SITE_URL,
    'logo': `${SITE_CONFIG.baseUrl}/android-chrome-512x512.png`,
    'image': DEFAULT_OG_IMAGE,
    'sameAs': [
      'https://twitter.com/vendeuria',
      'https://linkedin.com/company/vendeuria',
      'https://facebook.com/vendeuria'
    ],
    'description': DEFAULT_DESCRIPTION
  };

  const defaultSoftwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Vendeur IA',
    'operatingSystem': 'Web, Cloud, iOS, Android',
    'applicationCategory': 'BusinessApplication',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '248'
    },
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'XOF',
      'lowPrice': '5000',
      'highPrice': '20000',
      'offerCount': '2'
    }
  };

  const schemasToRender = schemaRaw 
    ? (Array.isArray(schemaRaw) ? schemaRaw : [schemaRaw])
    : [defaultOrganizationSchema, defaultSoftwareSchema];

  return (
    <Helmet>
      {/* Balises Méta Canoniques */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={mergedKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Directives Robots Google */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* OpenGraph / Facebook / WhatsApp Preview */}
      <meta property="og:site_name" content="Vendeur IA" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data JSON-LD Schema.org pour Google Rich Snippets */}
      {schemasToRender.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

