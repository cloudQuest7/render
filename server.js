import express from 'express';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import connectDB from './config/db.js';
import User from './models/user.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import meditationRoutes from './routes/meditation.js';

// Add these lines right after imports to set up __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Then your directory setup code
// const meditationImagesDir = path.join(__dirname, 'public', 'images', 'meditation');
// if (!fs.existsSync(meditationImagesDir)) {
//     fs.mkdirSync(meditationImagesDir, { recursive: true });
// }

// Add after your imports and before routes
const recipes = [
    {
        id: 1,
        name: "Oatmeal Bowl",
        calories: 350,
        protein: 12,
        carbs: 56,
        fats: 8,
        time: "15 min",
        image: "/images/recipes/oatmeal.jpg",
        category: "breakfast",
        description: "Healthy oatmeal with fruits and nuts"
    },
    {
        id: 2,
        name: "Grilled Chicken Salad",
        calories: 420,
        protein: 35,
        carbs: 12,
        fats: 28,
        time: "20 min",
        image: "/images/recipes/chicken-salad.jpg",
        category: "lunch",
        description: "Fresh salad with grilled chicken breast"
    },
    {
        id: 3,
        name: "Salmon with Quinoa",
        calories: 480,
        protein: 42,
        carbs: 38,
        fats: 22,
        time: "25 min",
        image: "/images/recipes/salmon-quinoa.jpg",
        category: "dinner",
        description: "Grilled salmon with quinoa and vegetables"
    }
];
// Connect to MongoDB
await connectDB();

const app = express();
const PORT = 3000;


//lets user to upload files to the server
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// // Add this after your existing uploadDir setup
// const meditationDir = path.join(__dirname, 'public', 'images', 'meditation');
// if (!fs.existsSync(meditationDir)) {
//     fs.mkdirSync(meditationDir, { recursive: true });
//     console.log('Created meditation images directory:', meditationDir);
// }

// // Add after the meditation directory creation
// try {
//     // Set directory permissions (readable/writable)
//     fs.chmodSync(meditationDir, 0o755);
//     console.log('Set permissions for meditation directory');
// } catch (error) {
//     console.error('⚠️ Error setting directory permissions:', error.message);
//     // Continue running the app even if permissions fail
// }

// Ensure recipes directory exists
const recipesDir = path.join(__dirname, 'public', 'images', 'recipes');
if (!fs.existsSync(recipesDir)) {
    fs.mkdirSync(recipesDir, { recursive: true });
    console.log('Created recipes images directory:', recipesDir);
}

// Add a middleware to handle missing recipe images
app.use('/images/recipes', (req, res, next) => {
    const imagePath = path.join(__dirname, 'public', req.url);
    if (!fs.existsSync(imagePath)) {
        // Redirect to default image if requested image doesn't exist
        return res.redirect('/images/recipes/default.jpg');
    }
    next();
});


// Middleware
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(join(__dirname, "public")));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'text/javascript');
        }
    }
}));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
    }
});

// Add static middleware for serving uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Add this middleware to track current path
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

// Add this before your routes
app.use((req, res, next) => {
    // Extract the current page from the URL
    res.locals.activePage = req.path.substring(1) || 'home';
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// Registration route - add logging
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Create new user
        const user = await User.create({ username, email, password });
        
        // Log registration details
        console.log('\n=== New User Registration ===');
        console.log('Username:', username);
        console.log('Email:', email);
        console.log('Time:', new Date().toLocaleString());
        console.log('===========================\n');

        res.json({
            success: true,
            message: 'Registration successful! Please login.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});

// Login route - add logging
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (user && user.password === password) {
            // Log successful login
            console.log('\n=== User Login ===');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Time:', new Date().toLocaleString());
            console.log('=================\n');

            req.session.userId = user._id;
            res.render('home', {
                user,
                username: user.username,
                email: user.email
            });
        } else {
            // Log failed login attempt
            console.log('\n=== Failed Login Attempt ===');
            console.log('Email:', email);
            console.log('Time:', new Date().toLocaleString());
            console.log('=========================\n');

            return res.status(401).render('login', { 
                error: user ? 'Invalid password' : 'User not found'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).render('login', { 
            error: 'Login failed'
        });
    }
});

// Protected home route
app.get('/home', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }

        res.render('home', {
            user,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Error accessing home:', error);
        res.redirect('/login');
    }
});

// Fitness page route
app.get('/fitness', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }

        res.render('fitness', {
            user,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Error accessing fitness page:', error);
        res.redirect('/home');
    }
});

// Add this route to your server.js
app.get('/setting', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }
        res.render('setting', { user });
    } catch (error) {
        console.error('Error accessing settings:', error);
        res.redirect('/home');
    }
});

