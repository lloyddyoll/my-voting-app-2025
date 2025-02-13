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

    let remainingVotes = 0;
    let currentPair = [];

    function loadImages() {
        fetch("/api/images")
            .then(response => response.json())
            .then(data => {
                console.log("Images Loaded:", data); // Debugging

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

                remainingVotes = data.remainingVotes;
                updateVoteCount();
            })
            .catch(error => console.error("Error loading images:", error));
    }

    function vote(winner, loser) {
        console.log("Vote Registered:", { winner, loser }); // Debugging

        if (remainingVotes <= 0) return;

        fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ winner, loser })
        })
        .then(response => {
            if (!response.ok) throw new Error("Vote submission failed");
            if (!response.ok) throw new Error("Vote submission failed");
return response.text(); // No need to parse JSON
        })
        .then(() => {
            remainingVotes--;
            updateVoteCount();

            if (remainingVotes > 0) {
                loadImages();
            } else {
                endVoting();
            }
        })
        .catch(error => console.error("Error submitting vote:", error));
    }

    function updateVoteCount() {
        votesLeft.textContent = `Remaining Votes: ${remainingVotes}`;
    }

    function endVoting() {
        votingContainer.classList.add("hidden");
        votingCompleteMessage.classList.remove("hidden");
        leaderboardButton.classList.remove("hidden");
        votesLeft.textContent = "Remaining Votes: 0";
    }

    leaderboardButton.addEventListener("click", () => {
        fetch("/api/leaderboard")
            .then(response => response.json())
            .then(data => {
                console.log("Leaderboard Data:", data); // Debugging

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
