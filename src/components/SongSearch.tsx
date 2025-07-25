
import { useState, useEffect } from 'react';
import { Search, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { type Song } from '@/types/song';
import { toast } from '@/components/ui/use-toast';

interface SongSearchProps {
  onSelectSong: (song: Song) => void;
  onClose: () => void;
  searchPlaceholder?: string;
}

const SongSearch = ({ onSelectSong, onClose, searchPlaceholder = "Search songs..." }: SongSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongTitle, setSelectedSongTitle] = useState('');

  const { data: songs, isLoading, error } = useQuery<Song[]>({
    queryKey: ['songs', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/songs?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  const handleSelectSong = async (song: Song) => {
    try {
      const response = await fetch(`/api/songs/download/${song.id}?searchTerm=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to download song');
      }
      const data = await response.json();
      
      // Update song with download info and notify parent
      const songWithDownload = {
        ...song,
        downloadUrl: data.downloadUrl,
        title: searchQuery,
        originalTitle: song.title
      };
      onSelectSong(songWithDownload);
      setSearchQuery('');
    } catch (error) {
      console.error('Error downloading song:', error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to download song. Please try again.",
        variant: "destructive"
      });
      // You might want to show a toast notification here
    }
  };

  // Close search when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] shadow-xl max-w-sm w-full">
      {/* Search Input */}
      <div className="p-3 border-b border-[#2A2A2A]">
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedSongTitle('');
            }}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[#7A6FF0] transition-colors"
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-[#0D0D0D]">
        {isLoading ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">Loading songs...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">Error loading songs</p>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="p-4 text-center">
            <Music className="w-6 h-6 text-white/30 mx-auto mb-2" />
            <p className="text-white/60 text-xs">Start typing to search</p>
          </div>
        ) : songs?.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">No songs found</p>
          </div>
        ) : (
          <div className="p-2">
            {songs?.map((song) => (
              <button
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="w-full flex items-center gap-3 p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={song.image}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white/90 font-medium text-xs truncate">{song.originalTitle || song.title}</h4>
                  <p className="text-white/60 text-xs truncate">{song.artist}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongSearch;
