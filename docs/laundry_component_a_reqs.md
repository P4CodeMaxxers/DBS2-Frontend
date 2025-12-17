# Laundry Minigame Component A requirement meetings

## instructions for input:

```
    window.laundryMinigameActive = true;
    window.minigameActive = true; 
```

 Code shows how the user triggers the minigame by walking over to the game and pressing on 'e' key to open popup

 Once ```window.minigameActive``` = true then the minigame starts and the player can begin to play.

 ## Encorporating lists

 ``` 
 const partsList = [
        { name: 'Motor', type: 'motor', sprite: `${baseurl}/images/DBS2/motor.png` },
        { name: 'Belt', type: 'belt', sprite: `${baseurl}/images/DBS2/belt.png` },
        { name: 'Pump', type: 'pump', sprite: `${baseurl}/images/DBS2/pump.jpg` },
        { name: 'Hose', type: 'hose', sprite: `${baseurl}/images/DBS2/hose.png` }
    ];
```

Lists are used in the Laundry minigame in order to organize parts of the laundry machine and it's sprites. Helpful for storing all parts and sprites of parts in order to make a more organized call when they are needed through ```partsList```

## Procedure

```
    export async function showLaundryMinigame(onComplete) {
    const baseurl = document.body.getAttribute('data-baseurl') || '';
```
Name of procedure: ```showLaundryMinigame```

Parameters: ```onComplete``` --> function which is called **after** minigame is completed and is successfully closed, allows for rest of game to know that Laundry minigame is complete and to allow for added crypto and code scrap in inventory. 

# Algorithm structures

## Sequencing

Sequencing can be found in the Laundry minigame as the code runs from top to bottom in a specific order.
    ex: create elements -> style elements -> append children -> add to page

## Selection

If player is completing minigame for the first time, they get 520 crypto

Else if player is completing NOT for the first time, they only get 20 crypto.

```let isFirstCompletion = false;
    try {
        isFirstCompletion = !(await isMinigameCompleted('laundry'));
        console.log('[Laundry] First completion:', isFirstCompletion);
    } catch (e) {
        console.log('[Laundry] Could not check completion status:', e);
    }
```
## Iteration

Adding event listeners to all laundry parts

```parts.forEach(part => {
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
```

Using ```.forEach()``` to apply the same code to each item in an array

# Call for student developed procedures

``` 
export async function showLaundryMinigame(onComplete) {
```
Calls the showLaundryMinigame procedure which creates the pop-up minigame on the screen for the player to interact with, without creating a separate page.

# Instructions for Output

There are many instructions for output, such as when the game gives reinforcement, like guidance or instruction, to the player:

```
const instructions = document.createElement('div');
    instructions.textContent = 'Drag the parts to the correct spots on the machine. Then load the laundry.';
```

```
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
```

based on user input. As user progresses through minigame, the game adds layers of instruction that gives feedback on what the player must do next to go on through the game. 

Dynamic on-screen text instructions in the code which guide the player step-by-step through the minigame.

# Backend integration

Laundry Minigame saves data in the backend such as completion of the minigame, earning of code scrap, and gaining crypto from playing the game. 

```
import { isMinigameCompleted, completeMinigame, addInventoryItem, updateCrypto } from './StatsManager.js';
```

Checks if game has been previously completed to determine how much crypto the player earns

```
 // Award crypto
            const cryptoAmount = isFirstCompletion ? 520 : 20;
            await updateCrypto(cryptoAmount);
            console.log('✅ Crypto added:', cryptoAmount);
            
            // Mark minigame complete and add code scrap on first completion
            if (isFirstCompletion) {
                await completeMinigame('laundry');
                console.log('✅ Minigame marked complete');
                
                await addInventoryItem({
                    name: 'Code Scrap: Laundry',
                    found_at: 'laundry',
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Code scrap added to inventory');
            }
```

Saves progress of player finishing minigame and rewards earned such as crypto and code scraps

GET:

```isMinigameCompleted('laundry')``` uses GET /api/dbs2/minigames, returns minigame completions and checks for laundry completion

```completeMinigame('laundry')``` uses PUT to mark laundry game as completed

```addInventoryItem``` uses POST to add items to player inventory

```updateCrypto(520)``` OR ```updateCrypto(20)``` uses PUT to add crypto to player's ingame currency count


