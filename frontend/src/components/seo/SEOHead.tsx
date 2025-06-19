import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
  noIndex?: boolean;
  albumData?: {
    name: string;
    artist: string;
    totalStreams: number;
    topTrack?: string;
    releaseDate?: string;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "StreamClout - Spotify Streaming Data & Track Stream Analytics",
  description = "Discover real-time Spotify streaming data, track stream counts, and analytics for the most streamed songs on Spotify. Get comprehensive streaming insights and performance metrics.",
  keywords = "spotify streaming data, spotify track streams, spotify stream count, most streamed song on spotify, streaming analytics, spotify statistics, track performance",
  ogImage = "https://streamclout.io/og-image.jpg",
  canonicalUrl = "https://streamclout.io/",
  structuredData,
  noIndex = false,
  albumData
}) => {
  // Generate dynamic content for album pages
  const getAlbumTitle = () => {
    if (!albumData) return title;
    return `${albumData.name} by ${albumData.artist} - Spotify Streaming Data | StreamClout`;
  };

  const getAlbumDescription = () => {
    if (!albumData) return description;
    return `View real-time Spotify streaming data for "${albumData.name}" by ${albumData.artist}. Track stream counts: ${albumData.totalStreams?.toLocaleString() || 'N/A'} total streams. ${albumData.topTrack ? `Most streamed track: ${albumData.topTrack}.` : ''} Get detailed streaming analytics and performance metrics.`;
  };

  const getAlbumKeywords = () => {
    if (!albumData) return keywords;
    return `${albumData.name} spotify streams, ${albumData.artist} streaming data, ${keywords}, ${albumData.name} stream count, ${albumData.artist} spotify statistics`;
  };

  // Generate structured data for albums
  const getAlbumStructuredData = () => {
    if (!albumData) return structuredData;

    return {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      "name": albumData.name,
      "byArtist": {
        "@type": "MusicGroup",
        "name": albumData.artist
      },
      "datePublished": albumData.releaseDate,
      "genre": "Music",
      "description": `Spotify streaming analytics for ${albumData.name} by ${albumData.artist}`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "1000",
        "bestRating": "5"
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ListenAction",
        "userInteractionCount": albumData.totalStreams
      }
    };
  };

  const finalTitle = getAlbumTitle();
  const finalDescription = getAlbumDescription();
  const finalKeywords = getAlbumKeywords();
  const finalStructuredData = getAlbumStructuredData();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="StreamClout" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}

      {/* Additional SEO enhancements */}
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="msapplication-TileColor" content="#0ea5e9" />

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;