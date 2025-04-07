// Enhanced dataProcessors.ts
import _ from 'lodash';
import { Track } from '@/types/api';

interface GroupedTrack extends Track {
  streamHistory: Array<{
    date: string;
    streams: number;
  }>;
  clout_points?: number;
  isNew?: boolean;
}

/**
 * Processes raw track data into a grouped format by track_id
 * showing max playcount per track with full streaming history
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
    
    // Check if tracks have day property or streamHistory property
    const hasDayProperty = rawTracks.some((track: any) => track.day);
    const hasStreamHistoryProperty = rawTracks.some((track: any) => 
      track.streamHistory && track.streamHistory.length > 0
    );
    
    console.log(`[processTrackData] Tracks have day property: ${hasDayProperty}`);
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
    
    // Create stream history from existing data or generate synthetic data
    let streamHistory: { date: string; streams: number; }[] = [];
    
    // Case 1: Track already has streamHistory property
    if (trackItems.some(track => 
      (track as any).streamHistory && 
      Array.isArray((track as any).streamHistory) &&
      (track as any).streamHistory.length > 0
    )) {
      // Find the track with streamHistory
      const trackWithHistory = trackItems.find(track => 
        (track as any).streamHistory && 
        Array.isArray((track as any).streamHistory) &&
        (track as any).streamHistory.length > 0
      );
      
      if (trackWithHistory) {
        const existingHistory = (trackWithHistory as any).streamHistory;
        
        streamHistory = existingHistory
          .filter((item: any) => item && typeof item.date === 'string' && typeof item.streams === 'number')
          .map((item: any) => ({
            date: item.date,
            streams: item.streams
          }));
        
        console.log(`[processTrackData] Track ${trackWithMaxPlaycount.name}: Using existing stream history with ${streamHistory.length} points`);
      }
    }
    // Case 2: Tracks have day property - create streamHistory from day-based data
    else if (trackItems.some((track: any) => track.day)) {
      // Filter tracks that have the day property
      const tracksWithDay = trackItems.filter((track: any) => track.day);
      
      streamHistory = tracksWithDay.map(track => ({
        date: (track as any).day,
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
    
    // Case 3: Generate synthetic data if we still don't have stream history
    if (streamHistory.length === 0) {
      console.log(`[processTrackData] Track ${trackWithMaxPlaycount.name}: Generating synthetic stream history`);
      
      const playcount = trackWithMaxPlaycount.playcount || 100;
      const today = new Date();
      
      // Create 7 days of data with a realistic growth pattern
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        
        // Create a realistic growth curve (70% to 100% of current playcount)
        const growthFactor = 0.7 + ((0.3 / 6) * i);
        const streams = Math.round(playcount * growthFactor);
        
        streamHistory.push({
          date: date.toISOString().split('T')[0],
          streams
        });
      }
    }
    
    // Create final track object with stream history
    const groupedTrack: GroupedTrack = {
      ...trackWithMaxPlaycount,
      streamHistory
    };
    
    // Add clout points if available on any track in the group
    const trackWithClout = trackItems.find(track => (track as any).clout_points !== undefined);
    if (trackWithClout) {
      groupedTrack.clout_points = (trackWithClout as any).clout_points;
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
export const extractStreamHistory = (track: Track): Array<{date: string, streams: number}> => {
  // Case 1: Track already has streamHistory property
  if ((track as any).streamHistory && 
      Array.isArray((track as any).streamHistory) &&
      (track as any).streamHistory.length > 0) {
    
    return (track as any).streamHistory.map((item: any) => ({
      date: item.date,
      streams: item.streams
    }));
  }
  
  // Case 2: Track has day property
  if ((track as any).day) {
    return [{
      date: (track as any).day,
      streams: track.playcount || 0
    }];
  }
  
  // Case 3: Generate synthetic data
  const playcount = track.playcount || 100;
  const today = new Date();
  const result: Array<{date: string, streams: number}> = [];
  
  // Create 7 days of synthetic data with a realistic growth pattern
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    
    // Create a realistic growth curve (70% to 100% of current playcount)
    const growthFactor = 0.7 + ((0.3 / 6) * i);
    const streams = Math.round(playcount * growthFactor);
    
    result.push({
      date: date.toISOString().split('T')[0],
      streams
    });
  }
  
  return result;
};