# TASK-002: Active Piece & Left Wall Movement

## Objective
Implement Tetrimino generation, rotation, and the automatic horizontal movement of the Left Wall.

## Business Context
The Left Wall is the primary moving force in the game, and the Active Piece is the player's tool to manipulate the field before it becomes part of the compressed mass.

## Scope
- `ActivePiece` class: Manages Tetrimino shapes, rotation, and current state.
- `LeftWall` class: Manages horizontal movement from $x=0$ toward the Right Wall.
- State Transition: Transitioning from "Active Piece" to "Fixed Block" upon contact with the Left Wall.

## Constraints
- 7 standard Tetrimino shapes.
- Rotation is 90° clockwise only.
- Left Wall moves at a constant speed.

## Relevant Concerns
- **Predictive Rotation**: Before a rotation is applied, the system must check if the rotation would cause a collision with existing blocks or the field boundaries.
- **Contact Logic**: Detecting the moment the Left Wall's $x$ position intersects with the Active Piece's bounds.

## Acceptance Criteria
- [ ] Seven distinct Tetrimino shapes are correctly defined.
- [ ] `ActivePiece` can rotate 90° clockwise.
- [ ] `ActivePiece.rotate()` is blocked if the rotation would cause a collision (Predictive Check).
- [ ] `LeftWall` moves horizontally at a constant rate.
- [ ] When `LeftWall` hits `ActivePiece`, the piece is marked as a fixed block in the `Field`.

## Deliverables
- `src/ActivePiece.ts`
- `src/LeftWall.ts`
