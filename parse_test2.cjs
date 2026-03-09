const fs = require('fs');

const html = fs.readFileSync('temp.html', 'utf8');
const topTournamentMatch = /<div class="detail_list_summary_box".*?<h2 class="detail_box_title">Largest Prize Pools<\/h2>.*?<tr class="format_row highlight">.*?<td class="format_cell detail_list_player"><a href="[^"]*">(.*?)<\/a>.*?<td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);

if (topTournamentMatch) {
    console.log("Top Tournament:", topTournamentMatch[1]);
    console.log("Top Prize:", topTournamentMatch[2]);
}

const topPlayerMatch = /<div class="detail_list_summary_box".*?<h2 class="detail_box_title">Top Players<\/h2>.*?<tr class="format_row highlight">.*?<td class="format_cell detail_list_player"><a href="[^"]*">(.*?)<\/a>.*?<td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);
if (topPlayerMatch) {
    console.log("Top Player:", topPlayerMatch[1]);
    console.log("Top Earnings:", topPlayerMatch[2]);
}
