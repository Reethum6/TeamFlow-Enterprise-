# 📐 Architectural Decisions Document (ADR)

## 1. Frontend Design Stack
* **Decision:** We chose a Single-Page Architecture (SPA) utilizing raw HTML5, native JavaScript (ES6+), and embedded CSS variables.
* **Reasoning:** Embedding our styles inside `index.html` prevents layout shift conditions and guarantees that premium glassmorphism filters render instantly without waiting for external stylesheet loads.

## 2. Immersive Visual Layer
* **Decision:** We implemented CSS Radial Gradient Mesh Animations paired with `backdrop-filter` properties.
* **Reasoning:** Traditional flat dark themes can feel static. Shifting gradients combined with translucent card elements give the Kanban lanes optical depth and a high-tech corporate appearance.

## 3. Telemetry Event Handling
* **Decision:** We built an asynchronous, self-dismissing Toast Notification system.
* **Reasoning:** Developers need instant confirmation of background API states (like a successful task deployment) without interrupting their current focus on the Kanban layout.