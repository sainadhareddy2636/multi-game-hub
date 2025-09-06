// Gate logic functions
function AND(a,b){ return a & b; }
function OR(a,b){ return a | b; }
function NOT(a){ return a ^ 1; }
function XOR(a,b){ return a ^ b; }

// DOM Elements
const svg = document.getElementById("circuit-svg");
const feedback = document.getElementById("feedback");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const timeSelect = document.getElementById("time-select");
const hintButton = document.getElementById("hint-game");
const hintStatus = document.getElementById("hint-status");

// Game state
let circuit = [];
let score = 0;
let gameTime = 60;
let intervalId;
let hintAvailable = true;
const hintCooldown = 60; // seconds
let hintTimerId;
let gameActive = false;

// Generate random circuit
function generateCircuit(numGates = 4){
    // Clear previous
    feedback.textContent = "";
    svg.innerHTML = "";
    circuit = [];

    for(let i=0;i<numGates;i++){
        const gateTypes = ["AND","OR","XOR","NOT"];
        const type = gateTypes[Math.floor(Math.random()*gateTypes.length)];
        const x = 50 + i*180;
        const y = 100;
        const inputs = type==="NOT"? [Math.round(Math.random())] : [Math.round(Math.random()), Math.round(Math.random())];
        const faulty = Math.random() < 0.3;
        circuit.push({id:i+1,type,x,y,inputs,faulty,output:null});
    }
    computeOutputs();
    renderCircuit();
}

// Compute outputs
function computeOutputs(){
    circuit.forEach(gate=>{
        let out;
        switch(gate.type){
            case "AND": out = AND(...gate.inputs); break;
            case "OR": out = OR(...gate.inputs); break;
            case "NOT": out = NOT(gate.inputs[0]); break;
            case "XOR": out = XOR(...gate.inputs); break;
        }
        if(gate.faulty) out = out ^ 1; // introduce fault
        gate.output = out;
    });
}

// Render circuit
function renderCircuit(){
    // Draw wires
    for(let i=0;i<circuit.length-1;i++){
        const line = document.createElementNS("http://www.w3.org/2000/svg","line");
        line.setAttribute("x1", circuit[i].x + 80);
        line.setAttribute("y1", circuit[i].y + 25);
        line.setAttribute("x2", circuit[i+1].x);
        line.setAttribute("y2", circuit[i+1].y + 25);
        line.setAttribute("stroke","white");
        line.setAttribute("stroke-width","2");
        svg.appendChild(line);
    }

    // Draw gates
    circuit.forEach(gate=>{
        const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
        rect.setAttribute("x",gate.x);
        rect.setAttribute("y",gate.y);
        rect.setAttribute("width",80);
        rect.setAttribute("height",50);
        rect.setAttribute("fill","#2980b9");
        rect.setAttribute("rx",5);
        rect.setAttribute("ry",5);
        rect.style.cursor = "pointer";
        svg.appendChild(rect);

        const text = document.createElementNS("http://www.w3.org/2000/svg","text");
        text.setAttribute("x",gate.x+15);
        text.setAttribute("y",gate.y+20);
        text.textContent = gate.type;
        text.setAttribute("fill","white");
        svg.appendChild(text);

        const outText = document.createElementNS("http://www.w3.org/2000/svg","text");
        outText.setAttribute("x",gate.x+30);
        outText.setAttribute("y",gate.y+45);
        outText.setAttribute("class","output-text");
        outText.textContent = gate.output;
        svg.appendChild(outText);
        gate.outTextRef = outText;

        // Input toggles
        gate.inputs.forEach((inp,index)=>{
            const inputRect = document.createElementNS("http://www.w3.org/2000/svg","rect");
            inputRect.setAttribute("x",gate.x-30);
            inputRect.setAttribute("y",gate.y+10 + index*20);
            inputRect.setAttribute("width",20);
            inputRect.setAttribute("height",20);
            inputRect.setAttribute("fill",inp?"#2ecc71":"#e74c3c");
            inputRect.style.cursor = "pointer";
            svg.appendChild(inputRect);

            inputRect.addEventListener("click",()=>{
                gate.inputs[index] = gate.inputs[index]^1;
                inputRect.setAttribute("fill",gate.inputs[index]?"#2ecc71":"#e74c3c");
                computeOutputs();
                updateOutputs();
            });
        });

        // Click to check faulty
        rect.addEventListener("click",()=>{
            if(!gameActive) return;

            if(gate.faulty){
                score++;
                scoreDisplay.textContent = `Correct Gates: ${score}`;
                feedback.textContent = `Correct! Gate ${gate.type} was faulty. ✅`;
            } else {
                feedback.textContent = `Incorrect. Gate ${gate.type} is working fine. ❌`;
            }

            // Show answer briefly
            circuit.forEach(g=>{
                if(g.faulty) g.outTextRef.textContent = `Answer! ${g.output}`;
            });

            setTimeout(generateCircuit,1000);
        });
    });
}

// Update outputs visually
function updateOutputs(){
    circuit.forEach(gate=>{
        gate.outTextRef.textContent = gate.output;
    });
}

// Start Game
function startGame(){
    score = 0;
    scoreDisplay.textContent = `Correct Gates: ${score}`;
    feedback.textContent = "";
    gameTime = parseInt(timeSelect.value);
    timerDisplay.textContent = gameTime;
    generateCircuit();
    gameActive = true;
    hintAvailable = true;
    hintStatus.textContent = "Hint available!";

    clearInterval(intervalId);
    clearInterval(hintTimerId);

    intervalId = setInterval(()=>{
        gameTime--;
        timerDisplay.textContent = gameTime;
        if(gameTime <= 0){
            endGame();
        }
    },1000);
}

// Quit Game
function quitGame(){
    endGame();
}

// End Game Logic
function endGame(){
    clearInterval(intervalId);
    clearInterval(hintTimerId);
    gameActive = false;
    svg.innerHTML = "";
    feedback.textContent = `Game Over! You correctly identified ${score} faulty gates.`;
    hintStatus.textContent = "";
}

// Hint Button
function useHint(){
    if(!gameActive){
        hintStatus.textContent = "Start the game first!";
        return;
    }

    if(!hintAvailable){
        hintStatus.textContent = "Hint not available yet!";
        return;
    }

    hintAvailable = false;

    // Show the faulty gate briefly
    const faultyGate = circuit.find(g => g.faulty);
    if(faultyGate){
        faultyGate.outTextRef.textContent = `Answer! ${faultyGate.output}`;
        faultyGate.outTextRef.setAttribute("fill", "orange");
        setTimeout(() => {
            updateOutputs();
        }, 2000);
    }

    // Start cooldown
    let cooldown = hintCooldown;
    hintStatus.textContent = `Hint cooldown: ${cooldown}s`;
    hintTimerId = setInterval(() => {
        cooldown--;
        hintStatus.textContent = `Hint cooldown: ${cooldown}s`;
        if(cooldown <= 0){
            clearInterval(hintTimerId);
            hintAvailable = true;
            hintStatus.textContent = "Hint available!";
        }
    }, 1000);
}

// Event Listeners
document.getElementById("start-game").addEventListener("click", startGame);
document.getElementById("quit-game").addEventListener("click", quitGame);
hintButton.addEventListener("click", useHint);
