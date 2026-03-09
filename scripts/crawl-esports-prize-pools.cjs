const fs = require('fs');
const https = require('https');
const path = require('path');

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      if (res.statusCode === 301 || res.statusCode === 302) {
          console.log(`Redirecting to ${res.headers.location}`);
          return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
          reject(new Error(`Status code: ${res.statusCode}`));
          return;
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeGameDetails(gameUrl, gameObj) {
    try {
        await delay(500); // 500ms delay
        console.log(`Fetching details from ${gameUrl}...`);
        const html = await fetchHTML(gameUrl);

        // Highest Prize Pool
        const tournamentBlockMatch = /<h2 class="detail_box_title">Largest Prize Pools<\/h2>.*?<table class="detail_list_table">(.*?)<\/table>/s.exec(html);
        if (tournamentBlockMatch) {
            const firstRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_tournament"><a href="[^"]*"[^>]*>(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(tournamentBlockMatch[1]);
            if (firstRow) {
                gameObj.topTournament = firstRow[1].replace(/<[^>]+>/g, '').replace('» ', '').trim();
                gameObj.topPrizeUSD = parseFloat(firstRow[2].replace(/[$,]/g, ''));
            }
        }

        // Highest Earning Player
        const playerBlockMatch = /<h2 class="detail_box_title">Top Players<\/h2>.*?<table class="detail_list_table">(.*?)<\/table>/s.exec(html);
        if (playerBlockMatch) {
            const firstRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_player"><a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(playerBlockMatch[1]);
            if (firstRow) {
                let playerName = firstRow[1].replace(/<[^>]+>/g, '').trim();
                const realName = firstRow[2].replace(/<[^>]+>/g, '').trim();
                if (realName) {
                    playerName += ` (${realName})`;
                }
                gameObj.topPlayer = playerName;
                gameObj.topEarningsUSD = parseFloat(firstRow[3].replace(/[$,]/g, ''));
            } else {
                 const altRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(playerBlockMatch[1]);
                 if (altRow) {
                    gameObj.topPlayer = altRow[1].replace(/<[^>]+>/g, '').trim();
                    gameObj.topEarningsUSD = parseFloat(altRow[2].replace(/[$,]/g, ''));
                 }
            }
        }

    } catch (e) {
        console.log(`Failed to fetch details for ${gameUrl}: ${e.message}`);
    }
}

async function scrapeEsportsEarnings() {
  console.log("Fetching top 100 games from esportsearnings.com/games...");
  const html = await fetchHTML('https://www.esportsearnings.com/games');

  const games = [];
  const regex = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_game_left"><a href="([^"]*)">(.*?)<\/a><\/td><td class="format_cell detail_list_prize border_right">(.*?)<\/td><td class="format_cell detail_list_prize border_left">(.*?) Players<\/td><td class="format_cell detail_list_prize">(.*?) Tournaments<\/td><\/tr>/g;

  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null && count < 100) {
    const urlPath = match[1];
    const game = match[2].replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    const totalPrizeStr = match[3];
    const playersCountStr = match[4];
    const tournamentsCountStr = match[5];

    let playersCount = null;
    if (playersCountStr.trim() !== '') {
        playersCount = parseInt(playersCountStr.replace(/,/g, ''));
    }

    let tournamentsCount = null;
    if (tournamentsCountStr.trim() !== '') {
        tournamentsCount = parseInt(tournamentsCountStr.replace(/,/g, ''));
    }

    let totalPrizeUSD = null;
    if (totalPrizeStr.trim() !== '') {
        totalPrizeUSD = parseFloat(totalPrizeStr.replace(/[$,]/g, ''));
    }

    games.push({
      url: `https://www.esportsearnings.com${urlPath}`,
      game,
      genre: "Various", // We will try to map this
      totalPrizeUSD,
      playersCount,
      tournamentsCount,
      topTournament: null,
      topPrizeUSD: null,
      topPlayer: null,
      topEarningsUSD: null
    });

    count++;
  }

  // Genre mapping
  const genreMapping = {
      'MOBA': ['Dota 2', 'League of Legends', 'Arena of Valor', 'Mobile Legends: Bang Bang', 'SMITE', 'League of Legends: Wild Rift', 'Heroes of the Storm', 'Honor of Kings', 'Dota 2', 'Pokémon UNITE'],
      'Battle Royale': ['Fortnite', 'PLAYERUNKNOWN\'S BATTLEGROUNDS', 'PLAYERUNKNOWN\'S BATTLEGROUNDS Mobile', 'Apex Legends', 'Call of Duty: Warzone', 'Free Fire'],
      'Tactical Shooter': ['Counter-Strike: Global Offensive', 'Counter-Strike 2', 'Counter-Strike', 'VALORANT', 'Rainbow Six Siege', 'CrossFire', 'Overwatch', 'Overwatch 2'],
      'RTS': ['StarCraft II', 'StarCraft: Brood War', 'Warcraft III', 'Age of Empires II', 'Age of Empires IV'],
      'Fighting': ['Super Smash Bros. Melee', 'Super Smash Bros. Ultimate', 'Street Fighter V', 'Street Fighter 6', 'Tekken 7', 'Tekken 8', 'Brawlhalla', 'Mortal Kombat 11'],
      'Sports': ['Rocket League', 'FIFA 22', 'FIFA 23', 'EA Sports FC 24', 'Madden NFL 22', 'Madden NFL 23', 'Madden NFL 24', 'NBA 2K'],
      'Card Game': ['Hearthstone', 'Magic: The Gathering Arena', 'Shadowverse', 'Gwent'],
      'Auto Battler': ['Teamfight Tactics', 'Dota Underlords'],
      'Mobile': ['Clash Royale', 'Brawl Stars', 'Call of Duty: Mobile']
  };

  for (const g of games) {
      for (const [genre, titles] of Object.entries(genreMapping)) {
          if (titles.some(t => g.game.includes(t))) {
              g.genre = genre;
              break;
          }
      }

      // Fetching details for all to get a good dataset (or just top 50 to not hit rate limits)
      if (games.indexOf(g) < 50) {
          await scrapeGameDetails(g.url, g);
      }

      delete g.url; // Remove URL as it's not needed in final output
  }

  return games;
}

async function run() {
  try {
    const data = await scrapeEsportsEarnings();
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../data/esports-prize-pools.json'), JSON.stringify(data, null, 2));
    console.log(`Successfully scraped ${data.length} games and saved to data/esports-prize-pools.json`);
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

run();
