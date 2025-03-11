document.addEventListener("DOMContentLoaded", () => {
    const candidate1 = document.getElementById("candidate1");
    const candidate2 = document.getElementById("candidate2");
    const name1 = document.getElementById("name1");
    const name2 = document.getElementById("name2");
    const votesLeft = document.getElementById("votes-left");
    const votingContainer = document.getElementById("vote-container");
    const votingCompleteMessage = document.getElementById("voting-complete-message");
    const leaderboardButton = document.getElementById("leaderboard-button");
    const leaderboard = document.getElementById("leaderboard");
    const leaderboardBody = document.getElementById("leaderboard-body");

    let currentPair = [];

    function getDeviceId() {
        let deviceId = localStorage.getItem("device_id");
        if (!deviceId) {
            deviceId = "device_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("device_id", deviceId);
        }
        return deviceId;
    }

    const deviceId = getDeviceId();

    function loadImages() {
        fetch(`/api/images?device=${deviceId}`)
            .then(response => response.json())
            .then(data => {
                if (data.finished) {
                    endVoting();
                    return;
                }

                currentPair = [data.images[0], data.images[1]];

                candidate1.src = `/images/${data.images[0]}`;
                candidate2.src = `/images/${data.images[1]}`;
                name1.textContent = data.images[0].split(".")[0];
                name2.textContent = data.images[1].split(".")[0];

                candidate1.onclick = () => vote(currentPair[0], currentPair[1]);
                candidate2.onclick = () => vote(currentPair[1], currentPair[0]);

                updateVoteCount(data.remainingVotes);
            })
            .catch(error => console.error("Error loading images:", error));
    }

    function vote(winner, loser) {
        fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winner, loser, device: deviceId })
        })
        .then(response => response.json())
        .then(data => {
            updateVoteCount(data.remainingVotes);
            if (data.remainingVotes > 0) {
                loadImages();
            } else {
                endVoting();
            }
        })
        .catch(error => console.error("Error submitting vote:", error));
    }

    function updateVoteCount(remainingVotes) {
        votesLeft.textContent = `Remaining Votes: ${remainingVotes}`;
    }

    function endVoting() {
        votingContainer.classList.add("hidden");
        votingCompleteMessage.classList.remove("hidden");
        leaderboardButton.classList.remove("hidden");
        votesLeft.textContent = "Remaining Votes: 0";

        // Hide the images so users can't click them after voting
        candidate1.style.display = "none";
        candidate2.style.display = "none";

        // Hide the candidate names
        name1.style.display = "none";
        name2.style.display = "none";

        // Remove click events to prevent extra votes
        candidate1.onclick = null;
        candidate2.onclick = null;
    }

    leaderboardButton.addEventListener("click", () => {
        fetch("/api/leaderboard")
            .then(response => response.json())
            .then(data => {
                leaderboardBody.innerHTML = data.slice(0, 20).map((candidate, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><img src="/images/${candidate.name}" width="50"></td>
                        <td>${candidate.name.split('.')[0]}</td>
                        <td>${candidate.rating.toFixed(2)}</td>
                    </tr>
                `).join('');
                leaderboard.classList.remove("hidden");
            })
            .catch(error => console.error("Error loading leaderboard:", error));
    });

    loadImages();
});
