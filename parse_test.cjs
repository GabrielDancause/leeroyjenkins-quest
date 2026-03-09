const fs = require('fs');

const html = fs.readFileSync('temp.html', 'utf8');
const topTournamentMatch = /Largest Prize Pool:.*?<a href="[^"]*">(.*?)<\/a> \((.*?)\)/s.exec(html);
if (topTournamentMatch) {
    console.log("Top Tournament:", topTournamentMatch[1]);
    console.log("Top Prize:", topTournamentMatch[2]);
}

const topPlayerMatch = /Highest Earning Player:.*?<a href="[^"]*">(.*?)<\/a> \((.*?)\)/s.exec(html);
if (topPlayerMatch) {
    console.log("Top Player:", topPlayerMatch[1]);
    console.log("Top Earnings:", topPlayerMatch[2]);
}
