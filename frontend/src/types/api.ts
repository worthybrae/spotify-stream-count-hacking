export interface Artist {
    artist_id: string;
    name: string;
  }
  
  export interface Album {
    album_id: string;
    artist_id: string;
    name: string;
    cover_art: string;
    release_date: string;
  }
  
  export interface Track {
    track_id: string;
    name: string;
    playcount: number;
    artist_name: string;
  }
  
  export interface AlbumResponse {
    album_id: string;
    album_name: string;
    artist_id: string;
    artist_name: string;
    tracks: Track[];
  }
  
  export interface StreamCount {
    track_id: string;
    playcount: number;
    timestamp: string;
  }
  
  export interface NewRelease {
    album_id: string;
    album_name: string;
    cover_art: string;
    artist_name: string;
    artist_id: string;
    release_date: string;
  }