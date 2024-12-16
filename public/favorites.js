const API_KEY = '412EBB6903BA8014ECC931C393E7014E';

function clearFavorites() {
    const carousel = document.querySelector('.swiper-wrapper');
    const favoriteGenre = document.getElementById('favoriteGenre');
    const recommendedGame = document.getElementById('recommendedGame');
    
    if (carousel) carousel.innerHTML = '';
    if (favoriteGenre) favoriteGenre.textContent = 'None';
    if (recommendedGame) recommendedGame.innerHTML = `
        <div class="recommendation-card">
            <p>No recommendations available</p>
        </div>
    `;
}

// Get Steam ID from URL parameters or localStorage
function getSteamId() {
    const params = new URLSearchParams(window.location.search);
    const steamId = params.get('steamId') || localStorage.getItem('currentSteamId');
    console.log('Retrieved Steam ID:', steamId);
    return steamId;
}

// Check if we have stored games first
function getStoredGames() {
    const storedGames = localStorage.getItem('favoriteGames');
    console.log('Stored games found:', storedGames ? 'yes' : 'no');
    return storedGames ? JSON.parse(storedGames) : null;
}

async function fetchGameDetails(appId) {
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    
    try {
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (data.contents) {
            const gameDetails = JSON.parse(data.contents);
            return gameDetails[appId]?.data?.genres || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching game details:', error);
        return [];
    }
}

async function determineFavoriteGenre(games) {
    try {
        console.log('Analyzing genres for games:', games);
        const genreCount = {};
        
        // Analyze genres for top 5 most played games
        const topGames = games.slice(0, 5);
        const genrePromises = topGames.map(game => fetchGameDetails(game.appid));
        const gameGenres = await Promise.all(genrePromises);
        
        // Count genre occurrences
        gameGenres.forEach(genres => {
            genres.forEach(genre => {
                const genreName = genre.description;
                genreCount[genreName] = (genreCount[genreName] || 0) + 1;
            });
        });
        
        // Find the most common genre
        const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
        const favoriteGenre = sortedGenres[0]?.[0] || 'None';
            
        console.log('Genre analysis:', genreCount);
        console.log('Favorite genre:', favoriteGenre);
        
        document.getElementById('favoriteGenre').textContent = favoriteGenre;
        return favoriteGenre;
    } catch (error) {
        console.error('Error determining favorite genre:', error);
        return 'None';
    }
}

async function recommendGame(ownedGames, favoriteGenre) {
    const recommendedGameElement = document.getElementById('recommendedGame');
    try {
        console.log('Finding recommendations for genre:', favoriteGenre);
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const steamUrl = 'https://store.steampowered.com/api/featuredcategories';
        
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (!data.contents) {
            throw new Error('No featured games data received');
        }
        
        const featuredData = JSON.parse(data.contents);
        const featuredGames = featuredData.top_sellers?.items || [];
        
        // Get owned game IDs for filtering
        const ownedGameIds = new Set(ownedGames.map(game => game.appid));
        
        // Analyze featured games
        const recommendations = [];
        for (const game of featuredGames) {
            if (ownedGameIds.has(parseInt(game.id))) continue;
            
            const genres = await fetchGameDetails(game.id);
            if (genres.some(g => g.description.toLowerCase() === favoriteGenre.toLowerCase())) {
                recommendations.push({
                    id: game.id,
                    name: game.name,
                    image: game.large_capsule_image,
                    genres: genres.map(g => g.description)
                });
            }
            
            // Stop after finding 3 recommendations
            if (recommendations.length >= 3) break;
        }
        
        if (recommendations.length > 0) {
            const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
            recommendedGameElement.innerHTML = `
                <div class="recommendation-card">
                    <img src="${recommendation.image}" alt="${recommendation.name}" class="recommendation-image">
                    <div class="recommendation-details">
                        <h3 class="text-xl font-bold mb-2">${recommendation.name}</h3>
                        <p class="mb-4"><i class="fas fa-tags"></i> ${recommendation.genres.join(', ')}</p>
                        <a href="https://store.steampowered.com/app/${recommendation.id}" 
                           target="_blank" 
                           class="view-store-btn">
                            <i class="fas fa-external-link-alt"></i> View in Store
                        </a>
                    </div>
                </div>
            `;
        } else {
            recommendedGameElement.innerHTML = `
                <div class="recommendation-card">
                    <p><i class="fas fa-info-circle"></i> No matching games found for your favorite genre: ${favoriteGenre}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error recommending game:', error);
        recommendedGameElement.innerHTML = `
            <div class="recommendation-card">
                <p><i class="fas fa-exclamation-circle"></i> Error loading recommendations</p>
            </div>
        `;
    }
}


async function fetchUserFavoriteGames(steamId) {
    if (!steamId) {
        clearFavorites();
        throw new Error('No Steam ID provided');
    }
    
    console.log('Attempting to fetch games for Steam ID:', steamId);

    const storedGames = getStoredGames();
    if (storedGames) {
        console.log('Using stored games from localStorage');
        return storedGames;
    }   
    
    // If no stored games, fetch from Steam API
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${steamId}&include_appinfo=1&format=json`;
    
    console.log('Fetching from Steam API...'); // Debug log
    
    try {
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        
        if (!response.ok) {
            console.error('Steam API response not OK:', response.status, response.statusText);
            throw new Error('Failed to fetch from Steam API');
        }
        
        const data = await response.json();
        console.log('Raw API response:', data); // Debug log
        
        if (!data.contents) {
            throw new Error('No contents in API response');
        }
        
        const gamesData = JSON.parse(data.contents);
        console.log('Parsed games data:', gamesData); // Debug log
        
        if (!gamesData.response) {
            throw new Error('Invalid response format from Steam API');
        }
        
        const games = gamesData.response.games || [];
        console.log('Number of games found:', games.length); // Debug log
        
        if (games.length === 0) {
            throw new Error('No games found in Steam library');
        }
        
        const topGames = [...games]
            .sort((a, b) => b.playtime_forever - a.playtime_forever)
            .slice(0, 10);
        
        console.log('Top games selected:', topGames); // Debug log
        
        // Store in localStorage for future use
        localStorage.setItem('favoriteGames', JSON.stringify(topGames));
        
        return topGames;
    } catch (error) {
        console.error('Detailed fetch error:', error);
        if (error.message.includes('contents')) {
            throw new Error('Error parsing Steam API response');
        } else if (error.message.includes('games')) {
            throw new Error('No games found in Steam library');
        } else {
            throw new Error(`Failed to load games: ${error.message}`);
        }
    }
}

function displayFavoriteGames(games) {
    console.log('Displaying games:', games);
    const carousel = document.querySelector('.swiper-wrapper');
    if (!carousel) {
        console.error('Carousel element not found');
        return;
    }
    carousel.innerHTML = '';
    
    games.forEach(game => {
        const imgUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
        carousel.innerHTML += `
            <div class="swiper-slide">
                <div class="game-card animate__animated animate__fadeIn">
                    <img src="${imgUrl}" alt="${game.name}" class="game-image" 
                         onerror="this.src='/api/placeholder/300/160'"/>
                    <a href="https://store.steampowered.com/app/${game.appid}/" 
                       target="_blank" 
                       class="game-title">
                        ${game.name}
                    </a>
                    <div class="playtime">
                        <i class="fas fa-clock"></i>
                        ${Math.round(game.playtime_forever / 60)} hours played
                    </div>
                </div>
            </div>`;
    });

    // Initialize Swiper
    new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        centeredSlides: true,
        autoplay: {
            delay: 3500,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            968: {
                slidesPerView: 3,
                spaceBetween: 30,
            }
        },
        effect: 'coverflow',
        coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true
        }
    });
}

