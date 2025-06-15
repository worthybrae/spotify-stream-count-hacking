// Enhanced dataProcessors.ts for the new API structure
import _ from 'lodash';
import { Track } from '@/types/api';

interface StreamHistoryItem {
  date: string;
  streams: number;
  newStreams: number;
}

interface TrackWithDay extends Track {
  day?: string;
  stream_recorded_at?: string;
}

interface TrackWithHistory extends Track {
  streamHistory?: StreamHistoryItem[];
}

interface GroupedTrack extends Track {
  streamHistory: StreamHistoryItem[];
  clout_points?: number;
  isNew?: boolean;
}

/**
 * Processes raw track data into a grouped format by track_id
 * showing max playcount per track with full streaming history
 * Compatible with the new API response format
 */
export const processTrackData = (rawTracks: Track[]): GroupedTrack[] => {
  // Debug raw data
  console.log(`[processTrackData] Processing ${rawTracks.length} track records`);

  if (!rawTracks || rawTracks.length === 0) {
    console.log('[processTrackData] No tracks to process');
    return [];
  }

  if (rawTracks.length > 0) {
    // Log sample to see structure
    console.log('[processTrackData] Sample track record:', rawTracks[0]);

    // Check for different data structures
    const hasDayProperty = rawTracks.some((track: TrackWithDay) => track.day || track.stream_recorded_at);
    const hasStreamHistoryProperty = rawTracks.some((track: Track) => {
      const trackWithHistory = track as TrackWithHistory;
      return trackWithHistory.streamHistory && trackWithHistory.streamHistory.length > 0;
    });

    console.log(`[processTrackData] Tracks have day/stream_recorded_at property: ${hasDayProperty}`);
    console.log(`[processTrackData] Tracks have streamHistory property: ${hasStreamHistoryProperty}`);
  }

  // Group tracks by track_id
  const groupedByTrackId = _.groupBy(rawTracks, 'track_id');
  console.log(`[processTrackData] Found ${Object.keys(groupedByTrackId).length} unique tracks`);

  // Create the grouped tracks array with stream history
  const groupedTracks = Object.entries(groupedByTrackId).map(([, trackItems]) => {
    // Sort tracks by timestamp to get the most recent one
    const sortedTracks = [...trackItems].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Get the most recent track
    const mostRecentTrack = sortedTracks[0];
    const currentStreams = mostRecentTrack.stream_count || 0;

    // Generate stream history from actual data
    const streamHistory: StreamHistoryItem[] = [];

    // Sort all tracks by timestamp (oldest to newest)
    const chronologicalTracks = [...trackItems].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateA.getTime() - dateB.getTime();
    });

    // Create stream history from actual data points
    let previousStreams = 0;
    chronologicalTracks.forEach(track => {
      const streams = track.stream_count || 0;
      streamHistory.push({
        date: track.timestamp || new Date().toISOString(),
        streams: streams,
        newStreams: Math.max(0, streams - previousStreams)
      });
      previousStreams = streams;
    });

    // Create final track object with stream history
    const groupedTrack: GroupedTrack = {
      ...mostRecentTrack,
      streamHistory,
      playcount: currentStreams,
      name: mostRecentTrack.track_name || '',
      track_id: mostRecentTrack.track_id || '',
      album_id: mostRecentTrack.album_id || '',
      album_name: mostRecentTrack.album_name || '',
      artist_name: mostRecentTrack.artist_name || '',
      artist_id: mostRecentTrack.artist_id || mostRecentTrack.album_id // Use album_id as fallback
    };

    // Add clout points if available on any track in the group
    const trackWithClout = trackItems.find(track => {
      const trackWithProps = track as TrackWithHistory & { clout_points?: number };
      return trackWithProps.clout_points !== undefined;
    }) as (Track & { clout_points?: number }) | undefined;

    if (trackWithClout) {
      groupedTrack.clout_points = trackWithClout.clout_points;
    }

    // Mark as new if it has clout points above threshold
    groupedTrack.isNew = groupedTrack.clout_points !== undefined &&
                        groupedTrack.clout_points > 10;

    return groupedTrack;
  });

  console.log(`[processTrackData] Finished processing, returning ${groupedTracks.length} grouped tracks`);
  return groupedTracks;
};

/**
 * Extract and process streaming data from track history
 * This helper function is useful for retrieving streaming history from tracks
 */
export const extractStreamHistory = (track: Track): StreamHistoryItem[] => {
  // Cast to appropriate types
  const trackWithHistory = track as TrackWithHistory;
  const trackWithDay = track as TrackWithDay;

  // Case 1: Track already has streamHistory property
  if (trackWithHistory.streamHistory &&
      Array.isArray(trackWithHistory.streamHistory) &&
      trackWithHistory.streamHistory.length > 0) {

    return trackWithHistory.streamHistory.map((item: StreamHistoryItem) => ({
      date: item.date,
      streams: item.streams,
      newStreams: item.newStreams || 0
    }));
  }

  // Case 2: Track has day property or stream_recorded_at
  if (trackWithDay.day || trackWithDay.stream_recorded_at) {
    return [{
      date: trackWithDay.stream_recorded_at || trackWithDay.day || '',
      streams: track.playcount || 0,
      newStreams: track.playcount || 0
    }];
  }

  // If no stream history data is available, return single point with current date
  return [{
    date: new Date().toISOString().split('T')[0],
    streams: track.playcount || 0,
    newStreams: track.playcount || 0
  }];
};