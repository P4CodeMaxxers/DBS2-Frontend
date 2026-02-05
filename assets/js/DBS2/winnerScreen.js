import Prompt from './Prompt.js';

/**
 * showVictoryScreen with image slideshow
 * Displays 3 images in sequence with Next/Close buttons
 */
export function showVictoryScreen() {
    try {
        // Stop the timer first
        if (window.GameControl && typeof window.GameControl.stopTimer === 'function') {
            window.GameControl.stopTimer();
        }

        // Image paths - update these to match your actual image locations
        const images = [
            '/images/DBS2/victory1.png',  // First image - door/escape scene
            '/images/DBS2/victory2.png',  // Second image - hand reaching
            '/images/DBS2/victory3.png'   // Third image - certificate
        ];

        let currentImageIndex = 0;

        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.id = 'victory-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Courier New', monospace;
        `;

        // Victory title
        const title = document.createElement('div');
        title.style.cssText = `
            color: #2ecc71;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 0 0 20px rgba(46, 204, 113, 0.8);
            animation: pulse 2s infinite;
        `;
        title.textContent = '🎉 VICTORY! 🎉';
        overlay.appendChild(title);

        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 50px rgba(46, 204, 113, 0.5);
            margin-bottom: 30px;
            max-width: 90%;
            max-height: 60vh;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Image element
        const img = document.createElement('img');
        img.style.cssText = `
            max-width: 100%;
            max-height: 50vh;
            border-radius: 10px;
            object-fit: contain;
        `;
        img.src = images[0];
        imageContainer.appendChild(img);
        overlay.appendChild(imageContainer);

        // Image counter
        const counter = document.createElement('div');
        counter.style.cssText = `
            color: #ecf0f1;
            font-size: 18px;
            margin-bottom: 20px;
        `;
        counter.textContent = `Image 1 of ${images.length}`;
        overlay.appendChild(counter);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 20px;
        `;

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.style.cssText = `
            padding: 15px 40px;
            background: linear-gradient(145deg, #2ecc71, #27ae60);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
            font-family: 'Courier New', monospace;
        `;

        nextBtn.onmouseover = () => {
            nextBtn.style.transform = 'translateY(-3px)';
            nextBtn.style.boxShadow = '0 8px 20px rgba(46, 204, 113, 0.6)';
        };

        nextBtn.onmouseout = () => {
            nextBtn.style.transform = 'translateY(0)';
            nextBtn.style.boxShadow = '0 5px 15px rgba(46, 204, 113, 0.4)';
        };

        nextBtn.onclick = () => {
            currentImageIndex++;
            if (currentImageIndex < images.length) {
                // Show next image
                img.src = images[currentImageIndex];
                counter.textContent = `Image ${currentImageIndex + 1} of ${images.length}`;
                
                // If last image, change button text
                if (currentImageIndex === images.length - 1) {
                    nextBtn.textContent = 'Finish ✓';
                }
            } else {
                // Close the victory screen
                closeVictoryScreen();
            }
        };

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 15px 40px;
            background: #95a5a6;
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            font-family: 'Courier New', monospace;
        `;

        closeBtn.onmouseover = () => {
            closeBtn.style.transform = 'translateY(-3px)';
            closeBtn.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
        };

        closeBtn.onmouseout = () => {
            closeBtn.style.transform = 'translateY(0)';
            closeBtn.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        };

        closeBtn.onclick = () => {
            closeVictoryScreen();
        };

        buttonContainer.appendChild(nextBtn);
        buttonContainer.appendChild(closeBtn);
        overlay.appendChild(buttonContainer);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);

        // Add overlay to page
        document.body.appendChild(overlay);

        // Close function
        function closeVictoryScreen() {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }

        // Allow ESC key to close
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closeVictoryScreen();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);

    } catch (e) {
        // Fallback if custom victory screen fails
        console.warn('Victory screen error, using fallback', e);
        try {
            Prompt.showDialoguePopup('System', '🎉 Victory! You escaped!', () => {});
        } catch (promptError) {
            console.error('Both victory screens failed', promptError);
        }
    }
}