# Text-to-CAD: Parametric 3D Modeling via Large Language Models
**A Prototype for Converting Natural Language Descriptions into Engineering CAD Models**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://amin-edjlal-s-projects.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Prototype-orange)]()

## 📝 Abstract (چکیده علمی)
The "Semantic Gap" between natural language and precise geometric modeling remains a significant challenge in Computer-Aided Design (CAD). **Text-to-CAD** is an experimental web application designed to bridge this gap. By leveraging Large Language Models (LLMs), the system translates Persian natural language descriptions into procedural CAD scripts, ultimately rendering downloadable 3D meshes (STL/OBJ). This document outlines the current architecture, empirical testing results, identified bottlenecks, and the proposed engineering roadmap for a production-grade, high-precision industrial application.

---

## 🎯 1. Introduction (مقدمه)
Traditional CAD software requires extensive training and manual parameter input. The vision of this project is to democratize engineering design by allowing users to generate precise industrial and civil components simply by describing them. The ultimate goal is to parse complex 2D engineering drawings or descriptive text and output "flawless" 3D models suitable for additive manufacturing (3D printing) and structural analysis.

## 🏗️ 2. Current Implementation (معماری فعلی)
The current Minimum Viable Product (MVP) is deployed on a Serverless architecture:
*   **Frontend/Backend:** Next.js deployed on Vercel.
*   **AI Engine:** An LLM (likely a lightweight open-source model or limited API) parses the Persian text.
*   **Code Generation:** The AI generates **OpenSCAD** scripts based on the user's prompt.
*   **Rendering:** The generated OpenSCAD script is processed (often client-side or via a restricted serverless function) into a mesh, visualized using a 3D web renderer (e.g., Three.js), and offered as `.stl` or `.obj`.

## 🔬 3. Empirical Testing & Critical Limitations (نتایج تست‌ها و محدودیت‌ها)
Extensive testing with standardized industrial and civil prompts (Flanges, I-beams, Pipe Elbows, Concrete T-junctions) revealed critical limitations in the current prototype:

1.  **Spatial Reasoning Deficits:** LLMs struggle with 3D spatial orientation. Prompts asking for "horizontal cylinders" were often rendered vertically.
2.  **Boolean Operation Failures:** Complex operations like `Subtract` (e.g., hollowing out a cube or creating through-holes) frequently result in corrupted or incomplete geometry due to OpenSCAD's fragile scripting nature.
3.  **Serverless Timeout (Vercel):** The generation of complex standard parts (like threaded M3 bolts) exceeds the execution time limit of Vercel's Serverless functions, leading to infinite loading states.
4.  **Geometry Fragmentation:** As seen in the I-beam test, the AI generates three floating disjointed planes instead of a single, unified solid body.

## 🚀 4. Proposed Solutions & Future Architecture (راه‌حل‌های مهندسی)
To transition from this prototype to a high-precision industrial tool (The "Text-to-CAD Pro" vision), the following architectural overhauls are proposed:

*   **Migration to CadQuery (Python):** Moving away from OpenSCAD to **CadQuery**, which utilizes the OpenCascade kernel. This ensures robust, exact solid modeling (B-Rep) required for civil and mechanical engineering.
*   **Advanced LLM Integration (GPT-4o / Claude 3.5):** Utilizing State-of-the-Art models with **Structured Outputs (JSON)** to ensure exact dimensional parameters are extracted before code generation.
*   **Self-Healing Feedback Loop:** Implementing an automated error-correction loop. If the Python/CadQuery execution fails on the server, the error logs are fed back into the LLM to auto-correct the script (up to 3 retries).
*   **Dedicated Backend Server:** Replacing Serverless hosting with a dedicated Python (FastAPI) container to handle heavy geometric computations, eliminating timeouts and allowing for high-quality STEP file generation.

---

## 🛠️ 5. Usage (نحوه استفاده)
1. Open the web application.
2. Input your geometric description in Persian (e.g., *"یک فلنج با قطر بیرونی ۱۰۰ و ضخامت ۲۰ بساز..."*).
3. Wait for the AI to generate and render the 3D model.
4. Download the output as `.STL` (for 3D printing) or `.OBJ` (for rendering).

## 🤝 Contributing
Contributions are welcome! If you are a mechanical engineer, CAD developer, or AI researcher, please check the issues tab or submit a PR. We are specifically looking for help with CadQuery script generation and LLM prompt engineering.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---
*Developed as a vision for the future of parametric design and AI.*
