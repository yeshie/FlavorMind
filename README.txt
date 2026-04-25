FlavorMind
==========

A mobile culinary assistant for memory-based recipe discovery, AI recipe generation, Sri Lankan ingredient adaptation, smart scaling, cookbooks, community sharing, and admin moderation.


1. What I Have Done
-------------------

This section outlines the work completed for this assignment/project.

* Feature Implementation: Developed the Expo React Native mobile app with authentication, home, memory search, recipe generation, adaptation, scaling, cookbook, community, notifications, feedback, and profile screens.
* Database Integration: Connected Firebase Authentication and Cloud Firestore to store users, saved recipes, draft recipes, cookbooks, public recipes, feedback, cooking history, notifications, and ingredient substitutions.
* API Development: Integrated the mobile app with a Node.js Express backend API and a Python AI service for recipe retrieval, recipe generation, local adaptation, seasonal food data, and smart recipe scaling.
* UI/UX Design: Built a responsive mobile interface using React Native, Expo, React Navigation, reusable components, and a shared theme system.
* Logic & Algorithms: Implemented memory-based recipe discovery using FAISS retrieval, AI-assisted recipe generation through Ollama/LLaMA, recommendation scoring from user activity, and serving-size scaling logic.


2. Key Features
---------------

* Memory-based recipe search from taste, smell, texture, or remembered dish descriptions.
* AI recipe generation using FAISS retrieval and Ollama/LLaMA.
* Sri Lankan local ingredient adaptation with approved substitution records and AI fallback.
* Smart recipe scaling for different serving sizes.
* Firebase login, Google sign-in support, saved recipes, draft recipes, and cooking history.
* Personal digital cookbooks with recipe publishing and ratings.
* Community recipe and cookbook browsing.
* User feedback and personalized recommendation feed.
* Admin moderation for recipes, cookbooks, and ingredient swaps.


3. Tech Stack
-------------

* Language: TypeScript, JavaScript, Python
* Framework: Expo React Native, React Navigation, Node.js Express, FastAPI/Uvicorn, Vite React
* Database: Firebase Authentication, Cloud Firestore, FAISS vector index
* Other Tools: Firebase Admin SDK, Ollama, LLaMA/TinyLlama model artifacts, npm, Expo Go, Android Studio emulator


4. Project Structure
--------------------

D:\DegreeFinal
+-- FlavorMind/                  # Mobile app
|   +-- src/                     # Source code
|   |   +-- assets/              # Images/icons
|   |   |   +-- icons/           # App icons
|   |   +-- common/              # Shared code
|   |   |   +-- components/      # Reusable UI
|   |   |   +-- hooks/           # Custom hooks
|   |   |   +-- utils/           # Helper functions
|   |   +-- constants/           # App constants
|   |   +-- features/            # App features
|   |   |   +-- adaptation/      # Ingredient swaps
|   |   |   +-- auth/            # Login/signup
|   |   |   +-- community/       # Community pages
|   |   |   +-- cookbook/        # Cookbooks
|   |   |   +-- create/          # Recipe creation
|   |   |   +-- home/            # Home screen
|   |   |   +-- memory/          # Memory search
|   |   |   +-- notifications/   # Notifications
|   |   |   +-- profile/         # User profile
|   |   |   +-- scaling/         # Recipe scaling
|   |   |   +-- search/          # Recipe search
|   |   +-- navigation/          # App navigation
|   |   +-- services/            # App services
|   |   |   +-- api/             # API calls
|   |   |   +-- firebase/        # Firebase logic
|   |   |   +-- storage/         # Local storage
|   |   +-- types/               # Type definitions
|   +-- .env.example             # Environment sample
|   +-- App.tsx                  # App entry
|   +-- package.json             # Dependencies
+-- FlavorMind-Backend/          # Backend API
|   +-- ai/                      # AI service
|   |   +-- app.py               # Service entry
|   |   +-- requirements.txt     # Python packages
|   +-- data/                    # Data files
|   +-- logs/                    # Log files
|   +-- scripts/                 # Helper scripts
|   +-- src/                     # Source code
|   |   +-- config/              # Configuration
|   |   +-- controllers/         # Request logic
|   |   +-- middleware/          # Middleware
|   |   +-- models/              # Data models
|   |   +-- routes/              # API routes
|   |   +-- services/            # Business logic
|   |   +-- utils/               # Utilities
|   +-- uploads/                 # Uploaded files
|   +-- .env.example             # Environment sample
|   +-- firebaseKey.json         # Firebase key
|   +-- package.json             # Dependencies
|   +-- server.js                # Server entry
+-- FlavorMindAdmin/             # Admin panel
|   +-- src/                     # Source code
|   |   +-- assets/              # Images
|   |   +-- App.tsx              # Main app
|   |   +-- config.ts            # Configuration
|   |   +-- firebase.ts          # Firebase setup
|   |   +-- index.css            # Styles
|   |   +-- main.tsx             # App entry
|   +-- public/                  # Static files
|   +-- .env.example             # Environment sample
|   +-- package.json             # Dependencies
|   +-- vite.config.ts           # Vite config
|   +-- tsconfig.json            # TypeScript config
+-- flavormind-train_model/      # AI model files
    +-- tinyllama_flavormind_model/            # LoRA model
    +-- tinyllama_flavormind_merged/           # Merged model
    +-- FlavorMind-AIModel-Train-final.csv     # Training CSV
    +-- FlavorMind-AIModel-Train-final.jsonl   # Training JSONL
    +-- FlavorMind-TinyLlama-Train.jsonl       # LLaMA data
    +-- flavormind_faiss_fixed.index           # FAISS index
    +-- flavormind_retrieval_dataset_fixed.csv # Retrieval data
    +-- flavormind-q4_k_m.gguf                 # Quantized model
    +-- tinyllama_flavormind_f16.gguf          # F16 model
    +-- Modelfile                              # Ollama file


