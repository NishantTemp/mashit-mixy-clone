
import { useState, useEffect } from 'react';
import { Search, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { type Song } from '@/types/song';

interface SongSearchProps {
  onSelectSong: (song: Song) => void;
  onClose: () => void;
  searchPlaceholder?: string;
}

const SongSearch = ({ onSelectSong, onClose, searchPlaceholder = "Search songs..." }: SongSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  const { data: songs, isLoading, error } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const response = await fetch('/api/songs');
      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (searchQuery.trim() === '' || !songs) {
      setSearchResults([]);
      return;
    }

    // Filter songs based on search query
    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery, songs]);

  const handleSelectSong = (song: Song) => {
    onSelectSong(song);
    setSearchQuery('');
    setSearchResults([]);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[#7A6FF0] transition-colors"
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">Loading songs...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">Error loading songs</p>
          </div>
        ) : searchQuery.trim() === '' ? (
          <div className="p-4 text-center">
            <Music className="w-6 h-6 text-white/30 mx-auto mb-2" />
            <p className="text-white/60 text-xs">Start typing to search</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-white/60 text-xs">No songs found</p>
          </div>
        ) : (
          <div className="p-2">
            {searchResults.map((song) => (
              <button
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="w-full flex items-center gap-3 p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/${song.image}?w=40&h=40&fit=crop`}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white/90 font-medium text-xs truncate">{song.title}</h4>
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
