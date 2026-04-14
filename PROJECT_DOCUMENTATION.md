# FlavorMind Workspace Documentation

Last updated: March 10, 2026

This document explains what the app does, the full screen flow, how the frontend talks to backend/Firebase, and what the AI-powered parts do (as seen from this repo).

## What The App Does (User View)

FlavorMind is an Expo/React Native cooking app with these core journeys:

- Memory-based cooking: describe a food memory, get suggested dishes, pick one, customize, cook step-by-step, run a timer, then leave feedback.
- Local adaptation: search an ingredient/dish and get local substitutes plus an ingredient guide; browse seasonal ingredients and suggested recipes.
- Smart scaling: describe what ingredient amount you have and get scaled recipe suggestions.
- Search: search recipes; show “adaptations” returned by backend; keep local search history.
- Digital cookbook: show published/draft recipes and saved items; create recipes (Firestore) and submit them for approval.

## Repo Layout

- `App.tsx`: app entry; mounts `RootNavigator`.
- `src/navigation/*`: navigation setup (Splash/Auth/Main Tabs + stacks).
- `src/features/*`: UI screens and feature components.
- `src/services/api/*`: HTTP client + API service wrappers.
- `src/services/firebase/*`: Firebase init + Firestore stores used by some features.
- `scripts/firebase/*`: admin scripts to seed Firestore / set admin claim.

## Tech Stack

- Expo SDK 54, React Native 0.81.5, React 19.1
- React Navigation: native stack + bottom tabs
- HTTP: Axios (`src/services/api/client.ts`)
- Firebase: Auth + Firestore + Storage (`src/services/firebase/firebase.ts`)
- Storage: AsyncStorage
- Expo modules used: location, image picker, linear gradient
- Icons: `lucide-react-native`

## Configuration (Env Vars)

Environment variables must be exposed to Expo using the `EXPO_PUBLIC_*` prefix.

- Backend
  - `EXPO_PUBLIC_API_URL`: backend base URL (example in `.env.example`: `http://localhost:5000/api/v1`)
  - `EXPO_PUBLIC_AI_URL` (optional): separate AI service base URL for FAISS retrieval + recipe generation (example: `http://localhost:8000` or an `https://*.ngrok-free.app` root URL). This is used by `/recipes/similar` and `/recipes/generate` so your retrieval/generation service can be deployed independently.
    - If you can only expose one public URL (e.g., one ngrok tunnel), set `EXPO_PUBLIC_AI_URL` to the same value as `EXPO_PUBLIC_API_URL`.
    - Keep local adaptation (`/recipes/local-adapt`) and smart scaling (`/recipes/scale-query`) on the main API unless your AI service also exposes those routes.
- Firebase (enables Firebase features only when all are set)
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
- OAuth (wired in `src/services/firebase/authService.ts`; values expected in env)
  - `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`
  - `EXPO_PUBLIC_USE_AUTH_PROXY`
- DOA
  - `EXPO_PUBLIC_DOA_API_KEY` (there is `DOA_CONFIG`, but the API wrapper file is currently empty)

Runtime config source:

- `src/constants/config.ts`: `API_CONFIG.BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.flavormind.com'`
- `src/constants/config.ts`: `AI_CONFIG.BASE_URL = process.env.EXPO_PUBLIC_AI_URL || API_CONFIG.BASE_URL`

## Navigation Architecture (How Screens Connect)

Entry:

- `App.tsx` -> `src/navigation/RootNavigator.tsx`

Root navigator behavior (`src/navigation/RootNavigator.tsx`):

- Shows `SplashScreen` until it calls `onFinish`.
- Checks auth using `isAuthenticated()` (AsyncStorage `authToken` existence).
- Subscribes to auth changes using `subscribeToAuthChanges` from `src/services/firebase/authService.ts`.
- If authenticated: shows `MainTabs` plus a set of stack screens.
- If not: shows `AuthNavigator`.

Tabs + app stack (`src/navigation/BottomTabNavigator.tsx`):