5. Full Application Installation
--------------------------------

Follow these steps to install all required parts of the full FlavorMind application.


Step 1: Install Required Software
---------------------------------

Install the following before running the project:

* Node.js 18 or newer
* npm 9 or newer
* Python 3.10 or newer
* Ollama
* Expo Go mobile app, or Android Studio emulator
* Firebase project with Authentication and Firestore enabled

Check installation:

node -v
npm -v
python --version
ollama --version


Step 2: Install Mobile App Dependencies
---------------------------------------

Open a terminal and run:

cd D:\DegreeFinal\FlavorMind
npm install


Step 3: Install Backend API Dependencies
----------------------------------------

Open a terminal and run:

cd D:\DegreeFinal\FlavorMind-Backend
npm install


Step 4: Install Python AI Service Dependencies
----------------------------------------------

Run:

cd D:\DegreeFinal\FlavorMind-Backend
pip install -r ai\requirements.txt


Step 5: Install Admin Panel Dependencies
----------------------------------------

Run:

cd D:\DegreeFinal\FlavorMindAdmin
npm install


6. Environment Setup
--------------------

Create .env files from the example files.


Step 1: Mobile App Environment
------------------------------

Run:

cd D:\DegreeFinal\FlavorMind
copy .env.example .env

Open D:\DegreeFinal\FlavorMind\.env and set:

EXPO_PUBLIC_API_URL=http://<YOUR_LAPTOP_IP>:5000/api/v1
EXPO_PUBLIC_AI_URL=http://<YOUR_LAPTOP_IP>:8000
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_google_expo_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_USE_AUTH_PROXY=true
EXPO_PUBLIC_DOA_API_KEY=your_doa_api_key

Important:
If using a real phone, do not use localhost for EXPO_PUBLIC_API_URL or EXPO_PUBLIC_AI_URL.
Use the laptop Wi-Fi/LAN IP address, for example:

EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api/v1
EXPO_PUBLIC_AI_URL=http://192.168.1.10:8000


Step 2: Backend Environment
---------------------------

Run:

cd D:\DegreeFinal\FlavorMind-Backend
copy .env.example .env

Open D:\DegreeFinal\FlavorMind-Backend\.env and set:

