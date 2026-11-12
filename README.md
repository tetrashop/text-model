# Text-to-CAD: Parametric 3D Modeling via Large Language Models
**A Prototype for Bridging Natural Language Processing and Industrial Computer-Aided Design**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://text-model.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Prototype%20(MVP)-orange)]()
[![Language](https://img.shields.io/badge/Language-Persian%20(Farsi)-blue)]()

---

## 📝 Abstract (چکیده)
The Semantic Gap between natural language and precise geometric modeling remains a significant challenge in Computer-Aided Design (CAD). **Text-to-CAD** is an experimental, AI-driven web application designed to translate Persian natural language descriptions into procedural CAD scripts. By leveraging Large Language Models (LLMs), the system generates and renders downloadable 3D meshes (STL/OBJ) suitable for additive manufacturing. This document outlines the system's architecture, empirical testing results across standard mechanical and civil components, root-cause analysis of geometric failures, and a proposed roadmap for a production-grade, high-precision engineering tool.

---

## 1. Introduction (مقدمه)
Traditional CAD software (e.g., SolidWorks, AutoCAD) requires extensive training and manual parametric input. The primary objective of this project is to democratize engineering design by enabling users to generate precise industrial and civil components through simple text prompts. The ultimate goal is to parse descriptive engineering requirements and output high-quality, printable 3D models.

## 2. Current System Architecture (معماری فعلی سیستم)
The current Minimum Viable Product (MVP) is deployed on a serverless architecture:
*   **Frontend/Backend:** Next.js deployed on Vercel.
*   **AI Engine:** An LLM parses Persian text and attempts to generate **OpenSCAD** (a script-based CAD language).
*   **Rendering:** The generated script is processed into a 3D Mesh using Three.js and rendered in the browser.
*   **Export:** Users can download `.stl` and `.obj` files.

## 3. Empirical Testing & Case Studies (نتایج تست‌های تجربی)
Extensive testing was conducted using standardized industrial and civil engineering parameters. The results highlight critical limitations in the current pipeline.

### Test Set 1: Standard Industrial & Civil Components
| Component | Persian Prompt (Data Input) | Observed Result |
| :--- | :--- | :--- |
| **Flange** | «یک فلنج استوانه‌ای... قطر بیرونی ۱۰۰، ضخامت ۲۰... سوراخ مرکزی ۲۵... ۶ سوراخ با فاصله ۴۰» | **Success.** Accurate rendering of the main body and Boolean subtractions for holes. |
| **Concrete T-Junction** | «یک اتصال ستون و تیر بتنی... ستون ۴۰x۴۰x۳۰۰... تیر ۳۰x۵۰x۲۰۰» | **Failure.** Geometrically distorted. The AI struggled with spatial alignment (Z-axis translation). |
| **Pillow Block** | «پایه بلبرینگ... مکعب ۸۰x۴۰x۵۰... استوانه افقی شعاع ۲۵... سوراخ عبوری ۱۵» | **Failure.** Rendered a vertical solid cylinder instead of horizontal. Ignored the through-hole operation. |
| **Pipe Elbow** | «اتصال لوله ۹۰ درجه... دو استوانه شعاع ۲۰... عمود بر هم... سوراخ ۱۵» | **Complete Failure.** Generated a simple hollow cylinder (cup shape) instead of a 90-degree elbow. |
| **I-Beam** | «تیرآهن I شکل... ارتفاع ۲۰۰، عرض ۱۰۰، ضخامت ۱۰، جان ۸... طول ۵۰۰» | **Failure.** Generated three disjointed floating planes instead of a unified solid body. |
| **Staircase** | «راه‌پله مستقیم ۱۰ پله... ارتفاع ۲۰، عمق ۳۰... زیر آن شیب‌دار» | **Partial Failure.** Ignored individual steps and generated a single solid wedge. |

### Test Set 2: Complex Parametric Geometries
**Prompt:** *"Based on technical drawings, this part is a complex Rotor with cylindrical, conical profiles, and specific grooves..."* (توصیف روتور پیچیده)
*   **Result:** **Total Hallucination.** The AI generated a flattened, distorted disc with nonsensical internal Boolean subtractions.

**Parametric Breakdown Attempt:** 
To assist the AI, the Rotor was deconstructed into primitives: *"Create a cylinder r=50, h=10. Place a cone on it (bottom r=50, top r=20, h=30). Subtract a cylinder r=10, h=60 from center..."*
*   **Result:** The system successfully generated the base cylinder and center hole, but **failed to render the cone** (Union operation) and failed to translate it on the Z-axis.

## 4. Root Cause Analysis (تحلیل ریشه‌ای مشکلات)
1.  **Spatial Reasoning Deficits:** LLMs lack inherent 3D spatial awareness. They fail to calculate coordinate translations (X, Y, Z) for operations like stacking a cone on a cylinder.
2.  **OpenSCAD Brittleness:** OpenSCAD relies on purely mathematical CSG (Constructive Solid Geometry). LLMs frequently hallucinate the syntax for complex Boolean operations (e.g., `difference()`, `union()`), leading to corrupted geometry or mesh fragmentation.
3.  **Serverless Timeouts (Vercel):** Generating complex standard parts (like threaded M3 bolts) exceeds the 10-60 second execution limit of Vercel's serverless functions, causing infinite loading states.
4.  **Abstract Language vs. Parametric Input:** The AI cannot process qualitative descriptions (e.g., "special grooves"). It requires strict quantitative parameters.

## 5. Proposed Solutions & Future Roadmap (Text-to-CAD Pro)
To transition from this prototype to a high-precision industrial tool, the following architectural overhauls are required:

*   **Migration to CadQuery (Python):** Replace OpenSCAD with **CadQuery**, which uses the OpenCascade (OCC) kernel. This enables exact B-Rep (Boundary Representation) solid modeling, ensuring robust Boolean operations and smooth fillets.
*   **Advanced LLM & Structured Outputs:** Integrate State-of-the-Art models (e.g., GPT-4o, Claude 3.5) using JSON schema. The AI will extract parameters first, then generate Python code, rather than generating raw geometry code directly.
*   **Self-Healing Feedback Loop:** Implement a backend system that catches Python/CadQuery execution errors and feeds the traceback back to the LLM for auto-correction (up to 3 retries).
*   **Dedicated Python Backend (FastAPI):** Move away from Serverless to a dedicated container (e.g., AWS EC2, DigitalOcean) to handle heavy geometric computations, eliminate timeouts, and allow `.STEP` file exports for professional engineering software.

---

## 6. Installation & Local Setup (نصب و راه‌اندازی)
*(Note: Ensure you have Node.js installed)*
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/text-to-cad.git

# Navigate to project directory
cd text-to-cad

# Install dependencies
npm install

# Run the development server
npm run dev
```

7. Contributing (مشارکت)

Contributions are highly encouraged! If you are an AI researcher, mechanical engineer, or full-stack developer, please fork the repo, create a feature branch, and submit a Pull Request. We are specifically looking for expertise in CadQuery implementation and LLM Prompt Engineering.

8. License (مجوز)

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed by Amin Edjlal as a vision for the future of parametric design.
