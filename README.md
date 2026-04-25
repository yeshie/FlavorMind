# FlavorMind

> A mobile culinary assistant for memory-based recipe discovery, AI recipe generation, Sri Lankan ingredient adaptation, smart scaling, cookbooks, community sharing, and admin moderation.

---

## 1. What I Have Done

This section outlines the work completed for this assignment/project.

- **Feature Implementation:** Developed the Expo React Native mobile app with authentication, home, memory search, recipe generation, adaptation, scaling, cookbook, community, notifications, feedback, and profile screens.
- **Database Integration:** Connected Firebase Authentication and Cloud Firestore to store users, saved recipes, draft recipes, cookbooks, public recipes, feedback, cooking history, notifications, and ingredient substitutions.
- **API Development:** Integrated the mobile app with a Node.js Express backend API and a Python AI service for recipe retrieval, recipe generation, local adaptation, seasonal food data, and smart recipe scaling.
- **UI/UX Design:** Built a responsive mobile interface using React Native, Expo, React Navigation, reusable components, and a shared theme system.
- **Logic & Algorithms:** Implemented memory-based recipe discovery using FAISS retrieval, AI-assisted recipe generation through Ollama/LLaMA, recommendation scoring from user activity, and serving-size scaling logic.

## 2. Key Features

- Memory-based recipe search from taste, smell, texture, or remembered dish descriptions.
- AI recipe generation using FAISS retrieval and Ollama/LLaMA.
- Sri Lankan local ingredient adaptation with approved substitution records and AI fallback.
- Smart recipe scaling for different serving sizes.
- Firebase login, Google sign-in support, saved recipes, draft recipes, and cooking history.
- Personal digital cookbooks with recipe publishing and ratings.
- Community recipe and cookbook browsing.
- User feedback and personalized recommendation feed.
- Admin moderation for recipes, cookbooks, and ingredient swaps.

## 3. Tech Stack

- **Language:** TypeScript, JavaScript, Python
- **Framework:** Expo React Native, React Navigation, Node.js Express, FastAPI/Uvicorn, Vite React
- **Database:** Firebase Authentication, Cloud Firestore, FAISS vector index
- **Other Tools:** Firebase Admin SDK, Ollama, LLaMA/TinyLlama model artifacts, npm, Expo Go, Android Studio emulator

## 4. Model Artefacts

The AI model assets for FlavorMind's memory-based recipe workflow are kept in `D:\DegreeFinal\flavormind-train_model`.

- `tinyllama_flavormind_model`: LoRA adapter files
- `tinyllama_flavormind_merged`: merged model configuration
- `tinyllama_flavormind_f16.gguf`: higher-precision GGUF export
- `flavormind-q4_k_m.gguf`: quantized GGUF used for local Ollama inference
- `flavormind_faiss_fixed.index`: FAISS retrieval index
- `flavormind_retrieval_dataset_fixed.csv`: retrieval dataset used by the backend AI service
- `FlavorMind-AIModel-Train-final.jsonl`: chat-format fine-tuning dataset
- `Modelfile`: Ollama packaging file for local serving

## 5. Project Structure

```text
D:\DegreeFinal
├── FlavorMind/                  # Mobile app
│   ├── src/                     # Source code
│   │   ├── assets/              # Images/icons
│   │   │   └── icons/           # App icons
│   │   ├── common/              # Shared code
│   │   │   ├── components/      # Reusable UI
│   │   │   ├── hooks/           # Custom hooks
│   │   │   └── utils/           # Helper functions
│   │   ├── constants/           # App constants
│   │   ├── features/            # App features
│   │   │   ├── adaptation/      # Ingredient swaps
│   │   │   ├── auth/            # Login/signup
│   │   │   ├── community/       # Community pages
│   │   │   ├── cookbook/        # Cookbooks
│   │   │   ├── create/          # Recipe creation
│   │   │   ├── home/            # Home screen
│   │   │   ├── memory/          # Memory search
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── profile/         # User profile
│   │   │   ├── scaling/         # Recipe scaling
│   │   │   └── search/          # Recipe search
│   │   ├── navigation/          # App navigation
│   │   ├── services/            # App services
│   │   │   ├── api/             # API calls
│   │   │   ├── firebase/        # Firebase logic
│   │   │   └── storage/         # Local storage
│   │   └── types/               # Type definitions
│   ├── .env.example             # Environment sample
│   ├── App.tsx                  # App entry
│   └── package.json             # Dependencies
├── FlavorMind-Backend/          # Backend API
│   ├── ai/                      # AI service
│   ├── data/                    # Data files
│   ├── src/                     # Source code
│   │   ├── config/              # Configuration
│   │   ├── controllers/         # Request logic
│   │   ├── middleware/          # Middleware
│   │   ├── models/              # Data models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utilities
│   ├── uploads/                 # Uploaded files
│   ├── .env.example             # Environment sample
│   └── server.js                # Server entry
├── FlavorMindAdmin/             # Admin panel
│   ├── src/                     # Source code
│   │   ├── assets/              # Images
│   │   ├── App.tsx              # Main app
│   │   ├── config.ts            # Configuration
│   │   ├── firebase.ts          # Firebase setup
│   │   ├── index.css            # Styles
│   │   └── main.tsx             # App entry
│   ├── .env.example             # Environment sample
│   └── package.json             # Dependencies
└── flavormind-train_model/      # AI model files
```

