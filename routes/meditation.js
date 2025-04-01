// routes/meditation.js

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Meditation data - this could be stored in a database in production
const meditationData = [
    { 
        id: 'meditation-1',
        title: 'Deep Sleep', 
        author: 'Sleep Guide',
        duration: '30 min', 
        image: '/images/meditation/sleep.jpg',
        audio: '/audio/meditation/Zack.mp3',
        gradient: ['#2D46B9', '#F13C77']
    },
    { 
        id: 'meditation-2',
        title: 'Morning Clarity', 
        author: 'Mindfulness Expert',
        duration: '15 min', 
        image: '/images/meditation/Blop.jpg',
        audio: '/audio/meditation/Ligaya.mp3',
        gradient: ['#1ED760', '#0D8744']
    },
    { 
        id: 'meditation-3',
        title: 'Stress Relief', 
        author: 'Relaxation Coach',
        duration: '20 min', 
        image: '/images/meditation/cats.jpg',
        audio: '/audio/meditation/dandelions.mp3',
        gradient: ['#E8115B', '#A70F44']
    },
    { 
        id: 'meditation-4',
        title: 'Inner Peace', 
        author: 'Zen Master',
        duration: '25 min', 
        image: '/images/meditation/koyo.jpg',
        audio: '/audio/meditation/peace.mp3',
        gradient: ['#7358FF', '#3B2B88']
    }
];

// Route for the meditation page
router.get('/', (req, res) => {
    res.render('meditation', { 
        user: req.user,
        title: 'Meditation - Fitra',
        meditationData
    });
});

// API endpoint to get meditation data
router.get('/api/meditations', (req, res) => {
    res.json(meditationData);
});

// API endpoint to get a specific meditation by ID
router.get('/api/meditations/:id', (req, res) => {
    const meditation = meditationData.find(m => m.id === req.params.id);
    if (!meditation) {
        return res.status(404).json({ error: 'Meditation not found' });
    }
    res.json(meditation);
});

// Handle image serving with proper error handling
router.get('/images/meditation/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '/public/images/meditation', imageName);
    
    // Check if file exists
    fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
            // If image doesn't exist, serve a default image
            return res.sendFile(path.join(__dirname, '/public/images/meditation/default.jpg'));
        }
        
        // Serve the requested image
        res.sendFile(imagePath);
    });
});

// Handle audio serving with proper error handling
router.get('/audio/meditation/:audioName', (req, res) => {
    const audioName = req.params.audioName;
    const audioPath = path.join(__dirname, '/public/audio/meditation', audioName);
    
    // Check if file exists
    fs.access(audioPath, fs.constants.F_OK, (err) => {
        if (err) {
            // If audio doesn't exist, respond with an error
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        // Get file stats for content length
        fs.stat(audioPath, (err, stats) => {
            if (err) {
                return res.status(500).json({ error: 'Server error' });
            }
            
            // Handle range requests for audio streaming
            const range = req.headers.range;
            if (range) {
                const positions = range.replace(/bytes=/, '').split('-');
                const start = parseInt(positions[0], 10);
                const end = positions[1] ? parseInt(positions[1], 10) : stats.size - 1;
                const chunksize = (end - start) + 1;
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg'
                });
                
                const stream = fs.createReadStream(audioPath, { start, end });
                stream.pipe(res);
            } else {
                // Send whole file
                res.writeHead(200, {
                    'Content-Length': stats.size,
                    'Content-Type': 'audio/mpeg'
                });
                
                const stream = fs.createReadStream(audioPath);
                stream.pipe(res);
            }
        });
    });
});



export default router;

