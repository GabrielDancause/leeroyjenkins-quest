const fs = require('fs');

const html = fs.readFileSync('temp.html', 'utf8');

const extractTopInfo = (html) => {
    let topTournament = null;
    let topPrizeUSD = null;
    let topPlayer = null;
    let topEarningsUSD = null;

    const tournamentMatch = /<h2 class="detail_box_title">Largest Prize Pools.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);
    if (tournamentMatch) {
        topTournament = tournamentMatch[1].trim();
        topPrizeUSD = parseFloat(tournamentMatch[2].replace(/[$,]/g, ''));
    }

    const playerMatch = /<h2 class="detail_box_title">Top Players.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);
    if (playerMatch) {
        topPlayer = playerMatch[1].trim();
        topEarningsUSD = parseFloat(playerMatch[2].replace(/[$,]/g, ''));
    }

    // Try alternate format for tournaments (where there's no flag)
    if (!topTournament) {
        const altTournamentMatch = /<h2 class="detail_box_title">Largest Prize Pools.*?<td class="format_cell detail_list_player"><a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);
        if (altTournamentMatch) {
             topTournament = altTournamentMatch[1].trim();
             topPrizeUSD = parseFloat(altTournamentMatch[2].replace(/[$,]/g, ''));
        }
    }

    // Sometimes players have team acronyms or tags, let's just get the first text
    if (playerMatch && playerMatch[1].includes("</a>")) {
         // It matched too much
         console.log("Matched too much for player");
    }

    return { topTournament, topPrizeUSD, topPlayer, topEarningsUSD };
};

console.log(extractTopInfo(html));
