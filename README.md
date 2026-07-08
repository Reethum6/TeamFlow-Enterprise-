# ♾️ TeamFlow Enterprise

**TeamFlow Enterprise** is an immersive, glassmorphic Kanban management platform designed specifically for DevOps teams. It combines modern UI aesthetics with real-time system insights to deliver a powerful workflow experience.

---

## 🛠️ Features

* 🌀 **Kinetic Mesh Canvas**
  Active color radial gradients flowing smoothly beneath translucent workspace layers.

* 🧪 **Layered Glassmorphism**
  Sleek UI panels using modern `backdrop-filter` effects for depth and clarity.

* 🃏 **3D Kinetic Scale Cards**
  Interactive task cards with hover animations, smooth transforms, and glow effects.

* 🔔 **Telemetry Toast Alerts**
  Real-time animated notifications for system updates and activity tracking.

* ↔️ **Sliding Sidebar View Panel**
  Collapsible control panel that expands workspace visibility with smooth transitions.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `/backend` directory and configure the following:

| Variable Name          | Example Value           | Description                                |
| ---------------------- | ----------------------- | ------------------------------------------ |
| `API_URL`              | `http://127.0.0.1:8000` | Backend API endpoint for frontend requests |
| `DB_CONNECTION_STRING` | Database URI            | Database connection credentials            |
| `SECRET_KEY`           | Random secure string    | Used for authentication and token security |

---

## 🚀 Setup Instructions

### 1. Backend Setup

Navigate to the backend directory and initialize the environment:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

* **Linux / Mac:**

```bash
source venv/bin/activate
```

* **Windows:**

```bash
venv\Scripts\activate
```

Install dependencies and start the server:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### 2. Frontend Setup

Run a local server for the frontend:

```bash
cd ../frontend
python -m http.server 3000
```

Open your browser and visit:

```
http://localhost:3000
```

---

## 🔬 Assumptions & Limitations

### 🧠 State Assumption

Client-side state updates are confirmed via toast notifications before syncing with the backend.

### 🌐 Network Assumption

The backend is expected to run locally on port `8000` with CORS enabled.

### 🛑 Known Limitation

Drag-and-drop functionality is currently implemented via button triggers instead of touch or pointer gestures.

---

## 📌 Notes

This project focuses on combining modern UI/UX with DevOps workflow efficiency. Future enhancements may include:

* Native drag-and-drop interactions
* Cloud deployment support
* Advanced pipeline analytics

---

## 🤝 Contribution

Feel free to fork, contribute, and enhance the platform. Pull requests are welcome!

---

## 📄 License

This project is intended for educational and development purposes.
