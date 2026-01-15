Role: Senior Creative Developer (Three.js & MediaPipe)

Task: Update the Hand Tracking Particle System with specific interaction logic and physics.

**Updated Interaction Logic (State Machine):**

1.  **High-Density Gather (State: PALM_UP)**:
    -   **Trigger**: Hand is flat, palm facing up/camera.
    -   **Action**: 
        -   Particles coalesce tightly into the current target shape (Sphere/Ring/Heart).
        -   **Positioning**: The shape must hover roughly **5-10cm (world units)** *above* the palm center, aligned with the palm's normal vector.
        -   **Visual**: High density, glowing core. Use a strong lerp factor (0.15) for tight tracking.
    -   **Shape Cycling**: *Crucial* - Every time the user enters the "Palm Up" state (from a non-palm-up state), cycle the target shape: **Sphere -> Ring -> Heart -> Sphere...**

2.  **Dissipate (State: FIST)**:
    -   **Trigger**: User clenches a fist.
    -   **Action**: Particles explode outwards randomly. They lose attraction to the center and drift with "noise".

3.  **Scatter/Expand (State: VERTICAL_FLIP)**:
    -   **Trigger**: Hand rotates vertically (chopping gesture) or flips over.
    -   **Action**: The shape expands significantly (scale * 2.5) and becomes sparse/loose, but maintains the general form.

**Special Feature: The Snap**:
-   **Trigger**: Detect a "Finger Snap" gesture (sudden change in distance between thumb and middle finger tip + velocity).
-   **Effect**: Spawn a *separate* burst of 50 tiny, high-velocity sparks/particles at the thumb tip. These fade out quickly (0.5s duration).

**Technical Constraints**:
-   **Particle Count**: Increase main system to 3000 particles for "High Density" look.
-   **Physics**: Use a custom shader or precise JS animation loop to handle the "Hover Offset" correctly using the hand's orientation (Normal Vector calculation required).

Please provide the updated `animate()` loop logic and the `detectGesture()` function logic.