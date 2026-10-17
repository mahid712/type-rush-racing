const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getRandomRacePrompt } = require('./prompts');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Health check and ping endpoints for uptime monitors (UptimeRobot, cron-job, Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: Date.now() });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Self-ping keeping Render Web Service awake if RENDER_EXTERNAL_URL is configured
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_EXTERNAL_URL) {
  const pingInterval = 10 * 60 * 1000; // Ping every 10 minutes (Render sleeps after 15 min)
  setInterval(() => {
    const pingUrl = `${RENDER_EXTERNAL_URL}/health`;
    http.get(pingUrl, (res) => {
      // Keep alive heartbeat acknowledged
    }).on('error', (err) => {
      console.warn('Heartbeat ping error:', err.message);
    });
  }, pingInterval);
  console.log(`💓 Auto-heartbeat enabled for Render: ${RENDER_EXTERNAL_URL} (every 10m)`);
}

// In-memory room store: pin -> Room Object
const rooms = new Map();

// Helper to generate a unique 4-digit PIN
function generateUniquePin() {
  let pin;
  let attempts = 0;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (rooms.has(pin) && attempts < 10000);
  return pin;
}

// Clean up room helper
function cleanRoom(pin) {
  const room = rooms.get(pin);
  if (!room) return;
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
  if (room.graceTimer) clearTimeout(room.graceTimer);
  rooms.delete(pin);
  console.log(`🧹 [ROOM CLOSED] PIN: [${pin}] (All racers left, memory freed)`);
}

// Format room state for clients
function getSanitizedRoom(room) {
  return {
    pin: room.pin,
    hostId: room.hostId,
    status: room.status,
    prompt: room.prompt,
    startTime: room.startTime,
    players: Object.values(room.players)
  };
}

// Finish race helper
function finalizeRace(pin) {
  const room = rooms.get(pin);
  if (!room || room.status === 'finished') return;

  if (room.graceTimer) {
    clearTimeout(room.graceTimer);
    room.graceTimer = null;
  }

  room.status = 'finished';

  // Sort players for leaderboard:
  // Finished players sorted by rank (1, 2, 3...)
  // Unfinished players sorted by progress % desc, then WPM desc
  const allPlayers = Object.values(room.players);
  let finishedCount = allPlayers.filter(p => p.rank !== null).length;

  allPlayers.forEach(p => {
    if (p.rank === null) {
      finishedCount++;
      p.rank = finishedCount;
      p.finishTime = p.finishTime || 'DNF';
    }
  });

  const sortedLeaderboard = [...allPlayers].sort((a, b) => a.rank - b.rank);
  const winner = sortedLeaderboard[0];
  console.log(`🏆 [RACE FINISHED] PIN: [${pin}] | Winner: "${winner ? winner.name : 'Unknown'}" (${winner ? winner.wpm : 0} WPM in ${winner ? winner.finishTime : 0}s) | Total Racers: ${sortedLeaderboard.length}`);

  io.to(pin).emit('race_finished', {
    leaderboard: sortedLeaderboard,
    roomState: getSanitizedRoom(room)
  });
}

