
import { useState } from 'react';
import { Play, Pause, Music, Plus, Edit, Share, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SongSearch from '@/components/SongSearch';

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [vocalSong, setVocalSong] = useState(null);
  const [instrumentalSong, setInstrumentalSong] = useState(null);
  const [activeSearch, setActiveSearch] = useState<'vocal' | 'instrumental' | null>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFlip = () => {
    const temp = vocalSong;
    setVocalSong(instrumentalSong);
    setInstrumentalSong(temp);
  };

  const handleSongCardClick = (type: 'vocal' | 'instrumental') => {
    setActiveSearch(type);
  };

  const handleSelectSong = (song) => {
    if (activeSearch === 'vocal') {
      setVocalSong(song);
    } else if (activeSearch === 'instrumental') {
      setInstrumentalSong(song);
    }
    setActiveSearch(null);
  };

  const handleCloseSearch = () => {
    setActiveSearch(null);
  };

  const SongCard = ({ type, song, onClick, showSearch }) => (
    <div className="flex-1 min-h-[180px] sm:min-h-[200px] relative">
      <div 
        className="bg-[#1A1A1A] rounded-2xl p-4 sm:p-6 border border-[#2A2A2A] cursor-pointer hover:bg-[#202020] transition-all duration-200 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center space-y-3 sm:space-y-4" 
        onClick={onClick}
      >
        {song ? (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2A2A2A] rounded-xl flex items-center justify-center flex-shrink-0">
              <img 
                src={`https://images.unsplash.com/${song.image}?w=80&h=80&fit=crop`} 
                alt="Album art" 
                className="w-full h-full rounded-xl object-cover" 
              />
            </div>
            <div className="text-center flex-1 min-w-0">
              <h3 className="text-white/90 font-medium text-xs sm:text-sm mb-1 truncate">{song.title}</h3>
              <p className="text-white/60 text-xs truncate">{song.artist}</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2A2A2A] rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="relative">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white/40 absolute -top-1 -right-1" />
              </div>
            </div>
          </div>
        )}
        <div className="text-center mt-auto">
          <span className="text-[#7A6FF0] text-xs font-medium uppercase tracking-wider">
            {type}
          </span>
        </div>
      </div>
      
      {showSearch && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2">
          <SongSearch
            onSelectSong={handleSelectSong}
            onClose={handleCloseSearch}
            searchPlaceholder={`Search ${type.toLowerCase()} songs...`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-white/90 mb-2">Mashit.fun</h1>
        </div>

        {/* Song Selection Row */}
        <div className="flex items-start gap-2 sm:gap-4 w-full">
          <SongCard 
            type="Vocal" 
            song={vocalSong} 
            onClick={() => handleSongCardClick('vocal')} 
            showSearch={activeSearch === 'vocal'}
          />
          
          {/* Flip Button */}
          <button 
            onClick={handleFlip} 
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-2 sm:p-3 hover:bg-[#202020] transition-all duration-200 shadow-inner flex-shrink-0 relative mt-4"
          >
            <div className="flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/70 -ml-1" />
            </div>
          </button>
          
          <SongCard 
            type="Instrumental" 
            song={instrumentalSong} 
            onClick={() => handleSongCardClick('instrumental')} 
            showSearch={activeSearch === 'instrumental'}
          />
        </div>

        {/* Waveform Visualizer */}
        <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 border border-[#2A2A2A] w-full">
          <div className="flex items-center justify-center space-x-1 h-12 sm:h-16 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="bg-[#7A6FF0] rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  width: '2px',
                  height: `${Math.random() * 30 + 8}px`,
                  opacity: isPlaying ? 0.8 : 0.3,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex justify-center">
          <button 
            onClick={handlePlayPause} 
            className="bg-[#7A6FF0] hover:bg-[#6B5FE0] rounded-full p-3 sm:p-4 transition-all duration-200 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
          <Button 
            variant="outline" 
            className="bg-[#1A1A1A] border-[#2A2A2A] text-white/80 hover:bg-[#202020] hover:text-white rounded-full px-6 py-3 flex-1 sm:flex-none"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            className="bg-[#7A6FF0] hover:bg-[#6B5FE0] text-white rounded-full px-6 py-3 flex-1 sm:flex-none"
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
