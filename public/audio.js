// High-Fidelity Audio Engine & Voice Announcer for Type Rush Racing
// Powered by Authentic Real-World Car Engine Sound Recordings (Porsche, Lambo, Mustang, F1, GT-R)
// and Web Speech API Motorsport Commentator

class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('typerush_muted') === 'true' : false;

    // Active Engine Audio State
    this.currentCarStyle = null;
    this.engineSource = null;
    this.engineGain = null;
    this.engineAudioElement = null;
    this.isEngineRunning = false;
    this.lastWpm = 0;

    // Preview Engine State (for car selector in lobby)
    this.previewSource = null;
    this.previewGain = null;
    this.previewTimeout = null;

    // In-memory decoded AudioBuffers for zero-latency, glitch-free loop playback
    this.audioBuffers = {};
    this.loadingPromises = {};

    // Authentic Real-World Vehicle Engine Profiles (User-provided original audio tracks)
    this.carAudioProfiles = {
      // 1. Porsche 911 GT3 RS: High-revving naturally aspirated 4.0L Boxer-6
      porsche: {
        file: '/audio/porsche.mp3',
        name: 'Porsche 911 GT3 RS',
        gain: 0.36,
        pitchMin: 0.92,
        pitchMax: 1.25
      },

      // 2. Lamborghini Huracán STO: Naturally aspirated 5.2L V10 operatic wail
      lambo: {
        file: '/audio/lambo.mp3',
        name: 'Lamborghini Huracán STO',
        gain: 0.33,
        pitchMin: 0.90,
        pitchMax: 1.28
      },

      // 3. Shelby GT500 Mustang: Supercharged 5.2L cross-plane V8 muscle roar
      mustang: {
        file: '/audio/mustang.mp3',
        name: 'Shelby GT500 Mustang',
        gain: 0.28, // Deep low-end rumble naturally heavy
        pitchMin: 0.88,
        pitchMax: 1.22
      },

      // 4. Formula 1 Grand Prix: Screaming naturally aspirated 2.4L V8 (18,000 RPM scream)
      f1: {
        file: '/audio/f1.mp3',
        name: 'Formula 1 Grand Prix',
        gain: 0.26, // Piercing high-RPM frequency balanced for comfort
        pitchMin: 0.92,
        pitchMax: 1.30
      },

      // 5. Nissan GT-R Nismo: Twin-turbo 3.8L VR38DETT V6 exhaust growl
      gtr: {
        file: '/audio/gtr.mp3',
        name: 'Nissan GT-R Nismo',
        gain: 0.34,
        pitchMin: 0.90,
        pitchMax: 1.25
      }
    };

    // Speech Announcer State
    this.voices = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  // Normalize car style identifiers
  resolveCarStyle(styleId) {
    if (!styleId) return 'porsche';
    let s = styleId.toLowerCase();
    if (s === 'gt') s = 'porsche';
    if (s === 'hyper') s = 'lambo';
    if (s === 'muscle') s = 'mustang';
    if (s === 'formula') s = 'f1';
    return this.carAudioProfiles[s] ? s : 'porsche';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Preload audio files into decoded Web Audio buffers for instant playback
    this.preloadAllCars();
  }

  loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('typerush_muted', this.isMuted);
    if (this.isMuted) {
      this.stopCarEngine();
      this.stopPreview();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return this.isMuted;
  }

  // Preload a single car audio buffer
  async loadCarBuffer(style) {
    const key = this.resolveCarStyle(style);
    if (this.audioBuffers[key]) {
      return this.audioBuffers[key];
    }
    if (this.loadingPromises[key]) {
      return this.loadingPromises[key];
    }

    const profile = this.carAudioProfiles[key];
    if (!profile) return null;

    this.loadingPromises[key] = (async () => {
      try {
        const response = await fetch(profile.file);
        if (!response.ok) throw new Error(`HTTP ${response.status} loading ${profile.file}`);
        const arrayBuffer = await response.arrayBuffer();
        if (!this.ctx) this.init();
        if (!this.ctx) return null;
        
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.audioBuffers[key] = audioBuffer;
        return audioBuffer;
      } catch (err) {
        console.warn(`Could not decode audio buffer for ${key}:`, err);
        return null;
      }
    })();

    return this.loadingPromises[key];
  }

  // Preload all 5 cars in background
  preloadAllCars() {
    Object.keys(this.carAudioProfiles).forEach(style => {
      this.loadCarBuffer(style);
    });
  }

  // =========================================================================
  // CAR ENGINE AUDIO: REAL CAR SOUND RECORDINGS WITH LIVE WPM RPM MODULATION
  // =========================================================================

  async startCarEngine(carStyle = 'porsche') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Clean up any existing engine sound
    this.stopCarEngine();
    this.stopPreview();

    const style = this.resolveCarStyle(carStyle);
    const profile = this.carAudioProfiles[style];
    this.currentCarStyle = style;
    this.isEngineRunning = true;
    this.lastWpm = 0;

    // Ensure buffer is loaded
    let buffer = this.audioBuffers[style];
    if (!buffer) {
      buffer = await this.loadCarBuffer(style);
    }

    // If still not active (e.g. stopped before loaded), return
    if (!this.isEngineRunning || this.currentCarStyle !== style) return;

    if (buffer && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Set initial idle pitch
        source.playbackRate.setValueAtTime(profile.pitchMin, t);

        // Smooth volume fade-in
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, t);
        gainNode.gain.linearRampToValueAtTime(profile.gain, t + 0.35);

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);

        this.engineSource = source;
        this.engineGain = gainNode;
      } catch (e) {
        console.warn('Web Audio buffer playback error, using HTML5 Audio fallback:', e);
        this.startFallbackAudio(profile);
      }
    } else {
      this.startFallbackAudio(profile);
    }
  }

  // HTML5 Audio fallback if Web Audio decoding is pending
  startFallbackAudio(profile) {
    try {
      if (this.engineAudioElement) {
        this.engineAudioElement.pause();
        this.engineAudioElement = null;
      }
      const audio = new Audio(profile.file);
      audio.loop = true;
      audio.volume = Math.min(1.0, profile.gain * 1.5);
      audio.playbackRate = profile.pitchMin;
      audio.play().catch(() => {});
      this.engineAudioElement = audio;
    } catch (e) {}
  }

  // Modulate playback pitch & throttle volume in real-time as the player types faster/slower
  updateEngineRPM(wpm = 0) {
    if (this.isMuted || !this.isEngineRunning) return;
    this.lastWpm = wpm;

    const style = this.currentCarStyle || 'porsche';
    const profile = this.carAudioProfiles[style] || this.carAudioProfiles.porsche;

    // RPM ratio 0.0 (idle) to 1.0 (redline ~95 WPM)
    const rpmRatio = Math.min(1.0, Math.max(0, wpm / 95));

    // Dynamic pitch: rises smoothly as WPM increases
    const targetPitch = profile.pitchMin + Math.pow(rpmRatio, 0.85) * (profile.pitchMax - profile.pitchMin);
    // Dynamic volume: slightly louder on full acceleration
    const targetGain = profile.gain * (0.85 + 0.35 * rpmRatio);

    if (this.ctx && this.engineSource && this.engineGain) {
      const t = this.ctx.currentTime;
      try {
        this.engineSource.playbackRate.setTargetAtTime(targetPitch, t, 0.08);
        this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
      } catch (e) {}
    } else if (this.engineAudioElement) {
      try {
        this.engineAudioElement.playbackRate = Math.max(0.5, Math.min(2.0, targetPitch));
        this.engineAudioElement.volume = Math.min(1.0, targetGain * 1.5);
      } catch (e) {}
    }
  }

  // Stop track engine audio with a smooth fade-out
  stopCarEngine() {
    this.isEngineRunning = false;

    if (this.ctx && this.engineGain && this.engineSource) {
      const t = this.ctx.currentTime;
      try {
        this.engineGain.gain.linearRampToValueAtTime(0.001, t + 0.3);
      } catch (e) {}

      const sourceToStop = this.engineSource;
      const gainToDisconnect = this.engineGain;
      this.engineSource = null;
      this.engineGain = null;

      setTimeout(() => {
        try {
          sourceToStop.stop();
          sourceToStop.disconnect();
          gainToDisconnect.disconnect();
        } catch (e) {}
      }, 350);
    }

    if (this.engineAudioElement) {
      try {
        this.engineAudioElement.pause();
        this.engineAudioElement.currentTime = 0;
      } catch (e) {}
      this.engineAudioElement = null;
    }
  }

  // =========================================================================
  // CAR SOUND PREVIEW IN DRIVER SETUP / LOBBY
  // =========================================================================

  async previewCarEngine(carStyle = 'porsche') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopPreview();

    const style = this.resolveCarStyle(carStyle);
    const profile = this.carAudioProfiles[style];
    if (!profile) return;

    let buffer = this.audioBuffers[style];
    if (!buffer) {
      buffer = await this.loadCarBuffer(style);
    }
    if (!buffer || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = false;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(profile.gain, t + 0.2);

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);

      this.previewSource = source;
      this.previewGain = gain;

      // Automatically fade out preview after 2.8 seconds
      this.previewTimeout = setTimeout(() => {
        this.stopPreview();
      }, 2800);
    } catch (e) {}
  }

  stopPreview() {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    if (this.previewGain && this.previewSource && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.previewGain.gain.linearRampToValueAtTime(0.001, t + 0.25);
      } catch (e) {}

      const s = this.previewSource;
      const g = this.previewGain;
      this.previewSource = null;
      this.previewGain = null;

      setTimeout(() => {
        try {
          s.stop();
          s.disconnect();
          g.disconnect();
        } catch (e) {}
      }, 300);
    }
  }

  // =========================================================================
  // VOICE COMMENTATOR & WINNER ANNOUNCER (Web Speech API)
  // =========================================================================

  announceWinner(winnerName = 'Racer', isYou = false, carModel = '') {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      let phrase = '';
      if (isYou) {
        phrase = `Victory! ${winnerName}, you take first place and claim the checkered flag! What an outstanding race!`;
      } else {
        phrase = `We have a winner! ${winnerName} crosses the finish line in first place to win the race!`;
      }

      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      if (!this.voices || this.voices.length === 0) {
        this.loadVoices();
      }

      const englishVoice = this.voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('Samantha') || v.name.includes('Guy'))
      ) || this.voices.find(v => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  announcePodiumChampion(winnerName = 'Racer', isYou = false) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      setTimeout(() => {
        window.speechSynthesis.cancel();
        const phrase = isYou
          ? `All hail our champion, ${winnerName}! Fantastic driving!`
          : `Congratulations to the champion of the race, ${winnerName}!`;

        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.04;
        utterance.pitch = 1.08;
        utterance.volume = 1.0;

        const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;

        window.speechSynthesis.speak(utterance);
      }, 700);
    } catch (e) {}
  }

  // =========================================================================
  // STANDARD SOUND EFFECTS (Countdown, Keys, Error, Nitro, Fanfare)
  // =========================================================================

  playCountdown(isGo = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + (isGo ? 0.6 : 0.25));
  }

  playKeyClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 1200 + Math.random() * 400;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playError() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playNitro() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.45);
    });
  }
}

if (typeof window !== 'undefined') {
  window.SoundFX = SoundFX;
  window.soundFX = new SoundFX();
  
  // Warm up audio context on user interaction
  ['click', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (window.soundFX) window.soundFX.init();
    }, { once: true });
  });
}

if (typeof module !== 'undefined') {
  module.exports = SoundFX;
}
