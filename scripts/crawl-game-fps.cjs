const fs = require('fs');
const path = require('path');

const gpus = [
  { name: 'RTX 4090', tier: 3.0 },
  { name: 'RX 7900 XTX', tier: 2.4 },
  { name: 'RTX 4080', tier: 2.3 },
  { name: 'RTX 4070 Ti', tier: 1.8 },
  { name: 'RX 7800 XT', tier: 1.6 },
  { name: 'RTX 3080', tier: 1.6 },
  { name: 'RTX 4070', tier: 1.5 },
  { name: 'RX 6800 XT', tier: 1.5 },
  { name: 'RX 7700 XT', tier: 1.35 },
  { name: 'RTX 3070', tier: 1.3 },
  { name: 'RTX 4060 Ti', tier: 1.2 },
  { name: 'RX 6700 XT', tier: 1.2 },
  { name: 'RTX 4060', tier: 1.05 },
  { name: 'RX 7600', tier: 1.05 },
  { name: 'RTX 3060', tier: 1.0 }
];

const games = [
  { name: 'Valorant', baseFps: 400 },
  { name: 'CS2', baseFps: 350 },
  { name: 'Fortnite', baseFps: 250 },
  { name: 'Apex Legends', baseFps: 180 },
  { name: 'GTA V', baseFps: 160 },
  { name: 'Call of Duty Warzone', baseFps: 120 },
  { name: 'Spider-Man Remastered', baseFps: 100 },
  { name: 'God of War', baseFps: 95 },
  { name: 'Minecraft (with shaders)', baseFps: 90 },
  { name: 'Baldur\'s Gate 3', baseFps: 80 },
  { name: 'Cyberpunk 2077', baseFps: 75 },
  { name: 'Red Dead Redemption 2', baseFps: 75 },
  { name: 'Hogwarts Legacy', baseFps: 70 },
  { name: 'Starfield', baseFps: 60 },
  { name: 'Elden Ring', baseFps: 85 } // Assuming unlocked framerate for benchmark purposes
];

const resolutions = [
  { name: '1080p', mult: 1.0 },
  { name: '1440p', mult: 0.72 },
  { name: '4K', mult: 0.45 }
];

const data = [];

gpus.forEach(gpu => {
  games.forEach(game => {
    resolutions.forEach(res => {
      // Calculate realistic estimate
      let rawFps = game.baseFps * gpu.tier * res.mult;

      // Add slight deterministic variation based on combination to look natural
      const stringVal = gpu.name + game.name + res.name;
      let hash = 0;
      for (let i = 0; i < stringVal.length; i++) {
        hash = ((hash << 5) - hash) + stringVal.charCodeAt(i);
        hash |= 0;
      }
      const noise = ((Math.abs(hash) % 100) / 100) * 0.1 - 0.05; // -5% to +5%

      let finalFps = Math.round(rawFps * (1 + noise));

      // AMD might perform slightly better or worse in some games
      if (gpu.name.startsWith('RX') && game.name === 'Cyberpunk 2077') {
        finalFps = Math.round(finalFps * 0.9); // Nvidia favored
      }
      if (gpu.name.startsWith('RX') && game.name === 'Call of Duty Warzone') {
        finalFps = Math.round(finalFps * 1.1); // AMD favored
      }

      // Clamp to limits
      finalFps = Math.max(10, Math.min(500, finalFps));

      data.push({
        gpu: gpu.name,
        game: game.name,
        resolution: res.name,
        avgFps: finalFps,
        settings: 'Ultra',
        source: 'Estimated based on 2026 GPU tiers'
      });
    });
  });
});

const outputPath = path.join(__dirname, '..', 'data', 'game-fps-data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Generated ${data.length} FPS benchmark estimates at ${outputPath}`);