// Add this route with your other routes
app.get('/yoga', async (req, res) => {
    try {
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }
        
        res.render('yoga', {
            user: user,
            activePage: 'yoga'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/login');
    }
});

app.get('/session/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }

        res.render('session', {
            user,
            sessionId: req.params.id
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/yoga');
    }
});

app.get('/meditation', async (req, res) => {
    try {
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }

        res.render('meditation', {
            user,
            meditations: [], // Your meditation data here
            activePage: 'meditation', // Add this line to fix the error
            title: 'Meditation - Fitra'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/home');
    }
});

app.get('/yoga', (req, res) => {
    res.render('yoga'); // Assuming you have a yoga.ejs template
});
// Profile picture upload route
app.post('/api/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture if exists
        if (user.profilePic) {
            const oldFilePath = path.join(__dirname, 'public', user.profilePic);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update user's profile picture path
        user.profilePic = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ 
            message: 'Profile picture uploaded successfully',
            profilePic: user.profilePic 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// Delete profile picture route
app.delete('/api/delete-profile-pic', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the file if it exists
        if (user.profilePic) {
            const filePath = path.join(__dirname, 'public', user.profilePic);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('File deletion error:', err);
                }
            });
        }

        user.profilePic = null;
        await user.save();

        res.json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Store meal plans in memory (replace with database in production)
const mealPlans = new Map();

app.post('/api/meal-plan', async (req, res) => {
    try {
        const { recipeId, meal, date } = req.body;
        const userId = req.session.userId || 'guest';
        
        if (!mealPlans.has(userId)) {
            mealPlans.set(userId, {});
        }
        
        const userMeals = mealPlans.get(userId);
        userMeals[meal] = recipes.find(r => r.id === recipeId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ success: false, error: 'Failed to save meal plan' });
    }
});

// Update nutrition route to include meal plans
app.get('/nutrition', async (req, res) => {
    try {
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }
        
        const userId = req.session.userId || 'guest';
        const userMealPlan = mealPlans.get(userId) || {};
        
        res.render('nutrition', {
            user,
            mealPlan: userMealPlan,
            title: 'Nutrition - Fitra'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/home');
    }
});

app.get('/recipes', async (req, res) => {
    try {
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }

        // Get meal type from query parameter
        const mealType = req.query.meal || 'breakfast';

        // In a real app, fetch recipes from database
        const recipes = [
            {
                id: 1,
                name: "Oatmeal Bowl",
                calories: 350,
                protein: 12,
                carbs: 56,
                fats: 8,
                time: "15 min",
                image: "/images/recipes/oatmeal.jpg",
                category: "breakfast"
            },
            // Add more recipes...
        ];

        res.render('recipes', {
            user,
            recipes,
            mealType,
            title: 'Healthy Recipes - Fitra'
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/nutrition');
    }
});
// ...existing code...

// Remove the duplicate app.post('/api/meal-plan') and replace with these routes
app.post('/api/meal-plan', async (req, res) => {
    try {
        const { recipeId, meal } = req.body;
        const userId = req.session.userId || 'guest';
        
        // Find the recipe
        const recipe = recipes.find(r => r.id === parseInt(recipeId));
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                error: 'Recipe not found' 
            });
        }
        
        // Initialize user's meal plan if it doesn't exist
        if (!mealPlans.has(userId)) {
            mealPlans.set(userId, {});
        }
        
        // Add the recipe to the meal plan
        const userMeals = mealPlans.get(userId);
        userMeals[meal] = recipe;
        
        console.log(`Added ${recipe.name} to ${meal} for user ${userId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save meal plan' 
        });
    }
});

// Add DELETE route for removing meals
app.delete('/api/meal-plan', async (req, res) => {
    try {
        const { meal } = req.body;
        const userId = req.session.userId || 'guest';
        
        if (!mealPlans.has(userId)) {
            return res.status(404).json({ 
                success: false, 
                error: 'No meal plan found' 
            });
        }
        
        const userMeals = mealPlans.get(userId);
        if (userMeals[meal]) {
            delete userMeals[meal];
            console.log(`Removed ${meal} for user ${userId}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Meal not found' 
            });
        }
    } catch (error) {
        console.error('Error removing meal:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove meal' 
        });
    }
});


app.use('/images/meditation', (req, res, next) => {
    const imagePath = path.join(__dirname, 'public', req.url);
    const defaultPath = path.join(__dirname, 'public', 'images', 'meditation', 'default.jpg');
    
    // Log request for debugging
    console.log('Requesting meditation image:', req.url);
    
    if (!fs.existsSync(imagePath)) {
        console.log('Image not found, trying default:', defaultPath);
        
        if (fs.existsSync(defaultPath)) {
            // Send default image
            return res.sendFile(defaultPath);
        } else {
            // If no default image, send gradient fallback
            return res.status(404).json({
                error: 'Image not found',
                gradient: ['#2D46B9', '#F13C77']
            });
        }
    }
    next();
});

// In your route handler
app.get('/universe', (req, res) => {
    res.render('universe', {
        user: req.user,
        activePage: 'meditation'
    });
});

app.use('/meditation', meditationRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
