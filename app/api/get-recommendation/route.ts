import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    let weatherData = null
    try {
      const lat = "30.7333"
      const lon = "76.7794"
      const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY

      if (weatherApiKey) {
        const currentWeatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`,
        )
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`,
        )

        if (currentWeatherResponse.ok && forecastResponse.ok) {
          const currentData = await currentWeatherResponse.json()
          const forecastData = await forecastResponse.json()

          weatherData = {
            current: {
              temp: Math.round(currentData.main.temp),
              condition: currentData.weather[0].main,
              description: currentData.weather[0].description,
              humidity: currentData.main.humidity,
              windSpeed: Math.round(currentData.wind.speed * 3.6),
              feelsLike: Math.round(currentData.main.feels_like),
            },
            forecast: forecastData.list
              .filter((_: any, index: number) => index % 8 === 0)
              .slice(0, 7)
              .map((item: any) => ({
                date: item.dt_txt.split(" ")[0],
                maxTemp: Math.round(item.main.temp_max),
                minTemp: Math.round(item.main.temp_min),
                condition: item.weather[0].main,
              })),
          }
          console.log("[v0] Weather data fetched successfully for recommendation")
        }
      }
    } catch (error) {
      console.log("[v0] Failed to fetch weather for recommendation:", error)
    }

    let marketData = null
    try {
      const marketModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      const marketPrompt = `Provide current market prices for major agricultural commodities in ${userProfile.state}, India. 
      
Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {"commodity": "Wheat", "price": 2500},
  {"commodity": "Rice", "price": 3200},
  {"commodity": "Cotton", "price": 7500}
]

Include 5-8 major commodities relevant to ${userProfile.state}. Prices should be in INR per quintal and reflect realistic current market rates.`

      const marketResult = await marketModel.generateContent(marketPrompt)
      const marketText = marketResult.response.text().trim()

      const jsonMatch = marketText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        marketData = JSON.parse(jsonMatch[0])
        console.log("[v0] Market data generated successfully for recommendation:", marketData.length, "commodities")
      }
    } catch (error) {
      console.log("[v0] Failed to fetch market prices for recommendation:", error)
    }

    const prompt = `You are an expert agricultural advisor AI assistant for Indian farmers. Provide a personalized, actionable farming recommendation based on the following comprehensive data:

**FARMER PROFILE:**
- Name: ${userProfile.username}
- Location: ${userProfile.state}, ${userProfile.country}
- Soil Type: ${userProfile.soilType}
- Preferred Language: ${userProfile.language}
- Email: ${userProfile.email}

**CURRENT WEATHER CONDITIONS:**
${
  weatherData
    ? `- Temperature: ${weatherData.current.temp}°C
- Condition: ${weatherData.current.condition} (${weatherData.current.description})
- Humidity: ${weatherData.current.humidity}%
- Wind Speed: ${weatherData.current.windSpeed} km/h
- Feels Like: ${weatherData.current.feelsLike}°C

