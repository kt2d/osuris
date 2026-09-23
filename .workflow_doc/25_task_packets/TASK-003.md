# TASK-003: Compression System & Right Wall

## Objective
Implement the "Right Wall" as the base of compressed blocks and the logic for the compression event when walls meet.

## Business Context
The core gameplay loop is the "squeeze" that occurs when the Left Wall reaches the Right Wall, turning the gap into a dense, compact mass.

## Scope
- `RightWall` class: Represents the vertical boundary and the base of the compressed mass.
- `CompressionSystem` class: Handles the logic of packing blocks into the Right Wall.
- **Vertical Looping of Mass**: The Right Wall and its attached blocks must move together vertically as a single unit.

## Constraints
- Compression only occurs when `LeftWall.x` $\approx$ `RightWall.x`.
- The Right Wall maintains a vertical offset ($dy$) that can be manipulated.

## Relevant Concerns
- **Block Mass Management**: When compression occurs, all blocks between the Left Wall and Right Wall must be "merged" into the Right Wall's vertical stack, respecting the Right Wall's vertical offset and loop.
- **State Reset**: The Left Wall must reset to $x=0$ after a compression event.

## Acceptance Criteria
- [ ] `RightWall` can be shifted vertically (looping from $y=7 \to y=0$).
- [ ] `CompressionSystem` correctly moves all blocks from the gap into the `RightWall` mass.
- [ ] The compressed blocks correctly inherit the vertical rotation/offset of the `RightWall`.
- [ ] The `LeftWall` resets its $x$-position to $0$ after compression is complete.

## Deliverables
- `src/RightWall.ts`
- `src/CompressionSystem.ts`
