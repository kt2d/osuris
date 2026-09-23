# Task Packet

TASK-ID: TASK-005

Title: Rendering & UI

Priority: High

Dependencies: None (can be developed in parallel with TASK-004)

---

# Objective

Implement `Renderer` that draws the game state on an HTML5 Canvas, including the field, active piece, walls, and UI elements (score, game over).

---

# Business Context

The player needs visual feedback to make decisions. The Renderer translates the game's logical state into a visual representation. Without rendering, the game is unplayable.

---

# Scope

## In Scope

### Target

- New file: `src/Renderer.ts` - Renderer class
- Modified: `src/styles.css` - Canvas styling (if needed)
- Modified: `src/main.ts` - Add tests for Renderer (optional, visual verification)

## Out of Scope

- Animations or transitions
- Sound effects
- Particle effects
- Custom fonts
- Responsive layout

---

# Constraints

## D-005-1: Canvas Only

Priority: Required

Description: Use HTML5 Canvas API only. No DOM manipulation for game elements.

Rationale: Consistent rendering approach, better performance for grid-based games.

---

## D-005-2: Grid Alignment

Priority: Required

Description: All elements must be drawn aligned to the grid cells. No sub-pixel offsets.

Rationale: Visual consistency with the logical grid structure.

---

## D-005-3: Cell Size

Priority: Optional

Description: Each grid cell is 40x40 pixels. Canvas is 640x320 pixels (16 cells x 8 cells).

Rationale: 16x8 grid at 40px cells gives a reasonable display size. The Renderer should accept cell size as a configurable parameter.

---

## D-005-4: Minimalist Design

Priority: Required

Description: Use simple colors and shapes. No gradients, shadows, or complex visual effects.

Rationale: MVP focuses on gameplay, not graphics.

---

# Implementation Notes

## Class Design

```typescript
export class Renderer {
  constructor(canvas: HTMLCanvasElement, cellSize: number = 40);
  
  render(
    field: Field,
    activePiece: ActivePiece | null,
    leftWall: LeftWall,
    rightWall: RightWall,
    score: number,
    isGameOver: boolean
  ): void;
}
```

## Render Order

1. Clear canvas (background color)
2. Draw field grid (cells, borders)
3. Draw fixed blocks on field
4. Draw active piece (if exists)
5. Draw Left Wall (vertical line)
6. Draw Right Wall (vertical line)
7. Draw UI (score, game over message)

## Color Scheme

| Element | Color |
|---------|-------|
| Background | #0f0f23 (dark) |
| Grid lines | #1a1a3e (subtle) |
| Fixed blocks | #4a4a8a (blue-gray) |
| Active piece | #ff6b6b (coral) |
| Left Wall | #ffd93d (yellow) |
| Right Wall | #6bff6b (green) |
| Text | #e0e0e0 (light gray) |
| Game Over overlay | Semi-transparent dark |

## UI Elements

- **Score**: Displayed above or below the canvas. Format: "Density: XX%"
- **Game Over**: Centered overlay text "GAME OVER" with final density

## Test Strategy

The Renderer is primarily visual. Tests should verify:
- Renderer constructor creates a valid context
- render() does not throw when given valid inputs
- render() handles null activePiece gracefully
- render() handles game over state correctly

Visual correctness is verified by human inspection during TASK-007 integration.

---

# Acceptance Criteria

- [ ] `Renderer` class exists in `src/Renderer.ts`
- [ ] Canvas is cleared before each render
- [ ] Field grid is drawn with visible cell borders
- [ ] Fixed blocks are rendered as filled cells
- [ ] Active piece is rendered with a distinct color
- [ ] Left Wall is rendered as a vertical line
- [ ] Right Wall is rendered as a vertical line
- [ ] Score (density percentage) is displayed
- [ ] Game Over message appears when isGameOver is true
- [ ] `render()` does not throw when activePiece is null
- [ ] `npx tsc` compiles with no errors
- [ ] All tests pass

---

# Deliverables

- New: `src/Renderer.ts`
- Modified: `src/main.ts` (optional tests)

---

# References

- `game-design.md` - UI section: field, active piece, left wall, game over display
- `10_plan.md` - D-005 Canvas Cell Size

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] Implementation notes provide sufficient detail
- [x] Task can be implemented without reading the full Plan
