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
app.use(express.static(path.join(__dirname, 'public')));

// API routes remain the same...
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
        
        const { data: listData, error: listError } = await supabase
            .from('game_lists')
            .insert([{ user_steam_id, list_name, description }])
            .select()
            .single();

        if (listError) throw listError;

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


// Delete game from list endpoint
app.delete('/api/lists/:listId/games/:gameId', async (req, res) => {
    try {
        const { listId, gameId } = req.params;
        const gameIdInt = parseInt(gameId, 10);
        
        console.log('Delete game request:', { listId, gameId: gameIdInt });

        // Use a single delete operation with explicit conditions
        const { data, error } = await supabase
            .from('list_games')
            .delete()
            .eq('list_id', listId)
            .eq('game_app_id', gameIdInt)
            .select(); // This returns the deleted row

        if (error) {
            console.error('Supabase delete error:', error);
            return res.status(500).json({
                error: 'Database delete operation failed',
                details: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'Game not found in list'
            });
        }

        res.json({
            success: true,
            message: 'Game removed successfully',
            deletedRecord: data[0]
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Delete entire list endpoint
app.delete('/api/lists/:listId', async (req, res) => {
    try {
        const { listId } = req.params;
        
        console.log('Delete list request:', { listId });

        // First delete all games in the list
        const { error: gamesDeleteError } = await supabase
            .from('list_games')
            .delete()
            .eq('list_id', listId);

        if (gamesDeleteError) {
            console.error('Error deleting games:', gamesDeleteError);
            return res.status(500).json({
                error: 'Failed to delete games from list',
                details: gamesDeleteError.message
            });
        }

        // Then delete the list itself
        const { data, error: listDeleteError } = await supabase
            .from('game_lists')
            .delete()
            .eq('list_id', listId)
            .select(); // This returns the deleted row

        if (listDeleteError) {
            console.error('Error deleting list:', listDeleteError);
            return res.status(500).json({
                error: 'Failed to delete list',
                details: listDeleteError.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: 'List not found'
            });
        }

        res.json({
            success: true,
            message: 'List and all its games deleted successfully',
            deletedList: data[0]
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});