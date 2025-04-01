let TotalMoves = 0; //Counts the total moves performed by the player
let GameTimer; // Timer variable
let ElapsedTime = 0; // Time elapsed in seconds
let IsGameActive = false; // Flag to check if the game is active
let DiskArray = []; // Array to hold the disks
let TowerStructure = { // Object to hold the towers and their disks
    tower1: [],
    tower2: [],
    tower3: []
};

let MoveHistory = []; // Array to store the history of moves for undo functionality

//Adjusts the number of disks according to the selected difficulty level (easy, medium, hard)
//The number of disks is automatically refreshed in the input field and connected to the game's configurations 
/*
function setDifficultyLevel(difficulty) {
    let diskCount;
    switch (difficulty) {
        case 'easy':
            diskCount = 3;
            break;
        case 'medium':
            diskCount = 5;
            break;
        case 'hard':
            diskCount = 7;
            break;
        default:
            return; // Do nothing if the difficulty is invalid
    }

    // Dynamically update the disk count input field
    document.getElementById('DiskCount').value = diskCount;
    document.getElementById('Diff').addEventListener('change', (event) => {
        setDifficultyLevel(event.target.value);
    });
}
    */
document.getElementById('StartGame').addEventListener('click', initializeGame);

//Starts the game by establishing the number of disks, the timer, and the towers
//It initiates the timer, arranges the disks on the initial tower, and shows the towers 
//The move counter resets, and the move history is wiped clean
function initializeGame() {
    console.log("Starting new game");

    // Get disk count dynamically from input field
    const diskCountElement = document.getElementById('DiskCount');
    if (!diskCountElement) {
        console.error("Disk count input field not found!");
        return;
    }

    const diskCount = parseInt(diskCountElement.value); // Read user input
    if (!isValidDiskCount(diskCount)) return; // Validate the input

    TotalMoves = 0; // Reset moves
    ElapsedTime = 0; // Reset timer
    clearInterval(GameTimer); // Clear previous timer
    document.getElementById('MoveCounter').innerText = 'Moves: 0';
    document.getElementById('Timer').innerText = 'Time: 0s';
    setupDisks(diskCount); // Dynamically create disks
    renderTowers(); // Render the disks
    beginTimer(); // Start timer
    IsGameActive = true; // Mark game as active

    MoveHistory = []; // Clear move history
}

//Creates the disks (numbers 1 to count) and assigns them to the first tower 
//The disks are stacked in descending order (with disk 1 being the smallest on top)
function setupDisks(count) {
    DiskArray = [];// Reset disks array
    for (let i = count; i >= 1; i--) {// Create disks in descending order
        DiskArray.push(i);
    }
    TowerStructure.tower1 = [...DiskArray];// Initialize tower1 with disks
    TowerStructure.tower2 = [];// Initialize tower2 as empty
    TowerStructure.tower3 = [];// Initialize tower3 as empty
}

//Refreshes the HTML depiction of the towers along with their disks
//Every disk is displayed using a div element, and the disks can be moved and placed between towers
function renderTowers() {
    console.log("Rendering towers:", TowerStructure); // Debugging line to check tower states

    const tower1 = document.getElementById('tower1');
    const tower2 = document.getElementById('tower2');
    const tower3 = document.getElementById('tower3');

    tower1.innerHTML = '';
    tower2.innerHTML = '';
    tower3.innerHTML = '';

    TowerStructure.tower1.forEach(disk => {
        const diskElement = createDiskElement(disk);
        tower1.appendChild(diskElement);
    });
    TowerStructure.tower2.forEach(disk => {
        const diskElement = createDiskElement(disk);
        tower2.appendChild(diskElement);
    });
    TowerStructure.tower3.forEach(disk => {
        const diskElement = createDiskElement(disk);
        tower3.appendChild(diskElement);
    });
}

// Function to create disk element
// This function creates a disk element with the specified size and color
function createDiskElement(size) {
    const disk = document.createElement('div');
    const sizeMap = {
        1: '23px',
        2: '46px',
        3: '69px',
        4: '92px',
        5: '115px',
        6: '138px',
        7: '161px'
    };
    
    disk.className = 'disk';
    disk.style.width = sizeMap[size] || `${size * 26}px`; // individual sizes
    disk.style.backgroundColor = getDiskColor(size);
    disk.innerText = size;
    disk.draggable = true;
    disk.dataset.size = size;
    disk.addEventListener('dragstart', handleDragStart);
    return disk;
}

// Function to get disk color
// This function returns a color based on the disk size
function getDiskColor(size) {
    const colors = ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'yellow'];
    return colors[size - 1] || '#000';
}

// Function to handle drag start event
// This function sets the data to be transferred during the drag operation
function handleDragStart(event) {
    const size = event.target.dataset.size;
    event.dataTransfer.setData('text/plain', size);
}

// Function to allow dropping on towers
// This function prevents the default behavior of the browser when dragging over a drop target
function enableDrop(event) {
    event.preventDefault();
}

