import React from 'react';

interface TrackStructuredDataProps {
  trackName: string;
  artistName: string;
  albumName: string;
  streamCount: number;
  releaseDate?: string;
}

interface AlbumStructuredDataProps {
  albumName: string;
  artistName: string;
  tracks: Array<{
    name: string;
    streams: number;
    position: number;
  }>;
  totalStreams: number;
  releaseDate?: string;
}

interface ArtistStructuredDataProps {
  artistName: string;
  albums?: Array<{
    name: string;
    totalStreams: number;
  }>;
  topTracks?: Array<{
    name: string;
    streams: number;
  }>;
}

export const TrackStructuredData: React.FC<TrackStructuredDataProps> = ({
  trackName,
  artistName,
  albumName,
  streamCount,
  releaseDate
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": trackName,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artistName
    },
    "inAlbum": {
      "@type": "MusicAlbum",
      "name": albumName
    },
    "datePublished": releaseDate,
    "genre": "Music",
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ListenAction",
      "userInteractionCount": streamCount
    },
    "description": `${trackName} by ${artistName} from ${albumName} has ${streamCount.toLocaleString()} streams on Spotify`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const AlbumStructuredData: React.FC<AlbumStructuredDataProps> = ({
  albumName,
  artistName,
  tracks,
  totalStreams,
  releaseDate
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "name": albumName,
    "byArtist": {
      "@type": "MusicGroup",
      "name": artistName
    },
    "datePublished": releaseDate,
    "genre": "Music",
    "numTracks": tracks.length,
    "description": `${albumName} by ${artistName} - Complete Spotify streaming analytics with ${totalStreams.toLocaleString()} total streams`,
    "track": tracks.map(track => ({
      "@type": "MusicRecording",
      "name": track.name,
      "position": track.position,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artistName
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ListenAction",
        "userInteractionCount": track.streams
      }
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": Math.floor(totalStreams / 1000),
      "bestRating": "5"
    },
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ListenAction",
      "userInteractionCount": totalStreams
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const ArtistStructuredData: React.FC<ArtistStructuredDataProps> = ({
  artistName,
  albums = [],
  topTracks = []
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": artistName,
    "description": `${artistName} - Spotify streaming data and analytics`,
    "genre": "Music",
    "album": albums.map(album => ({
      "@type": "MusicAlbum",
      "name": album.name,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artistName
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ListenAction",
        "userInteractionCount": album.totalStreams
      }
    })),
    "track": topTracks.map((track, index) => ({
      "@type": "MusicRecording",
      "name": track.name,
      "position": index + 1,
      "byArtist": {
        "@type": "MusicGroup",
        "name": artistName
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ListenAction",
        "userInteractionCount": track.streams
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

// FAQ Structured Data for About page
export const FAQStructuredData: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": "StreamClout FAQ - Spotify Streaming Data Questions",
    "description": "Frequently asked questions about StreamClout's Spotify streaming data analytics platform",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Where does the Spotify streaming data come from?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Spotify streaming data comes from Spotify's internal API that employees and internal services use. We found a way of accessing these internal systems through legal methods and are now offering the real-time track stream counts to the public for transparency."
        }
      },
      {
        "@type": "Question",
        "name": "How accurate are the Spotify track streams?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Spotify track streams and daily stream counts are updated every day and are 100% accurate - feel free to verify using the Spotify desktop application. Our data matches exactly with Spotify's internal systems."
        }
      },
      {
        "@type": "Question",
        "name": "How frequently is Spotify streaming data updated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Spotify streaming data and track stream counts are updated every day around 9pm EST, ensuring you always have access to the latest streaming performance metrics."
        }
      },
      {
        "@type": "Question",
        "name": "How is revenue calculated from stream counts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We estimate revenue based on the total Spotify track streams a song or album collected. We then multiply the total stream count by $0.004, which is an estimation for the average amount Spotify pays per stream."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export default {
  TrackStructuredData,
  AlbumStructuredData,
  ArtistStructuredData,
  FAQStructuredData
};