NODE_ENV=development
PORT=5000
API_VERSION=/api/v1
PUBLIC_BASE_URL=http://<YOUR_LAPTOP_IP>:5000
CLIENT_URL=http://localhost:19006,http://localhost:8081,exp://localhost:8081
FIREBASE_API_KEY=your_firebase_web_api_key
AI_PROXY_ENABLED=true
AI_SERVICE_URL=http://127.0.0.1:8000
LLAMA_ENABLED=false
OLLAMA_MODEL=flavormind
OLLAMA_GENERATE_MODEL=flavormind
CROPIX_BASE_URL=your_cropix_base_url
CROPIX_TOKEN=your_cropix_token

Add the Firebase service account file here:

D:\DegreeFinal\FlavorMind-Backend\firebaseKey.json

Keep firebaseKey.json private. Do not upload it publicly.


Step 3: Admin Panel Environment
-------------------------------

Run:

cd D:\DegreeFinal\FlavorMindAdmin
copy .env.example .env

Open D:\DegreeFinal\FlavorMindAdmin\.env and set:

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

The admin login user must have this Firebase custom claim:

{ "admin": true }


7. How To Run The Full Application
----------------------------------

To run the full FlavorMind application, open four separate terminals.


Terminal 1: Run Backend API
---------------------------

cd D:\DegreeFinal\FlavorMind-Backend
npm run dev

Check in browser:

http://localhost:5000/health
http://localhost:5000/api/status


Terminal 2: Create And Run AI Model Service
-------------------------------------------

First create the Ollama model:

cd D:\DegreeFinal\flavormind-train_model
ollama create flavormind -f Modelfile
ollama show flavormind

Then run the Python AI service:

cd D:\DegreeFinal\FlavorMind-Backend
set OLLAMA_MODEL=flavormind
set OLLAMA_GENERATE_MODEL=flavormind
uvicorn ai.app:app --reload --host 0.0.0.0 --port 8000

Check in browser:

http://127.0.0.1:8000/health
http://127.0.0.1:8000/recipes/similar?q=chicken%20curry


Terminal 3: Run Mobile App
--------------------------

cd D:\DegreeFinal\FlavorMind
npx expo start -c

Then choose one option:

* Press a to open Android emulator.
* Scan the QR code using Expo Go on a real phone.

For a real phone:

* Phone and laptop must be on the same Wi-Fi.
* EXPO_PUBLIC_API_URL must use laptop IP.
* EXPO_PUBLIC_AI_URL must use laptop IP.
* Windows Firewall must allow Node, Expo, and Python network access.


Terminal 4: Run Admin Panel
---------------------------

cd D:\DegreeFinal\FlavorMindAdmin
npm run dev

Open the Vite URL shown in the terminal. Usually:

http://localhost:5173


8. Useful Run Commands
----------------------

Mobile app:

cd D:\DegreeFinal\FlavorMind
npm start
npm run android
npm run web
npm run typecheck

Backend API:

cd D:\DegreeFinal\FlavorMind-Backend
npm run dev
npm start
npm test

AI service:

cd D:\DegreeFinal\FlavorMind-Backend
uvicorn ai.app:app --reload --host 0.0.0.0 --port 8000

Admin panel:

cd D:\DegreeFinal\FlavorMindAdmin
npm run dev
npm run typecheck
npm run build


9. Testing
----------

Run the available checks:

Mobile app TypeScript check:

cd D:\DegreeFinal\FlavorMind
npm run typecheck

Backend tests:

cd D:\DegreeFinal\FlavorMind-Backend
npm test

Admin panel checks:

cd D:\DegreeFinal\FlavorMindAdmin
npm run typecheck
npm run build

Python AI syntax check:

cd D:\DegreeFinal\FlavorMind-Backend
python -m py_compile ai\app.py


10. Important Notes
-------------------

* Start the backend before using the mobile app.
* Start the AI service before using memory search or AI recipe generation.
* Start the admin panel only when you need moderation features.
* Use laptop IP address instead of localhost when testing on a real phone.
* Keep .env files and Firebase key files private.
* Do not submit node_modules, .expo, dist, logs, uploads, .env, or firebaseKey.json.


11. Contact / Authors
---------------------

Name: Your Name
Student ID: Your Student ID
Email: Your Email
