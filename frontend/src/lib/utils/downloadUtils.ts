// lib/utils/downloadUtils.ts

/**
 * Helper function to download album streaming data as CSV
 */
export const downloadAlbumData = (
    albumName: string,
    artistName: string,
    tracks: Array<{
      track_id: string;
      name: string;
      playcount: number;
      artist_name?: string;
    }>,
    timestamp: string = new Date().toISOString()
  ) => {
    // Create CSV headers
    const headers = ['Track Name', 'Play Count', 'Timestamp'];
    
    // Create CSV rows from track data
    const rows = tracks.map(track => [
      track.name,
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
    const safeName = `${albumName.replace(/[^\w\s]/gi, '')}_${artistName.replace(/[^\w\s]/gi, '')}_streaming_data`;
    
    link.href = url;
    link.setAttribute('download', `${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };