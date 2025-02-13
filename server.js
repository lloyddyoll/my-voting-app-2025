const express = require("express");
const fs = require("fs");
const path = require("path");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000; // Use Render’s port if available
const IMAGE_DIR = path.join(__dirname, "public", "images");
const DATA_FILE = path.join(__dirname, "data.json");

app.use(compression());
app.use(express.static("public"));
app.use(express.json());

let images = fs.readdirSync(IMAGE_DIR).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
let comparisons = [];
let eloRatings = {};
let totalVotes = images.length; // Each image appears exactly twice

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Load saved rankings if available
if (fs.existsSync(DATA_FILE)) {
    eloRatings = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function initializeComparisons() {
    comparisons = [];
    let pairings = [];

    let tempImages = [...images, ...images]; // Ensure each image appears twice
    shuffleArray(tempImages);

    for (let i = 0; i < tempImages.length; i += 2) {
        pairings.push([tempImages[i], tempImages[i + 1]]);
    }

    comparisons = shuffleArray(pairings);
}

function calculateElo(winner, loser) {
    const K = 32;
    if (!eloRatings[winner]) eloRatings[winner] = 1500;
    if (!eloRatings[loser]) eloRatings[loser] = 1500;

    const ratingA = eloRatings[winner];
    const ratingB = eloRatings[loser];
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

    eloRatings[winner] = ratingA + K * (1 - expectedA);
    eloRatings[loser] = ratingB + K * (0 - expectedB);

    // Save updated rankings
    fs.writeFileSync(DATA_FILE, JSON.stringify(eloRatings, null, 2));
}

initializeComparisons();

app.get("/api/images", (req, res) => {
    if (comparisons.length === 0) {
        return res.json({ finished: true });
    }

    let selectedPair = comparisons.pop();
    res.json({ images: selectedPair, remainingVotes: comparisons.length + 1 });
});

app.post("/api/vote", (req, res) => {
    const { winner, loser } = req.body;
    if (!winner || !loser) {
        return res.status(400).json({ error: "Invalid vote submission" });
    }

    calculateElo(winner, loser);
    res.json({ success: true });
});

app.get("/api/leaderboard", (req, res) => {
    let sorted = Object.entries(eloRatings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20) // Show top 20
        .map(([name, rating]) => ({ name, rating }));

    res.json(sorted);
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
