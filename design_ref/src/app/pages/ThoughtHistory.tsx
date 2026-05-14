import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Tag,
  TrendingUp,
  Share2,
  Edit,
  Trash2,
} from "lucide-react";

const allThoughts = [
  {
    id: 1,
    title: "New business strategy for Q2 expansion",
    category: "Business",
    type: "Strategic Idea",
    score: 92,
    date: "2024-02-21",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    title: "Worried about project deadline approaching",
    category: "Emotional",
    type: "Emotional Reaction",
    score: 35,
    date: "2024-02-21",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    title: "Ideas for improving team collaboration",
    category: "IT",
    type: "Constructive",
    score: 88,
    date: "2024-02-20",
    timestamp: "1 day ago",
  },
  {
    id: 4,
    title: "Movie concept about AI and humanity",
    category: "Creative",
    type: "Raw Idea",
    score: 76,
    date: "2024-02-20",
    timestamp: "1 day ago",
  },
  {
    id: 5,
    title: "Financial planning for next quarter",
    category: "Financial",
    type: "Strategic Idea",
    score: 85,
    date: "2024-02-19",
    timestamp: "2 days ago",
  },
  {
    id: 6,
    title: "Feeling anxious about presentation",
    category: "Emotional",
    type: "Emotional Reaction",
    score: 42,
    date: "2024-02-19",
    timestamp: "2 days ago",
  },
  {
    id: 7,
    title: "Health and fitness goals for 2024",
    category: "Health",
    type: "Constructive",
    score: 81,
    date: "2024-02-18",
    timestamp: "3 days ago",
  },
  {
    id: 8,
    title: "Career growth opportunities analysis",
    category: "Career",
    type: "Strategic Idea",
    score: 90,
    date: "2024-02-18",
    timestamp: "3 days ago",
  },
];

const categories = ["All", "Business", "IT", "Emotional", "Creative", "Financial", "Health", "Career", "Others"];
const thoughtTypes = ["All", "Constructive", "Destructive", "Strategic Idea", "Raw Idea", "Emotional Reaction"];

export function ThoughtHistory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort thoughts
  let filteredThoughts = allThoughts.filter((thought) => {
    const matchesSearch = thought.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || thought.category === selectedCategory;
    const matchesType = selectedType === "All" || thought.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  if (sortBy === "score") {
    filteredThoughts = [...filteredThoughts].sort((a, b) => b.score - a.score);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Thought History
          </h1>
          <p className="text-gray-600">
            View and manage all your captured thoughts
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search thoughts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={() => setSortBy(sortBy === "date" ? "score" : "date")}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <ArrowUpDown className="w-5 h-5" />
              <span className="hidden sm:inline">
                {sortBy === "date" ? "Date" : "Score"}
              </span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Category Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {thoughtTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedType === type
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredThoughts.length}</span> thoughts
          </p>
        </div>

        {/* Thoughts List */}
        <div className="space-y-3">
          {filteredThoughts.map((thought) => (
            <div
              key={thought.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="p-4 lg:p-6">
                <div className="flex items-start gap-4">
                  {/* Score Circle */}
                  <div
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      thought.score >= 70
                        ? "bg-green-100"
                        : thought.score >= 50
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    <span
                      className={`text-2xl font-bold ${
                        thought.score >= 70
                          ? "text-green-600"
                          : thought.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {thought.score}
                    </span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      onClick={() => navigate(`/app/analysis/${thought.id}`)}
                      className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
                    >
                      {thought.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                        {thought.category}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                          thought.score >= 70
                            ? "bg-green-100 text-green-700"
                            : thought.score >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {thought.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {thought.timestamp}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredThoughts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No thoughts found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedType("All");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}