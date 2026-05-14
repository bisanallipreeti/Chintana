# Project Overview

## What This Project Is

This project is a full-stack web application for **thought management and mental wellness tracking**.

The main idea is to help users:

- capture personal thoughts
- analyze those thoughts using AI and fallback heuristics
- classify them as constructive, destructive, or neutral
- assign a cognitive score
- track emotional and mental patterns over time
- view trends through a dashboard

The project appears under multiple names in the repository:

- `Chintana`
- `NeuroSync`
- `Thought Management`

These all refer to the same product concept.

## Core Purpose

The app is designed as a combination of:

- a journaling tool
- a thought analysis system
- a lightweight mental wellness insights platform

Instead of just storing text entries, it tries to interpret what the user writes and give structured feedback.

## Main User Flow

The current application flow is:

1. User registers or logs in
2. User writes a thought
3. User selects a category such as `Career`, `Health`, or `Financial`
4. User can attach image or video files
5. The system analyzes the thought
6. The user sees classification, score, energy impact, and a suggestion
7. Saved thoughts appear in history and analytics dashboards
8. The user can update profile and settings

## Main Features Implemented

### Frontend

- Login and forgot password pages
- Protected routes for authenticated users
- Dashboard with charts and summary metrics
- Add and edit thought flow
- Thought analysis detail page
- Thought history with filtering and sorting
- Profile page
- Settings page
- Dark/light theming and responsive layout

### Backend

- JWT-based authentication
- Profile and settings APIs
- Thought create, read, update, and delete APIs
- Dashboard summary API
- File upload endpoint
- OpenAI-backed thought analysis with heuristic fallback
- MongoDB data models for users and thoughts

## Thought Analysis

One of the main parts of the project is the thought analysis service.

The backend analyzes thought text in:

- `backend/src/services/thoughtAnalysisService.js`

It works in two modes:

- If OpenAI is configured, it uses an OpenAI model for analysis
- If OpenAI is unavailable, it falls back to a keyword-based heuristic system

The analysis returns information such as:

- `type`
- `score`
- `classification`
- `energyImpact`
- `suggestion`
- `stressLevel` in some cases

The service also uses profile context to adjust analysis, including things like:

- occupation
- education
- income
- age-related context
- emergency contacts
- location signals

This means the app is trying to be more context-aware than a simple mood tracker.

## Dashboard Purpose

The dashboard turns individual thought entries into higher-level patterns.

It includes metrics like:

- total number of thoughts
- average cognitive score
- weekly cognitive stability
- thought type distribution
- mental load metrics
- category breakdown
- recent thoughts

This gives the user a broader view of their mental patterns over time.

## Project Structure

### Top-Level Folders

- `frontend` - React + Vite client application
- `backend` - Express + MongoDB server application
- `design_ref` - reference UI/design copy

### Important Frontend Files

- `frontend/src/app/routes.tsx`
- `frontend/src/app/context/AppContext.tsx`
- `frontend/src/app/pages/Dashboard.tsx`
- `frontend/src/app/pages/AddThought.tsx`
- `frontend/src/app/pages/ThoughtHistory.tsx`
- `frontend/src/app/pages/ThoughtAnalysis.tsx`

### Important Backend Files

- `backend/src/app.js`
- `backend/src/routes/index.js`
- `backend/src/controllers/thoughtController.js`
- `backend/src/controllers/dashboardController.js`
- `backend/src/models/Thought.js`
- `backend/src/models/User.js`
- `backend/src/services/thoughtAnalysisService.js`

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Radix UI components

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- Multer
- Cloudinary
- OpenAI API

## Honest Assessment of the Current Repo

The repository includes reports describing a very advanced, production-ready platform with features like:

- contact intelligence
- WebSocket updates
- Dockerized deployment
- CI/CD pipelines
- advanced encryption
- aggressive caching
- enterprise-grade monitoring

However, the current codebase is more accurately described as a **working MVP or prototype** with real full-stack functionality.

Some features documented in reports are not fully visible in the current implementation. For example:

- `contacts` are mentioned in API docs and frontend references, but are not wired into the current backend routes
- some enterprise and DevOps claims in the reports are not clearly reflected in the present code

So the practical reality is:

This is a solid full-stack thought management application with AI-assisted analysis and dashboard-based self-reflection, but it is not yet fully aligned with every ambitious claim in the project reports.

## Final Summary

This project is an **AI-assisted thought journaling and cognitive wellness application**.

Users can:

- record thoughts
- analyze them automatically
- track emotional and cognitive patterns
- review history
- view analytics
- manage their profile and settings

In short, the project is about helping users better understand their thoughts through structured reflection, simple analytics, and AI-supported feedback.
