// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const passport = require('passport');
const csrf = require('csurf');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Load Passport strategy
require('./config/passport')(passport);

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.set('io', io); // Share io instance across app

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo error:', err));

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later.'
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS templates
app.set('view engine', 'ejs');

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// CSRF protection
app.use(csrf({ cookie: true }));

// Flash messages
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Global template variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.csrfToken = req.csrfToken();
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/blog', require('./routes/blog'));
app.use('/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/activity', require('./routes/activity'));

// Catch 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Socket.io (basic chat example)
io.on('connection', socket => {
  console.log('🟢 New Socket.io connection');

  socket.on('chatMessage', msg => {
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

