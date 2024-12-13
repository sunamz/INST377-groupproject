const API_KEY = 'C64C097A0C347B224046BD0B009F6B16';
let selectedGames = new Map();
let currentSteamId = '';
let currentGames = []; // Store games data

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

async function parseSteamInput(input) {
    // Remove whitespace
    input = input.trim();
    
    // Handle full URLs
    if (input.includes('steamcommunity.com')) {
        const urlPattern = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([^\s/]+)/;
        const match = input.match(urlPattern);
        if (match) {
            input = match[1];
        }
    }

    // If it's a 17-digit number (Steam64 ID)
    if (/^\d{17}$/.test(input)) {
        return input;
    }

    // If it's a custom URL name, resolve it
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const vanityUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${API_KEY}&vanityurl=${input}`;
        const response = await fetch(proxyUrl + encodeURIComponent(vanityUrl));
        const data = await response.json();
        
        if (data.contents) {
            const result = JSON.parse(data.contents);
            if (result.response.success === 1) {
                return result.response.steamid;
            }
        }
        throw new Error('Could not resolve Steam ID');
    } catch (error) {
        throw new Error('Invalid Steam ID or vanity URL');
    }
}



async function fetchUserGames() {
    const steamId = document.getElementById('steamId').value;
    
    try {
        // Clear previous lists when searching new user
        document.getElementById('listsContainer').innerHTML = '';
        selectedGames.clear();
        
        const resolvedSteamId = await parseSteamInput(steamId);
        currentSteamId = resolvedSteamId;
        
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${resolvedSteamId}&include_appinfo=1&format=json`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (data.contents) {
            const gamesData = JSON.parse(data.contents);
            currentGames = gamesData.response.games || [];
            displayGames(currentGames);
            fetchUserLists(resolvedSteamId);
        }
    } catch (error) {
        showError(error.message);
    }
}


async function fetchUserLists(steamId) {
    try {
        const response = await fetch(`/api/lists/${steamId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch lists');
        }
        
        const lists = await response.json();
        displayLists(lists);
    } catch (error) {
        showError('Failed to load user lists: ' + error.message);
    }
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = '';

    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        
        const imgUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;
        
        gameCard.innerHTML = `
            <img src="${imgUrl}" alt="${game.name}">
            <span>${game.name}</span>
            <div class="game-actions">
                <button onclick="viewGameDetails(${game.appid})">View Details</button>
                <button onclick="toggleGameSelection(${game.appid}, '${game.name}', '${imgUrl}')"
                        id="btn-${game.appid}">
                    Add to List
                </button>
            </div>
        `;
        
        container.appendChild(gameCard);
    });
}

function toggleGameSelection(appId, name, imageUrl) {
    const btn = document.getElementById(`btn-${appId}`);
    const gameInfo = { appid: appId, name: name, img_icon_url: imageUrl };

    if (selectedGames.has(appId)) {
        selectedGames.delete(appId);
        btn.textContent = 'Add to List';
        btn.style.backgroundColor = '#66c0f4';
    } else {
        selectedGames.set(appId, gameInfo);
        btn.textContent = 'Selected';
        btn.style.backgroundColor = '#417a9b';
    }
}

async function viewGameDetails(appId) {
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (data.contents) {
            const gameDetails = JSON.parse(data.contents)[appId].data;
            
            document.getElementById('modalGameTitle').textContent = gameDetails.name;
            document.getElementById('modalGameContent').innerHTML = `
                <p>${gameDetails.short_description || 'No description available.'}</p>
                <p>Release Date: ${gameDetails.release_date?.date || 'Unknown'}</p>
                <p>Genres: ${gameDetails.genres?.map(g => g.description).join(', ') || 'None listed'}</p>
            `;
            
            document.getElementById('gameModal').style.display = 'block';
        }
    } catch (error) {
        showError('Failed to load game details');
    }
}

async function createNewList() {
    const listName = document.getElementById('listName').value;
    const description = document.getElementById('listDescription').value;

    if (!listName) {
        showError('Please enter a list name');
        return;
    }

    try {
        const response = await fetch('/api/lists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_steam_id: currentSteamId,
                list_name: listName,
                description: description,
                games: Array.from(selectedGames.values())
            })
        });

        if (!response.ok) throw new Error('Failed to create list');

        // Reset form and selections
        document.getElementById('listName').value = '';
        document.getElementById('listDescription').value = '';
        selectedGames.clear();
        
        // Reset all "Add to List" buttons
        const buttons = document.querySelectorAll('[id^="btn-"]');
        buttons.forEach(btn => {
            btn.textContent = 'Add to List';
            btn.style.backgroundColor = '#66c0f4';
        });
        
        // Refresh lists
        fetchUserLists(currentSteamId);
    } catch (error) {
        showError(error.message);
    }
}

function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
}


function displayLists(lists) {
    const container = document.getElementById('listsContainer');
    container.innerHTML = '';

    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'list-card';
        
        // Create header section
        const headerSection = `
            <div class="list-header">
                <h3>${list.list_name}</h3>
                <p class="list-description">${list.description || ''}</p>
                <div>Games: ${list.list_games ? list.list_games.length : 0}</div>
            </div>
        `;

        // Create games section
        const gamesSection = `
            <div class="list-games" id="list-${list.list_id}">
                ${list.list_games?.map(game => `
                    <div class="list-game-card">
                        <div class="game-basic-info">
                            <img src="https://media.steampowered.com/steamcommunity/public/images/apps/${game.game_app_id}/${game.game_image_url}" alt="${game.game_name}">
                            <span>${game.game_name}</span>
                        </div>
                        <div class="game-actions">
                            <button onclick="viewListGameDetails(event, ${game.game_app_id})">View Details</button>
                        </div>
                        <div class="game-details" id="details-${game.game_app_id}"></div>
                    </div>
                `).join('') || 'No games in this list'}
            </div>
        `;

        listElement.innerHTML = headerSection + gamesSection;
        
        // Add click handler to toggle list expansion
        const headerDiv = listElement.querySelector('.list-header');
        headerDiv.onclick = () => toggleListGames(list.list_id);
        
        container.appendChild(listElement);
    });
}

async function viewListGameDetails(event, appId) {
    event.stopPropagation(); // Prevent list toggle when clicking the button
    
    const detailsDiv = document.getElementById(`details-${appId}`);
    
    // If details are already loaded, just toggle visibility
    if (detailsDiv.innerHTML !== '') {
        detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
        return;
    }

    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        
        detailsDiv.innerHTML = '<div class="loading">Loading details...</div>';
        
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (data.contents) {
            const gameDetails = JSON.parse(data.contents)[appId].data;
            
            detailsDiv.innerHTML = `
                <div class="game-details-content">
                    <p class="game-description">${gameDetails.short_description || 'No description available.'}</p>
                    <div class="game-meta">
                        <p><strong>Release Date:</strong> ${gameDetails.release_date?.date || 'Unknown'}</p>
                        <p><strong>Genres:</strong> ${gameDetails.genres?.map(g => g.description).join(', ') || 'None listed'}</p>
                        ${gameDetails.metacritic ? `<p><strong>Metacritic:</strong> ${gameDetails.metacritic.score}</p>` : ''}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        detailsDiv.innerHTML = '<div class="error">Failed to load game details</div>';
    }
}

function toggleListGames(listId) {
    const gamesDiv = document.getElementById(`list-${listId}`);
    const currentDisplay = gamesDiv.style.display;
    gamesDiv.style.display = currentDisplay === 'none' ? 'block' : 'none';
}