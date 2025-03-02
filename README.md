# 3D Cart Racing Game

A simple 3D cart racing game built with Three.js.

## Features

- 3D racing environment
- Cart physics and controls
- Track with checkpoints
- Lap timing system
- Best lap tracking
- AI opponents
- Collision detection between carts

## How to Run

1. Clone this repository
2. Open index.html in a web browser

Alternatively, you can use a local server:

```bash
# Using Python 3
python -m http.server

# Using Node.js
npx http-server
```

Then navigate to http://localhost:8000 in your browser.

## Controls

- Arrow Up: Accelerate
- Arrow Down: Reverse
- Arrow Left/Right: Turn
- Spacebar: Brake

## Game Mechanics

- Stay on the track for better speed
- Pass through all checkpoints to complete a lap
- Try to achieve the best lap time
- Compete against AI-controlled opponents
- Avoid collisions with other carts

## Project Structure

- `index.html`: Main HTML file
- `css/style.css`: Styling for the game
- `js/game.js`: Main game logic
- `js/cart-controller.js`: Player cart physics and controls
- `js/ai-cart-controller.js`: AI opponent behavior
- `js/track-builder.js`: Track generation
- `js/game-ui.js`: User interface elements

## Future Improvements

- Add multiple tracks
- Add power-ups
- Improve physics and collision detection
- Add sound effects and music
- Add mobile controls
- Implement more sophisticated AI behavior
