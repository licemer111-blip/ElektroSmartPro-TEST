I will enhance the AI analysis logic to improve accuracy and context understanding by implementing a "Legend-First" strategy.

### 1. Update Server Action (`actions.ts`)
The core issue is that the AI counts symbols based on generic shapes (circles, crosses) without first "grounding" itself in the specific legend of the current project.
- **Refine System Prompt**:
  - Add a **"Phase 0: Legend & Context Analysis"** step.
  - Instruct AI to **first** scan the entire image (or crop edges) to find any visible Legend (Legenda) or text descriptions.
  - Use this legend to *define* what a "Lamp" or "Socket" looks like for *this specific drawing* before counting.
  - Explicitly ask it to match symbols to the legend definitions rather than guessing.
- **Adjust Counting Logic**:
  - Re-introduce a milder version of "Grid Search" but strictly for validation: "After counting, double-check your count by scanning the area again."
  - Add a specific instruction to handle the user's scenario: "If the user selects a group of items, assume they want a precise count of *that specific group*. If you see 8 items, say 8. Do not hallucinate 16."

### 2. Frontend Tweak (`pdf-drawing-viewer.tsx`)
- Ensure the "Smart Crop" includes a bit more context if possible, or advise the user (via UI hint) to include the legend in their selection if it's nearby, though the prompt change is the primary fix here. *Actually, the backend prompt change is sufficient.*

### 3. Verification
- I will verify the prompt structure ensures the "Legend First" logic is prioritized over the "Count Immediately" logic.
