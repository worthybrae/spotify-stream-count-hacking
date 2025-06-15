// lib/utils/downloadUtils.ts
import { Track, GroupedTrack } from '@/types/api';

/**
 * Helper function to download album streaming data as CSV with full streaming history
 */
export const downloadAlbumData = (
    albumName: string,
    artistName: string,
    tracks: Array<Track | GroupedTrack>,
    timestamp: string = new Date().toISOString()
  ) => {
    // Check if we have any tracks with streaming history
    const hasStreamHistory = tracks.some(
      track => 'streamHistory' in track && track.streamHistory && track.streamHistory.length > 0
    );

    if (hasStreamHistory) {
      // Enhanced CSV export with streaming history
      downloadStreamingHistory(albumName, artistName, tracks as GroupedTrack[]);
    } else {
      // Fallback to basic export if no streaming history is available
      downloadBasicTrackData(albumName, artistName, tracks, timestamp);
    }
  };

/**
 * Download complete streaming history for all tracks
 */
const downloadStreamingHistory = (
  albumName: string,
  artistName: string,
  tracks: GroupedTrack[]
) => {
  // First, collect all unique dates across all tracks
  const allDates = new Set<string>();

  tracks.forEach(track => {
    if (track.streamHistory) {
      track.streamHistory.forEach(entry => {
        allDates.add(entry.date);
      });
    }
  });

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Create CSV content directly starting with the streaming history
  let csvContent = '';

  // Daily streaming history section
  // Create headers: Date, Track1, Track2, etc.
  csvContent += 'Date,' + tracks.map(t => `"${(t.name || 'Unknown Track').replace(/"/g, '""')}"`).join(',') + '\n';

  // Add data for each date
  sortedDates.forEach(date => {
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString();

    const streamValues: number[] = [];

    // Get stream count for each track on this date
    tracks.forEach(track => {
      const historyEntry = track.streamHistory?.find(entry => entry.date === date);
      const streamCount = historyEntry ? historyEntry.streams : 0;
      streamValues.push(streamCount);
    });

    // Add the row with date and all track values
    csvContent += `${formattedDate},${streamValues.join(',')}\n`;
  });

  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger download
  const link = document.createElement('a');
  const formattedDate = new Date().toLocaleDateString().replace(/\//g, '-');
  const safeName = `${albumName.replace(/[^\w\s]/gi, '')}_${artistName.replace(/[^\w\s]/gi, '')}_streams_${formattedDate}`;

  link.href = url;
  link.setAttribute('download', `${safeName}.csv`);
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Fallback function for basic track data download (original implementation)
 */
const downloadBasicTrackData = (
  albumName: string,
  artistName: string,
  tracks: Array<Track>,
  timestamp: string
) => {
  // Create CSV headers
  const headers = ['Track ID', 'Track Name', 'Play Count', 'Timestamp'];

  // Create CSV rows from track data
  const rows = tracks.map(track => [
    track.track_id,
    `"${(track.name || 'Unknown Track').replace(/"/g, '""')}"`,
    track.playcount?.toString() || '0',
    timestamp
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger download
  const link = document.createElement('a');
  const safeName = `${albumName.replace(/[^\w\s]/gi, '')}_${artistName.replace(/[^\w\s]/gi, '')}_streams`;

  link.href = url;
  link.setAttribute('download', `${safeName}.csv`);
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};