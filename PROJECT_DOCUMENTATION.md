# FlavorMind Project Documentation

Generated: February 11, 2026

## Overview

FlavorMind is a React Native (Expo) mobile app that provides AI-assisted cooking features, local ingredient adaptation, memory-based recipe generation, smart scaling, and community cookbooks. The frontend lives in this repo; backend and AI model logic are accessed via HTTP APIs.

## Tech Stack

- Expo SDK 54 with React Native 0.81.5
- React 19.1
- React Navigation (native stack + bottom tabs)
- Axios for HTTP
- Firebase (Auth, Firestore, Storage) with AsyncStorage persistence
- Expo modules: `expo-location`, `expo-image-picker`, `expo-linear-gradient`
- Icons: `lucide-react-native`

## Environment Configuration

Environment variables are defined via Expo `EXPO_PUBLIC_*` and are expected at runtime.

- `EXPO_PUBLIC_API_URL`
  Base backend API URL. Example in `.env.example`: `http://localhost:5000/api/v1`.
- `EXPO_PUBLIC_AUTH_PROVIDER`
  Auth provider selector. Present in `.env.example`, not referenced in code.
- Firebase settings:
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_DOA_API_KEY`
  Intended for DOA (Department of Agriculture) integrations; direct usage is not implemented in the frontend.

Important: actual values should be in `.env` (not committed). `.env.example` is the template.

## Entry and Navigation Architecture

- `App.tsx` is the entry point and sets up Safe Area and the Root Navigator.
- `RootNavigator.tsx` handles the splash screen and decides between Auth and Main app based on a stored auth token.
- `AuthNavigator.tsx` contains Login, Register, OTP login, and Forgot Password flows.
- `BottomTabNavigator.tsx` defines tabs (Home, Memory, Create, Search, Library) and wraps them in a stack with a common header.

## Integration Layers

### Backend API Integration

- Base URL is hard-coded in two files for dev usage:
  - `src/services/api/client.ts` and `src/services/firebase/authService.ts` use `http://192.168.8.218:5000/api/v1` when `__DEV__` is true.
  - Production URL is a placeholder (`https://your-production-url.com/api/v1`).
- The Axios client attaches `Authorization: Bearer <token>` from AsyncStorage.
- On `401`, the client attempts to refresh the Firebase ID token using Firebase Secure Token API and retries the request.

Key backend endpoints used by the app:

- Auth: `/auth/login`, `/auth/send-otp`, `/auth/verify-otp`, `/auth/forgot-password`, `/auth/me`
- Recipes: `/recipes`, `/recipes/:id`, `/recipes/search`, `/recipes/similar`, `/recipes/local-adapt`, `/recipes/scale-query`, `/recipes/generate`, `/recipes/upload-image`
- Memories: `/memories`, `/memories/:id`
- Seasonal: `/seasonal`
- Cookbook: `/cookbook`, `/cookbooks`, `/my-cookbook`
- Feedback: `/feedback/recipes/:recipeId`, `/feedback/:feedbackId`
- Ingredients: `/ingredients/guides`, `/ingredients/adaptations`

### Firebase Integration

- `firebase.ts` initializes Firebase and exports `auth`, `db`, and `storage`.
- Auth persistence uses `AsyncStorage` for React Native.
- `authService.ts` uses Firebase Email/Password login, then posts the ID token to the backend.
- Tokens and profile data are stored in AsyncStorage:
  - `authToken`, `refreshToken`, `userData`, `rememberMe`, `userEmail`.

### AI/Model Integration (via Backend)

The frontend does not run AI locally. It calls backend endpoints that are expected to be AI-powered:

- Similar dishes: `/recipes/similar`
- Local ingredient adaptation: `/recipes/local-adapt`
- Ingredient-based scaling: `/recipes/scale-query`
- Recipe generation: `/recipes/generate`
- Memory flow: `/memories` with polling for AI processing completion

### External Data (Seasonal / DOA)

- Seasonal items are fetched from `/seasonal` and displayed as "Connected to DOA Sri Lanka".
- `DOA_CONFIG` exists in `src/constants/config.ts`, but there is no direct frontend usage.

### Local Storage

- AsyncStorage is used for auth tokens, profile data, and search history.
- Search history is stored under `search_history` in `SearchRecipeScreen.tsx`.

## Feature Flows (High-Level)

- Auth Flow:
  - Login/Register/OTP screens call Firebase + backend auth endpoints.
  - Tokens stored in AsyncStorage.
  - RootNavigator switches to MainTabs when authenticated.

- Memory-Based Cooking:
  - `MemoryScreen` -> create memory (`/memories`) -> `SimilarDishesScreen` -> `RecipeCustomizationScreen` -> `CookingStepsScreen` -> `DoneScreen` -> `CookingTimerScreen` -> `FeedbackScreen`.

