# FlavorMind Final System Overview

FlavorMind is delivered as four linked artefacts:

- `D:\DegreeFinal\FlavorMind`: Expo mobile app for end users
- `D:\DegreeFinal\FlavorMind-Backend`: Node/Express API plus the local AI microservice
- `D:\DegreeFinal\FlavorMindAdmin`: web admin panel for moderation
- `D:\DegreeFinal\flavormind-train_model`: TinyLlama fine-tuning artefacts, GGUF exports, FAISS index, and the Ollama `Modelfile`

## Core delivered features

- Memory-based recipe reconstruction from user prompts
- Local ingredient adaptation and seasonal ingredient discovery
- Dynamic ingredient scaling with cooking-time updates
- Personal digital cookbook creation and submission workflow
- Committee-style moderation for recipes, cookbooks, and local swaps
- Recommendation feed driven by saved recipes, search behavior, and recent activity

## Runtime architecture

1. The mobile app calls the Node backend for recipes, auth validation, cookbook flows, feedback, and ingredient features.
2. The backend calls the local AI service for memory retrieval and recipe generation.
3. The AI service uses FAISS retrieval plus an Ollama-served TinyLlama model.
4. Firebase Auth and Firestore store user identity, moderation state, saved content, and community data.
5. The admin panel connects to Firebase to review and update moderation states.

## Verification commands

### Mobile app

```bash
cd D:\DegreeFinal\FlavorMind
npm run typecheck
npx expo-doctor
```

### Admin app

```bash
cd D:\DegreeFinal\FlavorMindAdmin
npm run typecheck
npm run build
```

### Backend

```bash
cd D:\DegreeFinal\FlavorMind-Backend
npm test
```

### AI service

```bash
cd D:\DegreeFinal\FlavorMind-Backend
python -m py_compile ai\app.py
```

## Final deliverable note

The legacy `FlavorMind-Admin` folder should be treated as prototype history, not as the final admin application.
