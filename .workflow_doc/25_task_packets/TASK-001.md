# TASK-001: Core Engine & Field

## Objective
Set up the project structure and implement the base grid with vertical looping logic.

## Business Context
The foundation of the game is a $16 \times 8$ grid where the vertical dimension is a loop. This means moving off the bottom edge brings the entity to the top edge.

## Scope
- Project initialization (TypeScript/HTML/CSS).
- `Field` class: Manages the $16 \times 8$ grid.
- Vertical Looping: Logic to handle coordinate wrap-around for the $y$-axis.

## Constraints
- Use only HTML, CSS, and TypeScript.
- No external game libraries.

## Relevant Concerns
- Coordinate system: $x \in [0, 15]$, $y \in [0, 7]$.
- The vertical loop must be handled at the grid/coordinate level so that any "up/down" movement automatically wraps.

## Acceptance Criteria
- [ ] Project compiles without errors.
- [ ] `Field` class can be instantiated with $16$ columns and $8$ rows.
- [ ] A function/method in `Field` can successfully map a $y$-coordinate wrap (e.g., $y=8 \to y=0$ and $y=-1 \to y=7$).
- [ ] The grid data structure can store and retrieve blocks at any $(x, y)$ coordinate within the looped space.

## Deliverables
- `index.html`
- `src/main.ts`
- `src/Field.ts`
