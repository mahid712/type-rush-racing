const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function runSimulationTest() {
  console.log('🧪 Starting Type Rush Racing integration test...');

  const p1 = io(SERVER_URL);
  const p2 = io(SERVER_URL);

  let roomPin = null;

  // Promise helper for socket events
  const waitForEvent = (socket, event) => new Promise((resolve) => {
    socket.once(event, resolve);
  });

  try {
    // 1. Wait for both sockets to connect
    await Promise.all([
      waitForEvent(p1, 'connect'),
      waitForEvent(p2, 'connect')
    ]);
    console.log('✅ Both players connected to server.');

    // 2. Player 1 creates room
    p1.emit('create_room', {
      name: 'TurboApex',
      color: '#ff3344',
      carStyle: 'gt'
    });

    const roomCreatedData = await waitForEvent(p1, 'room_created');
    roomPin = roomCreatedData.pin;
    console.log(`✅ Room created successfully with 4-digit PIN: "${roomPin}" (Valid 4-digit format: ${/^\d{4}$/.test(roomPin)})`);

    if (!/^\d{4}$/.test(roomPin)) {
      throw new Error(`PIN "${roomPin}" is not a valid 4-digit PIN!`);
    }

    // 3. Player 2 joins room using the 4-digit PIN
    p2.emit('join_room', {
      pin: roomPin,
      name: 'NeonViper',
      color: '#00f2fe',
      carStyle: 'formula'
    });

    const roomJoinedData = await waitForEvent(p2, 'room_joined');
    console.log(`✅ Player 2 joined room #${roomJoinedData.pin}. Players in room: ${roomJoinedData.roomState.players.length}`);

    if (roomJoinedData.roomState.players.length !== 2) {
      throw new Error('Expected 2 players in room.');
    }

    // 4. Player 1 (Host) starts the race
    console.log('🚦 Host initiating race start...');
    p1.emit('start_race', { pin: roomPin });

    // Wait for countdown step
    const stepData = await waitForEvent(p1, 'countdown_step');
    console.log(`✅ Received countdown step: ${stepData.countdown}, prompt: "${stepData.prompt.title}"`);

    // Wait for race_start
    const raceStartData = await waitForEvent(p1, 'race_start');
    const promptText = raceStartData.prompt.text;
    console.log(`🏁 RACE STARTED! Prompt length: ${promptText.length} characters.`);

    // 5. Simulate Typing Battle
    // Player 1 types fast (25ms per char ~ 90 WPM)
    // Player 2 types slower (45ms per char ~ 55 WPM)
    console.log('⌨️  Simulating typing battle between TurboApex and NeonViper...');

    let p1Index = 0;
    let p2Index = 0;

    const p1Interval = setInterval(() => {
      if (p1Index < promptText.length) {
        p1Index += 2;
        if (p1Index > promptText.length) p1Index = promptText.length;
        p1.emit('update_progress', {
          pin: roomPin,
          typedIndex: p1Index,
          totalLength: promptText.length,
          wpm: 92,
          accuracy: 98
        });
      } else {
        clearInterval(p1Interval);
      }
    }, 25);

    const p2Interval = setInterval(() => {
      if (p2Index < promptText.length) {
        p2Index += 1;
        p2.emit('update_progress', {
          pin: roomPin,
          typedIndex: p2Index,
          totalLength: promptText.length,
          wpm: 58,
          accuracy: 95
        });
      } else {
        clearInterval(p2Interval);
      }
    }, 35);

    // 6. Listen for race_finished
    const p1Finished = await waitForEvent(p1, 'race_finished');
    clearInterval(p1Interval);
    clearInterval(p2Interval);

    console.log('🏆 RACE FINISHED! Final Leaderboard received:');
    p1Finished.leaderboard.forEach(r => {
      console.log(`   Rank #${r.rank} | ${r.name} | Speed: ${r.wpm} WPM | Time: ${r.finishTime}s | Acc: ${r.accuracy}%`);
    });

    if (p1Finished.leaderboard[0].name !== 'TurboApex') {
      throw new Error('TurboApex should have won 1st place!');
    }
    console.log('✅ 1st Place Champion correctly identified: TurboApex!');

    // 7. Test Rematch / Play Again
    console.log('🔄 Testing Rematch...');
    p1.emit('play_again', { pin: roomPin });
    const resetData = await waitForEvent(p2, 'room_reset');
    console.log(`✅ Room successfully reset to status: "${resetData.roomState.status}"!`);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The multiplayer Type Rush Racing engine works flawlessly.');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    p1.disconnect();
    p2.disconnect();
    process.exit(0);
  }
}

runSimulationTest();
