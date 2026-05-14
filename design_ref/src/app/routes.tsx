import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { AddThought } from "./pages/AddThought";
import { ThoughtAnalysis } from "./pages/ThoughtAnalysis";
import { ThoughtHistory } from "./pages/ThoughtHistory";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
      { path: "forgot-password", Component: ForgotPassword },
    ],
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "add-thought", Component: AddThought },
      { path: "analysis/:id", Component: ThoughtAnalysis },
      { path: "history", Component: ThoughtHistory },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);
