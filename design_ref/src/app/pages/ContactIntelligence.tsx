import { useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Clock,
  BarChart3,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";

type ContactInfluence = "growth" | "catalyst" | "waste" | "neutral";

interface Contact {
  id: number;
  name: string;
  avatar: string;
  influence: ContactInfluence;
  productivityScore: number;
  interactionFrequency: "High" | "Medium" | "Low";
  lastInteraction: string;
  totalInteractions: number;
  averageThoughtScore: number;
  trend: "up" | "down" | "stable";
}

const contacts: Contact[] = [
  {
    id: 1,
    name: "Priya Sharma",
    avatar: "PS",
    influence: "growth",
    productivityScore: 92,
    interactionFrequency: "High",
    lastInteraction: "2 hours ago",
    totalInteractions: 156,
    averageThoughtScore: 85,
    trend: "up",
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    avatar: "RK",
    influence: "catalyst",
    productivityScore: 88,
    interactionFrequency: "Medium",
    lastInteraction: "1 day ago",
    totalInteractions: 89,
    averageThoughtScore: 82,
    trend: "up",
  },
  {
    id: 3,
    name: "Anita Desai",
    avatar: "AD",
    influence: "waste",
    productivityScore: 32,
    interactionFrequency: "High",
    lastInteraction: "3 hours ago",
    totalInteractions: 203,
    averageThoughtScore: 38,
    trend: "down",
  },
  {
    id: 4,
    name: "Vikram Singh",
    avatar: "VS",
    influence: "neutral",
    productivityScore: 65,
    interactionFrequency: "Low",
    lastInteraction: "3 days ago",
    totalInteractions: 34,
    averageThoughtScore: 62,
    trend: "stable",
  },
  {
    id: 5,
    name: "Meera Patel",
    avatar: "MP",
    influence: "growth",
    productivityScore: 90,
    interactionFrequency: "Medium",
    lastInteraction: "5 hours ago",
    totalInteractions: 112,
    averageThoughtScore: 88,
    trend: "up",
  },
  {
    id: 6,
    name: "Arjun Mehta",
    avatar: "AM",
    influence: "waste",
    productivityScore: 28,
    interactionFrequency: "High",
    lastInteraction: "1 hour ago",
    totalInteractions: 178,
    averageThoughtScore: 35,
    trend: "down",
  },
];

const influenceConfig = {
  growth: {
    label: "Growth Contact",
    color: "green",
    icon: TrendingUp,
    description: "Positive influence on productivity",
  },
  catalyst: {
    label: "Business Catalyst",
    color: "blue",
    icon: BarChart3,
    description: "Drives strategic thinking",
  },
  waste: {
    label: "Time-Waste Trigger",
    color: "red",
    icon: AlertTriangle,
    description: "Negative impact on focus",
  },
  neutral: {
    label: "Neutral",
    color: "gray",
    icon: Minus,
    description: "Neutral influence",
  },
};

export function ContactIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInfluence, setFilterInfluence] = useState<ContactInfluence | "all">("all");

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterInfluence === "all" || contact.influence === filterInfluence;
    return matchesSearch && matchesFilter;
  });

  const highDistractionContacts = contacts.filter(
    (c) => c.influence === "waste" && c.interactionFrequency === "High"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Contact Intelligence
          </h1>
          <p className="text-gray-600">
            Understand how your contacts influence your cognitive wellness
          </p>
        </div>

        {/* Warning Banner */}
        {highDistractionContacts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                High Distraction Alert
              </h3>
              <p className="text-sm text-red-800">
                You have {highDistractionContacts.length} high-frequency contacts
                with negative productivity impact. Consider reducing interaction
                frequency.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {contacts.filter((c) => c.influence === "growth").length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Growth Contacts</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {contacts.filter((c) => c.influence === "catalyst").length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Catalysts</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {contacts.filter((c) => c.influence === "waste").length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Time Wasters</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {contacts.length}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Contacts</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterInfluence("all")}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filterInfluence === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {Object.entries(influenceConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilterInfluence(key as ContactInfluence)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    filterInfluence === key
                      ? `bg-${config.color}-600 text-white`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="space-y-3">
          {filteredContacts.map((contact) => {
            const config = influenceConfig[contact.influence];
            const Icon = config.icon;

            return (
              <div
                key={contact.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {contact.avatar}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {contact.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 bg-${config.color}-100 text-${config.color}-700 text-xs font-medium rounded-md`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {contact.lastInteraction}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div
                        className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                          contact.productivityScore >= 70
                            ? "bg-green-100"
                            : contact.productivityScore >= 50
                            ? "bg-yellow-100"
                            : "bg-red-100"
                        }`}
                      >
                        <span
                          className={`text-xl font-bold ${
                            contact.productivityScore >= 70
                              ? "text-green-600"
                              : contact.productivityScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {contact.productivityScore}
                        </span>
                        <span className="text-xs text-gray-500">Score</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Frequency</p>
                        <p className="font-semibold text-gray-900">
                          {contact.interactionFrequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Interactions
                        </p>
                        <p className="font-semibold text-gray-900">
                          {contact.totalInteractions}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Avg Thought Score
                        </p>
                        <p className="font-semibold text-gray-900">
                          {contact.averageThoughtScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trend</p>
                        <div className="flex items-center gap-1">
                          {contact.trend === "up" && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          {contact.trend === "down" && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          {contact.trend === "stable" && (
                            <Minus className="w-4 h-4 text-gray-600" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              contact.trend === "up"
                                ? "text-green-600"
                                : contact.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {contact.trend === "up"
                              ? "Improving"
                              : contact.trend === "down"
                              ? "Declining"
                              : "Stable"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Phone className="w-4 h-4" />
                        Call
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No contacts found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
