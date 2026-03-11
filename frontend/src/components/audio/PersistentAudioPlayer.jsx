import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import './PersistentAudioPlayer.css';

const EQ_BANDS = [
  { id: 'b1',  freq: 32,    label: '32',   type: 'lowshelf'  },
  { id: 'b2',  freq: 64,    label: '64',   type: 'peaking'   },
  { id: 'b3',  freq: 125,   label: '125',  type: 'peaking'   },
  { id: 'b4',  freq: 250,   label: '250',  type: 'peaking'   },
  { id: 'b5',  freq: 500,   label: '500',  type: 'peaking'   },
  { id: 'b6',  freq: 1000,  label: '1K',   type: 'peaking'   },
  { id: 'b7',  freq: 2000,  label: '2K',   type: 'peaking'   },
  { id: 'b8',  freq: 4000,  label: '4K',   type: 'peaking'   },
  { id: 'b9',  freq: 8000,  label: '8K',   type: 'peaking'   },
  { id: 'b10', freq: 16000, label: '16K',  type: 'highshelf' },
];

const DEFAULT_GAIN = 0; const MIN_GAIN = -12; const MAX_GAIN = +12;

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function PersistentAudioPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume, isMuted, isShuffled, repeatMode, isMinimized,
    audioRef, dispatch, togglePlayPause, nextTrack, prevTrack, seekTo, setVolume, toggleMute, toggleShuffle, cycleRepeat, toggleMinimized,
  } = useAudioPlayer();

  const audioCtxRef = useRef(null); const sourceRef = useRef(null);
  const filtersRef = useRef([]); const gainNodeRef = useRef(null);

  const [eqGains, setEqGains] = useState(() => Object.fromEntries(EQ_BANDS.map(b => [b.id, DEFAULT_GAIN])));
  const [showEq, setShowEq] = useState(false);
  const [eqEnabled, setEqEnabled] = useState(true);

  const [isFloating, setIsFloating] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 40, y: 40 });
  const dragRef = useRef(null); const isDragging = useRef(false); const dragOffset = useRef({ x: 0, y: 0 });

  const initAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;
    const filters = EQ_BANDS.map((band) => {
      const f = ctx.createBiquadFilter(); f.type = band.type; f.frequency.value = band.freq; f.Q.value = 1.0; f.gain.value = DEFAULT_GAIN; return f;
    });
    filtersRef.current = filters;
    const gain = ctx.createGain(); gain.gain.value = 1.0; gainNodeRef.current = gain;
    source.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
    filters[filters.length - 1].connect(gain);
    gain.connect(ctx.destination);
  }, [audioRef]);

  const resumeCtx = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
  }, []);

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const onTime = () => dispatch({ type: 'SET_TIME', value: audio.currentTime });
    const onDur = () => dispatch({ type: 'SET_DURATION', value: audio.duration });
    const onEnded = () => nextTrack();
    const onPlay = () => dispatch({ type: 'SET_PLAYING', value: true });
    const onPause = () => dispatch({ type: 'SET_PLAYING', value: false });
    audio.addEventListener('timeupdate', onTime); audio.addEventListener('durationchange', onDur);
    audio.addEventListener('ended', onEnded); audio.addEventListener('play', onPlay); audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('ended', onEnded); audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    resumeCtx();
    isPlaying ? audio.play().catch(() => {}) : audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current; if (!audio || !currentTrack) return;
    const src = currentTrack.files?.mp3_320?.url || currentTrack.files?.flac?.url || currentTrack.streamUrl || '';
    if (src && audio.src !== src) {
      audio.src = src; audio.load(); initAudioGraph();
      if (isPlaying) audio.play().catch(() => {});
    }
  }, [currentTrack]);

  useEffect(() => {
    const v = isMuted ? 0 : volume;
    if (audioRef.current) audioRef.current.volume = v;
    if (gainNodeRef.current && audioCtxRef.current) gainNodeRef.current.gain.setTargetAtTime(v, audioCtxRef.current.currentTime, 0.01);
  }, [volume, isMuted]);

  const handleEqChange = useCallback((bandId, gainDb) => {
    const val = parseFloat(gainDb); setEqGains(prev => ({ ...prev, [bandId]: val }));
    const idx = EQ_BANDS.findIndex(b => b.id === bandId); const filter = filtersRef.current[idx];
    if (filter && audioCtxRef.current && eqEnabled) filter.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.01);
  }, [eqEnabled]);

  const toggleEqEnabled = useCallback(() => {
    const next = !eqEnabled; setEqEnabled(next);
    if (audioCtxRef.current) {
      filtersRef.current.forEach((f, i) => f.gain.setTargetAtTime(next ? (eqGains[EQ_BANDS[i].id] ?? 0) : 0, audioCtxRef.current.currentTime, 0.01));
    }
  }, [eqEnabled, eqGains]);

  const resetEq = useCallback(() => {
    setEqGains(Object.fromEntries(EQ_BANDS.map(b => [b.id, 0])));
    if (audioCtxRef.current) filtersRef.current.forEach(f => f.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.01));
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Magis Studio', artist: currentTrack.artist || 'Unknown Artist', album: currentTrack.album || 'Magis Studio',
      artwork: currentTrack.artwork?.url ? [{ src: currentTrack.artwork.url, sizes: '512x512', type: 'image/jpeg' }] : []
    });
    navigator.mediaSession.setActionHandler('play', () => { resumeCtx(); dispatch({ type: 'SET_PLAYING', value: true }); audioRef.current.play(); });
    navigator.mediaSession.setActionHandler('pause', () => { dispatch({ type: 'SET_PLAYING', value: false }); audioRef.current.pause(); });
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    return () => { ['play','pause','nexttrack','previoustrack'].forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch {} }); };
  }, [currentTrack]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) return (
    <div className="player player--idle glass-heavy">
      <audio ref={audioRef} preload="metadata" playsInline crossOrigin="anonymous" />
      <span className="player__idle-icon" aria-hidden="true">◉</span>
      <p className="player__idle-msg font-mono">Selecciona una pista del Laboratorio Sonoro</p>
    </div>
  );

  const PlayerContent = (
    <>
      {isMobileExpanded && (
        <div className="mobile-expand-handle" onClick={() => setIsMobileExpanded(false)}>
          <span className="mobile-expand-bar"></span>
        </div>
      )}
      
      <div className="player__progress" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * duration); }}>
        <div className="player__progress-track">
          <div className="player__progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="player__progress-thumb" style={{ left: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="player__body">
        <div className="player__info" onClick={() => { if (window.innerWidth <= 768) setIsMobileExpanded(true); }}>
          <div className="player__artwork" onDoubleClick={() => setShowEq(v => !v)}>
            {currentTrack.artwork?.url ? <img src={currentTrack.artwork.url} alt={currentTrack.title} /> : <span className="player__artwork-placeholder">♪</span>}
            {isPlaying && <div className="player__artwork-pulse" />}
          </div>
          <div className="player__meta">
            <span className="player__title">{currentTrack.title}</span>
            <span className="player__artist">{currentTrack.artist}</span>
          </div>
        </div>

        <div className="player__controls">
          <button className={`player__btn player__btn--sm ${isShuffled ? 'is-active' : ''}`} onClick={toggleShuffle}><ShuffleIcon /></button>
          <button className="player__btn" onClick={prevTrack}><PrevIcon /></button>
          <button className={`player__btn player__btn--play ${isPlaying ? 'is-playing' : ''}`} onClick={(e) => { e.stopPropagation(); resumeCtx(); togglePlayPause(); }}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player__btn" onClick={nextTrack}><NextIcon /></button>
          <button className={`player__btn player__btn--sm ${repeatMode !== 'none' ? 'is-active' : ''}`} onClick={cycleRepeat}><RepeatIcon mode={repeatMode} /></button>
        </div>

        <div className="player__secondary">
          <span className="player__time font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="player__volume">
            <button className="player__btn player__btn--xs" onClick={toggleMute}>{isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}</button>
            <div className="player__volume-track">
              <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="player__volume-slider" />
              <div className="player__volume-fill" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
            </div>
          </div>
          <button className={`player__btn player__btn--xs ${showEq ? 'is-active' : ''}`} onClick={() => setShowEq(v => !v)}><EqIcon /></button>
        </div>
      </div>

      {showEq && (
        <div className="eq-panel">
          <div className="eq-panel__header">
            <span className="eq-panel__title font-mono">◈ EQ · 10 BANDAS · PARAMÉTRICO</span>
            <div className="eq-panel__actions">
              <button className={`eq-panel__btn ${eqEnabled ? 'is-on' : ''}`} onClick={toggleEqEnabled}>{eqEnabled ? 'ON' : 'OFF'}</button>
              <button className="eq-panel__btn" onClick={resetEq}>FLAT</button>
            </div>
          </div>
          <div className="eq-faders">
            {EQ_BANDS.map((band) => {
              const gain = eqGains[band.id] ?? 0; const pct = ((gain - MIN_GAIN) / (MAX_GAIN - MIN_GAIN)) * 100;
              return (
                <div key={band.id} className="eq-band">
                  <span className={`eq-band__db font-mono ${gain > 0 ? 'is-boost' : gain < 0 ? 'is-cut' : ''}`}>{gain > 0 ? `+${gain}` : gain}</span>
                  <div className="eq-band__fader-wrap">
                    <div className="eq-band__zero-line" />
                    <input type="range" orient="vertical" min={MIN_GAIN} max={MAX_GAIN} step="0.5" value={gain} disabled={!eqEnabled} onChange={(e) => handleEqChange(band.id, e.target.value)} className="eq-fader" />
                    <div className={`eq-band__fill ${gain >= 0 ? 'is-boost' : 'is-cut'}`} style={gain >= 0 ? { bottom: '50%', height: `${pct - 50}%` } : { bottom: `${pct}%`, height: `${50 - pct}%` }} />
                  </div>
                  <span className="eq-band__label font-mono">{band.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={`player glass-heavy ${isMinimized ? 'player--minimized' : ''} ${showEq ? 'player--with-eq' : ''} ${isMobileExpanded ? 'is-mobile-expanded' : 'is-mobile-mini'}`}>
      <audio ref={audioRef} preload="metadata" playsInline crossOrigin="anonymous" />
      {PlayerContent}
    </div>
  );
}

// Iconos omitidos por brevedad (Mantienen los tuyos originales)
const PlayIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>;
const PauseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>;
const PrevIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="2" height="16" rx="1"/></svg>;
const NextIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16" rx="1"/></svg>;
const ShuffleIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,3 21,3 21,8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21,16 21,21 16,21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const RepeatIcon = ({ mode }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17,1 21,5 17,9"/><path d="M3,11V9a4,4,0,0,1,4-4H21"/><polyline points="7,23 3,19 7,15"/><path d="M21,13v2a4,4,0,0,1-4,4H3"/>{mode==='one'&&<text x="9" y="15" fontSize="8" fill="currentColor" stroke="none">1</text>}</svg>;
const VolumeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54,8.46a5,5,0,0,1,0,7.07"/><path d="M19.07,4.93a10,10,0,0,1,0,14.14"/></svg>;
const MuteIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
const EqIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="4" y2="18"/><line x1="2" y1="10" x2="6" y2="10"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="10" y1="14" x2="14" y2="14"/><line x1="20" y1="6" x2="20" y2="18"/><line x1="18" y1="9" x2="22" y2="9"/></svg>;
