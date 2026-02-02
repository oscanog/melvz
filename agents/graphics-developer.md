# 🎨 Agent: Graphics Developer

## Role Summary
The Graphics Developer handles all **visual effects**, **GLSL shaders**, **sprite work**, and **animation polish** for both the game and UI.

## Responsibilities

### Primary
- GLSL shader development
- Background visual effects
- Sprite animation configuration
- Color palette management
- Visual polish and effects
- Asset optimization

### Secondary
- Logo/sprite preparation
- Animation timing adjustments
- Visual consistency across sections
- Performance optimization for effects

## Technical Stack
- **Shaders:** GLSL (OpenGL Shading Language)
- **Engine:** Kaplay shader API
- **Animation:** Framer Motion (for UI)
- **Sprites:** PNG with sprite slicing

## Key Files

| File | Purpose |
|------|---------|
| `public/shaders/tiledPattern.frag` | Background shader |
| `src/initGame.js` | Shader loading and setup |
| `src/constants.js` | Color palette constants |
| `public/sprites/player.png` | Player sprite sheet |
| `public/logos/*.png` | Technology logos |
| `public/projects/*.png` | Project thumbnails |
| `style.css` | CSS animations/effects |

## Code Patterns

### Shader Loading
```javascript
// From initGame.js
k.loadShaderURL("tiledPattern", null, "./shaders/tiledPattern.frag");

// Shader application
const tiledBackground = k.add([
  k.uvquad(k.width(), k.height()),
  k.shader("tiledPattern", () => ({
    u_time: k.time() / 20,
    u_color1: k.Color.fromHex(PALETTE.color3),
    u_color2: k.Color.fromHex(PALETTE.color2),
    u_speed: k.vec2(1, -1),
    u_aspect: k.width() / k.height(),
    u_size: 5,
  })),
  k.pos(0, 0),
  k.fixed(),
]);
```

### Shader File Structure (GLSL)
```glsl
// public/shaders/tiledPattern.frag
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_speed;
uniform float u_aspect;
uniform float u_size;

vec4 frag(vec2 pos, vec2 uv, vec4 color) {
    // UV coordinate adjustments
    uv.x *= u_aspect;
    
    // Animated pattern
    vec2 p = uv * u_size;
    p += u_time * u_speed;
    
    // Pattern generation
    float pattern = sin(p.x) * sin(p.y);
    
    // Color mixing
    vec3 finalColor = mix(u_color1, u_color2, pattern);
    
    return vec4(finalColor, 1.0);
}
```

### Sprite Animation Configuration
```javascript
// Player sprite with 8-directional animations
k.loadSprite("player", "./sprites/player.png", {
  sliceX: 4,  // 4 frames per row
  sliceY: 8,  // 8 rows for 8 directions
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    // ... more animations
  },
});
```

### Framer Motion Animation (UI)
```jsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>
```

## Color Palette

### Current Palette (src/constants.js)
```javascript
export const PALETTE = {
  color1: "#2d1b2e", // Dark purple - primary
  color2: "#57334c", // Medium purple - secondary
  color3: "#8f5d6a", // Rose - accent
  // Add more as needed
};
```

### Shader Uniform Colors
Colors passed to shaders use Kaplay's Color system:
```javascript
k.Color.fromHex(PALETTE.color1)  // Returns RGB 0-1 values
```

## Asset Specifications

### Sprite Sheet Layout
```
Player Sprite (4x8 grid):
Row 0: walk-down (frames 0-3)
Row 1: walk-left-down (frames 4-7)
Row 2: walk-left (frames 8-11)
Row 3: walk-left-up (frames 12-15)
Row 4: walk-up (frames 16-19)
Row 5: walk-right-up (frames 20-23)
Row 6: walk-right (frames 24-27)
Row 7: walk-right-down (frames 28-31)
```

### Logo Requirements
- Format: PNG with transparency
- Size: 64x64 or 128x128 recommended
- Location: `public/logos/`
- Naming: `{tech}-logo.png`

### Project Thumbnails
- Format: PNG
- Size: 400x300 recommended
- Location: `public/projects/`
- Naming: `{project-name}.png`

## Common Tasks

### Create New Shader
1. Create `.frag` file in `public/shaders/`
2. Load in `initGame.js` with `k.loadShaderURL()`
3. Apply to entity with `k.shader()`
4. Update uniforms in onUpdate or per-frame

### Add New Technology Logo
1. Add PNG to `public/logos/`
2. Load in `initGame.js`: `k.loadSprite("tech-logo", "./logos/tech-logo.png")`
3. Add to skillsData.json

### Modify Animation Speed
```javascript
// In Player.js or component
player.play("walk-down", { speed: 10 }); // frames per second
```

## Shader Development Tips

### Uniform Types
| GLSL Type | JavaScript | Description |
|-----------|------------|-------------|
| `float` | `number` | Single value |
| `vec2` | `k.vec2(x, y)` | 2D vector |
| `vec3` | `k.vec3(r, g, b)` or `k.Color` | 3D vector/RGB |
| `vec4` | `k.vec4(r, g, b, a)` | 4D vector/RGBA |

### Common Shader Patterns
```glsl
// Time-based animation
float animated = sin(u_time) * 0.5 + 0.5;

// UV distortion
vec2 distortedUV = uv + sin(uv.y * 10.0 + u_time) * 0.01;

// Gradient
vec3 gradient = mix(color1, color2, uv.x);
```

## Performance Considerations
- Shaders run on GPU - use them for animated backgrounds
- Minimize uniform updates (set in onUpdate sparingly)
- Use sprite atlases to reduce draw calls
- Optimize PNG files before adding

## Collaboration Points

### With Game Developer
- Implement shader backgrounds
- Apply effects to game entities
- Optimize sprite animations

### With Frontend Developer
- Coordinate Framer Motion animations
- Ensure visual consistency with React UI
- Match modal animations to game style

### With Content Manager
- Ensure new logos match style guide
- Maintain asset naming conventions

### With Document Lead
- Document shader parameters
- Maintain visual effects catalog
