export class GameUI {
    constructor() {
        this.speedElement = document.getElementById('speed');
        this.lapTimeElement = document.getElementById('lap-time');
        this.bestTimeElement = document.getElementById('best-time');
        this.positionElement = document.getElementById('position');
    }
    
    updateSpeed(speed) {
        const speedKmh = Math.abs(Math.round(speed * 10));
        this.speedElement.textContent = `Speed: ${speedKmh} km/h`;
    }
    
    updateLapTime(timeInSeconds) {
        this.lapTimeElement.textContent = `Lap: ${this.formatTime(timeInSeconds)}`;
    }
    
    updateBestTime(timeInSeconds) {
        if (timeInSeconds !== Infinity) {
            this.bestTimeElement.textContent = `Best: ${this.formatTime(timeInSeconds)}`;
        }
    }
    
    updatePosition(position, totalCarts) {
        this.positionElement.textContent = `Position: ${position}/${totalCarts}`;
    }
    
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    
    showGameOver(message) {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over';
        gameOverScreen.style.position = 'absolute';
        gameOverScreen.style.top = '0';
        gameOverScreen.style.left = '0';
        gameOverScreen.style.width = '100%';
        gameOverScreen.style.height = '100%';
        gameOverScreen.style.display = 'flex';
        gameOverScreen.style.flexDirection = 'column';
        gameOverScreen.style.justifyContent = 'center';
        gameOverScreen.style.alignItems = 'center';
        gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverScreen.style.color = 'white';
        gameOverScreen.style.zIndex = '300';
        
        const messageElement = document.createElement('h2');
        messageElement.textContent = message;
        gameOverScreen.appendChild(messageElement);
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.style.padding = '15px 30px';
        restartButton.style.fontSize = '20px';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.margin = '20px 0';
        
        restartButton.addEventListener('click', () => {
            location.reload();
        });
        
        gameOverScreen.appendChild(restartButton);
        document.body.appendChild(gameOverScreen);
    }
}
