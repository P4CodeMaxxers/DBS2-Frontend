// LaundryGame.js - Rewards CARDANO (ADA)
// Theme: Transaction Validation - reviewing and validating blockchain transactions
// Players learn to check balances, verify signatures, and detect double-spends

import { isMinigameCompleted, completeMinigame, addInventoryItem, rewardMinigame } from './StatsManager.js';

const MINIGAME_NAME = 'laundry';
const COIN_NAME = 'Cardano';
const COIN_SYMBOL = 'ADA';

// Simulated wallet addresses and balances
const WALLETS = {
    'alice_0x7a3b': { name: 'Alice', balance: 150, signature: 'SIG_ALICE_VALID' },
    'bob_0x9c2f': { name: 'Bob', balance: 75, signature: 'SIG_BOB_VALID' },
    'carol_0x4e8d': { name: 'Carol', balance: 200, signature: 'SIG_CAROL_VALID' },
    'dave_0x1f5a': { name: 'Dave', balance: 30, signature: 'SIG_DAVE_VALID' },
    'eve_0x6b2c': { name: 'Eve', balance: 500, signature: 'SIG_EVE_VALID' },
    'frank_0x8d4e': { name: 'Frank', balance: 0, signature: 'SIG_FRANK_VALID' }
};

// Generate transaction scenarios
function generateTransactions() {
    const transactions = [
        // Valid transactions
        {
            id: 'TX001',
            from: 'alice_0x7a3b',
            to: 'bob_0x9c2f',
            amount: 50,
            signature: 'SIG_ALICE_VALID',
            isValid: true,
            reason: 'Valid transaction - sufficient funds and correct signature'
        },
        {
            id: 'TX002',
            from: 'carol_0x4e8d',
            to: 'dave_0x1f5a',
            amount: 100,
            signature: 'SIG_CAROL_VALID',
            isValid: true,
            reason: 'Valid transaction - sufficient funds and correct signature'
        },
        {
            id: 'TX003',
            from: 'eve_0x6b2c',
            to: 'alice_0x7a3b',
            amount: 250,
            signature: 'SIG_EVE_VALID',
            isValid: true,
            reason: 'Valid transaction - sufficient funds and correct signature'
        },
        // Invalid: Insufficient funds
        {
            id: 'TX004',
            from: 'dave_0x1f5a',
            to: 'eve_0x6b2c',
            amount: 100,
            signature: 'SIG_DAVE_VALID',
            isValid: false,
            invalidReason: 'insufficient',
            reason: 'INVALID - Insufficient funds (Dave has 30 ADA, trying to send 100)'
        },
        {
            id: 'TX005',
            from: 'frank_0x8d4e',
            to: 'carol_0x4e8d',
            amount: 50,
            signature: 'SIG_FRANK_VALID',
            isValid: false,
            invalidReason: 'insufficient',
            reason: 'INVALID - Insufficient funds (Frank has 0 ADA)'
        },
        // Invalid: Bad signature
        {
            id: 'TX006',
            from: 'bob_0x9c2f',
            to: 'alice_0x7a3b',
            amount: 25,
            signature: 'SIG_HACKER_FAKE',
            isValid: false,
            invalidReason: 'signature',
            reason: 'INVALID - Signature does not match sender'
        },
        {
            id: 'TX007',
            from: 'eve_0x6b2c',
            to: 'frank_0x8d4e',
            amount: 100,
            signature: 'SIG_CORRUPTED',
            isValid: false,
            invalidReason: 'signature',
            reason: 'INVALID - Corrupted/forged signature detected'
        },
        // Invalid: Double spend attempt (same sender, total exceeds balance)
        {
            id: 'TX008',
            from: 'alice_0x7a3b',
            to: 'carol_0x4e8d',
            amount: 120,
            signature: 'SIG_ALICE_VALID',
            isValid: false,
            invalidReason: 'double_spend',
            reason: 'INVALID - Double spend attempt (Alice already sent 50, only has 150 total)',
            requiresPriorTx: 'TX001'
        }
    ];
    
    // Shuffle and return 6 transactions
    return transactions.sort(() => Math.random() - 0.5).slice(0, 6);
}

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
    
    // Show intro screen first
    const introOverlay = document.createElement('div');
    introOverlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const intro = document.createElement('div');
    intro.style.cssText = `
        background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
        border: 2px solid #0033ad;
        border-radius: 15px;
        padding: 30px;
        max-width: 650px;
        color: #eee;
        text-align: left;
        max-height: 85vh;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
    `;
    
    intro.innerHTML = `
        <h2 style="color: #0033ad; text-align: center; margin-bottom: 20px;">
            📋 TRANSACTION VALIDATOR
        </h2>
        
        <div style="background: rgba(0,51,173,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #0033ad;">
            <p style="margin: 0; line-height: 1.6; color: #0033ad; font-style: italic;">
                "Every transaction must be verified before it joins the blockchain. That's how we keep the ledger honest." - IShowGreen
            </p>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #0033ad; margin: 0 0 10px 0;">🔍 What is Transaction Validation?</h3>
            <p style="margin: 0; line-height: 1.6; color: #ccc;">
                Before any crypto transaction is added to the blockchain, validators must check:
            </p>
            <ul style="color: #ccc; margin: 10px 0 0 0; padding-left: 20px;">
                <li><strong style="color: #4CAF50;">Balance Check</strong> - Does the sender have enough funds?</li>
                <li><strong style="color: #2196F3;">Signature Verification</strong> - Is the digital signature authentic?</li>
                <li><strong style="color: #FF9800;">Double-Spend Detection</strong> - Is someone trying to spend the same coins twice?</li>
            </ul>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #0033ad; margin: 0 0 10px 0;">🎮 How to Play</h3>
            <p style="margin: 0; line-height: 1.6; color: #ccc;">
                1. Review each incoming transaction<br>
                2. Check the sender's balance and signature<br>
                3. Click <span style="color: #4CAF50; font-weight: bold;">✓ APPROVE</span> for valid transactions<br>
                4. Click <span style="color: #f44336; font-weight: bold;">✗ REJECT</span> for invalid ones<br>
                5. Correctly validate all transactions to earn ${COIN_NAME}!
            </p>
        </div>
        
        <div style="background: rgba(0,51,173,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #0033ad;">
            <h3 style="color: #0033ad; margin: 0 0 10px 0;">💰 Rewards</h3>
            <p style="margin: 0; line-height: 1.6; color: #ccc;">
                Earn <strong style="color: #0033ad;">${COIN_NAME} (${COIN_SYMBOL})</strong> for each correct decision!<br>
                Use ${COIN_SYMBOL} to buy the <em>Transaction Ledger Code Scrap</em> from the Closet Shop.
            </p>
        </div>
        
        <button id="start-laundry-btn" style="
            width: 100%;
            padding: 15px;
            font-size: 18px;
            background: linear-gradient(135deg, #0033ad 0%, #001a57 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        ">START VALIDATION</button>
    `;
    
    introOverlay.appendChild(intro);
    document.body.appendChild(introOverlay);
    
    document.getElementById('start-laundry-btn').onclick = () => {
        introOverlay.remove();
        startValidationGame(baseurl, isFirstCompletion, onComplete);
    };
}

