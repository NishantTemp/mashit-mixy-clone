
import { useState, useEffect } from 'react';
import { Search, Music } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: string;
}

interface SongSearchProps {
  onSelectSong: (song: Song) => void;
  onClose: () => void;
  searchPlaceholder?: string;
}

const SongSearch = ({ onSelectSong, onClose, searchPlaceholder = "Search songs..." }: SongSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  // Mock search results - in real app this would be an API call
  const mockSongs: Song[] = [
    { id: 1, title: "Summer Nights", artist: "Luna Bay", image: "photo-1618160702438-9b02ab6515c9" },
    { id: 2, title: "Electric Dreams", artist: "Neon Waves", image: "photo-1535268647677-057b9d5e3905" },
    { id: 3, title: "City Lights", artist: "Urban Echo", image: "photo-1582562124811-c09040d0a901" },
    { id: 4, title: "Midnight Drive", artist: "Synth Valley", image: "photo-1493225457124-a3eb161ffa5f" },
    { id: 5, title: "Neon Pulse", artist: "Digital Hearts", image: "photo-1571019613454-1cb2f99b2d8b" },
    { id: 6, title: "Starlight", artist: "Cosmic Drift", image: "photo-1493225457124-a3eb161ffa5f" },
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Filter songs based on search query
    const filtered = mockSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery]);

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
        {searchQuery.trim() === '' ? (
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
