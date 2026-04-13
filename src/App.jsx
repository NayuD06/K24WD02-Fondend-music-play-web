import { useEffect, useMemo, useRef, useState } from 'react'
import musicAPI from './MusicData'
import './App.css'

const getFileName = (assetPath) => assetPath.split('/').pop()

const getAssetUrl = (assetModules, fileName) => {
  const assetEntry = Object.entries(assetModules).find(([path]) =>
    path.endsWith(`/${fileName}`),
  )

  return assetEntry ? assetEntry[1].default : ''
}

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function App() {
  const audioRef = useRef(null)

  const imageModules = useMemo(
    () => import.meta.glob('./Assets/Images/*', { eager: true }),
    [],
  )
  const songModules = useMemo(
    () => import.meta.glob('./Assets/songs/*', { eager: true }),
    [],
  )
  const videoModules = useMemo(
    () => import.meta.glob('./Assets/Videos/*', { eager: true }),
    [],
  )

  const songs = useMemo(
    () =>
      musicAPI.map((song) => ({
        ...song,
        audioUrl: getAssetUrl(songModules, getFileName(song.songSrc)),
        avatarUrl: getAssetUrl(imageModules, getFileName(song.songAvatar)),
      })),
    [imageModules, songModules],
  )

  const backgroundVideos = useMemo(
    () =>
      Object.keys(videoModules)
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((path) => videoModules[path].default),
    [videoModules],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentSong = songs[currentIndex]
  const currentVideo =
    backgroundVideos[currentIndex % Math.max(backgroundVideos.length, 1)]

  const handlePlayPause = () => {
    setIsPlaying((prevState) => !prevState)
  }

  const handleSongChange = (nextIndex) => {
    setCurrentIndex(nextIndex)
    setCurrentTime(0)
  }

  const handlePrevious = () => {
    const previousIndex = (currentIndex - 1 + songs.length) % songs.length
    handleSongChange(previousIndex)
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % songs.length
    handleSongChange(nextIndex)
  }

  useEffect(() => {
    const audioEl = audioRef.current

    if (!audioEl || !currentSong?.audioUrl) {
      return
    }

    audioEl.src = currentSong.audioUrl
    audioEl.load()

    if (isPlaying) {
      audioEl.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [currentSong, isPlaying])

  useEffect(() => {
    const audioEl = audioRef.current

    if (!audioEl) {
      return
    }

    if (isPlaying) {
      audioEl.play().catch(() => {
        setIsPlaying(false)
      })
      return
    }

    audioEl.pause()
  }, [isPlaying])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="app-shell">
      {currentVideo && (
        <video className="video-bg" src={currentVideo} autoPlay muted loop playsInline />
      )}
      <div className="overlay" />

      <aside className="playlist-card">
        <h2>Playlist</h2>
        <ul>
          {songs.map((song, index) => (
            <li key={song.id}>
              <button
                type="button"
                className={index === currentIndex ? 'active' : ''}
                onClick={() => handleSongChange(index)}
              >
                <img src={song.avatarUrl} alt={song.songName} />
                <div>
                  <p>{song.songName}</p>
                  <span>{song.songArtist}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="player-card">
        <p className="player-tag">Music Player</p>
        <h1>{currentSong.songName}</h1>
        <h3>{currentSong.songArtist}</h3>

        <div className={`disc ${isPlaying ? 'rotate' : ''}`}>
          <img src={currentSong.avatarUrl} alt={currentSong.songName} />
        </div>

        <div className="timeline">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(event) => {
              const nextTime = Number(event.target.value)
              setCurrentTime(nextTime)
              if (audioRef.current) {
                audioRef.current.currentTime = nextTime
              }
            }}
            style={{ '--progress': `${progressPercent}%` }}
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="controls">
          <button type="button" onClick={handlePrevious} aria-label="Bài trước">
            ⏮
          </button>
          <button
            type="button"
            className="play-btn"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button type="button" onClick={handleNext} aria-label="Bài tiếp theo">
            ⏭
          </button>
        </div>

        <audio
          ref={audioRef}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onEnded={handleNext}
        />
      </section>
    </main>
  )
}

export default App
