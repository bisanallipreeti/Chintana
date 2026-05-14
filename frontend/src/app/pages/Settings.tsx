import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Download,
  Trash2,
  Eye,
  Database,
  Key,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { apiChangePassword, apiDeleteAccount, apiExportThoughtsPdf } from "../lib/api";

type SectionKey = "security" | "privacy" | "data";

function getPasswordRules(password: string) {
  return [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 8,
  ];
}

export function Settings() {
  const navigate = useNavigate();
  const { currentAccount, currentThoughts, logout, updateSettings, deleteAllThoughts } = useAppContext();
  const settings = currentAccount?.settings;
  const [openSection, setOpenSection] = useState<SectionKey | null>("security");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeletingThoughts, setIsDeletingThoughts] = useState(false);

  if (!currentAccount || !settings) return null;

  const toggleSection = (section: SectionKey) => {
    setOpenSection((previous) => (previous === section ? null : section));
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const pdfBlob = await apiExportThoughtsPdf();
      const url = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `chintana-thoughts-${Date.now()}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Your thoughts PDF export is ready.");
    } catch (error) {
      toast.error((error as Error).message || "Could not export PDF right now.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordForm.oldPassword.trim()) {
      toast.error("Enter your old password.");
      return;
    }

    if (!getPasswordRules(passwordForm.newPassword).every(Boolean)) {
      toast.error("New password must meet all security requirements.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiChangePassword({
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmNewPassword,
      });

      toast.success(response.message || "Password changed successfully.");
      await logout();
      navigate("/");
    } catch (error) {
      toast.error((error as Error).message || "Could not change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await apiDeleteAccount();
      await logout();
      toast.success(response.message || "Your account has been deleted.");
      navigate("/");
    } catch (error) {
      toast.error((error as Error).message || "Could not delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings & Privacy</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account security and preferences</p>
        </div>

        <SettingsSection
          title="Security"
          description="Manage your account security settings"
          icon={<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          iconClass="bg-blue-100 dark:bg-blue-950"
          open={openSection === "security"}
          onToggle={() => toggleSection("security")}
        >
          <SettingsRow
            icon={<Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            title="Change Password"
            description="Update your password securely"
            action={
              <button
                onClick={() => setShowPasswordForm((previous) => !previous)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                {showPasswordForm ? "Close" : "Change"}
              </button>
            }
          />
          {showPasswordForm && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Old Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({ ...previous, oldPassword: event.target.value }))
                    }
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter old password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({
                        ...previous,
                        confirmNewPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="Privacy"
          description="Control your privacy preferences"
          icon={<Eye className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          iconClass="bg-violet-100 dark:bg-violet-950"
          open={openSection === "privacy"}
          onToggle={() => toggleSection("privacy")}
        >
          <SettingsRow
            icon={<Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            title="Auto-delete Low-value Thoughts"
            description="Automatically remove thoughts with a score below 30"
            action={
              <Toggle
                enabled={settings.autoDelete}
                onToggle={() => updateSettings({ autoDelete: !settings.autoDelete })}
              />
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Data Management"
          description="Export or remove your account data"
          icon={<Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          iconClass="bg-indigo-100 dark:bg-indigo-950"
          open={openSection === "data"}
          onToggle={() => toggleSection("data")}
        >
          <SettingsRow
            icon={<Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            title="Export Data"
            description="Download all your thoughts as PDF"
            action={
              <button
                onClick={exportData}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? "Exporting..." : "Export"}
              </button>
            }
          />
          <SettingsRow
            icon={<Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
            title="Delete All Thoughts"
            description="Permanently removes all thoughts from this account"
            action={
              <button
                onClick={async () => {
                  if (currentThoughts.length === 0) {
                    toast.info("There are no thoughts to remove.");
                    return;
                  }
                  if (!window.confirm("Delete all thoughts for this account? This action cannot be undone.")) {
                    return;
                  }

                  setIsDeletingThoughts(true);
                  try {
                    const deletedCount = await deleteAllThoughts();
                    toast.success(
                      deletedCount > 0
                        ? `Deleted ${deletedCount} thought${deletedCount === 1 ? "" : "s"}.`
                        : "All thoughts deleted.",
                    );
                  } catch (error) {
                    toast.error((error as Error).message || "Could not delete all thoughts.");
                  } finally {
                    setIsDeletingThoughts(false);
                  }
                }}
                disabled={isDeletingThoughts}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingThoughts ? "Deleting..." : "Delete"}
              </button>
            }
          />
          <SettingsRow
            icon={<Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
            title="Delete Account"
            description="Permanently delete your account and associated data"
            action={
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingAccount ? "Deleting..." : "Delete"}
              </button>
            }
          />
        </SettingsSection>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{currentAccount.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Account Created</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                }).format(new Date(currentAccount.createdAt))}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Total Thoughts</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{currentThoughts.length}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-medium hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  icon,
  iconClass,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <button onClick={onToggle} className="w-full p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${iconClass} rounded-lg flex items-center justify-center`}>{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
      </button>
      {open && <div className="divide-y divide-gray-100 dark:divide-gray-700">{children}</div>}
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="p-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">{icon}</div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
