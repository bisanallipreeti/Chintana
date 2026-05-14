import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Lock,
  Shield,
  Download,
  Trash2,
  Bell,
  Eye,
  Database,
  Key,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const navigate = useNavigate();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleChangePassword = () => {
    toast.success("Password change initiated");
  };

  const handleExportData = () => {
    toast.success("Data export started. You'll receive an email shortly.");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.success("Account deletion initiated");
      setTimeout(() => navigate("/"), 2000);
    }
  };

  const handleLogout = () => {
    toast.success("Logging out...");
    setTimeout(() => navigate("/"), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Settings & Privacy
          </h1>
          <p className="text-gray-600">
            Manage your account security and preferences
          </p>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Security
                </h2>
                <p className="text-sm text-gray-600">
                  Manage your account security settings
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Change Password */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">
                    Update your account password
                  </p>
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Change
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-600">
                    {is2FAEnabled ? "Enabled" : "Disabled"} • Extra layer of
                    security
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIs2FAEnabled(!is2FAEnabled);
                  toast.success(
                    `2FA ${!is2FAEnabled ? "enabled" : "disabled"}`
                  );
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  is2FAEnabled ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    is2FAEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Data Encryption Status */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Data Encryption</p>
                  <p className="text-sm text-gray-600">
                    AES-256 encryption active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
                <p className="text-sm text-gray-600">
                  Control your data and privacy
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Auto-delete Low-value Thoughts */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Auto-delete Low-value Thoughts
                  </p>
                  <p className="text-sm text-gray-600">
                    Automatically remove thoughts with score below 30
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAutoDelete(!autoDelete);
                  toast.success(
                    `Auto-delete ${!autoDelete ? "enabled" : "disabled"}`
                  );
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  autoDelete ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    autoDelete ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notifications</p>
                  <p className="text-sm text-gray-600">
                    Receive insights and reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications(!notifications);
                  toast.success(
                    `Notifications ${!notifications ? "enabled" : "disabled"}`
                  );
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  notifications ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Data Management
                </h2>
                <p className="text-sm text-gray-600">
                  Export or delete your data
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Export Data */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Export Data</p>
                  <p className="text-sm text-gray-600">
                    Download all your thoughts and analysis
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Export
              </button>
            </div>

            {/* Delete Account */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">name@example.com</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Account Created</span>
              <span className="font-medium text-gray-900">January 15, 2024</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total Thoughts</span>
              <span className="font-medium text-gray-900">342</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Storage Used</span>
              <span className="font-medium text-gray-900">24.5 MB / 1 GB</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-medium hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800 text-center">
            <strong>Privacy First:</strong> All your data is encrypted end-to-end.
            We never access, share, or sell your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}
