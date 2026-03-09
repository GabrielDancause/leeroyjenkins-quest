const fs = require('fs');

const html = fs.readFileSync('temp.html', 'utf8');
const topTournamentMatch = /<div class="detail_list_summary_box" style="display:inline-block;">.*?<h2 class="detail_box_title">Largest Prize Pools.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a> )?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);

if (topTournamentMatch) {
    console.log("Top Tournament:", topTournamentMatch[1]);
    console.log("Top Prize:", topTournamentMatch[2]);
}

const topPlayerMatch = /<div class="detail_list_summary_box" style="display:inline-block;">.*?<h2 class="detail_box_title">Top Players.*?<td class="format_cell detail_list_player">(?:<a href="[^"]*"><img [^>]*><\/a> )?<a href="[^"]*">(.*?)<\/a><\/td><td class="format_cell detail_list_prize">(.*?)<\/td>/s.exec(html);
if (topPlayerMatch) {
    console.log("Top Player:", topPlayerMatch[1]);
    console.log("Top Earnings:", topPlayerMatch[2]);
}
