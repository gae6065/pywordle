const DEBUG_MODE = true; // ← Set to false for normal mode
let word = '';
let currentGuess = '';
let currentRow = 0;
const maxRows = 6;

document.addEventListener("DOMContentLoaded", () => {
    createBoard();

    if (DEBUG_MODE) {
        chooseDebugWord();
    } else {
        fetch("https://random-word-api.herokuapp.com/word?length=5")
            .then(res => res.json())
            .then(data => word = data[0].toLowerCase());
    }

    document.addEventListener("keydown", handleKeyPress);
});

function createBoard() {
    const board = document.getElementById("game-board");
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function handleKeyPress(e) {
    if (currentRow >= maxRows) return;

    const row = document.getElementsByClassName("row")[currentRow];
    if (e.key === "Enter") {
        if (currentGuess.length !== 5) return;

        validateGuess(currentGuess).then(isValid => {
            if (!isValid) {
                showMessage("Not in dictionary!");
                return;
            }

            const target = word.split("");
            const guess = currentGuess.split("");

            // Step 1: Build letter count
            const letterCount = {};
            for (let i = 0; i < 5; i++) {
                const ch = target[i];
                letterCount[ch] = (letterCount[ch] || 0) + 1;
            }

            const colors = Array(5).fill("absent");

            // Step 2: Mark greens
            for (let i = 0; i < 5; i++) {
                if (guess[i] === target[i]) {
                    colors[i] = "correct";
                    letterCount[guess[i]]--;
                }
            }

            // Step 3: Mark yellows
            for (let i = 0; i < 5; i++) {
                if (colors[i] === "correct") continue;
                if (target.includes(guess[i]) && letterCount[guess[i]] > 0) {
                    colors[i] = "present";
                    letterCount[guess[i]]--;
                }
            }

            // Step 4: Apply animations and colors
            for (let i = 0; i < 5; i++) {
                const tile = row.children[i];
                const color = colors[i];
                const letter = guess[i];

                setTimeout(() => {
                    tile.classList.add("flip");
                    setTimeout(() => {
                        tile.classList.add(color);
                    }, 200);
                }, i * 400);
            }

            // Step 5: Move on to next row
            if (currentGuess === word) {
                showMessage("You win! 🎉");
                disableInput();
            } else if (currentRow === maxRows - 1) {
                showMessage(`You lost! Word was: ${word}`);
                disableInput();
            } else {
                currentRow++;
                currentGuess = '';
            }
        });
    } else if (e.key === "Backspace") {
        if (currentGuess.length > 0) {
            currentGuess = currentGuess.slice(0, -1);
            row.children[currentGuess.length].textContent = '';
        }
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
        const tile = row.children[currentGuess.length];
        tile.textContent = e.key.toUpperCase();
        tile.classList.add("pop");
        setTimeout(() => tile.classList.remove("pop"), 100);
        currentGuess += e.key.toLowerCase();
    }
}

function chooseDebugWord() {
    let attempts = 0;
    while (attempts < 3) {
        const input = prompt("Enter your secret 5-letter word:").toLowerCase();
        if (input.length !== 5) {
            alert("Word must be exactly 5 letters.");
            attempts++;
            continue;
        }

        validateGuess(input).then(valid => {
            if (valid) {
                word = input;
                alert("Debug word accepted.");
            } else {
                alert("That word isn't valid. Try again.");
                chooseDebugWord(); // re-prompt
            }
        });
        break;
    }
}

if (!DEBUG_MODE) {
    console.log("Secret word:", word);
}

function showMessage(msg) {
    const msgContainer = document.getElementById("message-container");
    msgContainer.textContent = msg;
}

function validateGuess(word) {
    return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(res => res.status === 200)
        .catch(() => false);
}

function disableInput() {
    document.removeEventListener("keydown", handleKeyPress);
}
