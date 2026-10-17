// Type Rush Racing - Core Client Engine
(function () {
  'use strict';

  // --- Client State ---
  const state = {
    socket: null,
    myPlayerId: null,
    myRoomPin: null,
    isHost: false,
    currentScreen: 'welcome',
    playerProfile: {
      name: localStorage.getItem('typerush_name') || 'ApexRacer',
      color: localStorage.getItem('typerush_color') || '#00c3ff',
      carStyle: localStorage.getItem('typerush_style') || 'porsche'
    },
    room: null,
    prompt: null,
    words: [],
    typedWords: [],
    letterErrors: {},
    currentWordIndex: 0,
    currentLetterIndex: 0,
    totalLength: 0,
    typedIndex: 0,
    totalKeystrokes: 0,
    mistakes: 0,
    raceStartTime: null,
    isRacing: false,
    hasFinished: false,
    wpmTicker: null
  };

  // --- DOM Elements ---
  const screens = {
    welcome: document.getElementById('screen-welcome'),
    lobby: document.getElementById('screen-lobby'),
    race: document.getElementById('screen-race'),
    leaderboard: document.getElementById('screen-leaderboard')
  };

  // Profile & Customization Elements
  const nameInput = document.getElementById('player-name-input');
  const carStyleContainer = document.getElementById('car-style-selector');
  const carColorContainer = document.getElementById('car-color-selector');
  const carPreviewContainer = document.getElementById('car-preview-container');

  // Navigation
  const navPinBadge = document.getElementById('room-pin-display');
  const navPinVal = document.getElementById('nav-pin-value');
  const copyPinBtn = document.getElementById('copy-pin-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const connectionStatus = document.getElementById('connection-status');

  // Welcome Tabs & Buttons
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const paneCreate = document.getElementById('pane-create');
  const paneJoin = document.getElementById('pane-join');
  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnJoinRoom = document.getElementById('btn-join-room');
  const pinDigits = document.querySelectorAll('.pin-digit');

  // Lobby Elements
  const lobbyPinDisplay = document.getElementById('lobby-pin-display');
  const lobbyCopyBtn = document.getElementById('lobby-copy-btn');
  const lobbyPlayerCount = document.getElementById('lobby-player-count');
  const lobbyRoleTag = document.getElementById('lobby-role-tag');
  const lobbyPlayersGrid = document.getElementById('lobby-players-grid');
  const hostControls = document.getElementById('host-controls');
  const guestWaitingMsg = document.getElementById('guest-waiting-msg');
  const btnStartRace = document.getElementById('btn-start-race');
  const btnLeaveLobby = document.getElementById('btn-leave-lobby');

  // Race Arena Elements
  const hudMyRank = document.getElementById('hud-my-rank');
  const hudMyWpm = document.getElementById('hud-my-wpm');
  const hudMyAccuracy = document.getElementById('hud-my-accuracy');
  const hudTrackTitle = document.getElementById('hud-track-title');
  const hudGraceTimer = document.getElementById('hud-grace-timer');
  const hudGraceSeconds = document.getElementById('hud-grace-seconds');
  const raceTrackLanes = document.getElementById('race-track-lanes');
  const finishLineBanner = document.getElementById('finish-line-banner');
  const finishAlertBanner = document.getElementById('finish-alert-banner');
  const radarDotsContainer = document.getElementById('radar-dots-container');
  const typingWordsContainer = document.getElementById('typing-words-container');
  const typingWordsLines = document.getElementById('typing-words-lines');
  const currentWordNum = document.getElementById('current-word-num');
  const totalWordCount = document.getElementById('total-word-count');
  const typeRushInput = document.getElementById('type-rush-input');
  const typingProgressPct = document.getElementById('typing-progress-pct');
  const typingFocusPrompt = document.getElementById('typing-focus-prompt');

  // Countdown & Modals
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownNumber = document.getElementById('countdown-number');
  const toastContainer = document.getElementById('toast-container');

  // Leaderboard Elements
  const podiumStage = document.getElementById('podium-stage');
  const leaderboardTbody = document.getElementById('leaderboard-tbody');
  const btnLeaderboardLeave = document.getElementById('btn-leaderboard-leave');
  const btnLeaderboardRematch = document.getElementById('btn-leaderboard-rematch');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // --- Initial Setup ---
  function init() {
    setupSocket();
    setupSound();
    setupCustomizer();
    setupPinInputs();
    setupTypingEngine();
    setupNavigation();
  }

  // --- Screen Navigation Helper ---
  function showScreen(screenName) {
    state.currentScreen = screenName;
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('active', key === screenName);
    });

    // Toggle Room PIN display in top nav
    if (screenName === 'welcome') {
      navPinBadge.classList.add('hidden');
    } else if (state.myRoomPin) {
      navPinBadge.classList.remove('hidden');
      navPinVal.textContent = state.myRoomPin;
    }

    if (screenName === 'race') {
      setTimeout(() => {
        typeRushInput.focus();
      }, 100);
    }
  }

  // --- Toast Notifications ---
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Sound Button Setup ---
  function setupSound() {
    updateSoundBtn();
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = window.soundFX.toggleMute();
      updateSoundBtn();
      showToast(isMuted ? '🔇 Audio muted' : '🔊 Audio unmuted');
    });
  }

  function updateSoundBtn() {
    soundToggleBtn.textContent = window.soundFX.isMuted ? '🔇' : '🔊';
  }

  // --- Car Customization UI ---
  function setupCustomizer() {
    nameInput.value = state.playerProfile.name;
    nameInput.addEventListener('input', (e) => {
      state.playerProfile.name = e.target.value.trim() || 'Racer';
      localStorage.setItem('typerush_name', state.playerProfile.name);
    });

    // Populate styles
    carStyleContainer.innerHTML = '';
    CarGraphics.styles.forEach(st => {
      const chip = document.createElement('div');
      chip.className = `style-chip ${st.id === state.playerProfile.carStyle ? 'active' : ''}`;
      chip.textContent = st.name;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.style-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.playerProfile.carStyle = st.id;
        localStorage.setItem('typerush_style', st.id);
        updatePreview();
        if (window.soundFX) {
          window.soundFX.previewCarEngine(st.id);
        }
      });
      carStyleContainer.appendChild(chip);
    });

    // Populate colors
    carColorContainer.innerHTML = '';
    CarGraphics.colors.forEach(col => {
      const dot = document.createElement('div');
      dot.className = `color-dot ${col.hex === state.playerProfile.color ? 'active' : ''}`;
      dot.style.backgroundColor = col.hex;
      dot.title = col.name;
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        state.playerProfile.color = col.hex;
        localStorage.setItem('typerush_color', col.hex);
        updatePreview();
      });
      carColorContainer.appendChild(dot);
    });

    updatePreview();
  }

  function updatePreview() {
    carPreviewContainer.innerHTML = CarGraphics.getCarSVG(
      state.playerProfile.color,
      state.playerProfile.carStyle,
      false
    );
  }

  if (carPreviewContainer) {
    carPreviewContainer.style.cursor = 'pointer';
    carPreviewContainer.title = 'Click to rev engine!';
    carPreviewContainer.addEventListener('click', () => {
      if (window.soundFX) {
        window.soundFX.previewCarEngine(state.playerProfile.carStyle);
      }
    });
  }

  // --- PIN Input Boxes UX ---
  function setupPinInputs() {
    pinDigits.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        if (val && index < pinDigits.length - 1) {
          pinDigits[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          pinDigits[index - 1].focus();
        } else if (e.key === 'Enter') {
          joinRoomWithEnteredPin();
        }
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
        const digits = pasted.replace(/[^0-9]/g, '').slice(0, 4);
        digits.split('').forEach((d, i) => {
          if (pinDigits[i]) pinDigits[i].value = d;
        });
        if (digits.length === 4) {
          pinDigits[3].focus();
        }
      });
    });

    // Welcome Tabs
    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      paneCreate.classList.add('active');
      paneJoin.classList.remove('active');
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabCreate.classList.remove('active');
      paneJoin.classList.add('active');
      paneCreate.classList.remove('active');
      pinDigits[0].focus();
    });

    // Create Room Button
    btnCreateRoom.addEventListener('click', () => {
      window.soundFX.init();
      state.socket.emit('create_room', {
        name: state.playerProfile.name,
        color: state.playerProfile.color,
        carStyle: state.playerProfile.carStyle
      });
    });

    // Join Room Button
    btnJoinRoom.addEventListener('click', joinRoomWithEnteredPin);
  }

  function getEnteredPin() {
    return Array.from(pinDigits).map(input => input.value).join('');
  }

  function joinRoomWithEnteredPin() {
    window.soundFX.init();
    const pin = getEnteredPin();
    if (pin.length !== 4) {
      showToast('⚠️ Please enter a 4-digit PIN!');
      return;
    }
    state.socket.emit('join_room', {
      pin,
      name: state.playerProfile.name,
      color: state.playerProfile.color,
      carStyle: state.playerProfile.carStyle
    });
  }

  // --- Copy PIN to Clipboard ---
  function copyPin() {
    if (!state.myRoomPin) return;
    navigator.clipboard.writeText(state.myRoomPin).then(() => {
      showToast(`📋 Copied Room PIN: ${state.myRoomPin}`);
    }).catch(() => {
      showToast(`Room PIN: ${state.myRoomPin}`);
    });
  }

  function setupNavigation() {
    copyPinBtn.addEventListener('click', copyPin);
    navPinBadge.addEventListener('click', copyPin);
    lobbyCopyBtn.addEventListener('click', copyPin);

    // Host Start Race Button
    btnStartRace.addEventListener('click', () => {
      if (!state.isHost) return;
      window.soundFX.init();
      state.socket.emit('start_race', { pin: state.myRoomPin });
    });

    // Leave Room Buttons
    btnLeaveLobby.addEventListener('click', leaveRoomToWelcome);
    btnLeaderboardLeave.addEventListener('click', leaveRoomToWelcome);

    // Rematch Button
    btnLeaderboardRematch.addEventListener('click', () => {
      if (!state.isHost) {
        showToast('Only the host can restart the race!');
        return;
      }
      state.socket.emit('play_again', { pin: state.myRoomPin });
    });
  }

  function leaveRoomToWelcome() {
    if (window.soundFX) {
      window.soundFX.stopCarEngine();
    }
    window.location.reload();
  }

  // --- Socket.IO Client Setup ---
  function setupSocket() {
    state.socket = io();

    state.socket.on('connect', () => {
      state.myPlayerId = state.socket.id;
      connectionStatus.className = 'status-pill online';
      connectionStatus.innerHTML = '<span class="dot"></span> Online';
    });

    state.socket.on('disconnect', () => {
      connectionStatus.className = 'status-pill text-danger';
      connectionStatus.innerHTML = '<span class="dot"></span> Offline';
      showToast('⚠️ Disconnected from server');
    });

    state.socket.on('error_message', ({ message }) => {
      showToast(`❌ ${message}`);
    });

    // Room Created (Host)
    state.socket.on('room_created', ({ pin, roomState }) => {
      state.myRoomPin = pin;
      state.isHost = true;
      state.room = roomState;
      updateLobbyUI();
      showScreen('lobby');
      showToast(`🎉 Room #${pin} created! Share this PIN.`);
    });

    // Room Joined (Guest)
    state.socket.on('room_joined', ({ pin, roomState }) => {
      state.myRoomPin = pin;
      state.isHost = roomState.hostId === state.myPlayerId;
      state.room = roomState;
      updateLobbyUI();
      showScreen('lobby');
      showToast(`🏎️ Joined Room #${pin}!`);
    });

    // Room Updates (Players join / leave)
    state.socket.on('room_update', ({ roomState, message }) => {
      state.room = roomState;
      state.isHost = roomState.hostId === state.myPlayerId;
      if (message) showToast(message);
      if (state.currentScreen === 'lobby') {
        updateLobbyUI();
      }
    });

    state.socket.on('player_left', ({ name, roomState }) => {
      state.room = roomState;
      state.isHost = roomState.hostId === state.myPlayerId;
      showToast(`${name} left the room`);
      if (state.currentScreen === 'lobby') {
        updateLobbyUI();
      } else if (state.currentScreen === 'race') {
        renderRaceLanes();
      }
    });

    // Countdown Step (3, 2, 1)
    state.socket.on('countdown_step', ({ countdown, prompt, roomState }) => {
      if (roomState) state.room = roomState;
      if (prompt) state.prompt = prompt;

      // Switch to race screen if not already there
      if (state.currentScreen !== 'race') {
        prepareRaceArena();
        showScreen('race');
      }

      countdownOverlay.classList.remove('hidden');
      countdownNumber.textContent = countdown;
      window.soundFX.playCountdown(false);
    });

    // Race Start (GO!)
    state.socket.on('race_start', ({ startTime, prompt, roomState }) => {
      state.room = roomState;
      state.prompt = prompt;
      state.words = (prompt.text || '').split(' ');
      state.typedWords = state.words.map(() => '');
      state.totalLength = prompt.text.length;
      state.currentWordIndex = 0;
      state.currentLetterIndex = 0;
      state.raceStartTime = startTime;
      state.isRacing = true;
      state.hasFinished = false;
      state.typedIndex = 0;
      state.totalKeystrokes = 0;
      state.mistakes = 0;

      renderWordLines();
      renderRaceLanes();

      countdownNumber.textContent = 'GO!';
      countdownNumber.style.color = '#00ff88';
      window.soundFX.playCountdown(true);

      // Start the authentic engine sound corresponding to the player's car model!
      if (window.soundFX) {
        window.soundFX.startCarEngine(state.playerProfile.carStyle);
      }

      setTimeout(() => {
        countdownOverlay.classList.add('hidden');
        countdownNumber.style.color = '';
        typeRushInput.focus();
      }, 700);

      startWpmTicker();
    });

    // Live Progress Update from all racers
    state.socket.on('progress_update', ({ players }) => {
      if (state.room) {
        state.room.players = players;
      }
      updateTrackCars(players);
      updateRaceHUD(players);
    });

    // Single Player Finished
    state.socket.on('player_finished_single', ({ name, rank, finishTime, carStyle }) => {
      const ordinal = getOrdinal(rank);
      showToast(`🏁 ${name} finished ${ordinal}! (${finishTime}s)`);

      // When the 1st place winner finishes, voice announce their victory using their name!
      if (rank === 1 && window.soundFX) {
        const isYou = state.room && state.room.players.find(p => p.name === name)?.id === state.myPlayerId;
        const carName = (typeof CarGraphics !== 'undefined' && carStyle) ? CarGraphics.getStyleName(carStyle) : '';
        window.soundFX.announceWinner(name, isYou, carName);
      }
    });

    // Grace Countdown Started
    state.socket.on('grace_countdown_started', ({ seconds }) => {
      hudGraceTimer.classList.remove('hidden');
      let remain = seconds;
      hudGraceSeconds.textContent = `${remain}s`;
      const timer = setInterval(() => {
        remain--;
        if (remain >= 0) {
          hudGraceSeconds.textContent = `${remain}s`;
        } else {
          clearInterval(timer);
          hudGraceTimer.classList.add('hidden');
        }
      }, 1000);
    });

    // Race Finished -> Show Leaderboard
    state.socket.on('race_finished', ({ leaderboard, roomState }) => {
      state.isRacing = false;
      clearInterval(state.wpmTicker);
      state.room = roomState;

      // Stop engine sound
      if (window.soundFX) {
        window.soundFX.stopCarEngine();
      }

      showLeaderboard(leaderboard);

      // Voice announce the champion on the podium screen
      if (leaderboard && leaderboard.length > 0 && leaderboard[0] && window.soundFX) {
        const champ = leaderboard[0];
        const isYou = champ.id === state.myPlayerId;
        window.soundFX.announcePodiumChampion(champ.name, isYou);
      }
    });

    // Room Reset for Rematch
    state.socket.on('room_reset', ({ roomState }) => {
      if (window.soundFX) {
        window.soundFX.stopCarEngine();
      }
      state.room = roomState;
      state.prompt = null;
      state.isRacing = false;
      state.hasFinished = false;
      state.typedIndex = 0;
      updateLobbyUI();
      showScreen('lobby');
      showToast('🔄 Room reset for next race!');
    });
  }

  // --- Lobby UI Rendering ---
  function updateLobbyUI() {
    if (!state.room) return;
    lobbyPinDisplay.textContent = state.room.pin;
    lobbyPlayerCount.textContent = state.room.players.length;

    state.isHost = state.room.hostId === state.myPlayerId;
    lobbyRoleTag.textContent = state.isHost ? 'Host 👑' : 'Challenger';

    if (state.isHost) {
      hostControls.classList.remove('hidden');
      guestWaitingMsg.classList.add('hidden');
    } else {
      hostControls.classList.add('hidden');
      guestWaitingMsg.classList.remove('hidden');
    }

    // Render Racers Grid: Connected racers + open grid slots (8 total)
    lobbyPlayersGrid.innerHTML = '';
    const MAX_GRID_SLOTS = 8;
    const connectedPlayers = state.room.players || [];

    // 1. Connected Racers
    connectedPlayers.forEach((p, idx) => {
      const isYou = p.id === state.myPlayerId;
      const isHost = p.id === state.room.hostId;
      const card = document.createElement('div');
      card.className = `player-lobby-card ${isYou ? 'is-you' : ''}`;

      const carName = CarGraphics.getStyleName(p.carStyle);
      const colorName = CarGraphics.getColorName(p.color);
      const gridPos = idx === 0 ? 'POLE POSITION • P1' : `GRID P${idx + 1}`;

      card.innerHTML = `
        <div class="lobby-card-header">
          <span class="grid-slot-tag">${gridPos}</span>
          <div class="lobby-card-badges">
            ${isHost ? '<span class="player-badge-host">HOST 👑</span>' : '<span class="player-badge-challenger">RACER 🏁</span>'}
            ${isYou ? '<span class="player-badge-you">YOU</span>' : ''}
          </div>
        </div>

        <div class="player-lobby-car">
          ${CarGraphics.getCarSVG(p.color, p.carStyle, false)}
        </div>

        <div class="lobby-card-info">
          <div class="player-lobby-name">${escapeHTML(p.name)}</div>
          <div class="player-car-spec">
            <span class="spec-color-dot" style="background-color: ${p.color}" title="${colorName}"></span>
            <span class="spec-model">${carName}</span>
          </div>
          <div class="player-ready-status">
            <span class="status-indicator"></span> READY ON GRID
          </div>
        </div>
      `;
      lobbyPlayersGrid.appendChild(card);
    });

    // 2. Open Grid Slots (Waiting for challengers)
    for (let slot = connectedPlayers.length + 1; slot <= MAX_GRID_SLOTS; slot++) {
      const emptyCard = document.createElement('div');
      const isNext = slot === connectedPlayers.length + 1;
      emptyCard.className = `player-lobby-card empty-slot ${isNext ? 'next-slot' : ''}`;

      if (isNext) {
        emptyCard.innerHTML = `
          <div class="lobby-card-header">
            <span class="grid-slot-tag slot-open">GRID P${slot}</span>
            <span class="player-badge-waiting">WAITING</span>
          </div>
          <div class="empty-slot-content">
            <div class="empty-slot-icon">🏎️</div>
            <div class="empty-slot-title">WAITING FOR RACER</div>
            <div class="empty-slot-invite">
              <span class="invite-label">Share PIN:</span>
              <button class="invite-pin-chip" type="button" title="Click to copy PIN">
                ${state.room.pin} 📋
              </button>
            </div>
          </div>
        `;
        emptyCard.querySelector('.invite-pin-chip')?.addEventListener('click', (e) => {
          e.stopPropagation();
          copyPin();
        });
      } else {
        emptyCard.innerHTML = `
          <div class="lobby-card-header">
            <span class="grid-slot-tag slot-open">GRID P${slot}</span>
            <span class="player-badge-vacant">OPEN</span>
          </div>
          <div class="empty-slot-content vacant">
            <div class="empty-slot-icon">+</div>
            <div class="empty-slot-title">OPEN GRID SLOT</div>
            <div class="empty-slot-sub">Room PIN: ${state.room.pin}</div>
          </div>
        `;
      }

      lobbyPlayersGrid.appendChild(emptyCard);
    }
  }

  // --- Race Arena Initialization ---
  function prepareRaceArena() {
    hudTrackTitle.textContent = state.prompt ? state.prompt.title.toLowerCase() : 'monza sprint';
    hudGraceTimer.classList.add('hidden');

    // Ensure prompt is 100% lowercase words and spaces only
    if (state.prompt && state.prompt.text) {
      state.prompt.text = state.prompt.text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
      state.words = state.prompt.text.split(' ');
      state.totalLength = state.prompt.text.length;
    } else {
      state.words = [];
      state.totalLength = 0;
    }

    state.typedWords = state.words.map(() => '');
    state.currentWordIndex = 0;
    state.typedIndex = 0;
    state.mistakes = 0;
    state.totalKeystrokes = 0;

    // Hide finish line at start
    if (finishLineBanner) {
      finishLineBanner.className = 'finish-line-banner hidden-line';
    }
    if (finishAlertBanner) {
      finishAlertBanner.classList.add('hidden');
    }

    renderWordLines();
    renderRaceLanes();
    updateRadarDots(state.room ? state.room.players : []);
  }

  // Single-Line Sliding Ribbon Display: Strictly one horizontal line; words slide smoothly as you type!
  function renderWordLines() {
    if (!state.words || state.words.length === 0) return;
    if (currentWordNum) currentWordNum.textContent = Math.min(state.currentWordIndex + 1, state.words.length);
    if (totalWordCount) totalWordCount.textContent = state.words.length;
    if (!typingWordsLines) return;

    typingWordsLines.innerHTML = '';

    state.words.forEach((w, wIdx) => {
      const wordEl = document.createElement('div');
      wordEl.className = 'word';
      wordEl.id = `word-${wIdx}`;

      const typed = (state.typedWords && state.typedWords[wIdx]) || '';

      if (wIdx < state.currentWordIndex) {
        // Previously completed word (already typed, sliding away to the left)
        wordEl.classList.add('word-completed');
        for (let i = 0; i < w.length; i++) {
          const span = document.createElement('span');
          const isErr = typed[i] !== w[i];
          span.className = isErr ? 'char error' : 'char correct';
          span.textContent = w[i];
          wordEl.appendChild(span);
        }
      } else if (wIdx === state.currentWordIndex) {
        // Active word in the single-line reading focus!
        wordEl.classList.add('word-current');

        // Render characters of the expected word
        for (let i = 0; i < w.length; i++) {
          const span = document.createElement('span');

          if (i < typed.length) {
            // Already typed character by user
            if (typed[i] === w[i]) {
              span.className = 'char correct';
              span.textContent = w[i];
            } else {
              span.className = 'char error';
              span.textContent = typed[i]; // Show user's typo so they can backspace and correct!
            }
          } else if (i === typed.length) {
            // Active current caret character
            span.className = 'char pending current';
            span.textContent = w[i];
          } else {
            // Upcoming untyped character in active word
            span.className = 'char pending';
            span.textContent = w[i];
          }
          wordEl.appendChild(span);
        }

        // If user typed extra letters beyond word length, show them in red
        if (typed.length > w.length) {
          for (let i = w.length; i < typed.length; i++) {
            const extraSpan = document.createElement('span');
            extraSpan.className = 'char error extra';
            extraSpan.textContent = typed[i];
            wordEl.appendChild(extraSpan);
          }
        }

        // If user finished all letters in word, show space caret indicator
        if (typed.length >= w.length) {
          const lastChar = wordEl.querySelector('.char:last-child');
          if (lastChar) {
            lastChar.classList.add('current-space');
          }
        }
      } else {
        // Upcoming words sliding in from right in the single line!
        wordEl.classList.add('word-pending');
        for (let i = 0; i < w.length; i++) {
          const span = document.createElement('span');
          span.className = 'char pending';
          span.textContent = w[i];
          wordEl.appendChild(span);
        }
      }

      typingWordsLines.appendChild(wordEl);

      // Spacer between words
      if (wIdx < state.words.length - 1) {
        const spacer = document.createElement('span');
        spacer.className = 'word-spacer';
        typingWordsLines.appendChild(spacer);
      }
    });

    // --- SMOOTH SLIDING RIBBON ANIMATION ---
    // Calculate the horizontal offset so the active word sits smoothly at the focus reading line (~120px from left)
    const activeEl = document.getElementById(`word-${state.currentWordIndex}`);
    if (activeEl && typingWordsContainer) {
      const focusX = 120;
      const wordLeft = activeEl.offsetLeft;
      const slideX = focusX - wordLeft;
      typingWordsLines.style.transform = `translateX(${slideX}px)`;
    }

    const totalLen = state.totalLength || 100;
    const correctProg = typeof getCorrectCharProgress === 'function' ? getCorrectCharProgress() : (state.typedIndex || 0);
    const pct = Math.min(100, Math.round((correctProg / totalLen) * 100));
    if (typingProgressPct) typingProgressPct.textContent = `${pct}% complete`;
  }

  function renderRaceLanes() {
    if (!state.room) return;
    raceTrackLanes.innerHTML = '';

    state.room.players.forEach((p, idx) => {
      const isYou = p.id === state.myPlayerId;
      const carName = CarGraphics.getStyleName(p.carStyle);
      const lane = document.createElement('div');
      lane.className = `race-lane ${isYou ? 'lane-you' : ''}`;
      lane.id = `lane-${p.id}`;

      // Car Wrapper with Floating HUD Tag
      const carWrapper = document.createElement('div');
      carWrapper.className = 'racer-car-wrapper';
      carWrapper.id = `car-wrapper-${p.id}`;
      carWrapper.style.left = '10px';

      const tagClass = isYou ? 'racer-car-tag tag-you' : 'racer-car-tag';
      carWrapper.innerHTML = `
        <div class="${tagClass}">
          <span class="tag-pos pos-${Math.min(3, idx + 1)}" id="tag-pos-${p.id}">${getOrdinal(idx + 1)}</span>
          <span class="tag-player-name">${escapeHTML(p.name)}${isYou ? ' (YOU)' : ''}</span>
          <span class="tag-car-model">${carName}</span>
          <span class="tag-wpm" id="tag-wpm-${p.id}">0 WPM</span>
        </div>
        ${CarGraphics.getCarSVG(p.color, p.carStyle, true)}
      `;

      lane.appendChild(carWrapper);
      raceTrackLanes.appendChild(lane);
    });
  }

  // --- Live Track & Cars Position Updating ---
  function updateTrackCars(players) {
    const trackWidth = raceTrackLanes.clientWidth || 1100;
    const carWidth = 155;
    const finishOffset = 90;
    const maxTravel = Math.max(10, trackWidth - carWidth - finishOffset);

    // Compute live positions for all racers
    const rankedPlayers = [...players].sort((a, b) => {
      if ((b.progress || 0) !== (a.progress || 0)) {
        return (b.progress || 0) - (a.progress || 0);
      }
      return (b.wpm || 0) - (a.wpm || 0);
    });

    players.forEach(p => {
      const carWrapper = document.getElementById(`car-wrapper-${p.id}`);
      if (!carWrapper) return;

      const progress = p.progress || 0;
      const targetLeft = 10 + (progress / 100) * maxTravel;
      carWrapper.style.left = `${targetLeft}px`;

      // Live position index
      const rankIndex = rankedPlayers.findIndex(r => r.id === p.id) + 1;

      // Update position badge in floating tag
      const tagPos = document.getElementById(`tag-pos-${p.id}`);
      if (tagPos) {
        tagPos.textContent = getOrdinal(rankIndex);
        tagPos.className = `tag-pos pos-${Math.min(3, rankIndex)}`;
      }

      // Live WPM in tag
      const tagWpm = document.getElementById(`tag-wpm-${p.id}`);
      if (tagWpm) {
        tagWpm.textContent = `${p.wpm || 0} WPM`;
      }

      // Dynamic car vibration rumble
      if (p.wpm > 25 && !p.finishTime) {
        carWrapper.classList.add('speed-rumble');
      } else {
        carWrapper.classList.remove('speed-rumble');
      }
    });

    // Check dynamic finish line reveal: show only when leader reaches 70%+
    const maxProgress = Math.max(...players.map(p => p.progress || 0), 0);
    if (maxProgress >= 70) {
      if (finishLineBanner && finishLineBanner.classList.contains('hidden-line')) {
        finishLineBanner.classList.remove('hidden-line');
        finishLineBanner.classList.add('visible-line');
        if (finishAlertBanner) finishAlertBanner.classList.remove('hidden');
        window.soundFX.playNitro();
      }
    } else {
      if (finishLineBanner) {
        finishLineBanner.classList.add('hidden-line');
        finishLineBanner.classList.remove('visible-line');
      }
      if (finishAlertBanner) finishAlertBanner.classList.add('hidden');
    }

    // Update Overhead Race Radar
    updateRadarDots(rankedPlayers);
  }

  function updateRadarDots(players) {
    if (!radarDotsContainer) return;
    radarDotsContainer.innerHTML = '';

    players.forEach((p, idx) => {
      const isYou = p.id === state.myPlayerId;
      const dot = document.createElement('div');
      dot.className = `radar-dot ${isYou ? 'is-you' : ''}`;
      dot.style.left = `${Math.min(100, Math.max(0, p.progress || 0))}%`;
      dot.style.backgroundColor = p.color;
      dot.style.borderColor = isYou ? '#00f2fe' : '#ffffff';
      dot.style.boxShadow = `0 0 10px ${p.color}`;

      const lbl = document.createElement('span');
      lbl.className = 'radar-dot-label';
      lbl.textContent = `${getOrdinal(idx + 1)} ${p.name}`;
      dot.appendChild(lbl);

      radarDotsContainer.appendChild(dot);
    });
  }

  function getRankMedal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  function updateRaceHUD(players) {
    // Sort racers by progress descending to find live rank
    const sorted = [...players].sort((a, b) => (b.progress || 0) - (a.progress || 0));
    const myIndex = sorted.findIndex(p => p.id === state.myPlayerId);
    if (myIndex !== -1) {
      hudMyRank.textContent = getOrdinal(myIndex + 1);
    }
  }

  // --- Natural Line Type Rush Typing Mechanics ---
  function setupTypingEngine() {
    if (typingWordsContainer) {
      typingWordsContainer.addEventListener('click', () => {
        typeRushInput.focus();
      });
    }

    document.addEventListener('click', () => {
      if (state.currentScreen === 'race') {
        typeRushInput.focus();
      }
    });

    typeRushInput.addEventListener('blur', () => {
      if (state.currentScreen === 'race' && state.isRacing && !state.hasFinished) {
        typingFocusPrompt.classList.remove('hidden');
      }
    });

    typeRushInput.addEventListener('focus', () => {
      typingFocusPrompt.classList.add('hidden');
    });

    // Keydown event listener
    typeRushInput.addEventListener('keydown', handleKeyPress);
  }

  function getCorrectCharProgress() {
    if (!state.words || state.words.length === 0) return 0;
    let correctCount = 0;

    for (let w = 0; w < state.words.length; w++) {
      const expectedWord = state.words[w];
      const typed = (state.typedWords && state.typedWords[w]) || '';

      if (w < state.currentWordIndex) {
        // Fully completed words: count all letters + 1 for space
        correctCount += expectedWord.length + 1;
      } else if (w === state.currentWordIndex) {
        // Active word: only count contiguous correct letters from the start!
        for (let i = 0; i < typed.length && i < expectedWord.length; i++) {
          if (typed[i] === expectedWord[i]) {
            correctCount++;
          } else {
            // As soon as there's a mistake, stop counting! Car must NOT move forward!
            break;
          }
        }
        break;
      }
    }

    return correctCount;
  }

  function handleKeyPress(e) {
    if (!state.isRacing || state.hasFinished || !state.words || state.words.length === 0) return;

    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock') return;

    // Prevent default on Space, Tab, Backspace so browser doesn't scroll or navigate back
    if (e.key === ' ' || e.key === 'Tab' || e.key === 'Backspace') {
      e.preventDefault();
    }

    if (!state.typedWords) {
      state.typedWords = state.words.map(() => '');
    }

    const currentWord = state.words[state.currentWordIndex];
    if (!currentWord) return;
    const currentTyped = state.typedWords[state.currentWordIndex] || '';

    // 1. BACKSPACE: Erase mistakes and correct spelling
    if (e.key === 'Backspace') {
      if (currentTyped.length > 0) {
        state.typedWords[state.currentWordIndex] = currentTyped.slice(0, -1);
        window.soundFX.playKeyClick();
        renderWordLines();
        sendTypingUpdate(false);
      } else if (state.currentWordIndex > 0) {
        // Step back into previous word so user can correct it
        state.currentWordIndex--;
        window.soundFX.playKeyClick();
        renderWordLines();
        sendTypingUpdate(false);
      }
      typeRushInput.value = '';
      return;
    }

    state.totalKeystrokes++;
    const pressedKey = e.key.toLowerCase();

    // 2. SPACE KEY: Advance to next word only if current word is typed correctly!
    if (pressedKey === ' ') {
      if (currentTyped === currentWord) {
        window.soundFX.playKeyClick();
        state.currentWordIndex++;

        // If completed all words in the sentence -> FINISH!
        if (state.currentWordIndex >= state.words.length) {
          state.hasFinished = true;
          if (window.soundFX) window.soundFX.stopCarEngine();
          window.soundFX.playVictory();
          triggerConfetti();
          renderWordLines();
          sendTypingUpdate(true);
          typeRushInput.value = '';
          return;
        }

        renderWordLines();
        sendTypingUpdate(false);
      } else {
        // Word has typos or is incomplete: cannot skip with Space! Must correct with Backspace!
        state.mistakes++;
        window.soundFX.playError();
        flashActiveWordError();
      }
      typeRushInput.value = '';
      return;
    }

    // 3. REGULAR ALPHABET CHARACTERS (a-z)
    if (pressedKey.length === 1 && pressedKey >= 'a' && pressedKey <= 'z') {
      // ONLY allow typing up to the size/length of the current word!
      if (currentTyped.length >= currentWord.length) {
        typeRushInput.value = '';
        return;
      }

      const charIndex = currentTyped.length;
      const expectedChar = currentWord[charIndex];

      const newTyped = currentTyped + pressedKey;
      state.typedWords[state.currentWordIndex] = newTyped;

      if (pressedKey === expectedChar) {
        window.soundFX.playKeyClick();
      } else {
        // Misspelling! Record error, play sound, but DO NOT advance the car!
        state.mistakes++;
        window.soundFX.playError();
        flashActiveWordError();
      }

      // Check if finished entire race (last word and matched correctly)
      const isLastWord = state.currentWordIndex === state.words.length - 1;
      const isWordMatch = newTyped === currentWord;

      if (isLastWord && isWordMatch) {
        state.hasFinished = true;
        if (window.soundFX) window.soundFX.stopCarEngine();
        window.soundFX.playVictory();
        triggerConfetti();
        renderWordLines();
        sendTypingUpdate(true);
        typeRushInput.value = '';
        return;
      }

      renderWordLines();
      sendTypingUpdate(false);
    }

    // Clear input buffer so it doesn't accumulate
    typeRushInput.value = '';
  }

  function flashActiveWordError() {
    const activeEl = document.getElementById(`word-${state.currentWordIndex}`);
    if (activeEl) {
      activeEl.classList.add('error');
      setTimeout(() => activeEl.classList.remove('error'), 220);
    }
  }

  // --- Real-time WPM & Stats Calculation ---
  function calculateCurrentStats() {
    if (!state.raceStartTime) return { wpm: 0, accuracy: 100 };

    const elapsedMinutes = (Date.now() - state.raceStartTime) / 60000;
    const correctChars = getCorrectCharProgress();
    const wordsTyped = correctChars / 5;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;

    const accuracy = state.totalKeystrokes > 0
      ? Math.max(0, Math.round(((state.totalKeystrokes - state.mistakes) / state.totalKeystrokes) * 100))
      : 100;

    return { wpm, accuracy };
  }

  function sendTypingUpdate(isComplete = false) {
    if (!state.prompt) return;

    const correctProgress = getCorrectCharProgress();
    state.typedIndex = correctProgress;

    const { wpm, accuracy } = calculateCurrentStats();
    const totalLength = state.prompt.text.length;
    const pct = isComplete ? 100 : Math.min(100, Math.round((correctProgress / totalLength) * 100));

    // Update HUD
    hudMyWpm.innerHTML = `${wpm} <small>WPM</small>`;
    hudMyAccuracy.textContent = `${accuracy}%`;
    typingProgressPct.textContent = `${pct}% Complete`;

    // Dynamically modulate real-time engine sound frequency with typing speed
    if (window.soundFX) {
      window.soundFX.updateEngineRPM(wpm);
    }

    // Emit socket event
    state.socket.emit('update_progress', {
      pin: state.myRoomPin,
      typedIndex: correctProgress,
      totalLength,
      wpm,
      accuracy
    });
  }

  function startWpmTicker() {
    if (state.wpmTicker) clearInterval(state.wpmTicker);
    state.wpmTicker = setInterval(() => {
      if (state.isRacing && !state.hasFinished) {
        const { wpm, accuracy } = calculateCurrentStats();
        hudMyWpm.innerHTML = `${wpm} <small>WPM</small>`;
        hudMyAccuracy.textContent = `${accuracy}%`;
        if (window.soundFX) {
          window.soundFX.updateEngineRPM(wpm);
        }
      }
    }, 250);
  }

  // --- Screen 4: Leaderboard & Winner Podium ---
  function showLeaderboard(leaderboard) {
    showScreen('leaderboard');
    triggerConfetti();

    // Host controls for rematch
    if (state.isHost) {
      btnLeaderboardRematch.classList.remove('hidden');
    } else {
      btnLeaderboardRematch.classList.add('hidden');
    }

    // Podium Rendering (Top 3)
    podiumStage.innerHTML = '';
    const top3 = leaderboard.slice(0, 3);

    // Arrange visually: 2nd on Left, 1st in Center, 3rd on Right
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ ...top3[1], pos: '2nd', cls: 'podium-2nd' });
    if (top3[0]) podiumOrder.push({ ...top3[0], pos: '1st', cls: 'podium-1st' });
    if (top3[2]) podiumOrder.push({ ...top3[2], pos: '3rd', cls: 'podium-3rd' });

    podiumOrder.forEach(p => {
      const ped = document.createElement('div');
      ped.className = `podium-pedestal ${p.cls}`;
      ped.innerHTML = `
        <div class="podium-car">
          ${CarGraphics.getCarSVG(p.color, p.carStyle, false)}
        </div>
        <div class="podium-player-name">${escapeHTML(p.name)}</div>
        <div class="podium-wpm">${p.wpm || 0} WPM</div>
        <div class="podium-block">
          <span>${p.pos}</span>
        </div>
      `;
      podiumStage.appendChild(ped);
    });

    // Full Leaderboard Table
    leaderboardTbody.innerHTML = '';
    leaderboard.forEach(p => {
      const tr = document.createElement('tr');
      const rankClass = p.rank === 1 ? 'rank-1' : p.rank === 2 ? 'rank-2' : p.rank === 3 ? 'rank-3' : 'rank-other';
      const isYou = p.id === state.myPlayerId ? ' (You)' : '';

      tr.innerHTML = `
        <td><span class="rank-badge ${rankClass}">${p.rank}</span></td>
        <td>
          <div class="table-racer">
            <div class="table-car-icon">${CarGraphics.getCarSVG(p.color, p.carStyle, false)}</div>
            <span>${escapeHTML(p.name)}${isYou}</span>
          </div>
        </td>
        <td><strong>${p.wpm || 0}</strong> WPM</td>
        <td>${p.accuracy || 100}%</td>
        <td>${p.finishTime ? p.finishTime + 's' : 'DNF'}</td>
        <td><span style="color: ${p.finishTime && p.finishTime !== 'DNF' ? '#00ff88' : '#ff3366'}">${p.finishTime && p.finishTime !== 'DNF' ? 'FINISHED' : 'DNF'}</span></td>
      `;
      leaderboardTbody.appendChild(tr);
    });
  }

  // --- Confetti Animation ---
  function triggerConfetti() {
    const canvas = confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#00f2fe', '#ff3366', '#ffbe0b', '#00ff88', '#ffffff'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 5 + 3,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      frame++;
      if (frame < 220) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    render();
  }

  // --- Helpers ---
  function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Launch on DOM ready
  window.addEventListener('DOMContentLoaded', init);
})();
