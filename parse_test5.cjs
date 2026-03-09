const fs = require('fs');

const html = fs.readFileSync('temp.html', 'utf8');

const extractTopInfo = (html) => {
    let topTournament = null;
    let topPrizeUSD = null;
    let topPlayer = null;
    let topEarningsUSD = null;

    // Highest Prize Pool
    const tournamentBlockMatch = /<h2 class="detail_box_title">Largest Prize Pools<\/h2>.*?<table class="detail_list_table">(.*?)<\/table>/s.exec(html);
    if (tournamentBlockMatch) {
        const firstRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(tournamentBlockMatch[1]);
        if (firstRow) {
            topTournament = firstRow[1].replace(/<[^>]+>/g, '').trim();
            topPrizeUSD = parseFloat(firstRow[2].replace(/[$,]/g, ''));
        }
    }

    // Highest Earning Player
    const playerBlockMatch = /<h2 class="detail_box_title">Top Players<\/h2>.*?<table class="detail_list_table">(.*?)<\/table>/s.exec(html);
    if (playerBlockMatch) {
        const firstRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_player"><a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(playerBlockMatch[1]);
        if (firstRow) {
            topPlayer = firstRow[1].replace(/<[^>]+>/g, '').trim() + " (" + firstRow[2].replace(/<[^>]+>/g, '').trim() + ")";
            topEarningsUSD = parseFloat(firstRow[3].replace(/[$,]/g, ''));
        } else {
            // some players don't have real name
            const altRow = /<tr class="format_row highlight">.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a>\s*)?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(playerBlockMatch[1]);
            if (altRow) {
                topPlayer = altRow[1].replace(/<[^>]+>/g, '').trim();
                topEarningsUSD = parseFloat(altRow[2].replace(/[$,]/g, ''));
            }
        }
    }

    return { topTournament, topPrizeUSD, topPlayer, topEarningsUSD };
};

console.log(extractTopInfo(html));
