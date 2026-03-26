I will fix the AI analysis implementation to ensure high accuracy and eliminate hallucinations.

### 1. Fix Resolution & Image Quality (Critical)
The main reason for "made up results" is that the current implementation downscales the high-quality PDF to your screen size before sending it to the AI.
- **Frontend (`pdf-drawing-viewer.tsx`)**: I will rewrite the `handleAnalyze` function to use the **native resolution** of the PDF (scaled 3x) instead of the screen resolution.
- **Logic**: The system will generate a high-res background, then scale your drawings (red lines/boxes) *up* to match it, ensuring the AI sees a crisp 3000px+ image instead of a blurry 800px screenshot.
- **PDF Converter (`pdfToImage.ts`)**: Increase the default rendering scale from `2.0` to `3.0` to capture tiny electrical symbols clearly.

### 2. Improve AI System Prompt (`actions.ts`)
The current prompt is too aggressive ("Count EVERYTHING", "Mentally divide into 3x3 grid"). This confuses the model when it can't see clearly.
- **Refinement**: I will update the prompt to prioritize **accuracy over quantity**.
- **Instruction**: Add explicit rules: "If a symbol is ambiguous, do not count it." and "Verify consistency with the legend."
- **Formatting**: Keep the structured JSON output but ensure it handles the high-res input correctly.

### 3. Verify
- I will verify the changes by checking the code logic for the canvas merging to ensure the dimensions are correct.