async function initializeFavoriteGames() {
    try {
        const steamId = getSteamId();
        const noSteamIdElement = document.getElementById('noSteamId');
        const favoritesContentElement = document.getElementById('favoritesContent');
        
        if (!steamId) {
            console.log('No Steam ID found');
            clearFavorites();
            if (noSteamIdElement) noSteamIdElement.classList.remove('hidden');
            if (favoritesContentElement) favoritesContentElement.classList.add('hidden');
            return;
        }

        if (noSteamIdElement) noSteamIdElement.classList.add('hidden');
        if (favoritesContentElement) favoritesContentElement.classList.remove('hidden');
        
        const games = await fetchUserFavoriteGames(steamId);
        console.log('Games fetched successfully:', games);
        
        if (games && games.length > 0) {
            displayFavoriteGames(games);
            const favoriteGenre = await determineFavoriteGenre(games);
            if (favoriteGenre && favoriteGenre !== 'None') {
                await recommendGame(games, favoriteGenre);
            }
        } else {
            clearFavorites();
            throw new Error('No games found in the response');
        }
    } catch (error) {
        clearFavorites();
        console.error('Error:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = error.message;
        document.body.insertBefore(errorMessage, document.body.firstChild);
    }
}

// Event listeners and interval checking
document.addEventListener('DOMContentLoaded', () => {
    initializeFavoriteGames();
});


window.addEventListener('beforeunload', () => {
    const steamId = localStorage.getItem('currentSteamId');
    if (!steamId) {
        localStorage.removeItem('favoriteGames');
    }
});