- Bottom tabs: `HomeTab`, `MemoryTab`, `CreateTab`, `SearchTab`, `LibraryTab`.
- Each tab renders the same `AppStackNavigator` with a different `initialRouteName`.
- `AppStackNavigator` uses a custom `Header` for most stack screens, but hides the header on `Home`.
- Many screens are registered both in `RootNavigator` and inside `AppStackNavigator` (duplication). In practice, most navigation originates from the tab stack.

Auth stack (`src/navigation/AuthNavigator.tsx`):

- `Login`, `Register`, `ForgotPassword`.
- Note: `src/features/auth/screens/OTPLoginScreen.tsx` exists but is not currently wired into `AuthNavigator`.

## Frontend Integrations

### HTTP API Client

Files:

- `src/services/api/client.ts`: axios instance used by `src/services/api/*.service.ts`.

Behavior:

- Adds `Authorization: Bearer <token>` from AsyncStorage key `authToken`.
- On 401 (or backend message containing “invalid token format”): tries to refresh token using Firebase Secure Token API (`securetoken.googleapis.com`) with AsyncStorage key `refreshToken`, then retries once.
- Logs `[req] ...` and `[res] ...` in development mode.

### Firebase

Init:

- `src/services/firebase/firebase.ts` initializes Firebase only when all `EXPO_PUBLIC_FIREBASE_*` values exist.
- If config is missing, Firebase-dependent features degrade (stores throw if called without config).

Auth + backend handoff:

- `src/services/firebase/authService.ts` performs Firebase login (email/password, Google, Apple).
- After Firebase login, it calls backend `POST /auth/login` with `{ idToken }`.
- It stores:
  - `authToken` = Firebase ID token (used for API bearer auth)
  - `refreshToken` = Firebase refresh token (used for API client refresh path)
  - `userData` = mapped user profile JSON
  - `rememberMe` + `userEmail` when enabled

Firestore stores used by the app:

- `src/services/firebase/recipeStore.ts`: create recipes; list user/approved recipes; save recipes to library; increment views.
- `src/services/firebase/cookbookStore.ts`: create cookbooks; list user cookbooks; save cookbooks to library.
- `src/services/firebase/feedbackStore.ts`: submit feedback and update recipe rating/count transactionally.

Firestore collection shapes (as used by the stores):

- `recipes/{recipeId}`
- `recipes/{recipeId}/feedback/{userId}`
- `users/{userId}/savedRecipes/{savedId}`
- `users/{userId}/savedCookbooks/{savedId}`
- `users/{userId}/feedback/{recipeId}`
- `cookbooks/{cookbookId}`

### Local Storage (AsyncStorage)

Keys used by the app:

- `authToken`, `refreshToken`, `userData`, `rememberMe`, `userEmail` (auth)
- `search_history` (search screen history)

## Backend API Contracts (As Used By Frontend)

These endpoints are called by the frontend services (backend implementation is not in this repo).

- Auth
  - `POST /auth/login` (Firebase ID token -> backend user/session mapping)
  - `POST /auth/send-otp`
  - `POST /auth/verify-otp`
  - `POST /auth/forgot-password`
  - `GET /auth/me` (profile)
- Recipes
  - `GET /recipes`
  - `GET /recipes/:id`
  - `POST /recipes` (create)
  - `PUT /recipes/:id` (update)
  - `DELETE /recipes/:id` (delete)
  - `POST /recipes/:id/scale` (scale servings)
  - `GET /recipes/search?q=...` (search; may return `intent` and `adaptations`)
  - `GET /recipes/similar` (AI-assisted; supports `q` or `ingredient`)
  - `GET /recipes/local-adapt` (AI-assisted; supports `dishName` and `ingredients`)
  - `POST /recipes/scale-query` (AI-assisted; parses ingredient quantity text and returns `scale` + recipe suggestions)
  - `GET /recipes/generate?dish=...` (AI-assisted recipe generation)
  - `POST /recipes/upload-image` (multipart form upload; used by Add Recipe/Adaptation)
- Memories
  - `(Optional) POST /memories` (persist a memory; backend may do AI processing asynchronously)
  - `GET /memories` (list)
  - `GET /memories/:id` (poll for status/similar dishes)
  - `DELETE /memories/:id`
