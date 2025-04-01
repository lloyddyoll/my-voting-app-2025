const express = require("express");
const fs = require("fs");
const path = require("path");
const compression = require("compression");
const requestIp = require("request-ip");

const app = express();
const PORT = 3000;
const IMAGE_DIR = path.join(__dirname, "public", "images");

app.use(compression());
app.use(express.static("public"));
app.use(express.json());
app.use(requestIp.mw());

let images = fs.readdirSync(IMAGE_DIR).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
let eloRatings = {};
let userVotes = {}; // Store votes per device

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function initializeUserSession(device) {
    if (!userVotes[device]) {
        let shuffledImages = shuffleArray([...images, ...images]);
        let pairings = [];
        for (let i = 0; i < shuffledImages.length; i += 2) {
            pairings.push([shuffledImages[i], shuffledImages[i + 1]]);
        }
        userVotes[device] = {
            comparisons: pairings,
            remainingVotes: pairings.length
        };
    }
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
}

app.get("/api/images", (req, res) => {
    const device = req.query.device || req.clientIp;
    initializeUserSession(device);

    let userData = userVotes[device];

    // ✅ Prevent sending more images when voting is done
    if (userData.remainingVotes === 0 || userData.comparisons.length === 0) {
        return res.json({ finished: true });
    }

    let selectedPair = userData.comparisons.pop();
    userData.remainingVotes--;

    res.json({ images: selectedPair, remainingVotes: userData.remainingVotes });
});

app.post("/api/vote", (req, res) => {
    const { winner, loser, device } = req.body;
    if (!device || !userVotes[device]) return res.status(400).json({ error: "Invalid device" });

    if (winner && loser) {
        calculateElo(winner, loser);
    }

    res.json({ success: true, remainingVotes: userVotes[device].remainingVotes });
});

app.get("/api/leaderboard", (req, res) => {
    let sorted = Object.entries(eloRatings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, rating]) => ({ name, rating }));

    res.json(sorted);
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
