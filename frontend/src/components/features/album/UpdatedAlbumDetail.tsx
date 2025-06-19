import React, { useMemo, useState, useEffect } from 'react';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Activity, Clock, DollarSign, DownloadCloud, PieChart, Headphones, Calendar, Play, Shield, RotateCcw, CheckCircle, Star, Award, Flame } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { Track } from '@/types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';
import { formatNumber, formatNumberWithCommas, formatRevenue, calculateRevenue } from '@/lib/utils/formatters';
import { downloadAlbumData } from '@/lib/utils/downloadUtils';
import { Button } from '@/components/ui/button';
import UpdatedMiniStreamChart from '../tracks/UpdatedMiniStreamChart';
import SEOHead from '@/components/seo/SEOHead';

// Define interfaces for types
interface StreamHistoryItem {
  date: string;
  streams: number;
}

interface TrackWithHistory extends Track {
  streamHistory?: StreamHistoryItem[];
  hasRecentData?: boolean;
}

interface AlbumDetails {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  cover_art: string;
  release_date: string;
}

interface AlbumDetailProps {
  selectedAlbum: SearchResult | null;
  tracks: Track[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  onBackToSearch: () => void;
  albumDetails: AlbumDetails | null;
}

interface TrackRowProps {
  track: TrackWithHistory;
  index: number;
  totalTracks: number;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, index, totalTracks }) => {
  const revenue = calculateRevenue(track.playcount || 0);
  const marketShare = totalTracks > 0 ? ((track.playcount || 0) / totalTracks) * 100 : 0;

  // Calculate growth
  let growth = 0;
  if (track.pct_change !== undefined) {
    growth = track.pct_change;
  }

  // Modern ranking styles inspired by trading platforms
  const getRankingStyle = (position: number) => {
    switch (position) {
      case 0: // Gold - Vibrant cyan/blue like in the image
        return 'bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-cyan-600/10 border border-cyan-400/30 shadow-lg shadow-cyan-500/20';
      case 1: // Silver - Purple/pink accent
        return 'bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-purple-600/10 border border-purple-400/30 shadow-lg shadow-purple-500/20';
      case 2: // Bronze - Orange/amber accent
        return 'bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-600/10 border border-orange-400/30 shadow-lg shadow-orange-500/20';
      default:
        return 'bg-slate-800/40 border border-slate-700/30 shadow-lg shadow-slate-900/20 hover:bg-slate-800/60';
    }
  };

  const getRankBadgeStyle = (position: number) => {
    switch (position) {
      case 0: // Gold
        return 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-xl shadow-cyan-500/40';
      case 1: // Silver
        return 'bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-xl shadow-purple-500/40';
      case 2: // Bronze
        return 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-xl shadow-orange-500/40';
      default:
        return 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200 shadow-lg';
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Award className="w-3 h-3" />;
      case 1:
        return <Star className="w-3 h-3" />;
      case 2:
        return <Flame className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <article className={`group relative rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl ${getRankingStyle(index)}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex items-center gap-6">
        {/* Modern Rank Badge */}
        <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${getRankBadgeStyle(index)}`}>
          <div className="absolute inset-0 rounded-xl bg-white/20 backdrop-blur-sm" />
          <div className="relative flex items-center gap-1">
            {getRankIcon(index)}
            <span>{index + 1}</span>
          </div>
        </div>

        {/* Track Information */}
        <div className="w-64 lg:w-80 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white truncate group-hover:text-cyan-300 transition-colors duration-300">
              {track.name}
            </h3>
          </div>
          <p className="text-slate-300 text-sm truncate">
            {track.artist_name}
          </p>
        </div>

        {/* Expanded Mini Chart */}
        <div className="hidden md:block flex-shrink-0 w-48 lg:w-64 h-16 lg:h-20">
          <UpdatedMiniStreamChart track={track} height="100%" />
        </div>

        {/* Professional Metrics Grid */}
        <div className="hidden md:flex items-center gap-8 flex-shrink-0">
          {/* Streams */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {formatNumber(track.playcount || 0)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Streams
            </div>
          </div>

          {/* Growth with modern styling */}
          <div className="text-center">
            <div className={`text-xl font-bold mb-1 flex items-center justify-center gap-2 ${
              growth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>{growth === 0 ? '-' : `${Math.abs(growth).toFixed(1)}%`}</span>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              7D Growth
            </div>
          </div>

          {/* Revenue */}
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
              ${formatRevenue(revenue)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Revenue
            </div>
          </div>

          {/* Market Share with progress bar */}
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
              {marketShare.toFixed(1)}%
            </div>
            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                style={{ width: `${Math.min(marketShare * 2, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">
              Share
            </div>
          </div>
        </div>

        {/* Mobile Metrics */}
        <div className="md:hidden flex flex-col items-end">
          <div className="text-lg font-bold text-white mb-1">
            {formatNumber(track.playcount || 0)}
          </div>
          <div className={`text-sm font-semibold flex items-center gap-1 ${
            growth >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {growth === 0 ? '-' : `${Math.abs(growth).toFixed(1)}%`}
          </div>
        </div>
      </div>
    </article>
  );
};

// Live Countdown Component
const LiveRefreshCountdown: React.FC = () => {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));

      // Create next 10 AM EST
      const next10AM = new Date(est);
      next10AM.setHours(10, 0, 0, 0);

      // If it's already past 10 AM today, set to 10 AM tomorrow
      if (est.getHours() >= 10) {
        next10AM.setDate(next10AM.getDate() + 1);
      }

      const diffMs = next10AM.getTime() - est.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilRefresh(`${hours}h ${minutes}m`);
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <RotateCcw className="w-4 h-4 text-amber-400" style={{
        animation: 'spin 3s linear infinite reverse'
      }} />
      <span className="text-amber-300 text-sm font-medium">{timeUntilRefresh}</span>
    </div>
  );
};

const UpdatedAlbumDetail: React.FC<AlbumDetailProps> = ({
  selectedAlbum,
  tracks,
  totalStreams,
  loading,
  error,
  onBackToSearch,
  albumDetails
}) => {
  // Initialize processed tracks and calculated total streams
  const { processedTracks, calculatedTotalStreams, totalRevenue, avgGrowth } = useMemo(() => {
    // Early return for empty tracks
    if (!tracks || tracks.length === 0) {
      return {
        processedTracks: [],
        calculatedTotalStreams: 0,
        totalRevenue: 0,
        avgGrowth: 0
      };
    }

    // First process tracks to ensure they have streamHistory
    let processed = tracks;

    // Check if tracks already have streamHistory
    const needsProcessing = !tracks.some(track => {
      const trackWithHistory = track as TrackWithHistory;
      return trackWithHistory.streamHistory &&
        Array.isArray(trackWithHistory.streamHistory) &&
        trackWithHistory.streamHistory.length > 0;
    });

    // Process tracks if needed
    if (needsProcessing) {
      processed = processTrackData(tracks) as TrackWithHistory[];
    }

    // Sort tracks by playcount for ranking
    processed = processed.sort((a, b) => (b.playcount || 0) - (a.playcount || 0));

    // Calculate metrics
    const totalCalcStreams = processed.reduce((sum, track) => sum + (track.playcount || 0), 0);
    const totalRev = calculateRevenue(totalCalcStreams);

    // Calculate average growth
    const tracksWithGrowth = processed.filter(track =>
      track.pct_change !== undefined && !isNaN(track.pct_change)
    );
    const avgGrowthCalc = tracksWithGrowth.length > 0
      ? tracksWithGrowth.reduce((sum, track) => sum + (track.pct_change || 0), 0) / tracksWithGrowth.length
      : 0;

    return {
      processedTracks: processed,
      calculatedTotalStreams: totalCalcStreams,
      totalRevenue: totalRev,
      avgGrowth: avgGrowthCalc
    };
  }, [tracks]);

  // Use calculated total streams or fallback to provided total
  const actualTotalStreams = calculatedTotalStreams > 0 ? calculatedTotalStreams : totalStreams;

  // Return null if no selected album
  if (!selectedAlbum) return null;

  // Get album details from either source
  const album = albumDetails || selectedAlbum;

  // Handle download
  const handleDownload = () => {
    downloadAlbumData(
      album.album_name,
      album.artist_name,
      processedTracks,
      new Date().toISOString()
    );
  };

  // Calculate additional metrics
  const releaseDate = new Date(album.release_date);
  const daysSinceRelease = Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get top track for SEO
  const topTrack = processedTracks.length > 0 ? processedTracks[0] : null;

  return (
    <>
      {/* SEO Head with dynamic album data */}
      <SEOHead
        albumData={{
          name: album.album_name,
          artist: album.artist_name,
          totalStreams: actualTotalStreams,
          topTrack: topTrack?.name,
          releaseDate: album.release_date
        }}
        canonicalUrl={`https://streamclout.io/album/${album.album_id}`}
      />

      <main className="min-h-screen relative overflow-hidden" role="main">
        {/* Sophisticated background gradients */}
        <div className="absolute inset-0" />
        <div className="absolute inset-0" />
        <div className="absolute inset-0" />
        <div className="absolute inset-0" />

        {/* Modern Header with Glass Effect */}
        <header className="sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBackToSearch}
                className="flex items-center gap-3 text-slate-400 hover:text-cyan-300 transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-semibold text-lg">Back</span>
              </button>

              <div className="flex items-center gap-6">
                {/* Modern Trust Indicators - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 text-sm font-medium">Verified</span>
                  </div>

                  <LiveRefreshCountdown />
                </div>

                <Button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-xl">
              <div className="text-red-300">{error}</div>
            </div>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* World-Class Geometric Hero Section */}
          <section className="mb-16" aria-labelledby="album-title">
            {/* Perfect Golden Ratio Layout Container */}
            <div className="relative">
              {/* Two-Row Layout */}
              <div className="space-y-8">
                {/* First Row: Album Cover + Info */}
                <div className="grid grid-cols-12 gap-8 items-start">
                  {/* Album Artwork Column - 3 units */}
                  <div className="col-span-12 lg:col-span-3">
                    <div className="relative group">
                      {/* Perfect Square Album Cover */}
                      <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-cyan-400/30 transition-all duration-500">
                        <img
                          src={album.cover_art}
                          alt={`${album.album_name} album cover by ${album.artist_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      {/* Floating Status Indicator */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full p-3 shadow-xl shadow-cyan-500/50">
                        <Activity className="w-5 h-5 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Content Column - 9 units */}
                  <div className="col-span-12 lg:col-span-9">
                    {/* Typography Hierarchy */}
                    <div className="mb-4">
                      <h1 id="album-title" className="text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent leading-tight mb-2">
                        {album.album_name}
                      </h1>
                      <h2 className="text-2xl lg:text-3xl text-slate-300 font-light tracking-wide mb-4">
                        {album.artist_name}
                      </h2>

                      {/* Metadata Row with Perfect Spacing */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-400 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                          </div>
                          <span className="font-medium">Released {releaseDate.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="font-medium">{formatNumberWithCommas(daysSinceRelease)} days in market</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Headphones className="w-4 h-4 text-orange-400" />
                          </div>
                          <span className="font-medium">{processedTracks.length} tracks</span>
                        </div>
                      </div>

                      {/* Compact KPI Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Total Streams - Emerald Theme */}
                        <div className="group relative overflow-hidden">
                          {/* Compact Glass Background */}
                          <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 group-hover:border-emerald-500/30 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Compact Content */}
                          <div className="relative p-4 flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors duration-300 border border-emerald-500/20 flex-shrink-0">
                              <Play className="w-5 h-5 text-emerald-400" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-emerald-300/90 uppercase tracking-wider font-bold">
                                  Total Streams
                                </span>
                                <CheckCircle className="w-3 h-3 text-emerald-400/80" />
                              </div>
                              <div className="text-2xl font-black text-white group-hover:text-emerald-50 transition-colors duration-300 leading-none">
                                {formatNumber(actualTotalStreams)}
                              </div>
                              <div className="text-xs text-slate-400 font-medium mt-1">
                                All-time performance
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Revenue - Amber Theme */}
                        <div className="group relative overflow-hidden">
                          {/* Compact Glass Background */}
                          <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 group-hover:border-amber-500/30 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Compact Content */}
                          <div className="relative p-4 flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors duration-300 border border-amber-500/20 flex-shrink-0">
                              <DollarSign className="w-5 h-5 text-amber-400" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-amber-300/90 uppercase tracking-wider font-bold">
                                  Revenue Est.
                                </span>
                                <CheckCircle className="w-3 h-3 text-emerald-400/80" />
                              </div>
                              <div className="text-2xl font-black text-white group-hover:text-amber-50 transition-colors duration-300 leading-none">
                                ${formatRevenue(totalRevenue)}
                              </div>
                              <div className="text-xs text-slate-400 font-medium mt-1">
                                Estimated earnings
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Growth - Purple Theme */}
                        <div className="group relative overflow-hidden">
                          {/* Compact Glass Background */}
                          <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50 group-hover:border-purple-500/30 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Compact Content */}
                          <div className="relative p-4 flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors duration-300 border border-purple-500/20 flex-shrink-0">
                              <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-purple-300/90 uppercase tracking-wider font-bold">
                                  7D Growth
                                </span>
                                <CheckCircle className="w-3 h-3 text-emerald-400/80" />
                              </div>
                              <div className={`text-2xl font-black flex items-center gap-2 transition-colors duration-300 leading-none ${
                                avgGrowth >= 0 ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-red-400 group-hover:text-red-300'
                              }`}>
                                {avgGrowth === 0 ? '-' : `${Math.abs(avgGrowth).toFixed(1)}%`}
                              </div>
                              <div className="text-xs text-slate-400 font-medium mt-1">
                                Weekly trend
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Modern Track Performance Section */}
          <section className="space-y-8" aria-labelledby="track-performance-title">
            {/* Floating Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 id="track-performance-title" className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent mb-2">
                  Spotify Track Streaming Performance
                </h2>
                <p className="text-slate-400 text-lg">
                  Real-time Spotify streaming data analytics with advanced market insights for {album.album_name}
                </p>
              </div>
            </div>

            {/* Floating Track List */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-cyan-400/30" />
                  </div>
                  <span className="text-slate-300 text-xl font-medium">Analyzing Spotify streaming data...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {processedTracks.length > 0 ? (
                  processedTracks.map((track, index) => (
                    <TrackRow
                      key={track.track_id}
                      track={track}
                      index={index}
                      totalTracks={actualTotalStreams}
                    />
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center">
                      <PieChart className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Spotify Streaming Data Available</h3>
                    <p className="text-slate-400 text-lg">Unable to load Spotify stream counts for this album</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Schema.org structured data for better SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicPlaylist",
            "name": `${album.album_name} - Spotify Streaming Analytics`,
            "description": `View comprehensive Spotify streaming data for ${album.album_name} by ${album.artist_name}. Track-by-track stream counts, growth analytics, and performance metrics.`,
            "author": {
              "@type": "MusicGroup",
              "name": album.artist_name
            },
            "numTracks": processedTracks.length,
            "tracks": processedTracks.slice(0, 5).map((track, index) => ({
              "@type": "MusicRecording",
              "name": track.name,
              "byArtist": track.artist_name,
              "position": index + 1,
              "interactionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/ListenAction",
                "userInteractionCount": track.playcount || 0
              }
            }))
          })}
        </script>
      </main>
    </>
  );
};

export default UpdatedAlbumDetail;