- Ingredients
  - `GET /ingredients/guides` (lookup by `name`/`slug`/`q`)
  - `POST /ingredients/adaptations` (submit new adaptation + optional guide)
- Seasonal
  - `GET /seasonal`
- Feedback
  - `POST /feedback/recipes/:recipeId`
  - `GET /feedback/recipes/:recipeId`
  - `PUT /feedback/:feedbackId`
  - `DELETE /feedback/:feedbackId`
- Cookbook (API-backed cookbook, separate from Firestore “digital cookbook” storage)
  - `GET /cookbook`, `POST /cookbook/:recipeId`, `DELETE /cookbook/:recipeId`, `PUT /cookbook/organize`
  - `GET /cookbooks`, `GET /cookbooks/:id`, `POST /cookbooks`
  - `GET /my-cookbook` (dashboard aggregate)

## “AI” In This App (What The Frontend Actually Does)

The app does not run ML models locally. It calls backend endpoints that are expected to be AI-powered.

- Similar dishes: `GET /recipes/similar` via `recipeService.getSimilarRecipes` using the AI service base URL when configured.
- Local substitutes:
  - Search/local adaptation screens receive `adaptations` from `GET /recipes/search`.
  - Recipe customization can fetch substitute suggestions using `GET /recipes/local-adapt`.
- Smart scaling: `POST /recipes/scale-query` via `recipeService.scaleByIngredientQuery` through the main backend, which can call a local Ollama model.
- Recipe generation fallback: `GET /recipes/generate` via `recipeService.generateRecipeByDish` using the AI service base URL when configured.
- Memory processing:
  - Entry points fetch candidates via `GET /recipes/similar` and pass them to `SimilarDishesScreen`.
  - `SimilarDishesScreen` still supports polling `GET /memories/:id` if a `memoryId` is provided by a backend that persists memories.

Special case in `src/features/memory/screens/RecipeCustomizationScreen.tsx`:

- If `dishId` looks AI-generated (starts with `ai:` or contains spaces/`%20`), the screen assumes it is not a real DB id and calls `GET /recipes/generate` to create a recipe on the fly.

## Screen Catalog (What Each Screen Does)

This is the full set of `*Screen.tsx` screens in `src/features`.

Auth:

- `src/features/auth/screens/SplashScreen.tsx`: startup splash; calls `onFinish` to allow navigation.
- `src/features/auth/screens/LoginScreen.tsx`: email/password + social login via `authService.ts`.
- `src/features/auth/screens/RegisterScreen.tsx`: creates Firebase user, sends verification, then completes backend login.
- `src/features/auth/screens/ForgotPasswordScreen.tsx`: calls backend `POST /auth/forgot-password`.
- `src/features/auth/screens/OTPLoginScreen.tsx`: exists but is not registered in `AuthNavigator`.

Home:

- `src/features/home/screens/HomeScreen.tsx`: loads profile (`GET /auth/me`), seasonal (`GET /seasonal`), recipes (`GET /recipes`); memory search uses `GET /recipes/similar` via `MemoryCore`.

Memory-based cooking flow:

- `src/features/memory/screens/MemoryScreen.tsx`: memory search uses `GET /recipes/similar`, lists history (`GET /memories`), opens recipe customization from history.
- `src/features/memory/screens/SimilarDishesScreen.tsx`: show dish suggestions; polls memory (`GET /memories/:id`) and falls back to `GET /recipes/similar`.
- `src/features/memory/screens/RecipeCustomizationScreen.tsx`: load recipe (`GET /recipes/:id`) or generate (`GET /recipes/generate`), scale (`POST /recipes/:id/scale`), local adapt (`GET /recipes/local-adapt`), start cooking.
- `src/features/memory/screens/CookingStepsScreen.tsx`: checklist steps; uses passed instructions or mock.
- `src/features/memory/screens/DoneScreen.tsx`: completion; can start timer or reset to `MainTabs`.
- `src/features/memory/screens/CookingTimerScreen.tsx`: countdown timer; on finish routes to feedback.
- `src/features/memory/screens/FeedbackScreen.tsx`: submits feedback to Firestore first (if available) else to API; resets to `MainTabs`.