**7-DAY FORECAST:**
${weatherData.forecast
  .map(
    (day: any) =>
      `- ${new Date(day.date).toLocaleDateString("en-IN")}: ${day.condition}, High: ${day.maxTemp}°C, Low: ${day.minTemp}°C`,
  )
  .join("\n")}`
    : "- Weather data unavailable"
}

**CURRENT MARKET PRICES (${userProfile.state}):**
${
  marketData && marketData.length > 0
    ? marketData.map((item: any) => `- ${item.commodity}: ₹${item.price.toLocaleString()}/quintal`).join("\n")
    : "- Market data unavailable"
}

Based on this comprehensive information, provide a detailed recommendation in both English and ${userProfile.language} covering:

1. **IMMEDIATE ACTIONS** (Next 24-48 hours)
   - What ${userProfile.username} should do right now based on current conditions
   - Any urgent preparations needed for the forecasted weather

2. **CROP RECOMMENDATIONS**
   - Best crops to plant/harvest considering ${userProfile.soilType} soil, weather, and market prices
   - Timing considerations for the next 1-2 weeks
   - Expected profitability based on current market prices shown above

3. **WEATHER-BASED ADVICE**
   - How to prepare for upcoming weather conditions (next 7 days)
   - Irrigation recommendations based on humidity and rainfall forecast
   - Pest/disease risks based on weather patterns

4. **MARKET INSIGHTS**
   - Which crops are fetching good prices currently (refer to the market data above)
   - Strategic planting suggestions for future profitability
   - Storage vs immediate sale recommendations

5. **SOIL-SPECIFIC GUIDANCE**
   - Fertilizer recommendations for ${userProfile.soilType} soil
   - Soil preparation tips
   - Crop rotation suggestions

Please provide specific, actionable advice that ${userProfile.username} can implement immediately. Be concise but comprehensive, and ensure the recommendations are practical for a farmer in ${userProfile.state}.

Format your response with clear headings and bullet points for easy reading. Make it personal and address the farmer by name where appropriate.`

    let text = ""
    let retryCount = 0
    const maxRetries = 2

    while (retryCount <= maxRetries) {
      try {
        const result = await model.generateContent(prompt)
        text = result.response.text()
        console.log("[v0] Recommendation generated successfully, length:", text.length)
        break
      } catch (error: any) {
        retryCount++
        console.error(`[v0] Recommendation generation attempt ${retryCount} failed:`, error.message)

        if (retryCount > maxRetries) {
          text = `# Personalized Farming Recommendation for ${userProfile.username}

## Current Farm Profile
- **Location**: ${userProfile.state}, ${userProfile.country}
- **Soil Type**: ${userProfile.soilType}
- **Current Weather**: ${weatherData ? `${weatherData.current.temp}°C, ${weatherData.current.condition}` : "Data unavailable"}

## Immediate Actions (Next 24-48 hours)

Based on your ${userProfile.soilType} soil and current conditions in ${userProfile.state}, here are your priority actions:

- **Monitor Weather**: ${weatherData ? `Current temperature is ${weatherData.current.temp}°C with ${weatherData.current.humidity}% humidity` : "Check local weather forecasts regularly"}
- **Soil Preparation**: ${userProfile.soilType} soil requires specific care - ensure proper drainage and organic matter content
- **Irrigation Planning**: Adjust watering schedule based on current humidity levels

## Crop Recommendations

For ${userProfile.soilType} soil in ${userProfile.state}:

### Suitable Crops:
${
  userProfile.soilType === "Alluvial"
    ? "- Rice, Wheat, Sugarcane, Cotton\n- Vegetables: Potato, Onion, Tomato"
    : userProfile.soilType === "Black"
      ? "- Cotton, Soybean, Wheat, Jowar\n- Pulses: Chickpea, Pigeon pea"
      : userProfile.soilType === "Red"
        ? "- Groundnut, Millets, Pulses\n- Vegetables: Tomato, Potato"
        : userProfile.soilType === "Laterite"
          ? "- Rice, Ragi, Cashew, Coconut\n- Vegetables: Tapioca, Sweet potato"
          : "- Millets, Pulses, Drought-resistant crops"
}

## Weather-Based Advice

${
  weatherData
    ? `### 7-Day Outlook:
${weatherData.forecast
  .slice(0, 5)
  .map(
    (day: any) =>
      `- ${new Date(day.date).toLocaleDateString("en-IN")}: ${day.condition}, ${day.minTemp}°C - ${day.maxTemp}°C`,
  )
  .join("\n")}

**Recommendations:**
- ${weatherData.current.humidity > 70 ? "High humidity detected - monitor for fungal diseases" : "Moderate humidity - maintain regular irrigation"}
- ${weatherData.current.windSpeed > 20 ? "Strong winds expected - secure young plants and structures" : "Normal wind conditions - proceed with regular activities"}`
    : "Weather data is currently unavailable. Please check local forecasts and plan accordingly."
}

## Market Insights

${
  marketData && marketData.length > 0
    ? `### Current Market Prices in ${userProfile.state}:

${marketData
  .slice(0, 8)
  .map((item: any) => `- **${item.commodity}**: ₹${item.price.toLocaleString()}/quintal`)
  .join("\n")}

**Market Strategy:**
- Focus on crops with stable or rising prices
- Consider storage options for better returns
- Plan crop rotation for sustained profitability`
    : "Market data is currently unavailable. Consult local mandis for current prices."
}

## Soil-Specific Guidance

### For ${userProfile.soilType} Soil:

**Fertilizer Recommendations:**
${
  userProfile.soilType === "Alluvial"
    ? "- NPK ratio: 120:60:40 kg/ha for cereals\n- Add organic manure: 10-15 tons/ha\n- Micronutrients: Zinc and Boron as needed"
    : userProfile.soilType === "Black"
      ? "- NPK ratio: 100:50:50 kg/ha\n- Gypsum application for calcium\n- Organic matter: 8-10 tons/ha"
      : userProfile.soilType === "Red"
        ? "- NPK ratio: 80:40:40 kg/ha\n- Lime application to reduce acidity\n- Organic compost: 12-15 tons/ha"
        : userProfile.soilType === "Laterite"
          ? "- NPK ratio: 60:30:30 kg/ha\n- Heavy organic matter addition\n- Lime for pH correction"
          : "- Organic matter is crucial\n- Minimal chemical fertilizers\n- Focus on water conservation"
}

**Soil Preparation:**
- Deep ploughing before monsoon
- Add organic matter to improve soil structure
- Ensure proper drainage systems
- Test soil pH and nutrient levels annually

## Action Checklist

✓ Check weather forecast daily
✓ Prepare irrigation schedule
✓ Source quality seeds for recommended crops
✓ Arrange fertilizers and organic manure
✓ Inspect and maintain farm equipment
✓ Monitor market prices regularly
✓ Plan crop rotation for next season

---

**Note**: This is a general recommendation. For specific advice tailored to your exact farm conditions, please consult with local agricultural extension officers or agronomists.

*Generated for ${userProfile.username} | ${new Date().toLocaleDateString("en-IN")}*`
        }

        // Wait before retry
        if (retryCount <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount))
        }
      }
    }

    return NextResponse.json({
      success: true,
      recommendation: text,
      context: {
        weather: weatherData?.current,
        topCommodities: marketData?.slice(0, 3),
        userProfile: {
          name: userProfile.username,
          state: userProfile.state,
          soilType: userProfile.soilType,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Recommendation generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate recommendation. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
