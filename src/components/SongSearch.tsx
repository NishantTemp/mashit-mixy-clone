
import { useState, useEffect } from 'react';
import { Search, X, Music } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  image: string;
}

interface SongSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: Song) => void;
  searchPlaceholder?: string;
}

const SongSearch = ({ isOpen, onClose, onSelectSong, searchPlaceholder = "Search songs..." }: SongSearchProps) => {
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-3 text-white/90 placeholder-white/40 focus:outline-none focus:border-[#7A6FF0] transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="p-8 text-center">
              <Music className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Start typing to search for songs</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white/60 text-sm">No songs found</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#2A2A2A] rounded-xl transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-[#2A2A2A] rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/${song.image}?w=48&h=48&fit=crop`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white/90 font-medium text-sm truncate">{song.title}</h4>
                    <p className="text-white/60 text-xs truncate">{song.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongSearch;