## 6. How To Run

Follow these steps to set up and run the project locally.

### Step 1: Prerequisites

Ensure you have the following installed:

- Node.js 18 or newer
- npm 9 or newer
- Expo Go on a mobile phone or Android Studio emulator
- Python 3.10 or newer
- Ollama
- Firebase project with Authentication and Firestore enabled

### Step 2: Installation

Install dependencies for each application folder:

```bash
# Mobile app
cd D:\DegreeFinal\FlavorMind
npm install

# Backend API
cd D:\DegreeFinal\FlavorMind-Backend
npm install

# Python AI service
cd D:\DegreeFinal\FlavorMind-Backend
pip install -r ai\requirements.txt

# Admin panel
cd D:\DegreeFinal\FlavorMindAdmin
npm install
```

### Step 3: Setup Environment

Create `.env` files from the examples:

```bash
cd D:\DegreeFinal\FlavorMind
copy .env.example .env

cd D:\DegreeFinal\FlavorMind-Backend
copy .env.example .env

cd D:\DegreeFinal\FlavorMindAdmin
copy .env.example .env
```

Main mobile environment variables:

```text
EXPO_PUBLIC_API_URL=http://<YOUR_LAPTOP_IP>:5000/api/v1
EXPO_PUBLIC_AI_URL=http://<YOUR_LAPTOP_IP>:8000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Main backend environment variables:

```text
PORT=5000
API_VERSION=/api/v1
FIREBASE_API_KEY=your_firebase_web_api_key
AI_PROXY_ENABLED=true
AI_SERVICE_URL=http://127.0.0.1:8000
LLAMA_ENABLED=false
```

Main admin environment variables:

```text
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

The backend also needs the Firebase service account file at:

```text
D:\DegreeFinal\FlavorMind-Backend\firebaseKey.json
```

Keep `.env`, `firebaseKey.json`, and service account files private.

### Step 4: Run the Application

Open separate terminals and run these commands.

Run the backend API:

```bash
cd D:\DegreeFinal\FlavorMind-Backend
npm run dev
```

Check:

```text
http://localhost:5000/health
http://localhost:5000/api/status
```

Create the local Ollama model:

```bash
cd D:\DegreeFinal\flavormind-train_model
ollama create flavormind -f Modelfile
ollama show flavormind
```

Run the Python AI service:

```bash
cd D:\DegreeFinal\FlavorMind-Backend
set OLLAMA_MODEL=flavormind
set OLLAMA_GENERATE_MODEL=flavormind
uvicorn ai.app:app --reload --host 0.0.0.0 --port 8000
```

Check:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/recipes/similar?q=chicken%20curry
```

Run the mobile app:

```bash
cd D:\DegreeFinal\FlavorMind
npx expo start -c
```

Then press `a` for the Android emulator or scan the QR code with Expo Go.

Run the admin panel:

```bash
cd D:\DegreeFinal\FlavorMindAdmin
npm run dev
```

The admin panel should run at the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

When testing on a real phone, use your laptop LAN IP in `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AI_URL`. Do not use `localhost` on a phone because it points to the phone itself.

## 7. Testing

To run the available checks, use:

```bash
# Mobile app TypeScript check
cd D:\DegreeFinal\FlavorMind
npm run typecheck

# Backend tests and AI syntax check
cd D:\DegreeFinal\FlavorMind-Backend
npm test

# Admin panel checks
cd D:\DegreeFinal\FlavorMindAdmin
npm run typecheck
npm run build
```

## 8. Contact / Authors

Name: Your Name  
Student ID: Your Student ID  
Email: Your Email

## Submission Notes

Do not submit generated or private local files:

```text
node_modules
.expo
dist
logs
uploads
.env
firebaseKey.json
serviceAccountKey.json
```
