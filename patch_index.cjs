const fs = require('fs');
let code = fs.readFileSync('src/pages/index.astro', 'utf8');
code = code.replace(
    /const studies = \[/,
    `const studies = [\n  {\n    title: "Esports Prize Pool Rankings 2026",\n    subtitle: "95 games analyzed",\n    slug: "/esports-prize-pools",\n    stat: "$971M+",\n    statLabel: "Total Prize Money",\n    desc: "A comprehensive analysis of 95 top esports games. We tracked over $971M in total prize money across tens of thousands of tournaments to see which games pay the most.",\n    tag: "ORIGINAL RESEARCH",\n  },`
);
fs.writeFileSync('src/pages/index.astro', code);