function startValidationGame(baseurl, isFirstCompletion, onComplete) {
    const transactions = generateTransactions();
    let currentTxIndex = 0;
    let correctAnswers = 0;
    let totalAnswered = 0;
    let processedTxIds = new Set(); // Track which transactions were approved (for double-spend detection)
    const rewardPerCorrect = 2; // ADA per correct answer
    
    const overlay = document.createElement('div');
    overlay.id = 'minigame-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const container = document.createElement('div');
    container.id = 'minigame-container';
    container.style.cssText = `
        width: 95%;
        max-width: 1000px;
        height: 90vh;
        background: linear-gradient(135deg, #0a0a15 0%, #1a1a2e 100%);
        border: 2px solid #0033ad;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 0 50px rgba(0, 51, 173, 0.3);
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: 'Courier New', monospace;
        overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #0033ad;
    `;
    
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <h1 style="color: #0033ad; font-size: 20px; margin: 0; letter-spacing: 2px;">
                📋 TRANSACTION VALIDATOR
            </h1>
            <div style="background: rgba(0,51,173,0.2); padding: 5px 15px; border-radius: 20px; color: #0033ad;">
                Earning: <strong>${COIN_SYMBOL}</strong>
            </div>
        </div>
        <button id="exit-btn" style="
            background: #600;
            color: #ccc;
            border: 1px solid #800;
            padding: 8px 20px;
            cursor: pointer;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            border-radius: 5px;
        ">EXIT</button>
    `;
    
    container.appendChild(header);
    
    // Score/Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0,0,0,0.4);
        padding: 10px 20px;
        border-radius: 8px;
        margin-bottom: 15px;
    `;
    progressBar.innerHTML = `
        <div id="progress-text" style="color: #888;">Transaction <span style="color: #0033ad;">1</span> of ${transactions.length}</div>
        <div id="score-text" style="color: #4CAF50;">Correct: <span id="correct-count">0</span>/${transactions.length}</div>
        <div id="reward-text" style="color: #0033ad;">Earned: <span id="earned-ada">0</span> ${COIN_SYMBOL}</div>
    `;
    container.appendChild(progressBar);
    
    // Main game area
    const gameArea = document.createElement('div');
    gameArea.style.cssText = `
        display: flex;
        gap: 20px;
        flex: 1;
        min-height: 0;
    `;
    
    // Left panel - Wallet Balances
    const walletPanel = document.createElement('div');
    walletPanel.style.cssText = `
        width: 250px;
        background: rgba(0,0,0,0.4);
        border-radius: 10px;
        padding: 15px;
        overflow-y: auto;
    `;
    walletPanel.innerHTML = `
        <h3 style="color: #0033ad; margin: 0 0 15px 0; font-size: 14px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px;">
            💰 WALLET BALANCES
        </h3>
        <div id="wallet-list" style="font-size: 12px;">
            ${Object.entries(WALLETS).map(([addr, data]) => `
                <div id="wallet-${addr}" style="
                    background: rgba(50,50,80,0.3);
                    padding: 8px 10px;
                    margin-bottom: 8px;
                    border-radius: 5px;
                    border-left: 3px solid #0033ad;
                ">
                    <div style="color: #aaa; font-weight: bold;">${data.name}</div>
                    <div style="color: #666; font-size: 10px;">${addr}</div>
                    <div style="color: #4CAF50; margin-top: 5px;">
                        Balance: <strong>${data.balance} ADA</strong>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    gameArea.appendChild(walletPanel);
    
    // Center panel - Transaction Details
    const txPanel = document.createElement('div');
    txPanel.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
    // Transaction card
    const txCard = document.createElement('div');
    txCard.id = 'tx-card';
    txCard.style.cssText = `
        background: rgba(0,51,173,0.1);
        border: 2px solid #0033ad;
        border-radius: 10px;
        padding: 20px;
        flex: 1;
    `;
    txPanel.appendChild(txCard);
    
    // Action buttons
    const actionBar = document.createElement('div');
    actionBar.style.cssText = `
        display: flex;
        gap: 15px;
    `;
    actionBar.innerHTML = `
        <button id="reject-btn" style="
            flex: 1;
            padding: 15px;
            font-size: 18px;
            background: linear-gradient(135deg, #8B0000 0%, #5a0000 100%);
            border: 2px solid #f44336;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            transition: all 0.2s;
        ">✗ REJECT</button>
        <button id="approve-btn" style="
            flex: 1;
            padding: 15px;
            font-size: 18px;
            background: linear-gradient(135deg, #1B5E20 0%, #0d3d0d 100%);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            transition: all 0.2s;
        ">✓ APPROVE</button>
    `;
    txPanel.appendChild(actionBar);
    
    gameArea.appendChild(txPanel);
    
    // Right panel - Tips
    const tipsPanel = document.createElement('div');
    tipsPanel.style.cssText = `
        width: 220px;
        background: rgba(0,0,0,0.4);
        border-radius: 10px;
        padding: 15px;
        font-size: 12px;
    `;
    tipsPanel.innerHTML = `
        <h3 style="color: #FF9800; margin: 0 0 15px 0; font-size: 14px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px;">
            💡 VALIDATION TIPS
        </h3>
        <div style="color: #ccc; line-height: 1.6;">
            <div style="margin-bottom: 12px; padding: 8px; background: rgba(76,175,80,0.1); border-radius: 5px;">
                <strong style="color: #4CAF50;">✓ Balance Check</strong><br>
                <span style="color: #888;">Sender must have enough to cover the transaction amount.</span>
            </div>
            <div style="margin-bottom: 12px; padding: 8px; background: rgba(33,150,243,0.1); border-radius: 5px;">
                <strong style="color: #2196F3;">✓ Signature</strong><br>
                <span style="color: #888;">Must match the sender's wallet. Look for "SIG_[NAME]_VALID".</span>
            </div>
            <div style="padding: 8px; background: rgba(255,152,0,0.1); border-radius: 5px;">
                <strong style="color: #FF9800;">✓ Double Spend</strong><br>
                <span style="color: #888;">If you approved a prior TX from same sender, check remaining balance!</span>
            </div>
        </div>
    `;
    gameArea.appendChild(tipsPanel);
    
    container.appendChild(gameArea);
    
    // Feedback overlay (hidden initially)
    const feedbackOverlay = document.createElement('div');
    feedbackOverlay.id = 'feedback-overlay';
    feedbackOverlay.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 100;
    `;
    container.appendChild(feedbackOverlay);
    
    // Results screen (hidden initially)
    const resultsScreen = document.createElement('div');
    resultsScreen.id = 'results-screen';
    resultsScreen.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,10,30,0.95);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 200;
    `;
    container.appendChild(resultsScreen);
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Event handlers
    document.getElementById('exit-btn').onclick = () => {
        window.laundryMinigameActive = false;
        window.minigameActive = false;
        document.body.removeChild(overlay);
    };
    
    document.getElementById('approve-btn').onclick = () => handleDecision(true);
    document.getElementById('reject-btn').onclick = () => handleDecision(false);
    
    // Display first transaction
    displayTransaction(transactions[currentTxIndex]);
    
    function displayTransaction(tx) {
        const wallet = WALLETS[tx.from];
        const toWallet = WALLETS[tx.to];
        
        // Highlight relevant wallets
        document.querySelectorAll('[id^="wallet-"]').forEach(el => {
            el.style.borderLeftColor = '#0033ad';
            el.style.background = 'rgba(50,50,80,0.3)';
        });
        const fromWalletEl = document.getElementById(`wallet-${tx.from}`);
        const toWalletEl = document.getElementById(`wallet-${tx.to}`);
        if (fromWalletEl) {
            fromWalletEl.style.borderLeftColor = '#FF9800';
            fromWalletEl.style.background = 'rgba(255,152,0,0.15)';
        }
        if (toWalletEl) {
            toWalletEl.style.borderLeftColor = '#4CAF50';
            toWalletEl.style.background = 'rgba(76,175,80,0.15)';
        }
        
        // Check if this is a potential double-spend
        let doubleSpendWarning = '';
        if (tx.requiresPriorTx && processedTxIds.has(tx.requiresPriorTx)) {
            doubleSpendWarning = `
                <div style="background: rgba(255,152,0,0.2); border: 1px solid #FF9800; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong style="color: #FF9800;">⚠️ Note:</strong> 
                    <span style="color: #ccc;">You previously approved a transaction from this sender.</span>
                </div>
            `;
        }
        
        txCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #0033ad; margin: 0; font-size: 18px;">
                    📝 Transaction ${tx.id}
                </h2>
                <div style="background: rgba(0,51,173,0.3); padding: 5px 15px; border-radius: 15px; color: #88aaff; font-size: 12px;">
                    PENDING VALIDATION
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center; margin-bottom: 20px;">
                <!-- From -->
                <div style="background: rgba(255,152,0,0.1); border: 1px solid #FF9800; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #FF9800; font-size: 12px; margin-bottom: 5px;">FROM</div>
                    <div style="color: #fff; font-weight: bold; font-size: 16px;">${wallet.name}</div>
                    <div style="color: #666; font-size: 10px;">${tx.from}</div>
                    <div style="color: #4CAF50; margin-top: 8px; font-size: 14px;">
                        Balance: <strong>${wallet.balance} ADA</strong>
                    </div>
                </div>
                
                <!-- Arrow + Amount -->
                <div style="text-align: center;">
                    <div style="color: #0033ad; font-size: 24px; font-weight: bold; margin-bottom: 5px;">
                        ${tx.amount} ADA
                    </div>
                    <div style="color: #0033ad; font-size: 30px;">→</div>
                </div>
                
                <!-- To -->
                <div style="background: rgba(76,175,80,0.1); border: 1px solid #4CAF50; border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="color: #4CAF50; font-size: 12px; margin-bottom: 5px;">TO</div>
                    <div style="color: #fff; font-weight: bold; font-size: 16px;">${toWallet.name}</div>
                    <div style="color: #666; font-size: 10px;">${tx.to}</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #888; font-size: 12px;">DIGITAL SIGNATURE</div>
                        <div style="color: ${tx.signature.includes('VALID') && tx.signature.includes(wallet.name.toUpperCase()) ? '#4CAF50' : '#f44336'}; font-family: monospace; font-size: 14px; margin-top: 5px;">
                            ${tx.signature}
                        </div>
                    </div>
                    <div style="color: #888; font-size: 11px; text-align: right;">
                        Expected: SIG_${wallet.name.toUpperCase()}_VALID
                    </div>
                </div>
            </div>
            
            ${doubleSpendWarning}
        `;
    }
    
    function handleDecision(approved) {
        const tx = transactions[currentTxIndex];
        const isCorrect = (approved === tx.isValid);
        
        totalAnswered++;
        if (isCorrect) {
            correctAnswers++;
            if (approved) {
                processedTxIds.add(tx.id); // Track approved transactions
            }
        }
        
        // Update score display
        document.getElementById('correct-count').textContent = correctAnswers;
        document.getElementById('earned-ada').textContent = correctAnswers * rewardPerCorrect;
        
        // Show feedback
        showFeedback(isCorrect, tx, approved);
    }
    
    function showFeedback(isCorrect, tx, userApproved) {
        feedbackOverlay.style.display = 'flex';
        
        const feedbackCard = document.createElement('div');
        feedbackCard.style.cssText = `
            background: ${isCorrect ? 'linear-gradient(135deg, #1B5E20 0%, #0d3d0d 100%)' : 'linear-gradient(135deg, #8B0000 0%, #5a0000 100%)'};
            border: 2px solid ${isCorrect ? '#4CAF50' : '#f44336'};
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            text-align: center;
        `;
        
        feedbackCard.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 15px;">${isCorrect ? '✓' : '✗'}</div>
            <h2 style="color: ${isCorrect ? '#4CAF50' : '#f44336'}; margin: 0 0 15px 0;">
                ${isCorrect ? 'CORRECT!' : 'INCORRECT'}
            </h2>
            <p style="color: #ccc; margin: 0 0 15px 0; font-size: 14px;">
                You ${userApproved ? 'approved' : 'rejected'} this transaction.<br>
                The correct action was to <strong style="color: ${tx.isValid ? '#4CAF50' : '#f44336'};">${tx.isValid ? 'APPROVE' : 'REJECT'}</strong>.
            </p>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
                <div style="color: #888; font-size: 12px; margin-bottom: 5px;">EXPLANATION:</div>
                <div style="color: #fff; font-size: 13px; line-height: 1.6;">${tx.reason}</div>
            </div>
            ${isCorrect ? `<div style="color: #4CAF50; font-size: 16px;">+${rewardPerCorrect} ${COIN_SYMBOL} earned!</div>` : ''}
            <button id="next-tx-btn" style="
                margin-top: 20px;
                padding: 12px 40px;
                font-size: 16px;
                background: #0033ad;
                border: none;
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            ">${currentTxIndex < transactions.length - 1 ? 'NEXT TRANSACTION' : 'VIEW RESULTS'}</button>
        `;
        
        feedbackOverlay.innerHTML = '';
        feedbackOverlay.appendChild(feedbackCard);
        
        document.getElementById('next-tx-btn').onclick = () => {
            feedbackOverlay.style.display = 'none';
            currentTxIndex++;
            
            if (currentTxIndex < transactions.length) {
                document.getElementById('progress-text').innerHTML = 
                    `Transaction <span style="color: #0033ad;">${currentTxIndex + 1}</span> of ${transactions.length}`;
                displayTransaction(transactions[currentTxIndex]);
            } else {
                showResults();
            }
        };
    }
    
    async function showResults() {
        const totalReward = correctAnswers * rewardPerCorrect;
        const percentage = Math.round((correctAnswers / transactions.length) * 100);
        
        resultsScreen.style.display = 'flex';
        resultsScreen.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%);
                border: 2px solid #0033ad;
                border-radius: 15px;
                padding: 40px;
                max-width: 500px;
                text-align: center;
            ">
                <h1 style="color: #0033ad; margin: 0 0 20px 0;">VALIDATION COMPLETE</h1>
                
                <div style="font-size: 80px; margin-bottom: 20px;">
                    ${percentage >= 80 ? '🏆' : percentage >= 50 ? '📋' : '📝'}
                </div>
                
                <div style="background: rgba(0,51,173,0.2); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                    <div style="color: #888; font-size: 14px; margin-bottom: 5px;">ACCURACY</div>
                    <div style="color: #0033ad; font-size: 48px; font-weight: bold;">${percentage}%</div>
                    <div style="color: #888; font-size: 14px;">${correctAnswers} of ${transactions.length} correct</div>
                </div>
                
                <div style="background: rgba(76,175,80,0.2); padding: 15px; border-radius: 10px; margin-bottom: 25px;">
                    <div style="color: #4CAF50; font-size: 14px;">REWARDS EARNED</div>
                    <div style="color: #fff; font-size: 32px; font-weight: bold; margin-top: 5px;">
                        ${totalReward} ${COIN_SYMBOL}
                    </div>
                </div>
                
                <p style="color: #888; font-size: 13px; margin-bottom: 25px; line-height: 1.6;">
                    ${percentage >= 80 
                        ? "Excellent work! You've mastered transaction validation. The blockchain is safer with validators like you!" 
                        : percentage >= 50 
                            ? "Good effort! Keep practicing to catch more invalid transactions." 
                            : "Keep learning! Remember to always check balances, signatures, and watch for double-spends."}
                </p>
                
                <button id="claim-reward-btn" style="
                    width: 100%;
                    padding: 15px;
                    font-size: 18px;
                    background: linear-gradient(135deg, #0033ad 0%, #001a57 100%);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                ">CLAIM ${totalReward} ${COIN_SYMBOL}</button>
            </div>
        `;
        
        document.getElementById('claim-reward-btn').onclick = async () => {
            const btn = document.getElementById('claim-reward-btn');
            btn.textContent = 'Saving...';
            btn.disabled = true;
            btn.style.background = '#666';
            btn.style.cursor = 'wait';
            
            try {
                console.log(`[Laundry] Awarding ${totalReward} ${COIN_SYMBOL}...`);
                
                await rewardMinigame(MINIGAME_NAME, totalReward);
                console.log(`✅ ${COIN_NAME} added:`, totalReward);
                
                if (isFirstCompletion) {
                    await completeMinigame(MINIGAME_NAME);
                    console.log('✅ Minigame marked complete');
                }
                
                // Refresh leaderboard
                if (window.GameControl && window.GameControl.leaderboard) {
                    try {
                        await window.GameControl.leaderboard.refresh();
                    } catch (e) {}
                }
                
                btn.textContent = '✅ Saved!';
                btn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    window.laundryMinigameActive = false;
                    window.minigameActive = false;
                    document.body.removeChild(overlay);
                    if (onComplete) onComplete();
                }, 800);
                
            } catch (error) {
                console.error('❌ Sync failed:', error);
                btn.textContent = '⚠️ Error - Closing...';
                btn.style.background = '#f44336';
                
                setTimeout(() => {
                    window.laundryMinigameActive = false;
                    window.minigameActive = false;
                    document.body.removeChild(overlay);
                    if (onComplete) onComplete();
                }, 1500);
            }
        };
    }
}

window.showLaundryMinigame = showLaundryMinigame;
export default showLaundryMinigame;