// Favorites Page
async function fetchUserFavoriteGames(steamId) {
    try {
        const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${steamId}&include_appinfo=1&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        return data.response?.games || [];
    } catch (error) {
        console.error('Error fetching user games:', error);
        return [];
    }
}

async function fetchGameDetails(appId) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[appId]?.data?.genres?.map(genre => genre.description) || [];
}

async function determineFavoriteGenre(games) {
    const genreCount = {};
    const gameDetails = await Promise.all(games.slice(0, 5).map(game => fetchGameDetails(game.appid)));
    gameDetails.flat().forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    const favoriteGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    document.getElementById('favoriteGenre').textContent = favoriteGenre || 'Unknown';
    return favoriteGenre;
}

async function recommendGame(ownedGames, genre) {
    try {
        const url = `https://store.steampowered.com/api/featuredcategories`;
        const response = await fetch(url);
        const data = await response.json();
        const featuredGames = data.top_sellers.items.map(item => ({
            appid: item.id,
            name: item.name,
            image: item.large_capsule_image
        }));

        const gameDetails = await Promise.all(
            featuredGames.map(async (game) => {
                try {
                    const url = `https://store.steampowered.com/api/appdetails?appids=${game.appid}`;
                    const response = await fetch(url);
                    const detailsData = await response.json();
                    const genres = detailsData[game.appid]?.data?.genres?.map(genre => genre.description) || [];
                    return { ...game, genres };
                } catch (error) {
                    console.error(`Error fetching details for ${game.name}:`, error);
                    return { ...game, genres: [] };
                }
            })
        );

        const unownedAppIds = ownedGames.map(game => game.appid);
        const genreMatchedGames = gameDetails.filter(game => 
            game.genres.some(g => g.toLowerCase() === genre.toLowerCase()) && 
            !unownedAppIds.includes(game.appid)
        );

        const recommendedGame = genreMatchedGames.length > 0 
            ? genreMatchedGames[Math.floor(Math.random() * genreMatchedGames.length)] 
            : null;

        const recommendationElement = document.getElementById('recommendedGame');
        
        if (recommendedGame) {
            recommendationElement.innerHTML = `
                <img src="${recommendedGame.image}" alt="${recommendedGame.name}" />
                <a href="https://store.steampowered.com/app/${recommendedGame.appid}" target="_blank">${recommendedGame.name}</a>
            `;
        } else {
            recommendationElement.textContent = 'No recommendations found';
        }
    } catch (error) {
        console.error('Error in recommendGame function:', error);
        const recommendationElement = document.getElementById('recommendedGame');
        recommendationElement.textContent = 'Error fetching recommendation';
    }
}

function displayFavoriteGames(games) {
    const carousel = document.querySelector('.swiper-wrapper');
    const sortedGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 10);
    
    sortedGames.forEach(game => {
        const imgUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
        carousel.innerHTML += `
            <a class="swiper-slide game-card" href="https://store.steampowered.com/app/${game.appid}/">
                <img src="${imgUrl}" alt="${game.name}" class="game-image"/>
                <h3>${game.name}</h3>
                <p>${Math.round(game.playtime_forever / 60)} hours played</p>
            </a>`;
    });

    new Swiper('.swiper-container', { slidesPerView: 3, spaceBetween: 20, loop: true });
}

async function initializeFavoriteGames(steamId) {
    const games = await fetchUserFavoriteGames(steamId);
    if (games) {
        displayFavoriteGames(games);
        const favoriteGenre = await determineFavoriteGenre(games);
        if (favoriteGenre) recommendGame(games, favoriteGenre);
    }
}
