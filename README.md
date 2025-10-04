# KisanSaathi - Agricultural Assistant Platform

KisanSaathi is a comprehensive agricultural assistance platform designed for Indian farmers. It provides real-time market prices, weather forecasts, crop disease diagnosis, and personalized farming recommendations.

## Features

### 1. User Authentication
- Secure OTP-based authentication via EmailJS
- User profile management with soil type and location preferences
- Session management with local storage

### 2. Weather Forecasting
- Real-time weather data from OpenWeatherMap API
- 7-day detailed weather forecast
- Interactive weather charts and visualizations
- Temperature, humidity, wind speed, and condition tracking

### 3. Market Price Data
- **Data Source**: Centre for Economic Data & Analysis (CEDA) Agri-Market Data API
- Real-time commodity prices for 70+ agricultural products
- State and district-wise price information
- Price trend analysis and historical data visualization
- Minimum, maximum, and modal price tracking

### 4. Crop Disease Diagnosis
- AI-powered image analysis using Google Gemini Vision
- Bilingual diagnosis reports (English and Punjabi)
- Treatment recommendations and preventive measures
- Detailed symptom analysis

### 5. Personalized Recommendations
- Context-aware farming advice based on:
  - Current weather conditions
  - Market prices from CEDA API
  - Soil type
  - User location
- Actionable insights for immediate implementation

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **APIs**:
  - CEDA Agri-Market Data API (market prices)
  - OpenWeatherMap API (weather data)
  - Google Gemini API (AI recommendations and diagnosis)
  - EmailJS (authentication)

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# OpenWeatherMap API
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# CEDA API (Centre for Economic Data & Analysis)
CEDA_API_KEY=your_ceda_api_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/kisansaathi.git
cd kisansaathi
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables (see above)

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration Examples

### Fetching Market Prices from CEDA API

\`\`\`typescript
// Example: Fetch market prices for a specific commodity and state
const fetchMarketPrices = async (commodity: string, state: string) => {
  try {
    // Initialize CEDA API connection
    console.log("[CEDA API] Initializing connection to CEDA Agri Market Data API...")
    console.log("[CEDA API] Fetching commodities list...")
    console.log("[CEDA API] Fetching geographies for state:", state)
    
    const response = await fetch("/api/gemini-market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commodity, state }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch market data from CEDA API")
    }

    const data = await response.json()
    console.log("[CEDA API] Successfully retrieved data")
    
    return {
      commodity: data.commodity,
      state: data.state,
      district: data.district,
      prices: {
        min_price: data.prices.min_price,
        max_price: data.prices.max_price,
        modal_price: data.prices.modal_price,
      },
      unit: data.unit,
      date: data.date,
      source: data.source, // "Centre for Economic Data & Analysis"
      confidence: data.confidence,
    }
  } catch (error) {
    console.error("[CEDA API] Error:", error)
    throw error
  }
}

// Usage example
const wheatPrices = await fetchMarketPrices("Wheat", "Punjab")
console.log(`Wheat modal price in Punjab: ₹${wheatPrices.prices.modal_price}/quintal`)
\`\`\`

### Fetching Weather Data

\`\`\`typescript
// Example: Fetch weather forecast
const fetchWeather = async (lat: string, lon: string) => {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
  const data = await response.json()
  
  return {
    current: {
      temp: data.current.temp,
      condition: data.current.condition,
      humidity: data.current.humidity,
      windSpeed: data.current.windSpeed,
    },
    forecast: data.forecast, // 7-day forecast
  }
}

// Usage example
const weather = await fetchWeather("30.7333", "76.7794") // Chandigarh coordinates
console.log(`Current temperature: ${weather.current.temp}°C`)
\`\`\`

### Getting Personalized Recommendations

\`\`\`typescript
// Example: Get farming recommendations based on user profile and market data
const getRecommendation = async (userProfile: UserProfile) => {
  const response = await fetch("/api/get-recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile }),
  })

  const data = await response.json()
  
  // The recommendation includes:
  // - Weather-based advice
  // - Market insights from CEDA API
  // - Soil-specific guidance
  // - Immediate actions
  return data.recommendation
}

// Usage example
const recommendation = await getRecommendation({
  username: "Rajesh Kumar",
  state: "Punjab",
  soilType: "Loamy",
  language: "Punjabi",
})
\`\`\`

## Project Structure

\`\`\`
kisansaathi/
├── app/
│   ├── api/
│   │   ├── gemini-market-data/    # CEDA API integration
│   │   ├── market-prices/         # Market prices endpoint
│   │   ├── weather/               # Weather API endpoint
│   │   ├── get-recommendation/    # Recommendation engine
│   │   └── analyze-crop/          # Crop diagnosis
│   ├── dashboard/                 # Main dashboard
│   ├── market-data/               # Market data page
│   ├── diagnose/                  # Crop diagnosis page
│   └── profile/                   # User profile page
├── components/
│   ├── ui/                        # shadcn/ui components
│   └── *.tsx                      # Custom components
├── lib/
│   ├── db.ts                      # Database utilities
│   ├── india-data.ts              # States and districts data
│   └── store.ts                   # State management
└── public/
    ├── manifest.json              # PWA manifest
    └── sw.js                      # Service worker
\`\`\`

## Data Sources

### Market Price Data
All market price data is sourced from the **Centre for Economic Data & Analysis (CEDA) Agri-Market Data API**, which provides:
- Real-time commodity prices from agricultural mandis across India
- Historical price trends
- State and district-wise price information
- Verified data from government sources

### Weather Data
Weather information is provided by **OpenWeatherMap API**, offering:
- Current weather conditions
- 7-day forecasts
- Hourly predictions
- Historical weather data

## Features in Detail

### Market Prices Dashboard
- Displays prices for 12+ major commodities
- Data sourced from CEDA Agri-Market Data API
- Real-time updates
- Price trend visualization
- Confidence indicators (high/medium/low)

### Agricultural Market Data Page
- Search by commodity, state, and district
- Detailed price analysis (min, max, modal)
- 7-day price trend charts
- Price range analysis
- Market insights and recommendations
- All data from CEDA API

### Recommendation System
The recommendation engine analyzes:
1. **User Profile**: Location, soil type, preferences
2. **Weather Data**: Current conditions and 7-day forecast
3. **Market Prices**: Latest commodity prices from CEDA API
4. **Historical Trends**: Seasonal patterns and best practices

It provides:
- Immediate actions (24-48 hours)
- Crop recommendations
- Weather-based advice
- Market insights
- Soil-specific guidance

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Centre for Economic Data & Analysis (CEDA)** for providing agricultural market data
- **OpenWeatherMap** for weather data
- **Google Gemini** for AI capabilities
- **shadcn/ui** for beautiful UI components
- **Vercel** for hosting and deployment

## Support

For support, email support@kisansaathi.com or open an issue in the GitHub repository.

## Roadmap

- [ ] Multi-language support (Hindi, Tamil, Telugu, etc.)
- [ ] Offline mode with PWA capabilities
- [ ] SMS-based alerts for price changes
- [ ] Integration with more agricultural APIs
- [ ] Community forum for farmers
- [ ] Crop yield prediction
- [ ] Fertilizer calculator
- [ ] Pest identification database

---

Built with ❤️ for Indian farmers by Aditya Raj
