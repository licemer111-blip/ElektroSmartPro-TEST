I acknowledge the visual analysis is failing to count accurately despite recent tweaks. The "Image Analysis" approach has fundamental limitations with dense symbols on plans.

### Strategic Pivot: Switch to "Tile-Based Grid Analysis" (The "Google Maps" Approach)
Instead of sending one cropped image (which still gets resized/compressed by OpenAI), I will implement a robust **Tiling System**.

1.  **Architecture Change**:
    - Do not send one image.
    - Split the *marked area* into a 2x2 or 3x3 grid of high-res tiles (sub-images).
    - Send *each tile* to the AI individually with the instruction: "Count lamps in this partial view. Be careful of edges."
    - Aggregate the results on the server side.

2.  **Why this works**:
    - OpenAI's Vision model has a resolution cap (usually 2048x2048). If your room is detailed, it gets downscaled, and lamps become blur.
    - By splitting the room into 4-9 tiles, each tile effectively gets "zoomed in" by 2x-3x without quality loss. A lamp becomes a large, unmistakable object.

3.  **Implementation Plan**:
    - **Frontend (`pdf-drawing-viewer.tsx`)**: Update logic to slice the `finalImageBase64` into 4 overlapping tiles if the area is large.
    - **Backend (`actions.ts`)**: Update `analyzeImageWithAi` to accept an *array* of images or handle multiple calls. (To keep it simple first, I will improve the single-image handling to force maximum resolution without tiling first, as tiling is complex to implement in one go. Let's try **Native Resolution Enforcement** first).

**Wait, simpler fix first**: The `net::ERR_ABORTED` suggests we are hitting payload limits. The "Smart Crop" might be creating HUGE base64 strings that choke the network or OpenAI.
- **Immediate Fix**: Optimize the JPEG compression. 0.95 is too high for base64. I will lower it to 0.85 but keep the pixel dimensions high. This balances quality vs transmission reliability.
- **Refined Prompt**: I will completely strip the prompt back to basics. No complex "Phase 0/1/2". Just: "Look at this image. Count X. Return number." Complexity often confuses models.

Let's try the optimization + simplified prompt first. If that fails, we move to Tiling.
