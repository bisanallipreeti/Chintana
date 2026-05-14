import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { useAppContext } from "./context/AppContext";
import { Brain } from "lucide-react";

const DashboardPage = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const AddThoughtPage = lazy(() =>
  import("./pages/AddThought").then((module) => ({ default: module.AddThought })),
);
const ThoughtAnalysisPage = lazy(() =>
  import("./pages/ThoughtAnalysis").then((module) => ({ default: module.ThoughtAnalysis })),
);
const ThoughtHistoryPage = lazy(() =>
  import("./pages/ThoughtHistory").then((module) => ({ default: module.ThoughtHistory })),
);
const ProfilePage = lazy(() =>
  import("./pages/Profile").then((module) => ({ default: module.Profile })),
);
const SettingsPage = lazy(() =>
  import("./pages/Settings").then((module) => ({ default: module.Settings })),
);

function RouteLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl items-center justify-center mb-3 shadow-lg shadow-blue-500/30 animate-pulse">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function withSuspense(Component: ComponentType) {
  return function SuspendedRouteComponent() {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component />
      </Suspense>
    );
  };
}

function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAppContext();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30 animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Chintana...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
    ],
  },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [
      {
        Component: MainLayout,
        children: [
          { path: "dashboard", Component: withSuspense(DashboardPage) },
          { path: "add-thought", Component: withSuspense(AddThoughtPage) },
          { path: "analysis/:id", Component: withSuspense(ThoughtAnalysisPage) },
          { path: "history", Component: withSuspense(ThoughtHistoryPage) },
          { path: "profile", Component: withSuspense(ProfilePage) },
          { path: "settings", Component: withSuspense(SettingsPage) },
        ],
      },
    ],
  },
]);