Adaptation:

- `src/features/adaptation/screens/LocalAdaptationScreen.tsx`: seasonal list (`GET /seasonal`) + search (`GET /recipes/search`); shows `adaptations` and suggested recipes; opens `IngredientGuide` or `RecipeCustomization`.
- `src/features/adaptation/screens/SeasonalFoodScreen.tsx`: suggests recipes via `GET /recipes/similar` then fallback `GET /recipes/generate`; opens `RecipeCustomization` with `autoAdapt: true`.
- `src/features/adaptation/screens/IngredientGuideScreen.tsx`: loads guide (`GET /ingredients/guides`); can open `RecipeCustomization` from the guide.
- `src/features/adaptation/screens/AddAdaptationScreen.tsx`: uploads image (`POST /recipes/upload-image`) and submits adaptation (`POST /ingredients/adaptations`).
- `src/features/adaptation/screens/AddRecipeScreen.tsx`: uploads image (`POST /recipes/upload-image`) and creates a Firestore recipe (`recipeStore.createRecipe`) with draft/pending status.

Scaling:

- `src/features/scaling/screens/SmartScalingScreen.tsx`: collects scaling query and navigates to results; links to `AddRecipe`.
- `src/features/scaling/screens/ScaledRecipeResultsScreen.tsx`: calls `POST /recipes/scale-query` and shows suggested recipes; selecting opens `RecipeCustomization`.
- `src/features/scaling/screens/SmartScalingSearchResultsScreen.tsx`: registered; see file for behavior.

Search:

- `src/features/search/screens/SearchRecipeScreen.tsx`: calls `GET /recipes/search`; if intent is ingredient and recipes are empty, falls back to `GET /recipes/similar`; stores search history to AsyncStorage `search_history`.

Profile:

- `src/features/profile/screens/ProfileSettingsScreen.tsx`: profile + logout (`authService.logout()`).
- `src/features/profile/screens/ChangeEmailScreen.tsx`: placeholder.
- `src/features/profile/screens/ChangePasswordScreen.tsx`: placeholder.

Cookbook (Firestore-backed “Digital Cookbook”):

- `src/features/cookbook/screens/DigitalCookbookScreen.tsx`: reads Firestore recipes/cookbooks and saved items; depends on Firebase.
- `src/features/cookbook/screens/PublishedRecipePageScreen.tsx`: recipe detail UI (depends on navigation payload).
- `src/features/cookbook/screens/DraftRecipePageScreen.tsx`: draft recipe UI.
- `src/features/cookbook/screens/SelectRecipesPageScreen.tsx`: select recipes for a cookbook.
- `src/features/cookbook/screens/CookbookCoverSetupScreen.tsx`: cover + author fields.
- `src/features/cookbook/screens/CookbookCreationSummaryScreen.tsx`: summary/publish UI.

Community:

- `src/features/community/screens/DigitalCommitteeScreen.tsx`: community hub (mostly mock/static).
- `src/features/community/screens/RecipeDescriptionScreen.tsx`: recipe detail view for community items.
- `src/features/community/screens/CookbookReferenceScreen.tsx`: cookbook reference/detail.
- `src/features/community/screens/CookbookIntroductionScreen.tsx`: cookbook intro.
- `src/features/community/screens/CookbookRecipePageScreen.tsx`: cookbook recipe pages.
- `src/features/community/screens/CookbookThankYouScreen.tsx`: completion + rating UI.

## End-to-End Flows (Screen-by-Screen)

### 1) App Startup

- `App.tsx` mounts `RootNavigator`.
- `SplashScreen` shows first; when finished, `RootNavigator` checks AsyncStorage `authToken`.
- If authenticated: go to `MainTabs`.
- If not: go to `AuthNavigator` (`Login`).

### 2) Memory-Based Cooking Flow

Start (two entry points):

- Home: `HomeScreen` memory card -> `GET /recipes/similar` -> `SimilarDishesScreen`
- Recall tab: `MemoryScreen` -> `GET /recipes/similar` -> `SimilarDishesScreen`

Then:

