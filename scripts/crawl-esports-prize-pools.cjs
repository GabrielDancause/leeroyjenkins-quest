const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Dynamically import node-fetch
const importFetch = async () => {
    const fetchModule = await import('node-fetch');
    return fetchModule.default;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parseMoney(str) {
    if (!str) return null;
    const clean = str.replace(/[$,]/g, '').trim();
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
}

function parseIntText(str) {
    if (!str) return null;
    const clean = str.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? null : val;
}

async function main() {
    const fetch = await importFetch();
    const baseUrl = 'https://www.esportsearnings.com';

    console.log('Fetching top 100 games...');
    const gamesRes = await fetch(`${baseUrl}/games`);
    const gamesHtml = await gamesRes.text();
    const $ = cheerio.load(gamesHtml);

    const games = [];
    $('table tr').each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 5) {
            const orderText = $(cols[0]).text().trim();
            const order = parseInt(orderText.replace('.', ''), 10);
            if (order && order <= 100) {
                const name = $(cols[1]).text().trim();
                const href = $(cols[1]).find('a').attr('href');
                const prizeStr = $(cols[2]).text().trim();
                const playersStr = $(cols[3]).text().trim();
                const tournamentsStr = $(cols[4]).text().trim();

                games.push({
                    game: name,
                    genre: null, // Will attempt to infer or leave null
                    totalPrizeUSD: parseMoney(prizeStr),
                    tournamentsCount: parseIntText(tournamentsStr),
                    topTournament: null,
                    topPrizeUSD: null,
                    topPlayer: null,
                    topEarningsUSD: null,
                    href: href
                });
            }
        }
    });

    console.log(`Found ${games.length} games. Scraping details...`);

    // Map of common genres based on names for simplicity (or fallback to null)
    // Esportsearnings doesn't list genres on the game page easily
    const genreKeywords = {
        'Shooter': ['Shooter', 'Counter-Strike', 'Call of Duty', 'Overwatch', 'Valorant', 'Rainbow Six', 'PUBG', 'PLAYERUNKNOWN', 'Apex', 'Halo', 'CrossFire', 'Point Blank', 'Free Fire'],
        'MOBA': ['Dota', 'League of Legends', 'Arena of Valor', 'Mobile Legends', 'Smite', 'Heroes of the Storm', 'Wild Rift'],
        'Fighting': ['Street Fighter', 'Super Smash Bros', 'Tekken', 'Mortal Kombat', 'Brawlhalla', 'Guilty Gear', 'Dragon Ball'],
        'Battle Royale': ['Fortnite', 'PUBG', 'PLAYERUNKNOWN', 'Apex Legends', 'Free Fire'], // Battle Royale often overlaps with Shooter
        'Sports': ['Rocket League', 'FIFA', 'Madden', 'NBA', 'eFootball'],
        'Racing': ['iRacing', 'F1', 'rFactor', 'Gran Turismo', 'Forza'],
        'Strategy': ['StarCraft', 'Warcraft', 'Age of Empires', 'Teamfight Tactics'],
        'Card Game': ['Hearthstone', 'Magic: The Gathering', 'Gwent', 'Shadowverse']
    };

    function inferGenre(gameName) {
        // Find matching genre based on keywords
        let matchedGenre = null;
        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            for (const keyword of keywords) {
                if (gameName.toLowerCase().includes(keyword.toLowerCase())) {
                    matchedGenre = genre;
                    break;
                }
            }
            if (matchedGenre) break;
        }
        return matchedGenre;
    }

    const results = [];
    for (const g of games) {
        console.log(`Processing: ${g.game}`);
        g.genre = inferGenre(g.game);

        if (g.href) {
            await sleep(500);
            try {
                const res = await fetch(`${baseUrl}${g.href}`);
                if (res.ok) {
                    const html = await res.text();
                    const $g = cheerio.load(html);

                    // Top Tournament is usually in the first table
                    const tables = $g('table');

                    if (tables.length > 0) {
                        const topTourneyRow = $g(tables[0]).find('tr').eq(1).find('td');
                        if (topTourneyRow.length >= 3) {
                            g.topTournament = $g(topTourneyRow[1]).text().trim().replace(/^»\s*/, '') || null;
                            g.topPrizeUSD = parseMoney($g(topTourneyRow[2]).text().trim());
                        }
                    }

                    // Top Player is usually in the second table
                    if (tables.length > 1) {
                        const topPlayerRow = $g(tables[1]).find('tr').eq(1).find('td');
                        if (topPlayerRow.length >= 4) {
                            g.topPlayer = $g(topPlayerRow[1]).text().trim() || $g(topPlayerRow[2]).text().trim() || null; // Player ID
                            g.topEarningsUSD = parseMoney($g(topPlayerRow[3]).text().trim());
                        }
                    }
                } else {
                    console.error(`Failed to fetch ${g.href}: HTTP ${res.status}`);
                }
            } catch (err) {
                console.error(`Error fetching ${g.href}:`, err.message);
            }
        }

        // Clean up href before saving
        delete g.href;
        results.push(g);
    }

    const outputPath = path.join(__dirname, '../data/esports-prize-pools.json');
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Data collection complete. Saved to ${outputPath}`);
}

main();
