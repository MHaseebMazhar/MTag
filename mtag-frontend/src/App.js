import React, { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  ThumbsUp,
  Send,
  RefreshCw,
  Activity,
  Bike,
  Car,
  Phone,
  Award,
  Download,
  Info,
  Moon,
  Sun,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  CreditCard,
  FileText,
  HelpCircle,
  Star,
  Search,
  Filter,
  X,
  Navigation,
  Calendar,
  Clock3,
  Wifi,
  Coffee,
  Shield,
  Truck,
  Home,
  Landmark,
  TreePine,
  Hotel,
  ShoppingBag,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function App() {
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [reports, setReports] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [stats, setStats] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [centerRatings, setCenterRatings] = useState({});
  const [areas, setAreas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter24Hours, setFilter24Hours] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [reportData, setReportData] = useState({
    crowd_level: "moderate",
    wait_time: 15,
    reporter_name: "",
    vehicle_type: "motorcycle",
  });

  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    user_name: "",
  });

  // Category configuration
  const categories = [
    { id: "all", label: "All Centers", icon: "📍", color: "blue" },
    { id: "toll_plaza", label: "Toll Plazas", icon: "🛣️", color: "purple" },
    { id: "park", label: "Parks", icon: "🌳", color: "green" },
    { id: "check_post", label: "Check Posts", icon: "🚔", color: "red" },
    { id: "commercial", label: "Commercial", icon: "🏢", color: "orange" },
    { id: "roadside", label: "Roadside", icon: "🛤️", color: "yellow" },
    {
      id: "excise_office",
      label: "Excise Offices",
      icon: "🏛️",
      color: "indigo",
    },
    { id: "interchange", label: "Interchanges", icon: "🔄", color: "pink" },
  ];

  // Category icons mapping
  const categoryIcons = {
    toll_plaza: "🛣️",
    park: "🌳",
    check_post: "🚔",
    commercial: "🏢",
    roadside: "🛤️",
    excise_office: "🏛️",
    interchange: "🔄",
  };

  // Category colors mapping
  const categoryColors = {
    toll_plaza:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    park: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    check_post: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    commercial:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    roadside:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    excise_office:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    interchange:
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  };

  useEffect(() => {
    fetchAllData();
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [filter24Hours, vehicleFilter, selectedCategory, selectedArea]);

  useEffect(() => {
    if (selectedCenter) {
      refreshCenterData(selectedCenter.id);
      fetchReviews(selectedCenter.id);
    }
  }, [selectedCenter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCenter) {
        refreshCenterData(selectedCenter.id);
      }
      fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedCenter]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchCenters(),
        fetchRequirements(),
        fetchAnnouncements(),
        fetchStats(),
      ]);
    } catch (error) {
      toast.error("Failed to load some data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      let url = `${API_URL}/centers`;
      const params = new URLSearchParams();

      if (filter24Hours) params.append("is_24hours", "true");
      if (vehicleFilter !== "all") params.append("vehicle_type", vehicleFilter);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedArea !== "all") params.append("area", selectedArea);

      if (params.toString()) url += "?" + params.toString();

      const res = await axios.get(url);
      setCenters(res.data);

      // Fetch ratings for each center
      res.data.forEach((center) => {
        fetchCenterRating(center.id);
      });

      if (res.data.length > 0 && !selectedCenter) {
        setSelectedCenter(res.data[0]);
      }
    } catch (err) {
      toast.error("Failed to load centers");
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await axios.get(`${API_URL}/requirements`);
      setRequirements(res.data);
    } catch (err) {
      console.error("Failed to load requirements");
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to load announcements");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await axios.get(`${API_URL}/areas`);
      setAreas(res.data);
    } catch (err) {
      console.error("Failed to load areas");
    }
  };

  const refreshCenterData = async (centerId) => {
    await Promise.all([
      fetchCenterStatus(centerId),
      fetchReports(centerId),
      fetchPrediction(centerId),
      fetchCenterRating(centerId),
    ]);
  };

  const fetchCenterStatus = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/centers/${id}/status`);
      setCurrentStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/centers/${id}/reports`);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrediction = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/predict/${id}`);
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/centers/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCenterRating = async (centerId) => {
    try {
      const res = await axios.get(`${API_URL}/centers/${centerId}/rating`);
      setCenterRatings((prev) => ({ ...prev, [centerId]: res.data }));
    } catch (err) {
      console.error("Failed to load rating");
    }
  };

  const searchCenters = async (query) => {
    if (!query.trim()) {
      fetchCenters();
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/search?q=${encodeURIComponent(query)}`,
      );
      setCenters(res.data);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchCenters(searchQuery);
  };

  const handleCenterSelect = (center) => {
    setSelectedCenter(center);
    refreshCenterData(center.id);
    fetchReviews(center.id);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reports`, {
        center_id: selectedCenter.id,
        ...reportData,
      });
      toast.success("Report submitted! Thanks for helping others.");
      setShowReportForm(false);
      refreshCenterData(selectedCenter.id);
      setReportData({
        crowd_level: "moderate",
        wait_time: 15,
        reporter_name: "",
        vehicle_type: "motorcycle",
      });
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reviews`, {
        center_id: selectedCenter.id,
        ...reviewData,
      });
      toast.success("Review submitted! Thanks for your feedback.");
      setShowReviewForm(false);
      fetchReviews(selectedCenter.id);
      fetchCenterRating(selectedCenter.id);
      setReviewData({
        rating: 5,
        comment: "",
        user_name: "",
      });
    } catch (err) {
      toast.error("Failed to submit review");
    }
  };

  const handleVerify = async (reportId) => {
    try {
      await axios.post(`${API_URL}/reports/${reportId}/verify`);
      toast.success("Verified! Thanks for confirming.");
      refreshCenterData(selectedCenter.id);
    } catch (err) {
      if (err.response?.status === 400) toast.error("Already verified");
      else toast.error("Verification failed");
    }
  };

  const getCrowdColor = (level) => {
    switch (level) {
      case "quiet":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "busy":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "very_busy":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getCrowdIcon = (level) => {
    switch (level) {
      case "quiet":
        return "😊";
      case "moderate":
        return "😐";
      case "busy":
        return "😕";
      case "very_busy":
        return "😫";
      default:
        return "❓";
    }
  };

  const getCrowdDescription = (level) => {
    switch (level) {
      case "quiet":
        return "No wait, walk-in immediately";
      case "moderate":
        return "Short wait (5-15 minutes)";
      case "busy":
        return "Long wait (15-30 minutes)";
      case "very_busy":
        return "Very long wait (30+ minutes)";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 120) return "1 hour ago";
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalfStar) {
      stars.push("½");
    }
    while (stars.length < 5) {
      stars.push("☆");
    }
    return stars.join(" ");
  };

  const CategoryTabs = () => (
    <div className="flex overflow-x-auto pb-2 mb-4 gap-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1 ${
            selectedCategory === cat.id
              ? `bg-${cat.color}-600 text-white`
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <span>{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading M-Tag centers...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            17+ centers across Islamabad
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Toaster position="top-right" />

        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    M-Tag Rush Checker
                  </h1>
                  <p className="text-blue-100 text-xs md:text-sm">
                    {centers.length}+ Centers • Now mandatory for motorcycles
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 rounded-lg bg-blue-700 hover:bg-blue-600 transition md:hidden"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-blue-700 hover:bg-blue-600 transition"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Announcement Banner */}
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-red-100 dark:bg-red-900 border-b border-red-200 dark:border-red-800 animate-pulse"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  {announcement.message}
                </p>
              </div>
            </div>
          </div>
        ))}

        <main className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Centers
                  </p>
                  <p className="text-lg font-bold dark:text-white">
                    {centers.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    24/7
                  </p>
                  <p className="text-lg font-bold dark:text-white">
                    {centers.filter((c) => c.is_24hours === 1).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fee
                  </p>
                  <p className="text-lg font-bold dark:text-white">Rs. 250</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deadline
                  </p>
                  <p className="text-lg font-bold dark:text-white">Passed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search centers by name, area..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium dark:text-white">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Vehicle
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVehicleFilter("all")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        vehicleFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setVehicleFilter("motorcycle")}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                        vehicleFilter === "motorcycle"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      Motorcycles
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Hours
                  </label>
                  <button
                    onClick={() => setFilter24Hours(!filter24Hours)}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      filter24Hours
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    24/7 Only
                  </button>
                </div>

                {areas.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                      Area
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 dark:text-white border-none"
                    >
                      <option value="all">All Areas</option>
                      {areas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop Filters */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium dark:text-white">
                  Vehicle:
                </span>
                <button
                  onClick={() => setVehicleFilter("all")}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    vehicleFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Car className="w-3 h-3" /> All
                </button>
                <button
                  onClick={() => setVehicleFilter("motorcycle")}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    vehicleFilter === "motorcycle"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Bike className="w-3 h-3" /> Motorcycles
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium dark:text-white">
                  Hours:
                </span>
                <button
                  onClick={() => setFilter24Hours(!filter24Hours)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter24Hours
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  24/7 Only
                </button>
              </div>

              {areas.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium dark:text-white">
                    Area:
                  </span>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 dark:text-white border-none"
                  >
                    <option value="all">All Areas</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <CategoryTabs />

          {/* Requirements Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 dark:text-white">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Requirements for Motorcycle M-Tag
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center"
                >
                  <div className="text-2xl mb-1">
                    {req.icon === "id-card" && "🆔"}
                    {req.icon === "book" && "📄"}
                    {req.icon === "bike" && "🏍️"}
                    {req.icon === "mount" && "📱"}
                    {req.icon === "rupee" && "💰"}
                    {req.icon === "plate" && "🔢"}
                    {req.icon === "user" && "👤"}
                  </div>
                  <h3 className="font-medium text-xs dark:text-white">
                    {req.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Centers List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <h2 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                    <MapPin className="w-5 h-5" /> M-Tag Centers
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {centers.length} centers available •{" "}
                    {centers.filter((c) => c.is_24hours === 1).length} open 24/7
                  </p>
                </div>
                <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                  {centers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No centers match your filters</p>
                      <button
                        onClick={() => {
                          setFilter24Hours(false);
                          setVehicleFilter("all");
                          setSelectedCategory("all");
                          setSelectedArea("all");
                          setSearchQuery("");
                        }}
                        className="text-blue-600 text-sm mt-2"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    centers.map((center) => {
                      const centerStat = stats.find((s) => s.id === center.id);
                      const rating = centerRatings[center.id];

                      return (
                        <button
                          key={center.id}
                          onClick={() => handleCenterSelect(center)}
                          className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                            selectedCenter?.id === center.id
                              ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium dark:text-white">
                                  {center.name}
                                </h3>
                                {center.is_24hours === 1 && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    24/7
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                                {center.address}
                              </p>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[center.category] || "bg-gray-100 text-gray-800"}`}
                                >
                                  {categoryIcons[center.category] || "📍"}{" "}
                                  {center.category?.replace("_", " ")}
                                </span>

                                {centerStat?.avg_wait_time && (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {Math.round(centerStat.avg_wait_time)} min
                                    avg
                                  </span>
                                )}

                                {rating && rating.total_reviews > 0 && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    {rating.average_rating?.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Selected Center Details */}
            {selectedCenter && (
              <div className="lg:col-span-2 space-y-6">
                {/* Center Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h2 className="text-2xl font-bold dark:text-white">
                          {selectedCenter.name}
                        </h2>
                        {selectedCenter.is_24hours === 1 ? (
                          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 24/7
                          </span>
                        ) : selectedCenter.is_extended_hours === 1 ? (
                          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">
                            Extended Hours
                          </span>
                        ) : null}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {selectedCenter.address}
                      </p>

                      <div className="flex flex-wrap gap-3 mb-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${categoryColors[selectedCenter.category] || "bg-gray-100"}`}
                        >
                          {categoryIcons[selectedCenter.category] || "📍"}{" "}
                          {selectedCenter.category?.replace("_", " ")}
                        </span>

                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {selectedCenter.hours}
                        </span>

                        {selectedCenter.contact && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedCenter.contact}
                          </span>
                        )}
                      </div>

                      {selectedCenter.landmark && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                          <span className="font-medium">Landmark:</span>{" "}
                          {selectedCenter.landmark}
                        </p>
                      )}

                      {selectedCenter.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 pt-2 mt-2">
                          {selectedCenter.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setShowReportForm(!showReportForm)}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Send className="w-4 h-4" /> Report Rush
                      </button>
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Star className="w-4 h-4" /> Review
                      </button>
                    </div>
                  </div>

                  {/* Peak Hours and Best Time */}
                  {(selectedCenter.peak_hours || selectedCenter.best_time) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {selectedCenter.peak_hours && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                            ⚠️ Peak Hours
                          </p>
                          <p className="text-sm dark:text-white">
                            {selectedCenter.peak_hours}
                          </p>
                        </div>
                      )}
                      {selectedCenter.best_time && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                            ✅ Best Time to Visit
                          </p>
                          <p className="text-sm dark:text-white">
                            {selectedCenter.best_time}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Status */}
                  {currentStatus && currentStatus.crowd_level !== "unknown" && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Current Status
                          </h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getCrowdColor(currentStatus.crowd_level)}`}
                            >
                              {getCrowdIcon(currentStatus.crowd_level)}{" "}
                              {currentStatus.crowd_level.replace("_", " ")}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                              Wait time:{" "}
                              <strong className="dark:text-white">
                                {currentStatus.wait_time} minutes
                              </strong>
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(currentStatus.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {getCrowdDescription(currentStatus.crowd_level)}
                          </p>
                        </div>

                        {/* Prediction */}
                        {prediction &&
                          prediction.predicted_level !== "unknown" && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center w-full md:w-auto">
                              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                Predicted: {prediction.predicted_level}
                              </p>
                              <p className="text-xs text-purple-500 dark:text-purple-500">
                                {prediction.confidence}% confidence
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Report Form */}
                  {showReportForm && (
                    <form
                      onSubmit={handleSubmitReport}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4"
                    >
                      <h3 className="font-medium mb-3 dark:text-white flex items-center gap-2">
                        <Send className="w-4 h-4" /> Report Current Rush
                      </h3>
                      <div className="space-y-3">
                        <select
                          value={reportData.crowd_level}
                          onChange={(e) =>
                            setReportData({
                              ...reportData,
                              crowd_level: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          required
                        >
                          <option value="quiet">😊 Quiet (No wait)</option>
                          <option value="moderate">
                            😐 Moderate (5-15 min)
                          </option>
                          <option value="busy">😕 Busy (15-30 min)</option>
                          <option value="very_busy">
                            😫 Very Busy (30+ min)
                          </option>
                        </select>

                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={reportData.wait_time}
                          onChange={(e) =>
                            setReportData({
                              ...reportData,
                              wait_time: parseInt(e.target.value),
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          placeholder="Wait time (minutes)"
                          required
                        />

                        <select
                          value={reportData.vehicle_type}
                          onChange={(e) =>
                            setReportData({
                              ...reportData,
                              vehicle_type: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                        >
                          <option value="motorcycle">🏍️ Motorcycle</option>
                          <option value="car">🚗 Car</option>
                          <option value="both">Both</option>
                        </select>

                        <input
                          type="text"
                          value={reportData.reporter_name}
                          onChange={(e) =>
                            setReportData({
                              ...reportData,
                              reporter_name: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          placeholder="Your name (optional)"
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            Submit Report
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReportForm(false)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <form
                      onSubmit={handleSubmitReview}
                      className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4"
                    >
                      <h3 className="font-medium mb-3 dark:text-white flex items-center gap-2">
                        <Star className="w-4 h-4" /> Rate This Center
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Rating
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() =>
                                  setReviewData({ ...reviewData, rating: num })
                                }
                                className={`text-2xl ${num <= reviewData.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          value={reviewData.comment}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              comment: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          placeholder="Your comments (optional)"
                          rows="3"
                        />

                        <input
                          type="text"
                          value={reviewData.user_name}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              user_name: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                          placeholder="Your name (optional)"
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            Submit Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Recent Reports */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4" /> Recent Rush Reports
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {reports.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                          No reports yet. Be the first to report the current
                          rush!
                        </p>
                      ) : (
                        reports.map((report) => (
                          <div
                            key={report.id}
                            className="border dark:border-gray-700 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCrowdColor(report.crowd_level)}`}
                                  >
                                    {getCrowdIcon(report.crowd_level)}{" "}
                                    {report.crowd_level.replace("_", " ")}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Wait:{" "}
                                    <strong>{report.wait_time} min</strong>
                                  </span>
                                  {report.vehicle_type === "motorcycle" && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                      <Bike className="w-3 h-3 inline" /> Bike
                                    </span>
                                  )}
                                  {report.verified === 1 && (
                                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />{" "}
                                      Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  Reported by {report.reporter_name} •{" "}
                                  {formatDate(report.created_at)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleVerify(report.id)}
                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{report.verification_count || 0}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3 dark:text-white flex items-center gap-2">
                      <Star className="w-4 h-4" /> User Reviews
                      {centerRatings[selectedCenter.id]?.total_reviews > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          (
                          {centerRatings[
                            selectedCenter.id
                          ].average_rating?.toFixed(1)}{" "}
                          ★ from{" "}
                          {centerRatings[selectedCenter.id].total_reviews}{" "}
                          reviews)
                        </span>
                      )}
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {reviews.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                          No reviews yet. Be the first to review this center!
                        </p>
                      ) : (
                        reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border dark:border-gray-700 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400 text-sm">
                                  {renderStars(review.rating)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {review.user_name || "Anonymous"}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* One Network App Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Download className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-white">
                          One Network App
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Check balance, view trip history, and recharge your
                          M-Tag
                        </p>
                        <div className="flex gap-3">
                          <a
                            href="https://apps.apple.com/bt/app/m-tag-one-network/id1574366732"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800"
                          >
                            App Store
                          </a>
                          <a
                            href="https://play.google.com/store/apps/details?hl=en_AU&id=com.ls.onenetwork.mtag"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                          >
                            Google Play
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Support: 1313 • connect@onenetwork.pk
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
              <p>
                ⚡ Community-powered M-Tag rush checker • Refreshes every 60
                seconds
              </p>
              <p className="mt-2 text-xs">
                {centers.length}+ Centers across Islamabad • M-Tag mandatory for
                all motorcycles as of March 1, 2026
              </p>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <span>
                  24/7 Centers:{" "}
                  {centers.filter((c) => c.is_24hours === 1).length}
                </span>
                <span>•</span>
                <span>
                  Extended Hours:{" "}
                  {centers.filter((c) => c.is_extended_hours === 1).length}
                </span>
                <span>•</span>
                <span>Fee: Rs. 250</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
