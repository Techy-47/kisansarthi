"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Camera,
  Wand2,
  Cloud,
  TrendingUp,
  Loader2,
  MapPin,
  Sparkles,
  LogOut,
  User,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Wind,
  Eye,
  CloudRain,
  Sun,
  CloudSnow,
  CloudDrizzle,
  Sprout,
  DollarSign,
  ThermometerSun,
  Leaf,
  Info,
  RefreshCw,
} from "lucide-react"
import { isAuthenticated, getSession, getUserProfile, logout } from "@/lib/db"
import { useAppStore } from "@/lib/store"
import { WeatherForecastChart } from "@/components/weather-forecast-chart"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"

export default function DashboardPage() {
  const router = useRouter()
  const { userProfile, setUserProfile, setIsAuthenticated } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weatherData, setWeatherData] = useState<any>(null)
  const [marketData, setMarketData] = useState<any[]>([])
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const [isLoadingMarket, setIsLoadingMarket] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push("/")
        return
      }

      const session = await getSession()
      if (session) {
        const profile = await getUserProfile(session.userEmail)
        if (profile) {
          setUserProfile(profile)
          setIsAuthenticated(true)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, setUserProfile, setIsAuthenticated])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchWeather = async () => {
      if (!userProfile) return

      try {
        const lat = "30.7333"
        const lon = "76.7794"

        const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
        const data = await response.json()

        if (response.ok) {
          setWeatherData(data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch weather:", error)
      }
    }

    fetchWeather()
  }, [userProfile])

  const handleFetchMarketData = async () => {
    if (!userProfile?.state) return

    setIsLoadingMarket(true)
    setMarketData([])

    try {
      console.log("[CEDA API] Initializing connection to CEDA Agri Market Data API...")
      console.log("[CEDA API] Fetching commodities list...")
      console.log("[CEDA API] Fetching geographies for state:", userProfile.state)
      console.log("[CEDA API] Querying market prices...")

      const response = await fetch("/api/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: userProfile.state }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[CEDA API] Successfully retrieved market data")
        setMarketData(data)
      }
    } catch (error) {
      console.error("Failed to fetch market prices:", error)
    } finally {
      setIsLoadingMarket(false)
    }
  }

  const handleGetRecommendation = async () => {
    setShowRecommendationModal(true)
    setIsLoadingRecommendation(true)
    setRecommendationError(null)
    setRecommendation(null)

    try {
      const response = await fetch("/api/get-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recommendation")
      }

      setRecommendation(data.recommendation)
    } catch (error) {
      setRecommendationError(error instanceof Error ? error.message : "Failed to generate recommendation")
    } finally {
      setIsLoadingRecommendation(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setUserProfile(null)
    setIsAuthenticated(false)
    router.push("/")
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition?.toLowerCase() || ""
    if (lower.includes("rain")) return <CloudRain className="h-12 w-12" />
    if (lower.includes("cloud")) return <Cloud className="h-12 w-12" />
    if (lower.includes("clear") || lower.includes("sun")) return <Sun className="h-12 w-12" />
    if (lower.includes("snow")) return <CloudSnow className="h-12 w-12" />
    if (lower.includes("drizzle")) return <CloudDrizzle className="h-12 w-12" />
    return <Cloud className="h-12 w-12" />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-green-50/50 transition-all cursor-pointer"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                KisanSaathi
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <motion.div
                  key={currentTime.toLocaleTimeString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
                >
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </motion.div>
                <div className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/profile")} className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-2"
        >
          <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-green-600 via-emerald-600 to-teal-50 bg-clip-text text-transparent pb-2">
            Welcome back, {userProfile?.username || "Farmer"}!
          </h1>
          <p className="text-muted-foreground text-xl">Your agricultural command center</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="shadow-xl border-2 border-green-100 overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                  >
                    <Cloud className="h-8 w-8 text-blue-600" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl">Weather Forecast</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {userProfile?.state || "Your Location"}
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => setShowForecastModal(true)} variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  7-Day Forecast
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weatherData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Weather</p>
                        <p className="text-6xl font-bold text-blue-900">{weatherData.current.temp}°C</p>
                        <p className="text-lg text-blue-700 mt-2">{weatherData.current.condition}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        className="text-blue-600"
                      >
                        {getWeatherIcon(weatherData.current.condition)}
                      </motion.div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                          <Droplets className="h-4 w-4" />
                          <span className="text-xs font-medium">Humidity</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{weatherData.current.humidity}%</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                          <Wind className="h-4 w-4" />
                          <span className="text-xs font-medium">Wind Speed</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{weatherData.current.windSpeed} km/h</p>
                      </div>
                    </div>
                  </motion.div>

                  {weatherData.forecast?.slice(0, 3).map((day: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md border border-blue-100 hover:border-blue-300 transition-all"
                    >
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex justify-center my-3 text-blue-600">{getWeatherIcon(day.condition)}</div>
                      <p className="text-xs text-center text-blue-700 mb-3">{day.condition}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">High</p>
                          <p className="text-lg font-bold text-red-600">{day.maxTemp}°</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Low</p>
                          <p className="text-lg font-bold text-blue-600">{day.minTemp}°</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-2 border-green-100 overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-2xl">Market Prices for {userProfile?.state}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">
                    Data from Centre for Economic Data & Analysis Agri-Market Data API
                  </CardDescription>
                </div>
                {marketData.length > 0 && (
                  <Button
                    onClick={handleFetchMarketData}
                    disabled={isLoadingMarket}
                    variant="outline"
                    className="gap-2 bg-transparent"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh Data
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {marketData.length === 0 && !isLoadingMarket ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-8 shadow-lg"
                  >
                    <TrendingUp className="h-16 w-16 text-green-600" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-green-900">Discover Market Prices</h3>
                    <p className="text-muted-foreground max-w-md">
                      Get the latest commodity prices from agricultural markets across {userProfile?.state}
                    </p>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={handleFetchMarketData} size="lg" className="gap-3 text-lg px-8 py-6 shadow-xl">
                      <Sparkles className="h-5 w-5" />
                      Fetch Market Data
                    </Button>
                  </motion.div>
                </div>
              ) : isLoadingMarket ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Loader2 className="h-16 w-16 text-green-600" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-green-700">Fetching market data...</p>
                    <p className="text-sm text-muted-foreground">Analyzing current market trends</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketData.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                      >
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 transition-all shadow-md hover:shadow-xl">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-xl text-green-900">{item.commodity}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-sm text-muted-foreground mb-1">Modal Price</p>
                                <p className="text-3xl font-bold text-green-600">₹{item.price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">per quintal</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="h-32 text-lg w-full shadow-lg bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => router.push("/diagnose")}
            >
              <div className="flex flex-col items-center gap-3">
                <Camera className="h-8 w-8" />
                <span>Diagnose Crop</span>
              </div>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="secondary"
              className="h-32 text-lg w-full shadow-lg"
              onClick={handleGetRecommendation}
            >
              <div className="flex flex-col items-center gap-3">
                <Wand2 className="h-8 w-8" />
                <span>Get Recommendation</span>
              </div>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="outline"
              className="h-32 text-lg w-full shadow-lg bg-transparent"
              onClick={() => router.push("/market-data")}
            >
              <div className="flex flex-col items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                <span>Market Data</span>
              </div>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              variant="outline"
              className="h-24 text-lg w-full shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 hover:border-teal-400"
              onClick={() => router.push("/crop-rotation")}
            >
              <div className="flex items-center gap-4">
                <RefreshCw className="h-8 w-8 text-teal-600" />
                <div className="text-left">
                  <div className="font-bold text-teal-900">Crop Rotation Planner</div>
                  <div className="text-sm text-muted-foreground font-normal">Plan your seasonal crop cycles</div>
                </div>
              </div>
            </Button>
          </motion.div>
        </motion.div>
      </main>

      <Dialog open={showForecastModal} onOpenChange={setShowForecastModal}>
        <DialogContent className="w-[98vw] h-[98vh] max-w-none overflow-y-auto p-8">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-4xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
              <Cloud className="h-10 w-10 text-blue-600" />
              7-Day Weather Forecast
            </DialogTitle>
            <DialogDescription className="text-lg">
              Detailed weather predictions for your farming region
            </DialogDescription>
          </DialogHeader>
          {weatherData?.forecast ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weatherData.forecast.map((day: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all"
                  >
                    <p className="text-lg font-bold text-blue-900 mb-3">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex justify-center my-4 text-blue-600">{getWeatherIcon(day.condition)}</div>
                    <p className="text-sm text-center text-blue-700 mb-4 font-medium">{day.condition}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">High</p>
                        <p className="text-2xl font-bold text-red-600">{day.maxTemp}°</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Low</p>
                        <p className="text-2xl font-bold text-blue-600">{day.minTemp}°</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <WeatherForecastChart data={weatherData.forecast} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRecommendationModal} onOpenChange={setShowRecommendationModal}>
        <DialogContent fullScreen className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <DialogHeader className="space-y-3 pb-6 text-left max-w-7xl mx-auto">
              <DialogTitle className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Sparkles className="h-10 w-10 md:h-14 md:w-14 text-green-600" />
                </motion.div>
                AI-Powered Farming Insights
              </DialogTitle>
              <DialogDescription className="text-lg md:text-xl flex items-start gap-3 max-w-4xl">
                <Info className="h-5 w-5 md:h-6 md:w-6 mt-1 shrink-0" />
                Personalized recommendations based on weather, market trends, and your farm profile
              </DialogDescription>
            </DialogHeader>

            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                {isLoadingRecommendation ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-24 space-y-8"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50"></div>
                      <Loader2 className="h-24 w-24 text-green-600 relative z-10" />
                    </motion.div>
                    <div className="text-center space-y-4">
                      <p className="text-2xl font-bold text-green-700">Analyzing Your Farm Data...</p>
                      <p className="text-lg text-muted-foreground max-w-lg">
                        Processing weather patterns, CEDA market data, and soil conditions
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-5 h-5 bg-green-600 rounded-full"
                          animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : recommendationError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-20 text-center space-y-8"
                  >
                    <div className="flex justify-center">
                      <div className="rounded-full bg-red-100 p-8 shadow-lg">
                        <AlertTriangle className="h-20 w-20 text-red-600" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-bold text-red-900">Unable to Generate Recommendation</h3>
                      <p className="text-red-600 text-xl max-w-md mx-auto">{recommendationError}</p>
                    </div>
                    <Button onClick={handleGetRecommendation} size="lg" className="gap-3 text-lg px-8 py-6">
                      <Sparkles className="h-5 w-5" />
                      Try Again
                    </Button>
                  </motion.div>
                ) : recommendation ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Quick Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-blue-100 rounded-lg">
                                <ThermometerSun className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Weather Status</p>
                                <p className="text-lg font-bold text-blue-900">{weatherData?.current?.temp || "--"}°C</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-100 rounded-lg">
                                <Sprout className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Soil Type</p>
                                <p className="text-lg font-bold text-green-900">{userProfile?.soilType || "N/A"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-purple-100 rounded-lg">
                                <MapPin className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="text-lg font-bold text-purple-900">{userProfile?.state || "N/A"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Market Data</p>
                                <p className="text-lg font-bold text-orange-900">Live</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Main Recommendation Content - Parsed into sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Crop Recommendations */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="h-full border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardTitle className="flex items-center gap-3 text-green-900">
                              <Leaf className="h-6 w-6" />
                              Crop Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                                    ul: ({ children }) => <ul className="space-y-2 ml-4">{children}</ul>,
                                    li: ({ children }) => (
                                      <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{children}</span>
                                      </li>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-green-800">{children}</strong>
                                    ),
                                  }}
                                >
                                  {recommendation.split("\n\n").slice(0, 3).join("\n\n")}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Weather Impact */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Card className="h-full border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                            <CardTitle className="flex items-center gap-3 text-blue-900">
                              <Cloud className="h-6 w-6" />
                              Weather Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {weatherData && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Droplets className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-medium text-blue-700">Humidity</span>
                                    </div>
                                    <p className="text-xl font-bold text-blue-900">{weatherData.current.humidity}%</p>
                                  </div>
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Wind className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-medium text-blue-700">Wind</span>
                                    </div>
                                    <p className="text-xl font-bold text-blue-900">{weatherData.current.windSpeed} km/h</p>
                                  </div>
                                </div>
                              )}
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                                    ul: ({ children }) => <ul className="space-y-2 ml-4">{children}</ul>,
                                    li: ({ children }) => (
                                      <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{children}</span>
                                      </li>
                                    ),
                                  }}
                                >
                                  {recommendation.split("\n\n").slice(3, 6).join("\n\n")}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Market Insights */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Card className="h-full border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                            <CardTitle className="flex items-center gap-3 text-orange-900">
                              <DollarSign className="h-6 w-6" />
                              Market Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {marketData.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  {marketData.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="bg-orange-50 rounded-lg p-2">
                                      <p className="text-xs text-muted-foreground">{item.commodity}</p>
                                      <p className="text-sm font-bold text-orange-900">₹{item.price}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                                    ul: ({ children }) => <ul className="space-y-2 ml-4">{children}</ul>,
                                    li: ({ children }) => (
                                      <li className="flex items-start gap-2">
                                        <TrendingUp className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{children}</span>
                                      </li>
                                    ),
                                  }}
                                >
                                  {recommendation.split("\n\n").slice(6, 9).join("\n\n")}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Action Items */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <Card className="h-full border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="flex items-center gap-3 text-purple-900">
                              <Lightbulb className="h-6 w-6" />
                              Action Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                                    ul: ({ children }) => <ul className="space-y-3">{children}</ul>,
                                    li: ({ children }) => (
                                      <motion.li
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm border border-purple-100"
                                      >
                                        <div className="mt-0.5 p-1 bg-purple-100 rounded">
                                          <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <span className="text-gray-700 flex-1">{children}</span>
                                      </motion.li>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-purple-800">{children}</strong>
                                    ),
                                  }}
                                >
                                  {recommendation.split("\n\n").slice(9).join("\n\n")}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Full Recommendation Expandable Section */}
                    <Card className="border-2 border-gray-200">
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <Info className="h-5 w-5" />
                          View Complete Recommendation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 max-h-96 overflow-y-auto">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-800 flex items-center gap-2">
                                    <Lightbulb className="h-6 w-6" />
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-xl font-bold mt-5 mb-3 text-gray-700">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-600">{children}</h3>
                                ),
                                p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
                                ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4">{children}</ul>,
                                li: ({ children }) => (
                                  <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">•</span>
                                    <span className="text-gray-700">{children}</span>
                                  </li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-800">{children}</strong>
                                ),
                              }}
                            >
                              {recommendation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div className="border-t bg-white/70 backdrop-blur-sm p-4 flex justify-end gap-4 sticky bottom-0">
            <Button variant="outline" size="lg" onClick={() => setShowRecommendationModal(false)}>
              Close
            </Button>
            <Button size="lg" onClick={handleGetRecommendation} className="gap-2">
              <Sparkles className="h-5 w-5" />
              Generate New Recommendation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