- Local Adaptation:
  - `LocalAdaptationScreen` uses `/recipes/search` and `/recipes/local-adapt` for swaps.
  - Ingredient guides fetched via `/ingredients/guides`.

- Smart Scaling:
  - `SmartScalingScreen` -> `ScaledRecipeResultsScreen` uses `/recipes/scale-query`.

- Seasonal Foods:
  - Home/LocalAdaptation -> `SeasonalFoodScreen` -> suggestions via `/recipes/similar` or `/recipes/generate`.

- Cookbook Creation:
  - `DigitalCookbookScreen` -> `SelectRecipesPageScreen` -> `CookbookCoverSetupScreen` -> `CookbookCreationSummaryScreen` -> `CookbookReferenceScreen`.

- Community:
  - `DigitalCommitteeScreen` -> `RecipeDescriptionScreen` or `CookbookReferenceScreen` -> (cookbook flows).

## Directory and File Breakdown

## Root

- `.env` Local environment values (not versioned).
- `.env.example` Template for environment variables.
- `.expo/` Expo runtime metadata.
- `.git/` Git repository metadata.
- `.gitignore` Git ignore rules.
- `.qodo/` Editor/automation support folder.
- `.vscode/` Editor configuration.
- `App.tsx` App entry point. Wraps `RootNavigator` in `SafeAreaProvider` and sets `StatusBar` color.
- `app.json` Expo app configuration (name, icons, permissions, bundle IDs).
- `cspell.json` Spell checker configuration.
- `package.json` Project dependencies and scripts (`expo start`, platform runs, `setup-assets`).
- `package-lock.json` NPM lockfile.
- `tsconfig.json` TypeScript configuration.
- `TODO.md` Project notes; contains cookbook flow tasks and testing notes.

## src/assets

- `src/assets/icon.png` App icon used across the app.
- `src/assets/splash-icon.png` Splash icon.
- `src/assets/adaptive-icon.png` Android adaptive icon.
- `src/assets/favicon.png` Web favicon.
- `src/assets/icons/bell.png`
- `src/assets/icons/book.png`
- `src/assets/icons/chart.png`
- `src/assets/icons/clock.png`
- `src/assets/icons/community.png`
- `src/assets/icons/home.png`
- `src/assets/icons/leaf.png`
- `src/assets/icons/location.png`
- `src/assets/icons/memory.png`
- `src/assets/icons/microphone.png`
- `src/assets/icons/plus.png`
- `src/assets/icons/ruler.png`
- `src/assets/icons/search.png`
- `src/assets/icons/sparkle.png`
- `src/assets/icons/swap.png`
- `src/assets/icons/user.png`

## src/constants

- `src/constants/config.ts` App config and API defaults (base URLs, DOA config, app name). Note: `API_CONFIG` is not used by the API client.
- `src/constants/theme.ts` Design system: colors, typography, spacing, border radius, shadows, layout.
- `src/constants/index.ts` Barrel exports for theme values.

## src/navigation

- `src/navigation/RootNavigator.tsx` Root stack; handles Splash, auth gating, and all screens.
- `src/navigation/AuthNavigator.tsx` Auth stack (Login, Register, OTPLogin, ForgotPassword).
- `src/navigation/BottomTabNavigator.tsx` Main tab layout; uses `AppStackNavigator` for shared header.
- `src/navigation/AppNavigator.tsx` Empty placeholder file.
- `src/navigation/types.ts` Type definitions for navigation params (partially used; some screens use `any`).

## src/services

### src/services/firebase

- `src/services/firebase/firebase.ts`
  Firebase initialization. Exports `auth`, `db`, `storage`, and `hasFirebaseConfig`.
- `src/services/firebase/authService.ts`
  Firebase Auth + backend integration. Implements:
  - Email registration (`registerWithEmail`)
  - Email login (`loginWithEmail`)
  - OTP send/verify
  - Forgot password
  - Token storage and logout
  - Google/Apple login placeholders

### src/services/api

- `src/services/api/client.ts`
  Axios client with auth token injection and refresh-token retry logic.
- `src/services/api/index.ts`
  Barrel exports for API services and types.
- `src/services/api/recipe.service.ts`
  Recipe CRUD, search, similar recipes (AI), local adaptation (AI), scaling (AI), generate recipe (AI), image upload.
- `src/services/api/memory.service.ts`
  Create/read/delete memory entries.
- `src/services/api/seasonal.service.ts`
  Fetch seasonal foods.
- `src/services/api/ingredient.service.ts`
  Ingredient guides and local adaptation submission.
- `src/services/api/cookbook.service.ts`
  Saved recipes (cookbook) management.
- `src/services/api/cookbooks.service.ts`
  Cookbook CRUD (list/get/create).
- `src/services/api/cookbookDashboard.service.ts`
  Dashboard data for saved/published/draft recipes and cookbooks.
