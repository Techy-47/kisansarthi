import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { userProfile, currentPlan } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `You are an expert agricultural advisor specializing in crop rotation planning.

User Profile:
- Location: ${userProfile?.state || "Not specified"}, ${userProfile?.country || "Not specified"}
- Soil Type: ${userProfile?.soilType || "Not specified"}
- Address: ${userProfile?.address || "Not specified"}

Current Crop Rotation Plan:
${currentPlan.length > 0 ? currentPlan.map((entry: any) => `- ${entry.year} ${entry.season}: ${entry.crop} (${entry.category})`).join("\n") : "No crops planned yet"}

Please provide:
1. **Optimal Crop Rotation Suggestions**: Recommend a 3-4 year crop rotation plan suitable for their soil type and location
2. **Benefits**: Explain the benefits of the suggested rotation (soil health, pest management, nutrient balance)
3. **Seasonal Recommendations**: Suggest which crops work best in Kharif, Rabi, and Zaid seasons
4. **Soil Health Tips**: Provide specific advice on maintaining soil fertility through rotation
5. **Legume Integration**: Explain how to incorporate nitrogen-fixing legumes
6. **Pest and Disease Management**: How rotation helps prevent pest buildup

If they have a current plan, analyze it and suggest improvements. If not, provide a complete rotation plan.

Format your response in clear markdown with headings and bullet points.`

    const result = await model.generateContent(prompt)
    const suggestion = result.response.text()

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error("[v0] Crop rotation suggestion error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate suggestions" },
      { status: 500 },
    )
  }
}
