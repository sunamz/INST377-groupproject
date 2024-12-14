# INST377 Final Project
Our app is a way for Steam users to see details, make lists, and receive recommendations from the games in their library.

# Group Members
- Minh Chu
- Devin Perry
- Alice Sun

# Target Browsers
- Google Chrome Web Browser

# Our API
We decided to use the [Steamworks Web API](https://steamapi.xpaw.me/) for our project. This API is capable of retrieving a variety of Steam-related data, and we are using it to access the user's game library, as well as accessing the top games of each genre.

# Developer Manual
### How to Install and Run
- Navigate to `steam-game-lists` folder within the project folder
- Run `npm install express @supabase/supabase-js cors` in the terminal
- Run `node server.js` in the terminal
- Navigate to `http://localhost:3000` on Chrome Web Browser
- Test if entering a valid Steam ID returns the corresponding game library
### API
- `app.get('/')` Sends all static files to the website
- `app.get('/api/lists/:userId')` Populates the database with the user's game library
- `app.post('/api/lists)` Creates a new list with the games that the user selected
### Known Bugs and Roadmap
- No known bugs during development.
- Future development of the app could include more analytics on the user's profile, such as breakdowns of time spent playing or games owned across popular genres, or filtering options for game reccomendations (such as a price range limitation).
### Libraries Used
- Node.js
- Supabase
- Picture Slider
- Font Awesome

