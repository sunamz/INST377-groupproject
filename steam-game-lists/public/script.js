const API_KEY = 'C64C097A0C347B224046BD0B009F6B16';
let selectedGames = new Map();
let currentSteamId = '';
let currentGames = [];

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

async function parseSteamInput(input) {
    input = input.trim();
    
    if (input.includes('steamcommunity.com')) {
        const urlPattern = /(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/([^\s/]+)/;
        const match = input.match(urlPattern);
        if (match) {
            input = match[1];
        }
    }

    if (/^\d{17}$/.test(input)) {
        return input;
    }

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
    const gamesContainer = document.getElementById('gamesContainer');
    
    try {
        gamesContainer.innerHTML = '<div class="loading">Loading your games...</div>';
        
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
        gamesContainer.innerHTML = '';
        showError(error.message);
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
            <img src="${imgUrl}" alt="${escapeHtml(game.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/184x69.png?text=No+Image'">
            <div class="game-card-content">
                <h3 class="game-card-title">${escapeHtml(game.name)}</h3>
                <div class="game-actions">
                    <button onclick="viewGameDetails(${game.appid})" class="view-details-btn">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button id="btn-${game.appid}" 
                            onclick="toggleGameSelection(${game.appid})" 
                            class="toggle-list-btn ${selectedGames.has(game.appid) ? 'selected' : ''}">
                        <i class="fas ${selectedGames.has(game.appid) ? 'fa-check' : 'fa-plus'}"></i>
                        ${selectedGames.has(game.appid) ? 'Selected' : 'Add to List'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(gameCard);
    });
}

function toggleGameSelection(appId) {
    const game = currentGames.find(g => g.appid === appId);
    if (!game) return;

    const btn = document.getElementById(`btn-${appId}`);
    
    if (selectedGames.has(appId)) {
        selectedGames.delete(appId);
        btn.innerHTML = '<i class="fas fa-plus"></i> Add to List';
        btn.classList.remove('selected');
    } else {
        selectedGames.set(appId, {
            appid: appId,
            name: game.name,
            img_icon_url: game.img_icon_url
        });
        btn.innerHTML = '<i class="fas fa-check"></i> Selected';
        btn.classList.add('selected');
    }
}

async function createNewList() {
    const listName = document.getElementById('listName').value;
    const description = document.getElementById('listDescription').value;

    if (!listName) {
        showError('Please enter a list name');
        return;
    }

    if (selectedGames.size === 0) {
        showError('Please select at least one game');
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

        if (!response.ok) {
            throw new Error('Failed to create list');
        }

        document.getElementById('listName').value = '';
        document.getElementById('listDescription').value = '';
        selectedGames.clear();
        
        const buttons = document.querySelectorAll('.toggle-list-btn');
        buttons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add to List';
            btn.classList.remove('selected');
        });
        
        showSuccess('List created successfully!');
        fetchUserLists(currentSteamId);
    } catch (error) {
        showError(error.message);
    }
}

async function viewGameDetails(appId) {
    const modal = document.getElementById('gameModal');
    const modalContent = document.getElementById('modalGameContent');
    
    try {
        modal.style.display = 'block';
        modalContent.innerHTML = '<div class="loading">Loading game details...</div>';
        
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(steamUrl));
        const data = await response.json();
        
        if (data.contents) {
            const gameDetails = JSON.parse(data.contents)[appId].data;
            
            document.getElementById('modalGameTitle').textContent = gameDetails.name;
            modalContent.innerHTML = `
                <div class="modal-game-details">
                    <img src="${gameDetails.header_image}" alt="${gameDetails.name}" class="modal-game-image">
                    <p class="game-description">${gameDetails.short_description || 'No description available.'}</p>
                    <div class="game-meta">
                        <p><strong>Release Date:</strong> ${gameDetails.release_date?.date || 'Unknown'}</p>
                        <p><strong>Genres:</strong> ${gameDetails.genres?.map(g => g.description).join(', ') || 'None listed'}</p>
                        ${gameDetails.metacritic ? `<p><strong>Metacritic:</strong> ${gameDetails.metacritic.score}</p>` : ''}
                        ${gameDetails.price_overview ? `<p><strong>Price:</strong> ${gameDetails.price_overview.final_formatted}</p>` : ''}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        modalContent.innerHTML = '<div class="error">Failed to load game details</div>';
    }
}

function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
}

window.onclick = (event) => {
    const modal = document.getElementById('gameModal');
    if (event.target === modal) {
        closeGameModal();
    }
};

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeGameModal();
    }
});

async function deleteList(listId) {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
        const response = await fetch(`/api/lists/${listId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete list');
        }

        showSuccess('List deleted successfully!');
        fetchUserLists(currentSteamId);
    } catch (error) {
        showError('Failed to delete list: ' + error.message);
    }
}

async function deleteGameFromList(listId, gameAppId) {
    if (!confirm('Are you sure you want to remove this game from the list?')) return;

    try {
        const response = await fetch(`/api/lists/${listId}/games/${gameAppId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to remove game from list');
        }

        showSuccess('Game removed from list successfully!');
        fetchUserLists(currentSteamId);
    } catch (error) {
        showError('Failed to remove game: ' + error.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

function displayLists(lists) {
    const container = document.getElementById('listsContainer');
    container.innerHTML = '';

    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'list-card';
        
        listElement.innerHTML = `
            <div class="list-header">
                <div class="list-title-section">
                    <h3>${escapeHtml(list.list_name)}</h3>
                    <p class="list-description">${escapeHtml(list.description || '')}</p>
                    <div class="list-meta">
                        <i class="fas fa-gamepad"></i> ${list.list_games ? list.list_games.length : 0} games
                    </div>
                </div>
                <button class="delete-button" onclick="deleteList('${list.list_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="list-games">
                ${renderListGames(list.list_games)}
            </div>
        `;
        
        container.appendChild(listElement);
    });
}

function renderListGames(games) {
    if (!games || games.length === 0) {
        return '<div class="no-games">No games in this list</div>';
    }
    
    return games.map(game => `
        <div class="list-game-card">
            <div class="game-basic-info">
                <span>${escapeHtml(game.game_name)}</span>
            </div>
            <div class="game-actions">
                <button onclick="viewGameDetails(${game.game_app_id})" class="view-details-btn">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button onclick="deleteGameFromList('${game.list_id}', ${game.game_app_id})" class="delete-button">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}