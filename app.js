// === app.js ===
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const path = require('path');
const csrf = require('csurf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const server = http.createServer(app);
const io = new Server(server);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('chatMessage', async (msg) => {
    const userId = socket.handshake.auth.userId;
    const user = await User.findById(userId);

    if (!user) return;

    const message = new Message({ sender: user._id, text: msg });
    await message.save();

    io.emit('message', {
      username: user.username,
      text: msg,
      time: message.createdAt,
    });
  });
});


const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(flash());
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.user && session.user._id) {
    socket.handshake.auth = { userId: session.user._id };
    next();
  } else {
    next(new Error("Not authenticated"));
  }
});


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

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
app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const blogRoutes = require('./routes/blog');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const chatRoutes = require('./routes/chat');

app.use('/chat', chatRoutes);
app.use('/contact', contactRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes);
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/blog', blogRoutes);
app.use('/contact', contactRoutes);
app.use('/admin', adminRoutes);
app.use('/blog', blogRoutes);


app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});
