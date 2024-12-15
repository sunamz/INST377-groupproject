# INST377 Final Project
Steam Lists is a web application that enhances the Steam gaming experience by allowing users to organize their game library, create custom collections, and receive personalized game recommendations. The application leverages the Steam Web API to provide insightful analytics and streamlined library management.

# Features

- Game Library Management: View and organize your Steam game library
- Custom Lists Creation: Create personalized game collections
- Game Analytics: Track playtime and view gaming statistics
- Personalized Recommendations: Receive game suggestions based on your playing habits
- Steam Integration: Direct links to Steam store pages for each game

# Technical Stack

# Frontend:
- HTML/CSS
- - JavaScript (ES6+)

# Libraries:

- Swiper.js: Interactive game carousel
- Animate.css: Smooth animations and transitions
- Font Awesome: Icon library

# Backend:

- Node.js: Runtime environment
- Express.js: Web application framework
- Supabase: Database and authentication
- CORS: Cross-origin resource sharing middleware

# Group Members
- Minh Chu - Full Stack Developer
- Devin Perry - Full Stack Developer
- Alice Sun - Full Stack Developer

# Target Browsers
- Google Chrome Web Browser

# Our API
We decided to use the [Steamworks Web API](https://steamapi.xpaw.me/) for our project. This API is capable of retrieving a variety of Steam-related data, and we are using it to access the user's game library, as well as accessing the top games of each genre.

# Developer Manual

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **Google Chrome** (recommended browser)

---

## Installation Steps

### 1. Clone the repository:
```bash
git clone https://github.com/your-repo/steam-lists.git
cd steam-lists
```

### 2. Install dependencies:
```bash
npm install express @supabase/supabase-js cors
npm install
```

### 3. Configure environment variables:
Create a `.env` file in the root directory and add the following:
```
STEAM_API_KEY=your_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 4. Start the server:
```bash
node server.js
```

### 5. Access the application:
1. Open **Google Chrome**.
2. Navigate to [http://localhost:3000](http://localhost:3000).

---

## API Documentation

### Endpoints

#### 1. **Get User Lists**
**GET** `/api/lists/:userId`

Retrieves all game lists for a specific user.

---

#### 2. **Create New List**
**POST** `/api/lists`

Creates a new game list with selected games.

---

#### 3. **Delete List**
**DELETE** `/api/lists/:listId`
Deletes a specific game list.
#### 4. **Remove Game from List**
**DELETE** `/api/lists/:listId/games/:gameId`
Removes a specific game from a list.


### Known Bugs and Roadmap
- No known bugs during development.
- Future development of the app could include more analytics on the user's profile, such as breakdowns of time spent playing or games owned across popular genres, or filtering options for game reccomendations (such as a price range limitation).