- `src/services/api/feedback.service.ts`
  Submit/update/delete feedback, fetch feedback summaries.
- `src/services/api/user.service.ts`
  Fetch current user profile (`/auth/me`).
- `src/services/api/endpoints.ts` Empty placeholder file.
- `src/services/api/doa.service.ts` Empty placeholder file.

### src/services/storage

- `src/services/storage/asyncStorage.ts` Empty placeholder file.

## src/types

- `src/types/global.d.ts` Empty placeholder file.
- `src/types/navigation.d.ts` Empty placeholder file.

## src/common

### Components

- `src/common/components/index.ts` Barrel exports for Button/Card/Input.
- `src/common/components/Button/button.tsx` Button component with variants, sizes, icons, loading state.
- `src/common/components/Button/index.ts` Barrel export for Button.
- `src/common/components/Button/Button.styles.ts` Empty placeholder file.
- `src/common/components/Card/Card.tsx` Card component with variants and padding.
- `src/common/components/Card/index.ts` Barrel export for Card.
- `src/common/components/Card/Card.styles.ts` Empty placeholder file.
- `src/common/components/Input/Input.tsx` Input with label, error, left/right icons.
- `src/common/components/Input/index.ts` Barrel export for Input.
- `src/common/components/Input/Input.styles.ts` Empty placeholder file.
- `src/common/components/Input/setup-assets.js` Script to generate placeholder assets in its local folder.
- `src/common/components/Icon/Icon.tsx` Empty placeholder file.
- `src/common/components/Icon/index.ts` Empty placeholder file.
- `src/common/components/Header/Header.tsx` Common header with app branding, notifications, and profile icon.

### Utils

- `src/common/utils/index.ts` Barrel export for responsive helpers.
- `src/common/utils/responsive.ts` Responsive scaling utilities and breakpoints.
- `src/common/utils/colors.ts` Empty placeholder file.
- `src/common/utils/spacing.ts` Empty placeholder file.
- `src/common/utils/typography.ts` Empty placeholder file.
- `src/common/utils/dimensions.ts` Empty placeholder file.

### Hooks

- `src/common/hooks/index.ts` Empty placeholder file.
- `src/common/hooks/useResponsive.ts` Empty placeholder file.
- `src/common/hooks/useDebounce.ts` Empty placeholder file.

## src/features

### Auth

- `src/features/auth/screens/SplashScreen.tsx` Animated splash screen used before auth check.
- `src/features/auth/screens/LoginScreen.tsx` Email/password login with remember-me, Google/Apple placeholders.
- `src/features/auth/screens/RegisterScreen.tsx` Registration form using Firebase email/password.
- `src/features/auth/screens/OTPLoginScreen.tsx` Phone OTP login flow via backend.
- `src/features/auth/screens/ForgotPasswordScreen.tsx` Password reset via backend.

### Home

- `src/features/home/screens/HomeScreen.tsx` Main home feed; pulls profile, seasonal foods, and recipes.
- `src/features/home/screens/index.ts` Empty placeholder file.
- `src/features/home/types/home.types.ts` Home UI data types.
- `src/features/home/hooks/useSeasonalData.ts` Empty placeholder file.
- `src/features/home/hooks/useRecommendations.ts` Empty placeholder file.
- `src/features/home/components/Header/Header.tsx` Home-specific header with greeting and location.
- `src/features/home/components/Header/index.ts` Barrel export for header.
- `src/features/home/components/Header/Header.styles.ts` Empty placeholder file.
- `src/features/home/components/MemoryCore/MemoryCore.tsx` "Recreate memory" input card on Home.
- `src/features/home/components/MemoryCore/index.ts` Empty placeholder file.
- `src/features/home/components/MemoryCore/MemoryCore.styles.ts` Empty placeholder file.
- `src/features/home/components/SeasonalScroll/SeasonalScroll.tsx` Horizontal seasonal items list.
- `src/features/home/components/SeasonalScroll/SeasonalItem.tsx` Empty placeholder file.
- `src/features/home/components/SeasonalScroll/SeasonalScroll.styles.ts` Empty placeholder file.
- `src/features/home/components/SeasonalScroll/index.ts` Empty placeholder file.
- `src/features/home/components/FeatureGrid/FeatureGrid.tsx` Quick access tiles (Local Adaptation, Smart Scaling, etc.).
- `src/features/home/components/FeatureGrid/FeatureCard.tsx` Empty placeholder file.
- `src/features/home/components/FeatureGrid/index.ts` Empty placeholder file.
- `src/features/home/components/FeatureGrid/FeatureGrid.styles.ts` Empty placeholder file.
- `src/features/home/components/RecommendationFeed/RecommendationFeed.tsx` Suggested recipe cards.
- `src/features/home/components/RecommendationFeed/RecommendationCard.tsx` Empty placeholder file.
- `src/features/home/components/RecommendationFeed/index.ts` Barrel export for recommendation feed.
- `src/features/home/components/RecommendationFeed/RecommendationFeed.styles.ts` Empty placeholder file.