io.on('connection', (socket) => {
  let currentPin = null;
  console.log(`🔌 [SOCKET CONNECTED] Client: ${socket.id}`);

  // Create a new room with 4-digit PIN
  socket.on('create_room', ({ name, color, carStyle }) => {
    const pin = generateUniquePin();
    currentPin = pin;

    const newPlayer = {
      id: socket.id,
      name: (name || 'Racer').trim().substring(0, 16) || 'Racer',
      color: color || '#ff3b30',
      carStyle: carStyle || 'gt',
      progress: 0,
      typedIndex: 0,
      wpm: 0,
      accuracy: 100,
      finishTime: null,
      rank: null,
      ready: true,
      isHost: true
    };

    const room = {
      pin,
      hostId: socket.id,
      status: 'lobby',
      prompt: null,
      startTime: null,
      countdownTimer: null,
      graceTimer: null,
      players: {
        [socket.id]: newPlayer
      }
    };

    rooms.set(pin, room);
    socket.join(pin);

    console.log(`🏁 [ROOM CREATED] PIN: [${pin}] | Host: "${newPlayer.name}" | Car: ${newPlayer.carStyle} | Color: ${newPlayer.color}`);

    socket.emit('room_created', {
      pin,
      playerId: socket.id,
      roomState: getSanitizedRoom(room)
    });
  });

  // Join an existing room via 4-digit PIN
  socket.on('join_room', ({ pin, name, color, carStyle }) => {
    const sanitizedPin = (pin || '').toString().trim();
    const room = rooms.get(sanitizedPin);

    if (!room) {
      console.log(`⚠️  [JOIN FAILED] PIN: [${sanitizedPin}] - Room does not exist | User: "${name || 'Anonymous'}"`);
      return socket.emit('error_message', { message: `Room #${sanitizedPin} not found. Please check the 4-digit PIN!` });
    }

    if (Object.keys(room.players).length >= 8) {
      console.log(`⚠️  [JOIN FAILED] PIN: [${sanitizedPin}] - Room is full (8/8) | User: "${name}"`);
      return socket.emit('error_message', { message: 'Room is full (max 8 racers).' });
    }

    if (room.status === 'racing') {
      console.log(`⚠️  [JOIN FAILED] PIN: [${sanitizedPin}] - Race in progress | User: "${name}"`);
      return socket.emit('error_message', { message: 'A race is currently in progress. Please wait for the next round!' });
    }

    currentPin = sanitizedPin;

    const newPlayer = {
      id: socket.id,
      name: (name || 'Racer').trim().substring(0, 16) || 'Racer',
      color: color || '#00d2ff',
      carStyle: carStyle || 'formula',
      progress: 0,
      typedIndex: 0,
      wpm: 0,
      accuracy: 100,
      finishTime: null,
      rank: null,
      ready: false,
      isHost: false
    };

    room.players[socket.id] = newPlayer;
    socket.join(sanitizedPin);

    const totalCount = Object.keys(room.players).length;
    console.log(`👤 [PLAYER JOINED] PIN: [${sanitizedPin}] | Player: "${newPlayer.name}" | Car: ${newPlayer.carStyle} | Total Racers: ${totalCount}/8`);

    socket.emit('room_joined', {
      pin: sanitizedPin,
      playerId: socket.id,
      roomState: getSanitizedRoom(room)
    });

    // Notify other players
    io.to(sanitizedPin).emit('room_update', {
      roomState: getSanitizedRoom(room),
      message: `${newPlayer.name} joined the room!`
    });
  });

  // Host starts the race
  socket.on('start_race', ({ pin }) => {
    const room = rooms.get(pin);
    if (!room) return;
    if (room.hostId !== socket.id) {
      return socket.emit('error_message', { message: 'Only the host can start the race.' });
    }
    if (room.status !== 'lobby') return;

    // Generate fresh procedural random prompt every single race (all lowercase words)!
    room.prompt = getRandomRacePrompt(35);
    room.status = 'countdown';

    console.log(`🚦 [RACE COUNTDOWN] PIN: [${pin}] | Host: "${room.players[socket.id]?.name}" | Racers on grid: ${Object.keys(room.players).length}`);

    // Reset all player stats
    Object.values(room.players).forEach(p => {
      p.progress = 0;
      p.typedIndex = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finishTime = null;
      p.rank = null;
    });

    // 3-second countdown
    let countdown = 3;
    io.to(pin).emit('countdown_step', {
      countdown,
      prompt: room.prompt,
      roomState: getSanitizedRoom(room)
    });

    if (room.countdownTimer) clearInterval(room.countdownTimer);

    room.countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        io.to(pin).emit('countdown_step', { countdown, prompt: room.prompt });
      } else if (countdown === 0) {
        // Go!
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        room.status = 'racing';
        room.startTime = Date.now();

        console.log(`🏁 [RACE STARTED] PIN: [${pin}] | Prompt length: ${room.prompt.text.length} chars | All racers GO!`);

        io.to(pin).emit('race_start', {
          startTime: room.startTime,
          prompt: room.prompt,
          roomState: getSanitizedRoom(room)
        });
      }
    }, 1000);
  });

  // Progress update from a racer
  socket.on('update_progress', ({ pin, typedIndex, totalLength, wpm, accuracy }) => {
    const room = rooms.get(pin);
    if (!room || room.status !== 'racing') return;

    const player = room.players[socket.id];
    if (!player) return;

    const progress = Math.min(100, Math.round((typedIndex / totalLength) * 100));
    player.typedIndex = typedIndex;
    player.progress = progress;
    player.wpm = Math.max(0, Math.round(wpm || 0));
    player.accuracy = Math.round(accuracy || 100);

    // Check if player just finished
    if (typedIndex >= totalLength && player.finishTime === null) {
      const finishedPlayers = Object.values(room.players).filter(p => p.finishTime !== null);
      player.rank = finishedPlayers.length + 1;
      const elapsedSeconds = ((Date.now() - room.startTime) / 1000).toFixed(2);
      player.finishTime = elapsedSeconds;
      player.progress = 100;

      console.log(`🥇 [RACER FINISHED] PIN: [${pin}] | Rank #${player.rank}: "${player.name}" | Speed: ${player.wpm} WPM | Time: ${player.finishTime}s | Acc: ${player.accuracy}%`);

      io.to(pin).emit('player_finished_single', {
        playerId: player.id,
        name: player.name,
        rank: player.rank,
        finishTime: player.finishTime,
        wpm: player.wpm,
        accuracy: player.accuracy,
        carStyle: player.carStyle
      });

      // Check if all players finished
      const allDone = Object.values(room.players).every(p => p.finishTime !== null);
      if (allDone) {
        finalizeRace(pin);
        return;
      }

      // If at least 1 player finished, start a 15-second grace timer so late racers finish or race closes
      if (!room.graceTimer) {
        io.to(pin).emit('grace_countdown_started', { seconds: 15 });
        room.graceTimer = setTimeout(() => {
          finalizeRace(pin);
        }, 15000);
      }
    }

    // Broadcast live racing updates
    io.to(pin).emit('progress_update', {
      players: Object.values(room.players)
    });
  });

  // Rematch / Play Again
  socket.on('play_again', ({ pin }) => {
    const room = rooms.get(pin);
    if (!room) return;
    if (room.hostId !== socket.id) {
      return socket.emit('error_message', { message: 'Only the host can initiate a rematch.' });
    }

    console.log(`🔄 [REMATCH INITIATED] PIN: [${pin}] | Resetting room for next race`);

    if (room.graceTimer) {
      clearTimeout(room.graceTimer);
      room.graceTimer = null;
    }
    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }

    room.status = 'lobby';
    room.prompt = null;
    room.startTime = null;

    Object.values(room.players).forEach(p => {
      p.progress = 0;
      p.typedIndex = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finishTime = null;
      p.rank = null;
    });

    io.to(pin).emit('room_reset', {
      roomState: getSanitizedRoom(room)
    });
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    if (!currentPin) return;
    const room = rooms.get(currentPin);
    if (!room) return;

    const disconnectedPlayer = room.players[socket.id];
    delete room.players[socket.id];

    const remainingPlayers = Object.values(room.players);
    console.log(`👋 [PLAYER LEFT] PIN: [${currentPin}] | Player: "${disconnectedPlayer ? disconnectedPlayer.name : 'Unknown'}" | Remaining Racers: ${remainingPlayers.length}`);

    if (remainingPlayers.length === 0) {
      cleanRoom(currentPin);
      return;
    }

    // Reassign host if host left
    if (room.hostId === socket.id) {
      room.hostId = remainingPlayers[0].id;
      remainingPlayers[0].isHost = true;
      console.log(`👑 [NEW HOST] PIN: [${currentPin}] | Assigned to: "${remainingPlayers[0].name}"`);
    }

    // If currently racing and all remaining racers finished, finalize race
    if (room.status === 'racing') {
      const allDone = remainingPlayers.every(p => p.finishTime !== null);
      if (allDone) {
        finalizeRace(currentPin);
      }
    }

    io.to(currentPin).emit('player_left', {
      playerId: socket.id,
      name: disconnectedPlayer ? disconnectedPlayer.name : 'A racer',
      roomState: getSanitizedRoom(room)
    });
  });
});

server.listen(PORT, () => {
  console.log(`🏎️  Type Rush Racing Server listening on http://localhost:${PORT}`);
});
