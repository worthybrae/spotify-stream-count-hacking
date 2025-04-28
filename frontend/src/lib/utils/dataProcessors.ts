// Enhanced dataProcessors.ts for the new API structure
import _ from 'lodash';
import { Track } from '@/types/api';

interface StreamHistoryItem {
  date: string;
  streams: number;
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
    const hasStreamHistoryProperty = rawTracks.some((track: TrackWithHistory) =>
      track.streamHistory && track.streamHistory.length > 0
    );

    console.log(`[processTrackData] Tracks have day/stream_recorded_at property: ${hasDayProperty}`);
    console.log(`[processTrackData] Tracks have streamHistory property: ${hasStreamHistoryProperty}`);
  }

  // Group tracks by track_id
  const groupedByTrackId = _.groupBy(rawTracks, 'track_id');
  console.log(`[processTrackData] Found ${Object.keys(groupedByTrackId).length} unique tracks`);

  // Create the grouped tracks array with stream history
  const groupedTracks = Object.entries(groupedByTrackId).map(([trackId, trackItems]) => {
    // Debug group
    console.log(`[processTrackData] Processing track id: ${trackId} with ${trackItems.length} records`);

    // Get the track with the max playcount to use as base
    const trackWithMaxPlaycount = _.maxBy(trackItems, 'playcount') || trackItems[0];

    // Create stream history from existing data
    let streamHistory: StreamHistoryItem[] = [];

    // Case 1: Track already has streamHistory property
    if (trackItems.some(track => {
      const trackWithHistory = track as TrackWithHistory;
      return trackWithHistory.streamHistory &&
        Array.isArray(trackWithHistory.streamHistory) &&
        trackWithHistory.streamHistory.length > 0;
    })) {
      // Find the track with streamHistory
      const trackWithHistory = trackItems.find(track => {
        const castedTrack = track as TrackWithHistory;
        return castedTrack.streamHistory &&
          Array.isArray(castedTrack.streamHistory) &&
          castedTrack.streamHistory.length > 0;
      }) as TrackWithHistory;

      if (trackWithHistory && trackWithHistory.streamHistory) {
        const existingHistory = trackWithHistory.streamHistory;

        streamHistory = existingHistory
          .filter((item: StreamHistoryItem) => item && typeof item.date === 'string' && typeof item.streams === 'number')
          .map((item: StreamHistoryItem) => ({
            date: item.date,
            streams: item.streams
          }));

        console.log(`[processTrackData] Track ${trackWithMaxPlaycount.name}: Using existing stream history with ${streamHistory.length} points`);
      }
    }
    // Case 2: Tracks have day property or stream_recorded_at - create streamHistory from day-based data
    else if (trackItems.some((track: TrackWithDay) => track.day || track.stream_recorded_at)) {
      // Filter tracks that have the date property
      const tracksWithDay = trackItems.filter((track: TrackWithDay) => track.day || track.stream_recorded_at) as TrackWithDay[];

      // Map to a consistent date property
      streamHistory = tracksWithDay.map(track => ({
        date: track.stream_recorded_at || track.day || '',
        streams: track.playcount || 0
      }));

      // Sort by date
      streamHistory.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(`[processTrackData] Track ${trackWithMaxPlaycount.name}: Created ${streamHistory.length} stream history points from day property`);
    }

    // If we still don't have any stream history, use current date and playcount
    if (streamHistory.length === 0) {
      console.log(`[processTrackData] Track ${trackWithMaxPlaycount.name}: Using current date and playcount as single data point`);

      // Use current date and playcount as a single data point
      streamHistory = [{
        date: new Date().toISOString().split('T')[0],
        streams: trackWithMaxPlaycount.playcount || 0
      }];
    }

    // Create final track object with stream history
    const groupedTrack: GroupedTrack = {
      ...trackWithMaxPlaycount,
      streamHistory
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
      streams: item.streams
    }));
  }

  // Case 2: Track has day property or stream_recorded_at
  if (trackWithDay.day || trackWithDay.stream_recorded_at) {
    return [{
      date: trackWithDay.stream_recorded_at || trackWithDay.day || '',
      streams: track.playcount || 0
    }];
  }

  // If no stream history data is available, return single point with current date
  return [{
    date: new Date().toISOString().split('T')[0],
    streams: track.playcount || 0
  }];
};