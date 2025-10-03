"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, Leaf, Clock, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface AnalysisReportProps {
  report: string
}

export function AnalysisReport({ report }: AnalysisReportProps) {
  const parseReport = (text: string) => {
    const sections: Record<string, string> = {}

    // Try to split by markdown headers (##)
    const headerPattern = /##\s+([^\n]+)/g
    const matches = [...text.matchAll(headerPattern)]

    if (matches.length === 0) {
      // Fallback: return raw text if no structured format found
      console.log("[v0] No structured format found, using raw display")
      return null
    }

    for (let i = 0; i < matches.length; i++) {
      const sectionTitle = matches[i][1].trim()
      const startIndex = matches[i].index! + matches[i][0].length
      const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length
      const content = text.substring(startIndex, endIndex).trim()
      sections[sectionTitle] = content
    }

    console.log("[v0] Parsed sections:", Object.keys(sections))
    return sections
  }

  const sections = parseReport(report)

  if (!sections) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Analysis Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none prose-headings:text-green-900 prose-strong:text-gray-900">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    )
  }

  const extractTableData = (content: string) => {
    const rows: Record<string, { english: string; local: string }> = {}
    const lines = content.split("\n").filter((l) => l.trim())

    for (const line of lines) {
      if (line.includes("|") && !line.includes("Feature") && !line.includes(":---")) {
        const parts = line.split("|").map((p) => p.trim())
        if (parts.length >= 4) {
          rows[parts[1]] = {
            english: parts[2],
            local: parts[3], // Can be any language now
          }
        }
      }
    }

    return rows
  }

  const findSection = (keyword: string) => {
    return Object.keys(sections).find((key) => key.toUpperCase().includes(keyword.toUpperCase()))
  }

  const getSeverityColor = (severity: string) => {
    const lower = severity.toLowerCase()
    if (
      lower.includes("severe") ||
      lower.includes("गंभीर") ||
      lower.includes("ਗੰਭੀਰ") ||
      lower.includes("गंभीर") ||
      lower.includes("తీవ్రమైన")
    )
      return "destructive"
    if (
      lower.includes("moderate") ||
      lower.includes("मध्यम") ||
      lower.includes("ਮੱਧਮ") ||
      lower.includes("मध्यम") ||
      lower.includes("మధ్యస్థ")
    )
      return "default"
    return "secondary"
  }

  const getConfidenceColor = (confidence: string) => {
    const lower = confidence.toLowerCase()
    if (
      lower.includes("high") ||
      lower.includes("95") ||
      lower.includes("उच्च") ||
      lower.includes("ਉੱਚ") ||
      lower.includes("उच्च") ||
      lower.includes("అధిక")
    )
      return "default"
    if (
      lower.includes("medium") ||
      lower.includes("मध्यम") ||
      lower.includes("ਮੱਧਮ") ||
      lower.includes("मध्यम") ||
      lower.includes("మధ్యస్థ")
    )
      return "secondary"
    return "outline"
  }

  const identificationKey = findSection("IDENTIFICATION")
  const symptomsKey = findSection("SYMPTOMS")
  const diagnosisKey = findSection("DIAGNOSIS")
  const treatmentKey = findSection("TREATMENT")
  const notesKey = findSection("ADDITIONAL")

  return (
    <div className="space-y-6">
      {/* Identification Section */}
      {identificationKey && sections[identificationKey] && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Crop Identification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(extractTableData(sections[identificationKey])).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-sm font-medium text-green-700 mb-1">{key}</p>
                <p className="text-base text-gray-900">{value.english}</p>
                <p className="text-sm text-gray-600 mt-1 font-medium">{value.local}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Symptoms Section */}
      {symptomsKey && sections[symptomsKey] && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Symptoms Observed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(extractTableData(sections[symptomsKey])).map(([key, value]) => {
              const isSeverity = key.toLowerCase().includes("severity")
              return (
                <div key={key} className="bg-white rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-orange-700">{key}</p>
                    {isSeverity && (
                      <Badge variant={getSeverityColor(value.english)} className="ml-2">
                        {value.english}
                      </Badge>
                    )}
                  </div>
                  {!isSeverity && (
                    <>
                      <p className="text-base text-gray-900">{value.english}</p>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{value.local}</p>
                    </>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Section */}
      {diagnosisKey && sections[diagnosisKey] && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Diagnosis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(extractTableData(sections[diagnosisKey])).map(([key, value]) => {
              const isConfidence = key.toLowerCase().includes("confidence")
              return (
                <div key={key} className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-red-700">{key}</p>
                    {isConfidence && (
                      <Badge variant={getConfidenceColor(value.english)} className="ml-2">
                        {value.english}
                      </Badge>
                    )}
                  </div>
                  {!isConfidence && (
                    <>
                      <p className="text-base text-gray-900 font-medium">{value.english}</p>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{value.local}</p>
                    </>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Treatment Recommendations */}
      {treatmentKey && sections[treatmentKey] && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">Treatment Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections[treatmentKey]
              .split(/\d+\.\s+\*\*/)
              .filter((s) => s.trim())
              .map((treatment, idx) => {
                const lines = treatment.split("\n").filter((l) => l.trim())
                const title = lines[0]?.replace(/\*\*/g, "").trim()
                const englishContent = lines
                  .find((l) => l.includes("English:"))
                  ?.replace(/[-*]\s*English:\s*/i, "")
                  .trim()
                const localContent = lines
                  .find((l) => l.match(/[-*]\s*(Hindi|Punjabi|Marathi|Telugu|हिंदी|ਪੰਜਾਬੀ|मराठी|తెలుగు):/i))
                  ?.replace(/[-*]\s*(Hindi|Punjabi|Marathi|Telugu|हिंदी|ਪੰਜਾਬੀ|मराठी|తెలుగు):\s*/i, "")
                  .trim()

                return (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">{title}</h4>
                        {englishContent && <p className="text-gray-900 mb-2">{englishContent}</p>}
                        {localContent && <p className="text-gray-600 text-sm font-medium">{localContent}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {notesKey && sections[notesKey] && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">Additional Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(extractTableData(sections[notesKey])).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-3 border border-purple-100">
                <p className="text-sm font-medium text-purple-700 mb-1">{key}</p>
                <p className="text-base text-gray-900">{value.english}</p>
                <p className="text-sm text-gray-600 mt-1 font-medium">{value.local}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
