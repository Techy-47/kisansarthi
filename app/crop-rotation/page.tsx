"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Sprout,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { isAuthenticated, getUserProfile, getSession } from "@/lib/db"
import { useAppStore } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"

const CROP_CATEGORIES = {
  Cereals: ["Rice", "Wheat", "Maize", "Barley", "Sorghum", "Millet"],
  Pulses: ["Chickpea", "Lentil", "Pigeon Pea", "Mung Bean", "Black Gram", "Kidney Bean"],
  Oilseeds: ["Mustard", "Groundnut", "Sunflower", "Soybean", "Sesame"],
  Vegetables: ["Tomato", "Potato", "Onion", "Cabbage", "Cauliflower", "Brinjal"],
  "Cash Crops": ["Cotton", "Sugarcane", "Tobacco", "Jute"],
  Legumes: ["Alfalfa", "Clover", "Vetch"],
}

const SEASONS = ["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"]

interface CropEntry {
  id: string
  season: string
  crop: string
  category: string
  year: number
}

export default function CropRotationPage() {
  const router = useRouter()
  const { userProfile, setUserProfile, setIsAuthenticated } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [cropPlan, setCropPlan] = useState<CropEntry[]>([])
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

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

      // Load saved crop plan from localStorage
      const savedPlan = localStorage.getItem("cropRotationPlan")
      if (savedPlan) {
        setCropPlan(JSON.parse(savedPlan))
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, setUserProfile, setIsAuthenticated])

  const addCropEntry = () => {
    const newEntry: CropEntry = {
      id: Date.now().toString(),
      season: "",
      crop: "",
      category: "",
      year: currentYear,
    }
    setCropPlan([...cropPlan, newEntry])
  }

  const removeCropEntry = (id: string) => {
    setCropPlan(cropPlan.filter((entry) => entry.id !== id))
  }

  const updateCropEntry = (id: string, field: keyof CropEntry, value: string | number) => {
    setCropPlan(cropPlan.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const savePlan = () => {
    localStorage.setItem("cropRotationPlan", JSON.stringify(cropPlan))
    alert("Crop rotation plan saved successfully!")
  }

  const getAISuggestions = async () => {
    setIsLoadingSuggestion(true)
    setSuggestionError(null)
    setAiSuggestion(null)

    try {
      const response = await fetch("/api/crop-rotation-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          currentPlan: cropPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggestions")
      }

      setAiSuggestion(data.suggestion)
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "Failed to generate suggestions")
    } finally {
      setIsLoadingSuggestion(false)
    }
  }

  const analyzeCropSequence = () => {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for consecutive same crops
    const sortedPlan = [...cropPlan].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season)
    })

    for (let i = 1; i < sortedPlan.length; i++) {
      if (sortedPlan[i].crop === sortedPlan[i - 1].crop) {
        issues.push(`⚠️ Same crop (${sortedPlan[i].crop}) planted consecutively`)
      }
    }

    // Check for legume inclusion
    const hasLegumes = cropPlan.some((entry) => entry.category === "Pulses" || entry.category === "Legumes")
    if (!hasLegumes) {
      recommendations.push("💡 Consider adding legumes to improve soil nitrogen")
    }

    // Check for diversity
    const uniqueCategories = new Set(cropPlan.map((entry) => entry.category))
    if (uniqueCategories.size < 2 && cropPlan.length > 2) {
      recommendations.push("💡 Increase crop diversity to improve soil health")
    }

    return { issues, recommendations }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    )
  }

  const analysis = analyzeCropSequence()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-green-900">Crop Rotation Planner</h1>
                  <p className="text-sm text-muted-foreground">Plan your seasonal crop cycles</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={savePlan} variant="outline" className="gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save Plan
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="planner">Rotation Planner</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Crop Rotation Plan
                </CardTitle>
                <CardDescription>
                  Plan your crops across different seasons to optimize soil health and yield
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Label htmlFor="year">Planning Year:</Label>
                  <Input
                    id="year"
                    type="number"
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number.parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <AnimatePresence>
                  {cropPlan.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg border-2 border-green-100"
                    >
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          type="number"
                          value={entry.year}
                          onChange={(e) => updateCropEntry(entry.id, "year", Number.parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Season</Label>
                        <Select
                          value={entry.season}
                          onValueChange={(value) => updateCropEntry(entry.id, "season", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select season" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEASONS.map((season) => (
                              <SelectItem key={season} value={season}>
                                {season}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={entry.category}
                          onValueChange={(value) => {
                            updateCropEntry(entry.id, "category", value)
                            updateCropEntry(entry.id, "crop", "")
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(CROP_CATEGORIES).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Crop</Label>
                        <Select
                          value={entry.crop}
                          onValueChange={(value) => updateCropEntry(entry.id, "crop", value)}
                          disabled={!entry.category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop" />
                          </SelectTrigger>
                          <SelectContent>
                            {entry.category &&
                              CROP_CATEGORIES[entry.category as keyof typeof CROP_CATEGORIES].map((crop) => (
                                <SelectItem key={crop} value={crop}>
                                  {crop}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeCropEntry(entry.id)}
                          className="w-full md:w-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button onClick={addCropEntry} variant="outline" className="w-full gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add Crop Entry
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Rotation Analysis
                </CardTitle>
                <CardDescription>Insights and recommendations for your crop rotation plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {cropPlan.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sprout className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Add crops to your rotation plan to see analysis</p>
                  </div>
                ) : (
                  <>
                    {/* Issues */}
                    {analysis.issues.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-700">
                          <AlertCircle className="h-5 w-5" />
                          Issues Detected
                        </h3>
                        <div className="space-y-2">
                          {analysis.issues.map((issue, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded"
                            >
                              <p className="text-orange-800">{issue}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                          <Lightbulb className="h-5 w-5" />
                          Recommendations
                        </h3>
                        <div className="space-y-2">
                          {analysis.recommendations.map((rec, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-green-50 border-l-4 border-green-500 p-4 rounded"
                            >
                              <p className="text-green-800">{rec}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success indicators */}
                    {analysis.issues.length === 0 && analysis.recommendations.length === 0 && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-green-900 mb-2">Great Rotation Plan!</h3>
                        <p className="text-green-700">Your crop rotation looks well-balanced</p>
                      </div>
                    )}

                    {/* Crop Timeline */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Crop Timeline</h3>
                      <div className="space-y-2">
                        {[...cropPlan]
                          .sort((a, b) => {
                            if (a.year !== b.year) return a.year - b.year
                            return SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season)
                          })
                          .map((entry, index) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center gap-4 p-4 bg-white rounded-lg border"
                            >
                              <div className="flex-shrink-0 w-24 text-sm font-medium text-muted-foreground">
                                {entry.year}
                              </div>
                              <div className="flex-shrink-0 w-40 text-sm font-medium">{entry.season}</div>
                              <div className="flex items-center gap-2 flex-1">
                                <Sprout className="h-4 w-4 text-green-600" />
                                <span className="font-semibold">{entry.crop}</span>
                                <span className="text-sm text-muted-foreground">({entry.category})</span>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-suggestions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Suggestions
                </CardTitle>
                <CardDescription>
                  Get personalized crop rotation recommendations based on your profile and current plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!aiSuggestion && !isLoadingSuggestion && (
                  <div className="text-center py-12 space-y-6">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                      className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-8 shadow-lg inline-block"
                    >
                      <Lightbulb className="h-16 w-16 text-green-600" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-green-900">Get AI Recommendations</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Our AI will analyze your soil type, location, and current plan to suggest optimal crop rotations
                      </p>
                    </div>
                    <Button onClick={getAISuggestions} size="lg" className="gap-3">
                      <Lightbulb className="h-5 w-5" />
                      Generate Suggestions
                    </Button>
                  </div>
                )}

                {isLoadingSuggestion && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="h-16 w-16 text-green-600" />
                    </motion.div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold text-green-700">Analyzing your farm data...</p>
                      <p className="text-sm text-muted-foreground">Generating personalized recommendations</p>
                    </div>
                  </div>
                )}

                {suggestionError && (
                  <div className="text-center py-12 space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
                      <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-900 mb-2">Error</h3>
                      <p className="text-red-700">{suggestionError}</p>
                    </div>
                    <Button onClick={getAISuggestions} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {aiSuggestion && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold mt-4 mb-3 text-green-900">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold mt-4 mb-2 text-green-800">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold mt-3 mb-2 text-green-700">{children}</h3>
                            ),
                            p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
                            ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4">{children}</ul>,
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
                          {aiSuggestion}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                      <Button onClick={getAISuggestions} variant="outline" className="gap-2 bg-transparent">
                        <RefreshCw className="h-4 w-4" />
                        Generate New Suggestions
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