### Memory

- `src/features/memory/screens/MemoryScreen.tsx` Memory input and recent memory list; calls `/memories`.
- `src/features/memory/screens/SimilarDishesScreen.tsx` Shows AI-suggested dishes; polls memory status.
- `src/features/memory/screens/RecipeCustomizationScreen.tsx` Ingredient selection, scaling, local adaptation.
- `src/features/memory/screens/CookingStepsScreen.tsx` Step-by-step cooking flow.
- `src/features/memory/screens/CookingTimerScreen.tsx` Timer view.
- `src/features/memory/screens/DoneScreen.tsx` Completion screen; allows timer start.
- `src/features/memory/screens/FeedbackScreen.tsx` Collects rating/comments and sends feedback.

### Adaptation

- `src/features/adaptation/screens/LocalAdaptationScreen.tsx` Search for local swaps and seasonal foods.
- `src/features/adaptation/screens/SeasonalFoodScreen.tsx` Seasonal ingredient detail plus recipe suggestions.
- `src/features/adaptation/screens/AddRecipeScreen.tsx` Create recipe and upload image.
- `src/features/adaptation/screens/IngredientGuideScreen.tsx` Ingredient guide from `/ingredients/guides`.
- `src/features/adaptation/screens/AddAdaptationScreen.tsx` Submit local ingredient adaptations.

### Scaling

- `src/features/scaling/screens/SmartScalingScreen.tsx` Ingredient-based scaling entry.
- `src/features/scaling/screens/ScaledRecipeResultsScreen.tsx` Scaled recipe results using `/recipes/scale-query`.

### Search

- `src/features/search/screens/SearchRecipeScreen.tsx` Recipe search, recent history, and local adaptation hints.

### Profile

- `src/features/profile/screens/ProfileSettingsScreen.tsx` User profile settings and logout.
- `src/features/profile/screens/ChangeEmailScreen.tsx` Placeholder for email change.
- `src/features/profile/screens/ChangePasswordScreen.tsx` Placeholder for password change.

### Community

- `src/features/community/screens/DigitalCommitteeScreen.tsx` Community hub with mock data.
- `src/features/community/screens/RecipeDescriptionScreen.tsx` Community recipe detail.
- `src/features/community/screens/CookbookReferenceScreen.tsx` Cookbook details.
- `src/features/community/screens/CookbookIntroductionScreen.tsx` Cookbook intro flow.
- `src/features/community/screens/CookbookRecipePageScreen.tsx` Cookbook recipe pages (mock recipes).
- `src/features/community/screens/CookbookThankYouScreen.tsx` Cookbook completion and rating.
- `src/features/community/screens/index.ts` Barrel exports for community screens.
- `src/features/community/types/community.types.ts` Community data types.
- `src/features/community/index.ts` Contains unresolved merge conflict markers; needs cleanup.

### Cookbook

- `src/features/cookbook/screens/DigitalCookbookScreen.tsx` Cookbook dashboard from `/my-cookbook`.
- `src/features/cookbook/screens/PublishedRecipePageScreen.tsx` Published recipe details plus mock feedback.
- `src/features/cookbook/screens/DraftRecipePageScreen.tsx` Draft recipe actions.
- `src/features/cookbook/screens/SelectRecipesPageScreen.tsx` Select recipes for a cookbook.
- `src/features/cookbook/screens/CookbookCoverSetupScreen.tsx` Cookbook cover and author info.
- `src/features/cookbook/screens/CookbookCreationSummaryScreen.tsx` Preview and publish (mocked).

## Known Gaps / Issues

- `src/features/community/index.ts` contains merge conflict markers (`=======`).
- `src/features/adaptation/screens/SeasonalFoodScreen.tsx` uses `getDifficultyColor` without defining it.
- `src/navigation/AppNavigator.tsx`, `src/services/api/endpoints.ts`, `src/services/api/doa.service.ts`, `src/services/storage/asyncStorage.ts`, and several `*.styles.ts` files are empty placeholders.
- Some navigation targets referenced but not defined, for example `RecipeLibrary` in Local Adaptation and Smart Scaling screens.
- Backend URLs are hard-coded in multiple files instead of using `EXPO_PUBLIC_API_URL` consistently.

## Backend Expectations (Not in Repo)

The frontend expects a backend that:

- Validates Firebase ID tokens at `/auth/login` and returns user data.
- Exposes recipe, memory, cookbook, ingredient guide, feedback, and seasonal endpoints described above.
- Provides AI-generated results for similar dishes, local adaptations, scaling, and recipe generation.

---

End of documentation.
