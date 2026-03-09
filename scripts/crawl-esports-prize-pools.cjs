const fs = require('fs');
const fetch = require('node-fetch').default || require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(1000 * (i + 1));
    }
  }
}

function parseCurrency(str) {
  if (!str) return null;
  return parseFloat(str.replace(/[^0-9.-]+/g, ''));
}

function parseNumber(str) {
  if (!str) return null;
  return parseInt(str.replace(/[^0-9]+/g, ''), 10);
}

const gameGenres = {
  'Dota 2': 'MOBA',
  'Fortnite': 'Battle Royale',
  'Counter-Strike: Global Offensive': 'FPS',
  'League of Legends': 'MOBA',
  'Arena of Valor': 'MOBA',
  'PLAYERUNKNOWN’S BATTLEGROUNDS': 'Battle Royale',
  'Counter-Strike 2': 'FPS',
  'PLAYERUNKNOWN\'S BATTLEGROUNDS Mobile': 'Battle Royale',
  'StarCraft II': 'RTS',
  'Overwatch': 'FPS',
  'Rainbow Six Siege': 'FPS',
  'Rocket League': 'Sports',
  'Hearthstone': 'Card Game',
  'VALORANT': 'FPS',
  'Apex Legends': 'Battle Royale',
  'Mobile Legends: Bang Bang': 'MOBA',
  'Free Fire': 'Battle Royale',
  'Heroes of the Storm': 'MOBA',
  'Call of Duty: Warzone': 'Battle Royale',
  'CrossFire': 'FPS'
};

const defaultGenre = 'Other';

async function crawlTopGames() {
  const url = 'https://www.esportsearnings.com/games';
  console.log(`Fetching ${url}...`);
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  const topGames = [];

  $('.format_row').each((i, el) => {
    const cells = $(el).find('.format_cell');
    if (cells.length > 0) {
       const rank = cells.eq(0).text().trim();
       const name = cells.eq(1).text().trim();
       const href = cells.eq(1).find('a').attr('href');
       const prize = cells.eq(2).text().trim();
       const players = cells.eq(3).text().trim();
       const tourneys = cells.eq(4).text().trim();

       if (name && href && href.includes('/games/') && parseCurrency(prize) > 100000) {
           topGames.push({
               name,
               url: `https://www.esportsearnings.com${href}`,
               totalPrizeUSD: parseCurrency(prize),
               tournamentsCount: parseNumber(tourneys)
           });
       }
    }
  });

  // Sort by prize to be sure
  topGames.sort((a, b) => b.totalPrizeUSD - a.totalPrizeUSD);
  const selectedGames = topGames.slice(0, 15);

  const results = [];
  for (const game of selectedGames) {
    console.log(`Fetching data for ${game.name}...`);
    try {
      let topPlayer = null;
      let topEarningsUSD = null;
      let topTournament = null;
      let topPrizeUSD = null;

      // Top Player page
      await delay(500);
      const playersHtml = await fetchWithRetry(`${game.url}/top-players`);
      const $p = cheerio.load(playersHtml);
      const topPlayerRow = $p('.format_row').eq(4); // the data rows start at index 4 usually
      if (topPlayerRow.length) {
         const cells = topPlayerRow.find('.format_cell, td');
         // We might have <td class="format_cell">...
         // Index 1 is Player ID, Index 2 is Player Name, Index 3 is Total (Game)
         topPlayer = cells.eq(1).text().trim().replace(/.*?\s+/, '') || cells.eq(1).text().trim(); // Might contain flag img
         const playerName = cells.eq(2).text().trim();
         if (topPlayer) {
             topPlayer = topPlayer.split(/(?=[A-Z])/)[0]; // Just try to get their handle. Or wait, let's just get the text.
             // Actually index 1 is usually ID, index 2 is Name
             const idText = cells.eq(1).text().trim();
             // Let's strip out the number ranking from the start if it exists
             topPlayer = idText.replace(/^\d+\.\s*/, '');
         }
         topEarningsUSD = parseCurrency(cells.eq(3).text().trim());
      }

      // Top Tournaments page
      await delay(500);
      const tourneyHtml = await fetchWithRetry(`${game.url}/largest-tournaments`);
      const $t = cheerio.load(tourneyHtml);

      const topTourneyRow = $t('.format_row').eq(3); // The data rows start at index 3
      if (topTourneyRow.length) {
        const cells = topTourneyRow.find('.format_cell, td');
        // Index 1 is usually Tournament Name, Index 2 is Prize Money
        const tName = cells.eq(1).text().trim();
        topTournament = tName.replace(/^\d+\.»\s*/, ''); // Remove "1.» "
        topPrizeUSD = parseCurrency(cells.eq(2).text().trim());
      }

      let genre = gameGenres[game.name] || defaultGenre;

      results.push({
        game: game.name,
        genre,
        totalPrizeUSD: game.totalPrizeUSD,
        tournamentsCount: game.tournamentsCount,
        topTournament,
        topPrizeUSD,
        topPlayer,
        topEarningsUSD
      });

      await delay(500);
    } catch (e) {
      console.error(`Failed to fetch ${game.name}: ${e.message}`);
    }
  }

  const dataPath = path.join(__dirname, '..', 'data', 'esports-prize-pools.json');
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} records to ${dataPath}`);
}

crawlTopGames().catch(console.error);
