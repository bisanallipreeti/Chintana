import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  TrendingUp,
  Share2,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { THOUGHT_CATEGORIES, useAppContext } from "../context/AppContext";
import { formatThoughtTimestamp } from "../lib/thoughts";
import { ListSkeleton } from "../components/Skeleton";

type DateSortOrder = "newest" | "oldest";
type ScoreSortOrder = "highest" | "lowest";
type SortMode = "date" | "score";

const thoughtTypes = ["All", "Constructive", "Destructive", "Neutral"] as const;

export function ThoughtHistory() {
  const navigate = useNavigate();
  const { currentThoughts, deleteThought, isBootstrapping } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateSort, setDateSort] = useState<DateSortOrder>("newest");
  const [scoreSort, setScoreSort] = useState<ScoreSortOrder>("highest");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [showFilters, setShowFilters] = useState(false);

  const filteredThoughts = useMemo(() => {
    return [...currentThoughts]
      .filter((thought) => {
        const matchesSearch = thought.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategories.length === 0 || selectedCategories.includes(thought.category);
        const matchesType =
          selectedTypes.length === 0 || selectedTypes.includes(thought.type);
        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((left, right) => {
        if (sortMode === "score") {
          const scoreDifference =
            scoreSort === "highest" ? right.score - left.score : left.score - right.score;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return +new Date(right.createdAt) - +new Date(left.createdAt);
        }

        return dateSort === "newest"
          ? +new Date(right.createdAt) - +new Date(left.createdAt)
          : +new Date(left.createdAt) - +new Date(right.createdAt);
      });
  }, [currentThoughts, dateSort, scoreSort, searchQuery, selectedCategories, selectedTypes, sortMode]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((previous) =>
      previous.includes(category)
        ? previous.filter((item) => item !== category)
        : [...previous, category],
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((previous) =>
      previous.includes(type)
        ? previous.filter((item) => item !== type)
        : [...previous, type],
    );
  };

  const shareThought = async (thoughtId: string) => {
    const thought = currentThoughts.find((item) => item.id === thoughtId);
    if (!thought) return;

    if (!thought.allowSharing) {
      toast.info("Turn on sharing for this thought before sending it to another app.");
      return;
    }

    const shareText = `${thought.text}\n\nCategory: ${thought.category}\nType: ${thought.type}\nScore: ${thought.score}`;

    if (navigator.share) {
      await navigator.share({ title: "Chintana Thought", text: shareText });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Thought copied to your clipboard.");
  };

  const handleDelete = async (thoughtId: string) => {
    if (window.confirm("Delete this thought?")) {
      await deleteThought(thoughtId);
      toast.success("Thought deleted.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Thought History</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage all your captured thoughts</p>
        </div>

        {isBootstrapping ? (
          <ListSkeleton items={4} />
        ) : (
        <>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search thoughts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFilters((previous) => !previous)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={() => {
                setSortMode("date");
                setDateSort((previous) => (previous === "newest" ? "oldest" : "newest"));
              }}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                sortMode === "date"
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {dateSort === "newest" ? "Newest First" : "Oldest First"}
            </button>
            <button
              onClick={() => {
                setSortMode("score");
                setScoreSort((previous) => (previous === "highest" ? "lowest" : "highest"));
              }}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                sortMode === "score"
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {scoreSort === "highest" ? "Highest Score" : "Lowest Score"}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {THOUGHT_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedCategories.includes(category)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {thoughtTypes.filter((type) => type !== "All").map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedTypes.includes(type)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedTypes([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{filteredThoughts.length}</span> thoughts
          </p>
        </div>

        {filteredThoughts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No thoughts available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentThoughts.length === 0
                ? "You have not created any thoughts yet."
                : "Try adjusting your search or filters."}
            </p>
            {currentThoughts.length === 0 ? (
              <button
                onClick={() => navigate("/app/add-thought")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Create Your First Thought
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategories([]);
                  setSelectedTypes([]);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThoughts.map((thought) => (
              <div
                key={thought.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{thought.score}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => navigate(`/app/analysis/${thought.id}`)}
                        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        {thought.text}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-md">
                          {thought.category}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {thought.type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatThoughtTimestamp(thought.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => shareThought(thought.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button
                          onClick={() => navigate(`/app/add-thought?edit=${thought.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(thought.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                        >
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
        )}
        </>
        )}
      </div>
    </div>
  );
}