- `SimilarDishesScreen`
  - If `memoryId` exists: polls `GET /memories/:id` while `status === 'processing'`
  - Else: calls `GET /recipes/similar?q=<memoryQuery>`
  - Selecting a dish navigates to `RecipeCustomization`
- `RecipeCustomizationScreen`
  - Loads recipe by `dishId` (`GET /recipes/:id`) or generates (`GET /recipes/generate`) when id looks AI-generated
  - Optional auto-adapt: calls `GET /recipes/local-adapt` for all ingredients and pre-fills local alternatives
  - Scaling: calls `POST /recipes/:id/scale` when a `dishId` is provided
  - “Local alternative” per ingredient may call `GET /recipes/local-adapt` for that ingredient
  - Done -> `CookingSteps`
- `CookingStepsScreen` -> `DoneScreen` -> `CookingTimerScreen` -> `FeedbackScreen`
- `FeedbackScreen` submits feedback (Firestore preferred; API fallback) then resets to `MainTabs`

### 3) Local Adaptation Flow

- `LocalAdaptationScreen` loads seasonal list (`GET /seasonal`) and accepts a search term.
- On search:
  - Calls `GET /recipes/search?q=...`
  - If intent is `dish` and recipes exist: opens `RecipeCustomization` directly for the first recipe
  - If intent is `ingredient`: displays backend `adaptations` and suggested recipes (fallback: `GET /recipes/similar?ingredient=...`)
- Tapping an adaptation opens `IngredientGuideScreen` (`GET /ingredients/guides`)
- Seasonal item opens `SeasonalFoodScreen`

### 4) Seasonal Ingredient Flow

- `SeasonalFoodScreen` calls `GET /recipes/similar?ingredient=<foodName>` and falls back to `GET /recipes/generate?dish=<foodName>`.
- Selecting a suggestion opens `RecipeCustomization` with `autoAdapt: true` (which triggers automatic `GET /recipes/local-adapt` on ingredient list).

### 5) Smart Scaling Flow

- `SmartScalingScreen` -> `ScaledRecipeResultsScreen` with `scalingQuery`.
- `ScaledRecipeResultsScreen` calls `POST /recipes/scale-query` with `{ query, includeRecipes: true }`.
- Selecting a result opens `RecipeCustomization`.

### 6) Search Flow

- `SearchRecipeScreen` calls `GET /recipes/search?q=...`.
- If backend says intent `ingredient` and recipes are empty: fallback `GET /recipes/similar?ingredient=...`.
- Stores the query into AsyncStorage key `search_history`.

### 7) Digital Cookbook Flow (Firestore)

- `DigitalCookbookScreen` reads:
  - Firestore recipes filtered by `ownerId` and by `publishStatus` (approved/pending/draft)
  - Saved recipes from `users/{uid}/savedRecipes`
  - Cookbooks from `cookbooks` and `users/{uid}/savedCookbooks`
- Add Recipe: `AddRecipeScreen` creates a Firestore recipe with `publishStatus` draft or pending.

## Dev/Support Scripts

These scripts are used for Firestore seeding/admin tasks (run from repo root):

- `scripts/firebase/add-pending-recipe.js`: writes a sample recipe with `publishStatus: 'pending'` to Firestore.
- `scripts/firebase/set-admin-claim.js`: sets Firebase Auth custom claim `{ admin: true|false }` for a user.

Both require a Firebase service account JSON and use `firebase-admin`:

- Provide `--key <path>` or set `GOOGLE_APPLICATION_CREDENTIALS`.

## Known Gaps / Issues In Current Workspace

- Navigation targets referenced but not registered: `RecipeLibrary` is navigated to from `SmartScalingScreen` and `LocalAdaptationScreen`.
- `src/services/api/endpoints.ts`, `src/services/api/doa.service.ts`, `src/services/storage/asyncStorage.ts` are empty placeholders.
- `HomeScreen.tsx` “recommended recipe press” currently shows an alert instead of navigating to a recipe detail screen.
- `BottomTabNavigator.tsx` `CreateTab` currently renders a placeholder “Create Recipe Screen”.

---

End of documentation.
