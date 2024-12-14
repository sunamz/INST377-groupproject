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
- Navigate to the project folder
- Run `npm install express @supabase/supabase-js cors` in the directory
- Run `node server.js` in the directory
- Navigate to `http://localhost:3000` on Chrome Web Browser
- Tests: ?
### API
- `app.get('/')` Sends the homepage to the website
- `(app.get('/api/lists/:userId'))` Populates the database with the user's game library
- `app.post('/api/lists)` Creates a new list with the games that the user selected
### Known Bugs and Roadmap
- Bugs ?
- Future development of the app could include more analytics on the user's profile, such as breakdowns of time spent playing or games owned across popular genres, or filtering options for game reccomendations (such as a price range limitation).
### Libraries Used
- Node.js
- Supabase
- Picture Slider
- 

# User Manual
- Input your Steam ID or vanity URL into the search bar, and press `Enter` or Search
- If valid, your game library will show up
- Details about each game can be accessed with the 'Details' button
- To create a list, select games with the 'Select' button and provide a list title.
- Your created lists can be seen at the bottom of the page, and you can remove games from your list or delete your list with the red trash can button


