const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Supabase client initialization
const supabaseUrl = 'https://oiwumbyahwxlbhbvyxgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pd3VtYnlhaHd4bGJoYnZ5eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMzU0OTIsImV4cCI6MjA0OTYxMTQ5Mn0.AYiX0-YYfFm-lsUXajv1PPpmt41-s1_k9QQr3UaLQJU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.get('/api/lists/:userId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('game_lists')
            .select('*, list_games(*)')
            .eq('user_steam_id', req.params.userId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/lists', async (req, res) => {
    try {
        const { user_steam_id, list_name, description, games } = req.body;
        
        // Insert new list
        const { data: listData, error: listError } = await supabase
            .from('game_lists')
            .insert([{ user_steam_id, list_name, description }])
            .select()
            .single();

        if (listError) throw listError;

        // Insert games if provided
        if (games && games.length > 0) {
            const gamesWithListId = games.map(game => ({
                list_id: listData.list_id,
                game_app_id: game.appid,
                game_name: game.name,
                game_image_url: game.img_icon_url
            }));

            const { error: gamesError } = await supabase
                .from('list_games')
                .insert(gamesWithListId);

            if (gamesError) throw gamesError;
        }

        res.json(listData);
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});