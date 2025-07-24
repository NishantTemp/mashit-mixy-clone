
import { useState } from 'react';
import { Play, Pause, Music, Plus, RotateCcw, Edit, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [vocalSong, setVocalSong] = useState(null);
  const [instrumentalSong, setInstrumentalSong] = useState(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFlip = () => {
    const temp = vocalSong;
    setVocalSong(instrumentalSong);
    setInstrumentalSong(temp);
  };

  const SongCard = ({ type, song, onClick }) => (
    <div 
      className="bg-[#1A1A1A] rounded-2xl p-6 border border-[#2A2A2A] cursor-pointer hover:bg-[#202020] transition-all duration-200 flex-1 min-h-[200px] flex flex-col items-center justify-center space-y-4"
      onClick={onClick}
    >
      {song ? (
        <>
          <div className="w-20 h-20 bg-[#2A2A2A] rounded-xl flex items-center justify-center">
            <img 
              src={`https://images.unsplash.com/${song.image}?w=80&h=80&fit=crop`} 
              alt="Album art"
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
          <div className="text-center">
            <h3 className="text-white/90 font-medium text-sm mb-1">{song.title}</h3>
            <p className="text-white/60 text-xs">{song.artist}</p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-20 h-20 bg-[#2A2A2A] rounded-xl flex items-center justify-center">
            <div className="relative">
              <Music className="w-8 h-8 text-white/40" />
              <Plus className="w-4 h-4 text-white/40 absolute -top-1 -right-1" />
            </div>
          </div>
        </div>
      )}
      <div className="text-center">
        <span className="text-[#7A6FF0] text-xs font-medium uppercase tracking-wider">
          {type}
        </span>
      </div>
    </div>
  );

  const mockSongs = [
    { id: 1, title: "Summer Nights", artist: "Luna Bay", image: "photo-1618160702438-9b02ab6515c9" },
    { id: 2, title: "Electric Dreams", artist: "Neon Waves", image: "photo-1535268647677-057b9d5e3905" },
    { id: 3, title: "City Lights", artist: "Urban Echo", image: "photo-1582562124811-c09040d0a901" },
  ];

  const selectRandomSong = (type) => {
    const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
    if (type === 'vocal') {
      setVocalSong(randomSong);
    } else {
      setInstrumentalSong(randomSong);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white/90 mb-2">Mashit</h1>
          <p className="text-white/60 text-sm">Create your perfect mashup</p>
        </div>

        {/* Song Selection Row */}
        <div className="flex items-center gap-4">
          <SongCard 
            type="Vocal" 
            song={vocalSong} 
            onClick={() => selectRandomSong('vocal')}
          />
          
          {/* Flip Button */}
          <button
            onClick={handleFlip}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 hover:bg-[#202020] transition-all duration-200 shadow-inner"
          >
            <RotateCcw className="w-5 h-5 text-white/70" />
          </button>
          
          <SongCard 
            type="Instrumental" 
            song={instrumentalSong} 
            onClick={() => selectRandomSong('instrumental')}
          />
        </div>

        {/* Waveform Visualizer */}
        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center justify-center space-x-1 h-16">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="bg-[#7A6FF0] rounded-full transition-all duration-300"
                style={{
                  width: '3px',
                  height: `${Math.random() * 40 + 10}px`,
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
            className="bg-[#7A6FF0] hover:bg-[#6B5FE0] rounded-full p-4 transition-all duration-200 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="bg-[#1A1A1A] border-[#2A2A2A] text-white/80 hover:bg-[#202020] hover:text-white rounded-full px-6 py-3"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            className="bg-[#7A6FF0] hover:bg-[#6B5FE0] text-white rounded-full px-6 py-3"
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