// Function to handle drop on towers
function handleDrop(event, towerId) {
    event.preventDefault();
    const size = parseInt(event.dataTransfer.getData('text/plain'));
    const sourceTowerId = getSourceTower(size);
    
    // Validation for game rules
    if (!sourceTowerId) {
        alert('You can only move the uppermost disk.');
        return;
    }
    
    if (!validateMove(sourceTowerId, towerId)) {
        alert('Invalid move: No larger disk may be placed on top of a smaller disk.');
        return;
    }
    
    // Check if the game is active
    const move = {
        disk: size,
        sourceTower: sourceTowerId,
        targetTower: towerId
    };
    MoveHistory.push(move);

    executeMove(sourceTowerId, towerId);
    TotalMoves++;
    document.getElementById('MoveCounter').innerText = `Moves: ${TotalMoves}`;
    verifyWinCondition();
}

// Function to get the source tower of the disk
// This function checks which tower the disk is currently on
function getSourceTower(size) {
    for (let tower in TowerStructure) {
        if (TowerStructure[tower][TowerStructure[tower].length - 1] === size) {
            return tower;
        }
    }
    return null;
}

// Function to validate the move
// Checks if the move is valid according to the game rules
// Returns true if the move is valid, false otherwise
function validateMove(source, target) {
    const sourceTower = TowerStructure[source];
    const targetTower = TowerStructure[target];
    if (sourceTower.length === 0) return false;
    if (targetTower.length === 0) return true;
    return sourceTower[sourceTower.length - 1] < targetTower[targetTower.length - 1];
}

// Function to execute the move
// Moves the disk from the source tower to the target tower
function executeMove(source, target) {
    const disk = TowerStructure[source].pop();
    TowerStructure[target].push(disk);
    renderTowers();
}

// Function to verify win condition
// Checks if all disks are moved to the third tower
// If all disks are moved, the game is over and the user wins
// If the game is over, the game timer is stopped and the user is alerted with a congratulatory message
function verifyWinCondition() {
    if (TowerStructure.tower3.length === DiskArray.length) {
        clearInterval(GameTimer);
        alert('=) Congratulations! You completed the game!');
        IsGameActive = false;
        saveCompletionTime(ElapsedTime); // Save the completion time
        updateLeaderboard(); // Update the leaderboard display
    }
}

// Function to start the game timer
// This function initializes the game timer and updates the timer display every second
function beginTimer() {
    GameTimer = setInterval(() => {
        ElapsedTime++;
        document.getElementById('Timer').innerText = `Time: ${ElapsedTime}s`;
    }, 1000);
}

// Function to revert the last move
// This function allows the user to undo the last move made in the game
function revertLastMove() {
    if (MoveHistory.length === 0) {
        alert("No moves to undo.");
        return;
    }
    
    // Get the last move from the history
    const lastMove = MoveHistory.pop();

    // Revert the move by moving the disk back
    TowerStructure[lastMove.targetTower].pop(); // Remove the disk from the target tower
    TowerStructure[lastMove.sourceTower].push(lastMove.disk); // Add the disk back to the source tower

    TotalMoves--;
    document.getElementById('MoveCounter').innerText = `Moves: ${TotalMoves}`;
    renderTowers();
}

// Event listeners
const startGameButton = document.getElementById('StartGame');
startGameButton.addEventListener('click', initializeGame);

const undoButton = document.getElementById('UndoButton');
undoButton.addEventListener('click', revertLastMove);

['tower1', 'tower2', 'tower3'].forEach(id => {
    const towerEl = document.getElementById(id);
    towerEl.addEventListener('dragover', enableDrop);
    towerEl.addEventListener('drop', (event) => handleDrop(event, id));
});
//
const counter = document.getElementById('MoveCounter');
counter.innerText = `Moves: ${TotalMoves}`;
counter.classList.remove('animate'); // Reset animation
void counter.offsetWidth; // Trigger reflow
counter.classList.add('animate'); // Reapply animation

// Function to validate disk count
// This function checks if the disk count is within the valid range (1 to 7)
// If the disk count is invalid, it displays an alert and returns false
// Otherwise it returns true
function isValidDiskCount(diskCount) {
    if (diskCount > 7) {
        alert('Maximum number of disks is 7. Please select a smaller number.');
        return false;
    }
    if (diskCount < 1) {
        alert('Minimum number of disks is 1. Please select a larger number.');
        return false;
    }
    return true;
}

// Function to initialize the game
// This function sets up the game by resetting the game state 
// and removing any existing leaderboard data
function reset() {
    location.reload(true);
    localStorage.removeItem('leaderboard'); 
}
// Function to save completion time
// This function saves the completion time to local storage
// It also updates the leaderboard by removing any existing data
// and adding the new time to the top 5 times
function saveCompletionTime(time) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

    leaderboard.push(time);
    leaderboard.sort((highest, lowest) => highest - lowest); // Sort times in ascending order
    leaderboard = leaderboard.slice(0, 5); // Keep only top 5 times

    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}
// Function to update leaderboard
// This function retrieves the leaderboard from local storage
// and displays the top 5 times in the leaderboard 
function updateLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = '<h3>Fastest Times</h3>';

    leaderboard.forEach((time, index) => {
        leaderboardDiv.innerHTML += `<li>${index + 1}. ${time}s</li>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateLeaderboard(); // Update leaderboard on page load
});
