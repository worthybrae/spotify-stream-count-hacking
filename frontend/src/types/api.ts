// types/api.ts
export interface Artist {
  artist_id: string;
  name: string;
}

export interface Album {
  album_id: string;
  name: string;
  artist_id: string;
  cover_art: string;
  release_date: string;
  artist_name: string;
}

// Update the Track interface in types/api.ts
export interface Track {
  track_id: string;
  name: string;
  playcount: number;
  artist_name?: string;
  artist_id?: string;
  album_id?: string;
  album_name?: string;
  cover_art?: string;
  day?: string; // Optional day property for tracking daily streams
  stream_recorded_at?: string; // Add this property to fix the error
  clout_points?: number; // Added clout points property
  streamHistory?: Array<{  // Optional stream history for the grouped view
    date: string;
    streams: number;
  }>;
}
export interface AlbumResponse {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  tracks: Track[];
  total_streams?: number;
  cover_art?: string;
  release_date?: string;
}

export interface StreamCount {
  track_id: string;
  playcount: number;
  timestamp?: string;
}

export interface NewRelease {
  album_id: string;
  album_name: string;
  cover_art: string;
  artist_name: string;
  artist_id: string;
  release_date: string;
}

export interface AlbumWithTracksResponse {
  album: {
    album_id: string;
    album_name: string;
    artist_id: string;
    artist_name: string;
    cover_art: string;
    release_date: string;
  };
  tracks: Track[];
  total_streams: number;
}

export interface StreamsAddRequest {
  album_id: string;
  streams: StreamCount[];
}

export interface AlbumSaveRequest {
  album: NewRelease;
  streamHistory: StreamCount[];
  tracks: Track[];
}

export interface GroupedTrack extends Track {
  streamHistory: Array<{
    date: string;
    streams: number;
  }>;
  clout_points?: number;
  isNew?: boolean;
}

export interface CloutScoreResponse {
  current_score: number;
  trend_data: Array<{
    date: string;
    score: number;
  }>;
  growth_percentage: number;
  rank_percentile: number;
}

export interface AlbumInfo {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  cover_art: string;
  release_date: string;
}

// API Key related interfaces
export interface ApiRequest {
  timestamp: string;
  endpoint: string;
  ip_address?: string;
}

export interface ApiKeyInfo {
  api_key: string;
  ip_address: string;
  created_at: string;
  is_active: boolean;
  requests?: ApiRequest[];
}

// Define the clout history item type
export interface CloutHistoryItem {
  day: string;
  daily_clout: number;
  cumulative_clout: number;
}

// Update the GroupedTrack interface to include clout-related fields
export interface GroupedTrack extends Track {
  streamHistory: Array<{
    date: string;
    streams: number;
  }>;
  clout_points?: number;
  isNew?: boolean;
  position?: number;
  cloutHistory?: CloutHistoryItem[];
}

// Add track clout response interface
export interface TrackCloutResponse {
  user_id: string;
  tracks: Array<{
    track_id: string;
    track_name: string;
    artist_name: string;
    album_id: string;
    album_name: string;
    cover_art: string;
    clout_history: CloutHistoryItem[];
  }>;
}