// LaundryGame.js - Rewards CARDANO (ADA)
// Change: Replace updateCrypto() with rewardMinigame()

import { isMinigameCompleted, completeMinigame, addInventoryItem, rewardMinigame } from './StatsManager.js';

const MINIGAME_NAME = 'laundry';
const COIN_NAME = 'Cardano';
const COIN_SYMBOL = 'ADA';

export async function showLaundryMinigame(onComplete) {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
    
    window.laundryMinigameActive = true;
    window.minigameActive = true;
    
    let isFirstCompletion = false;
    try {
        isFirstCompletion = !(await isMinigameCompleted(MINIGAME_NAME));
        console.log('[Laundry] First completion:', isFirstCompletion);
    } catch (e) {
        console.log('[Laundry] Could not check completion status:', e);
    }
    
    let partsPlaced = 0;
    const totalParts = 4;
    let laundryLoaded = 0;
    const totalLaundry = 5;
    let currentDraggedElement = null;
    let repairComplete = false;

    const overlay = document.createElement('div');
    overlay.id = 'minigame-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const container = document.createElement('div');
    container.id = 'minigame-container';
    container.style.cssText = `
        width: 90%;
        max-width: 900px;
        height: 80vh;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 2px solid #0033ad;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: 'Courier New', monospace;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'EXIT';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px; right: 10px;
        background: #600;
        color: #ccc;
        border: 1px solid #800;
        padding: 8px 15px;
        cursor: pointer;
        font-size: 15px;
        font-family: 'Courier New', monospace;
        z-index: 10;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#800';
    closeBtn.onmouseout = () => closeBtn.style.background = '#600';
    closeBtn.onclick = () => {
        window.laundryMinigameActive = false;
        window.minigameActive = false;
        document.body.removeChild(overlay);
    };

    const title = document.createElement('h1');
    title.textContent = 'WASHING MACHINE REPAIR';
    title.style.cssText = `
        text-align: center;
        color: #0033ad;
        font-size: 20px;
        margin-bottom: 10px;
        letter-spacing: 2px;
    `;

    // Coin indicator
    const coinIndicator = document.createElement('div');
    coinIndicator.style.cssText = `
        text-align: center;
        color: #0033ad;
        font-size: 15px;
        margin-bottom: 10px;
        padding: 5px;
        background: rgba(0,51,173,0.1);
        border-radius: 5px;
    `;
    coinIndicator.innerHTML = `Rewards: <strong>${COIN_NAME} (${COIN_SYMBOL})</strong>`;

    const instructions = document.createElement('div');
    instructions.textContent = 'Drag the parts to the correct spots on the machine. Then load the laundry.';
    instructions.style.cssText = `
        text-align: center;
        color: #888;
        font-size: 15px;
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 5px;
    `;

    const gameArea = document.createElement('div');
    gameArea.style.cssText = `display: flex; gap: 20px; flex: 1; overflow: hidden;`;

    const partsArea = document.createElement('div');
    partsArea.style.cssText = `flex: 1; background: rgba(50, 50, 50, 0.9); border-radius: 10px; padding: 15px; overflow-y: auto;`;

    const partsTitle = document.createElement('h2');
    partsTitle.textContent = 'Spare Parts';
    partsTitle.style.cssText = `color: #fff; font-size: 18px; margin-bottom: 15px; text-align: center;`;

    const partsContainer = document.createElement('div');
    partsContainer.style.cssText = `display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;`;

    const partsList = [
        { name: 'Motor', type: 'motor', sprite: `${baseurl}/images/DBS2/motor.png` },
        { name: 'Belt', type: 'belt', sprite: `${baseurl}/images/DBS2/belt.png` },
        { name: 'Pump', type: 'pump', sprite: `${baseurl}/images/DBS2/pump.jpg` },
        { name: 'Hose', type: 'hose', sprite: `${baseurl}/images/DBS2/hose.png` }
    ];

    const parts = [];
    partsList.forEach(partInfo => {
        const part = document.createElement('div');
        part.className = 'part';
        part.textContent = partInfo.name;
        part.draggable = true;
        part.dataset.part = partInfo.type;
        part.style.cssText = `
            width: 100%;
            aspect-ratio: 1;
            background: #4a4a4a;
            border: 3px solid #666;
            border-radius: 10px;
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            color: #fff;
            text-align: center;
            transition: all 0.2s;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        `;
        part.style.backgroundImage = `url('${partInfo.sprite}')`;

        part.onmouseover = () => {
            if (!part.classList.contains('placed')) {
                part.style.borderColor = '#0033ad';
                part.style.transform = 'scale(1.05)';
            }
        };
        part.onmouseout = () => {
            part.style.borderColor = '#666';
            part.style.transform = 'scale(1)';
        };

        parts.push(part);
        partsContainer.appendChild(part);
    });

    partsArea.appendChild(partsTitle);
    partsArea.appendChild(partsContainer);

    const machineArea = document.createElement('div');
    machineArea.style.cssText = `flex: 1.5; background: rgba(30, 30, 30, 0.9); border-radius: 10px; padding: 20px; position: relative; display: flex; flex-direction: column;`;

    const machineContainer = document.createElement('div');
    machineContainer.style.cssText = `
        flex: 1;
        position: relative;
        background: #555;
        border-radius: 10px;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        transition: transform 0.1s;
    `;
    machineContainer.style.backgroundImage = `url('${baseurl}/images/DBS2/broken-washing-machine-jpeg.jpeg')`;

    const zones = [
        { id: 'zone-motor', accepts: 'motor', label: 'Motor', style: 'top: 20%; left: 15%; width: 25%; height: 20%;' },
        { id: 'zone-belt', accepts: 'belt', label: 'Belt', style: 'top: 45%; left: 10%; width: 30%; height: 15%;' },
        { id: 'zone-pump', accepts: 'pump', label: 'Pump', style: 'bottom: 20%; left: 15%; width: 25%; height: 20%;' },
        { id: 'zone-hose', accepts: 'hose', label: 'Hose', style: 'top: 25%; right: 15%; width: 20%; height: 30%;' }
    ];

    const dropZones = [];
    zones.forEach(zoneInfo => {
        const zone = document.createElement('div');
        zone.id = zoneInfo.id;
        zone.dataset.accepts = zoneInfo.accepts;
        zone.style.cssText = `
            position: absolute;
            ${zoneInfo.style}
            background: rgba(100, 100, 100, 0.3);
            border: 2px dashed #888;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        `;

        const label = document.createElement('div');
        label.textContent = zoneInfo.label;
        label.style.cssText = `color: #aaa; font-size: 15px; text-align: center;`;
        zone.appendChild(label);

        dropZones.push(zone);
        machineContainer.appendChild(zone);
    });

    // Laundry items area
    const laundryItemsArea = document.createElement('div');
    laundryItemsArea.style.cssText = `
        display: none;
        position: absolute;
        bottom: 60px;
        left: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 8px;
        z-index: 50;
    `;
    
    const laundryTitle = document.createElement('div');
    laundryTitle.textContent = 'Dirty Laundry - Drag to Machine';
    laundryTitle.style.cssText = `color: #888; font-size: 17px; margin-bottom: 8px; text-align: center;`;
    laundryItemsArea.appendChild(laundryTitle);
    
    const laundryGrid = document.createElement('div');
    laundryGrid.style.cssText = `display: flex; gap: 10px; justify-content: center;`;
    
    const laundryTypes = ['🧦', '👕', '👖', '🧣', '🩳'];
    const laundryItems = [];
    laundryTypes.forEach((emoji, i) => {
        const item = document.createElement('div');
        item.className = 'laundry-item';
        item.textContent = emoji;
        item.draggable = true;
        item.dataset.index = i;
        item.style.cssText = `
            width: 50px;
            height: 50px;
            background: #444;
            border: 2px solid #666;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: grab;
            transition: all 0.2s;
        `;
        item.onmouseover = () => {
            if (!item.classList.contains('loaded')) {
                item.style.borderColor = '#0033ad';
                item.style.transform = 'scale(1.1)';
            }
        };
        item.onmouseout = () => {
            item.style.borderColor = '#666';
            item.style.transform = 'scale(1)';
        };
        laundryItems.push(item);
        laundryGrid.appendChild(item);
    });
    laundryItemsArea.appendChild(laundryGrid);

    // Machine door zone
    const machineDoorZone = document.createElement('div');
    machineDoorZone.id = 'machine-door';
    machineDoorZone.style.cssText = `
        display: none;
        position: absolute;
        top: 30%;
        left: 35%;
        width: 30%;
        height: 40%;
        background: rgba(100, 100, 150, 0.2);
        border: 3px dashed #88aaff;
        border-radius: 50%;
    `;

    machineContainer.appendChild(machineDoorZone);
    machineArea.appendChild(machineContainer);
    machineArea.appendChild(laundryItemsArea);

    // Start button
    const startBtn = document.createElement('button');
    startBtn.textContent = 'START WASH CYCLE';
    startBtn.disabled = true;
    startBtn.style.cssText = `
        margin-top: 15px;
        padding: 12px 25px;
        font-size: 17px;
        background: #666;
        color: #888;
        border: none;
        border-radius: 8px;
        cursor: not-allowed;
        font-family: 'Courier New', monospace;
        position: relative;
        z-index: 100;
    `;

    machineArea.appendChild(startBtn);

    // Success and paper discovery messages
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 100, 0, 0.9);
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        z-index: 100;
    `;
    successMessage.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
        <div style="color: #fff; font-size: 18px;">Laundry Complete!</div>
    `;
    machineArea.appendChild(successMessage);

    const paperDiscovery = document.createElement('div');
    paperDiscovery.style.cssText = `
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
        border: 2px solid #0033ad;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        z-index: 100;
        max-width: 400px;
    `;
    
    const rewardAmount = isFirstCompletion ? 35 : 20;
    paperDiscovery.innerHTML = `
        <div style="font-size: 36px; margin-bottom: 10px;">📄</div>
        <div style="color: #0033ad; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
            ${isFirstCompletion ? 'CODE FRAGMENT FOUND!' : 'LAUNDRY DONE!'}
        </div>
        <div style="color: #888; font-size: 15px; margin-bottom: 15px;">
            ${isFirstCompletion ? 'Found a soggy piece of paper stuck to a sock. The ink is smeared but still readable.' : 'The machine hums along. Another load complete.'}
        </div>
        ${isFirstCompletion ? `
        <div style="background: rgba(0,51,173,0.2); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
            <img src="${baseurl}/images/DBS2/codescrapLaundry.png" style="max-width: 80px; border: 1px solid #0033ad; border-radius: 4px;" onerror="this.style.display='none'">
        </div>
        ` : ''}
        <div style="color: #0033ad; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
            +${rewardAmount} ${COIN_NAME} (${COIN_SYMBOL})
        </div>
        <button id="continueBtn" style="
            background: #0033ad;
            color: #fff;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 17px;
        ">CONTINUE</button>
    `;
    machineArea.appendChild(paperDiscovery);

    gameArea.appendChild(partsArea);
    gameArea.appendChild(machineArea);

    container.appendChild(closeBtn);
    container.appendChild(title);
    container.appendChild(coinIndicator);
    container.appendChild(instructions);
    container.appendChild(gameArea);

    // Drag and drop handlers
    function handleDragStart(e) {
        currentDraggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.style.borderColor = '#0033ad';
        this.style.background = 'rgba(0, 51, 173, 0.3)';
    }

    function handleDragLeave(e) {
        this.style.borderColor = '#888';
        this.style.background = 'rgba(100, 100, 100, 0.3)';
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        this.style.borderColor = '#888';
        this.style.background = 'rgba(100, 100, 100, 0.3)';

        const accepts = this.dataset.accepts;
        const dragged = currentDraggedElement.dataset.part;

        if (accepts === dragged && !currentDraggedElement.classList.contains('placed')) {
            currentDraggedElement.classList.add('placed');
            currentDraggedElement.style.opacity = '0.3';
            currentDraggedElement.style.cursor = 'not-allowed';
            currentDraggedElement.style.pointerEvents = 'none';
            currentDraggedElement.draggable = false;
            partsPlaced++;

            const label = this.querySelector('div');
            if (label) label.style.display = 'none';

            if (partsPlaced === totalParts) {
                completeRepair();
            }
        } else {
            this.style.background = 'rgba(255, 0, 0, 0.3)';
            setTimeout(() => {
                this.style.background = 'rgba(100, 100, 100, 0.3)';
            }, 500);
        }

        return false;
    }

    function handleLaundryDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        this.style.borderColor = '#88aaff';
        this.style.background = 'rgba(100, 100, 150, 0.2)';
        this.style.borderStyle = 'dashed';

        if (currentDraggedElement.classList.contains('laundry-item')) {
            currentDraggedElement.classList.add('loaded');
            currentDraggedElement.style.opacity = '0.3';
            currentDraggedElement.style.cursor = 'not-allowed';
            currentDraggedElement.style.pointerEvents = 'none';
            currentDraggedElement.draggable = false;
            laundryLoaded++;

            this.style.background = 'rgba(68, 255, 68, 0.3)';
            setTimeout(() => {
                this.style.background = 'rgba(100, 100, 150, 0.2)';
            }, 300);

            if (laundryLoaded === totalLaundry) {
                enableStartButton();
            }
        }

        return false;
    }

    parts.forEach(part => {
        part.addEventListener('dragstart', handleDragStart);
        part.addEventListener('dragend', handleDragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    laundryItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    machineDoorZone.addEventListener('dragover', handleDragOver);
    machineDoorZone.addEventListener('dragenter', handleDragEnter);
    machineDoorZone.addEventListener('dragleave', handleDragLeave);
    machineDoorZone.addEventListener('drop', handleLaundryDrop);

    function completeRepair() {
        repairComplete = true;
        instructions.innerHTML = '✅ Machine repaired! Now drag all the dirty laundry into the washing machine.';
        instructions.style.background = 'rgba(0, 100, 0, 0.6)';
        laundryItemsArea.style.display = 'block';
        machineDoorZone.style.display = 'block';
        dropZones.forEach(zone => {
            zone.style.display = 'none';
        });
    }

    function enableStartButton() {
        startBtn.style.background = '#0033ad';
        startBtn.style.color = 'white';
        startBtn.style.cursor = 'pointer';
        startBtn.disabled = false;
        instructions.innerHTML = '✅ All laundry loaded! Click the button to start the wash cycle.';
        instructions.style.background = 'rgba(0, 150, 0, 0.7)';
        
        startBtn.onmouseover = () => startBtn.style.background = '#0044cc';
        startBtn.onmouseout = () => startBtn.style.background = '#0033ad';
        
        startBtn.onclick = () => {
            if (repairComplete && laundryLoaded === totalLaundry) {
                laundryItemsArea.style.display = 'none';
                machineDoorZone.style.display = 'none';

                let animFrame = 0;
                const washingInterval = setInterval(() => {
                    animFrame++;
                    const offset = Math.sin(animFrame * 0.3) * 3;
                    const rotation = Math.sin(animFrame * 0.3) * 0.5;
                    machineContainer.style.transform = `translateX(${offset}px) rotate(${rotation}deg)`;
                }, 50);

                startBtn.textContent = 'Running...';
                startBtn.disabled = true;
                startBtn.style.background = '#666';
                startBtn.style.cursor = 'not-allowed';
                instructions.innerHTML = '🌊 Washing cycle in progress...';
                instructions.style.background = 'rgba(0, 100, 200, 0.6)';

                setTimeout(() => {
                    clearInterval(washingInterval);
                    machineContainer.style.transform = 'translateX(0) rotate(0)';
                    successMessage.style.display = 'block';
                    
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                        paperDiscovery.style.display = 'block';
                        
                        const continueBtn = document.getElementById('continueBtn');
                        if (continueBtn) {
                            continueBtn.onclick = handleContinue;
                        }
                    }, 2000);
                }, 3000);
            }
        };
    }

    // *** KEY CHANGE: Use rewardMinigame instead of updateCrypto ***
    async function handleContinue() {
        const continueBtn = document.getElementById('continueBtn');
        if (!continueBtn) return;
        
        continueBtn.textContent = 'Saving...';
        continueBtn.disabled = true;
        continueBtn.style.background = '#666';
        continueBtn.style.cursor = 'wait';
        
        try {
            console.log(`[Laundry] Awarding ${rewardAmount} ${COIN_SYMBOL}...`);
            
            // *** Use rewardMinigame for Cardano ***
            await rewardMinigame(MINIGAME_NAME, rewardAmount);
            console.log(`✅ ${COIN_NAME} added:`, rewardAmount);
            
            if (isFirstCompletion) {
                await completeMinigame(MINIGAME_NAME);
                console.log('✅ Minigame marked complete');
                
                await addInventoryItem({
                    name: 'Code Scrap: Laundry',
                    found_at: MINIGAME_NAME,
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Code scrap added to inventory');
            }
            
            // Refresh leaderboard
            if (window.GameControl && window.GameControl.leaderboard) {
                try {
                    await window.GameControl.leaderboard.refresh();
                } catch (e) {}
            }
            
            continueBtn.textContent = '✅ Saved!';
            continueBtn.style.background = '#0033ad';
            
            setTimeout(() => {
                window.laundryMinigameActive = false;
                window.minigameActive = false;
                document.body.removeChild(overlay);
                if (onComplete) onComplete();
            }, 800);
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            continueBtn.textContent = '⚠️ Error - Closing...';
            continueBtn.style.background = '#ff4444';
            
            setTimeout(() => {
                window.laundryMinigameActive = false;
                window.minigameActive = false;
                document.body.removeChild(overlay);
                try {
                    if (window.Leaderboard && typeof window.Leaderboard.refresh === 'function') {
                        window.Leaderboard.refresh();
                    }
                } catch(e) {}
                if (onComplete) onComplete();
            }, 1500);
        }
    }

    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

window.showLaundryMinigame = showLaundryMinigame;
export default showLaundryMinigame;