# The Compass 🧭

A personalised dating compatibility tracker that helps you discover who you authentically match with based on your own weighted criteria.

## Features

- 🔐 **Multi-user authentication** - Secure JWT-based login system
- 🎯 **AI-guided criteria setup** - Thoughtful 10-question wizard to discover what you truly value
- 📊 **Visual compatibility scoring** - Beautiful radar charts showing how partners match your criteria
- ✨ **AI-generated explanations** - Get natural language insights explaining your compatibility scores based on your ratings and feelings
- 📝 **Journal entries** - Track your thoughts and feelings as relationships evolve
- 🔄 **Re-rating reminders** - See how your feelings change over time
- 🔍 **Comparison view** - Compare multiple partners side-by-side

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Charts**: Recharts (radar/spider charts)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with better-sqlite3
- **Auth**: JWT-based authentication

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone and install dependencies**
```bash
cd the-compass
npm install
```

2. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your JWT_SECRET
```

3. **Initialize the database**
```bash
npm run db:migrate
npm run db:seed
```

4. **Start the development servers**
```bash
# Start both client and server concurrently
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Demo Account
After seeding, you can log in with:
- **Email**: demo@compass.app
- **Password**: demo1234

## Project Structure

```
the-compass/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (auth, etc.)
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Helper functions
│   │   └── App.tsx
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth, validation, etc.
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── database/      # DB setup and migrations
│   │   └── server.ts
│   └── package.json
└── README.md
```

## Available Scripts

From the root directory:

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the frontend
- `npm run dev:server` - Start only the backend
- `npm run build` - Build both client and server for production
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with demo data

## How It Works

### 1. Onboarding
New users complete a 10-question interview about what they value in relationships. The app generates a personalised set of criteria weighted by importance.

### 2. Adding Partners
Add people you're dating or have dated. Track basic info like when you met and how many dates you've had.

### 3. Rating
Score each partner on your criteria using a 1-10 scale. The app calculates a weighted compatibility score and generates a visual radar chart.

### 4. Journaling
Record your thoughts and feelings about each partner over time. Tag entries with moods to track emotional patterns.

### 5. Comparison
View all your partners in one place. Compare 2-3 people side-by-side to see how they stack up against each other and your ideal.

### 6. Evolution
Set reminders to re-rate partners after a certain number of dates. See how your perception changes as you get to know them better.

## AI-Generated Explanations

When rating a partner, you can add your personal feelings and reflections in the "Your Feelings & Reflections" section. The app uses **Google Gemini AI (FREE!)** to generate a warm, thoughtful explanation of your compatibility score by analyzing:

- Your individual criterion scores and their importance (dealbreaker/important/nice-to-have)
- Your personal notes about how you're feeling
- Patterns in what's working well vs. areas of uncertainty

**Setup (100% FREE):**
1. Get a FREE API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Free tier includes: 60 requests/min, 1,500 requests/day, 1M tokens/month
2. Add it to your `server/.env` file: `GEMINI_API_KEY=your-key-here`
3. The feature works automatically when you create new ratings

**No API key?** No problem! The app includes intelligent fallback explanations that analyze your scores without requiring an API key.

## Development

### Database Schema
The app uses SQLite with the following main tables:
- `users` - User accounts
- `criteria` - User-defined rating criteria
- `partners` - People being tracked
- `ratings` - Historical ratings of partners
- `journal_entries` - Reflective journal entries

See `server/src/database/schema.sql` for the complete schema.

### API Routes
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/criteria` - Get user's criteria
- `POST /api/partners` - Add new partner
- `POST /api/ratings` - Rate a partner
- And many more...

See `server/src/routes/` for all available endpoints.

## Contributing

This is a personal project built for self-reflection and intentional dating. Feel free to fork and adapt it to your needs!

## License

MIT
