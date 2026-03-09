const fs = require('fs');
const path = require('path');

// Dynamically import node-fetch
const importFetch = async () => {
    const fetchModule = await import('node-fetch');
    return fetchModule.default;
};

const engines = [
    { name: "Unity", license: "Proprietary", pricingModel: "Revenue threshold / Per-seat", languages: "C#", platforms: "Windows, macOS, Linux, iOS, Android, WebGL, Consoles", renderingAPI: "DirectX, OpenGL, Vulkan, Metal", githubRepo: null, steamTerm: "Unity", notableGames: "Hollow Knight, Rust, Escape from Tarkov, Genshin Impact" },
    { name: "Unreal Engine", license: "Proprietary", pricingModel: "5% royalty over $1M", languages: "C++, Blueprints", platforms: "Windows, macOS, Linux, iOS, Android, Consoles", renderingAPI: "DirectX, Vulkan, Metal", githubRepo: "EpicGames/UnrealEngine", steamTerm: "Unreal Engine", notableGames: "Fortnite, Final Fantasy VII Remake, Tekken 8" },
    { name: "Godot", license: "MIT", pricingModel: "Free / Open Source", languages: "GDScript, C#, C++", platforms: "Windows, macOS, Linux, iOS, Android, Web", renderingAPI: "Vulkan, OpenGL", githubRepo: "godotengine/godot", steamTerm: "Godot", notableGames: "Sonic Colors: Ultimate, Brotato, Cassette Beasts" },
    { name: "GameMaker", license: "Proprietary", pricingModel: "Free (non-commercial) / Subscription", languages: "GML", platforms: "Windows, macOS, Ubuntu, iOS, Android, Web, Consoles", renderingAPI: "DirectX, OpenGL", githubRepo: null, steamTerm: "GameMaker", notableGames: "Undertale, Hotline Miami, Stardew Valley" },
    { name: "Construct 3", license: "Proprietary", pricingModel: "Subscription", languages: "Visual Scripting, JavaScript", platforms: "Web, Windows, macOS, Linux, iOS, Android", renderingAPI: "WebGL", githubRepo: null, steamTerm: "Construct", notableGames: "There Is No Game: Wrong Dimension" },
    { name: "Cocos2d-x", license: "MIT", pricingModel: "Free / Open Source", languages: "C++, Lua, JavaScript", platforms: "Windows, macOS, Linux, iOS, Android", renderingAPI: "OpenGL, Metal", githubRepo: "cocos2d/cocos2d-x", steamTerm: "Cocos", notableGames: "Geometry Dash, Fire Emblem Heroes" },
    { name: "CryEngine", license: "Proprietary", pricingModel: "5% royalty", languages: "C++, C#, Lua", platforms: "Windows, Linux, Consoles", renderingAPI: "DirectX, Vulkan", githubRepo: "CRYTEK/CRYENGINE", steamTerm: "CryEngine", notableGames: "Crysis, Hunt: Showdown, Kingdom Come: Deliverance" },
    { name: "RPG Maker MZ", license: "Proprietary", pricingModel: "One-time purchase", languages: "JavaScript", platforms: "Windows, macOS, Web, iOS, Android", renderingAPI: "WebGL", githubRepo: null, steamTerm: "RPG Maker", notableGames: "OMORI, To the Moon, Lisa: The Painful" },
    { name: "Defold", license: "Defold License", pricingModel: "Free", languages: "Lua", platforms: "Windows, macOS, Linux, iOS, Android, Web, Switch", renderingAPI: "OpenGL, Vulkan, Metal", githubRepo: "defold/defold", steamTerm: "Defold", notableGames: "Family Guy: The Quest for Stuff" },
    { name: "Bevy", license: "MIT/Apache", pricingModel: "Free / Open Source", languages: "Rust", platforms: "Windows, macOS, Linux, Web, iOS, Android", renderingAPI: "Vulkan, Metal, DirectX, WebGPU", githubRepo: "bevyengine/bevy", steamTerm: "Bevy", notableGames: "Tiny Glade (in development)" }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getSteamCount(fetch, term) {
    try {
        const encodedTerm = encodeURIComponent(term);
        const res = await fetch(`https://store.steampowered.com/search/?term=${encodedTerm}`);
        const html = await res.text();

        let match = html.match(/([\d,]+)\s*(?:results|matching)/i);
        if (match) {
            return parseInt(match[1].replace(/,/g, ''));
        }
        match = html.match(/class="search_results_count">.*?([\d,]+).*?<\/div>/);
        if (match) {
            return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
    } catch (e) {
        console.error(`Steam fetch failed for ${term}:`, e.message);
        return null;
    }
}

async function getGithubStars(fetch, repo) {
    if (!repo) return null;
    try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                'User-Agent': 'Node.js/Game-Engine-Scraper',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!res.ok) {
           console.error(`GitHub fetch failed for ${repo} with status ${res.status}`);
           return null;
        }
        const data = await res.json();
        return data.stargazers_count || null;
    } catch (e) {
        console.error(`GitHub fetch failed for ${repo}:`, e.message);
        return null;
    }
}

async function getItchCount(fetch, tag) {
    try {
        const encodedTag = encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'));
        const res = await fetch(`https://itch.io/games/made-with-${encodedTag}`);
        if (!res.ok) {
            return null; // Not found
        }
        const html = await res.text();
        // Typically itch shows the count like "<div class="game_count">3,124 results</div>"
        const match = html.match(/([\d,]+)\s*(?:results|games)/i);
        if (match) {
            return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function main() {
    const fetch = await importFetch();
    console.log("Starting data collection...");
    const results = [];

    for (const engine of engines) {
        console.log(`Processing ${engine.name}...`);

        const githubStars = await getGithubStars(fetch, engine.githubRepo);
        await sleep(500);

        const steamGames = await getSteamCount(fetch, engine.steamTerm);
        await sleep(500);

        const itchGames = await getItchCount(fetch, engine.name);
        await sleep(500);

        results.push({
            engine: engine.name,
            license: engine.license,
            pricingModel: engine.pricingModel,
            languages: engine.languages,
            platforms: engine.platforms,
            renderingAPI: engine.renderingAPI,
            githubStars: githubStars,
            steamGames: steamGames,
            itchGames: itchGames,
            notableGames: engine.notableGames
        });
    }

    const outputPath = path.join(__dirname, '../data/game-engine-comparison.json');
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Data collection complete. Saved to ${outputPath}`);
}

main();
