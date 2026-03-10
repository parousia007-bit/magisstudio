import React, { createContext, useContext, useRef, useState } from 'react';
const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <AudioPlayerContext.Provider value={{
      currentTrack: { title: "Frecuencia Ámbar", artist: "Magis", streamUrl: "" },
      isPlaying, currentTime: 0, duration: 240, volume: 1, isMuted: false, 
      isShuffled: false, repeatMode: 'none', isMinimized: false, audioRef, 
      dispatch: () => {}, togglePlayPause: () => setIsPlaying(!isPlaying), 
      nextTrack: () => {}, prevTrack: () => {}, seekTo: () => {}, setVolume: () => {}, 
      toggleMute: () => {}, toggleShuffle: () => {}, cycleRepeat: () => {}, toggleMinimized: () => {}
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};
export const useAudioPlayer = () => useContext(AudioPlayerContext);
