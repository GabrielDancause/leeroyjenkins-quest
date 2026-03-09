const fs = require('fs');
const data = fs.readFileSync('data/esports-prize-pools.json', 'utf8');
let html = fs.readFileSync('public/esports-prize-pools.html', 'utf8');

const jsCode = `
  <script>
    const esportsData = ${data};

    // Format currency
    function formatMoney(num) {
      if (num === null) return "N/A";
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(num);
    }

    // Format numbers
    function formatNum(num) {
      if (num === null) return "N/A";
      return new Intl.NumberFormat('en-US').format(num);
    }

    // Render logic
    const tbody = document.getElementById('table-body');
    const statGames = document.getElementById('stat-games');
    const statMoney = document.getElementById('stat-money');
    const statTourneys = document.getElementById('stat-tourneys');

    let currentData = [...esportsData];
    let sortCol = 'totalPrizeUSD';
    let sortDesc = true;

    function renderStats() {
      statGames.innerText = currentData.length;
      const totalPrize = currentData.reduce((sum, d) => sum + (d.totalPrizeUSD || 0), 0);
      statMoney.innerText = formatMoney(totalPrize);
      const totalTourneys = currentData.reduce((sum, d) => sum + (d.tournamentsCount || 0), 0);
      statTourneys.innerText = formatNum(totalTourneys);
    }

    function renderTable() {
      tbody.innerHTML = '';
      currentData.forEach((d, idx) => {
        const tr = document.createElement('tr');

        // Game and Genre
        const tdGame = document.createElement('td');
        tdGame.innerHTML = \`<div class="col-game">\${d.game}</div>\`;

        const tdGenre = document.createElement('td');
        tdGenre.innerHTML = \`<span class="badge">\${d.genre || 'Uncategorized'}</span>\`;

        // Total Prize
        const tdTotal = document.createElement('td');
        tdTotal.className = 'col-num money';
        tdTotal.innerText = formatMoney(d.totalPrizeUSD);

        // Tournaments
        const tdCount = document.createElement('td');
        tdCount.className = 'col-num';
        tdCount.innerText = formatNum(d.tournamentsCount);

        // Top Tournament
        const tdTourney = document.createElement('td');
        if (d.topTournament) {
           tdTourney.innerHTML = \`<div>\${d.topTournament}</div><span class="sub-text">\${formatMoney(d.topPrizeUSD)}</span>\`;
        } else {
           tdTourney.innerText = 'N/A';
        }

        // Top Player
        const tdPlayer = document.createElement('td');
        if (d.topPlayer) {
           tdPlayer.innerHTML = \`<div>\${d.topPlayer}</div><span class="sub-text">\${formatMoney(d.topEarningsUSD)}</span>\`;
        } else {
           tdPlayer.innerText = 'N/A';
        }

        const tdRank = document.createElement('td');
        tdRank.className = 'col-rank';
        tdRank.innerText = idx + 1;

        tr.appendChild(tdRank);
        tr.appendChild(tdGame);
        tr.appendChild(tdGenre);
        tr.appendChild(tdTotal);
        tr.appendChild(tdCount);
        tr.appendChild(tdTourney);
        tr.appendChild(tdPlayer);

        tbody.appendChild(tr);
      });
      renderStats();
    }

    function filterAndSort() {
       const searchVal = document.getElementById('search').value.toLowerCase();
       const genreVal = document.getElementById('genre-filter').value;

       currentData = esportsData.filter(d => {
          const mSearch = d.game.toLowerCase().includes(searchVal) || (d.topPlayer && d.topPlayer.toLowerCase().includes(searchVal));
          const mGenre = genreVal === 'all' || d.genre === genreVal;
          return mSearch && mGenre;
       });

       currentData.sort((a, b) => {
          let valA = a[sortCol];
          let valB = b[sortCol];
          if (valA === null) valA = sortDesc ? -Infinity : Infinity;
          if (valB === null) valB = sortDesc ? -Infinity : Infinity;

          if (typeof valA === 'string') {
             return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          } else {
             return sortDesc ? valB - valA : valA - valB;
          }
       });

       renderTable();
    }

    document.getElementById('search').addEventListener('input', filterAndSort);
    document.getElementById('genre-filter').addEventListener('change', filterAndSort);

    document.querySelectorAll('th[data-sort]').forEach(th => {
       th.addEventListener('click', () => {
          const col = th.getAttribute('data-sort');
          if (sortCol === col) {
             sortDesc = !sortDesc;
          } else {
             sortCol = col;
             sortDesc = true;
          }

          document.querySelectorAll('th[data-sort]').forEach(t => t.classList.remove('sort-active'));
          th.classList.add('sort-active');

          filterAndSort();
       });
    });

    // Initial render
    filterAndSort();
  </script>
</body>
`;

html = html.replace('</body>', jsCode);
fs.writeFileSync('public/esports-prize-pools.html', html);
console.log('Injected JSON and JS into public/esports-prize-pools.html');
