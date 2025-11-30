/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Dhruv Sharma Student ID: 180876237 Date: November 30, 2025
*
********************************************************************************/

require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('./config/mongoose'); 
const bcrypt = require('bcrypt');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const sessions = {};
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

app.use((req, res, next) => {
  const sessionId = req.query?.sid || req.body?.sid || req.headers['x-session-id'];
  req.session = sessionId && sessions[sessionId] ? sessions[sessionId] : {};
  req.sessionId = sessionId;
  next();
});


app.locals.formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const h = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
};

app.locals.formatDateTimeInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const h = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${y}-${m}-${day}T${h}:${min}`;
};


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  startDate: { type: Date },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  order: { type: Number },
  userEmail: { type: String, required: true }
});
const Task = mongoose.model('Task', TaskSchema);



app.get('/', (req, res) => {
  res.render('index', { page: 'home', user: req.session.user, sid: req.sessionId });
});




app.get('/auth/login', (req, res) => {
  if (req.session.user) return res.redirect(`/dashboard?sid=${req.sessionId}`);
  res.render('index', { page: 'login', error: null, email: '', user: null, sid: req.sessionId });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    const sessionId = generateSessionId();
    sessions[sessionId] = { user: { name: user.name, email: user.email } };
    res.redirect(`/dashboard?sid=${sessionId}`);
  } catch (err) {
    res.render('index', { page: 'login', error: err.message, email, user: null, sid: req.sessionId });
  }
});


app.get('/auth/register', (req, res) => {
  if (req.session.user) return res.redirect(`/dashboard?sid=${req.sessionId}`);
  res.render('index', { page: 'register', error: null, name: '', email: '', user: null, sid: req.sessionId });
});

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const sessionId = generateSessionId();
    sessions[sessionId] = { user: { name, email } };
    res.redirect(`/dashboard?sid=${sessionId}`);
  } catch (err) {
    res.render('index', { page: 'register', error: err.message, name, email, user: null, sid: req.sessionId });
  }
});


app.get('/auth/logout', (req, res) => {
  if (req.session?.user) {
    for (const sid in sessions) if (sessions[sid] === req.session) delete sessions[sid];
  }
  res.redirect('/');
});


app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('index', { page: 'dashboard', user: req.session.user, sid: req.sessionId });
});




app.get('/tasks', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const tasks = await Task.find({ userEmail: req.session.user.email }).sort('order');
  res.render('index', { page: 'tasks', tasks, user: req.session.user, sid: req.sessionId });
});


app.get('/tasks/add', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('index', { page: 'add-task', user: req.session.user, sid: req.sessionId });
});

app.post('/tasks/add', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { title, description, startDate, dueDate } = req.body;

  const parseDateTime = dt => dt ? new Date(dt) : new Date();

  try {
    const count = await Task.countDocuments({ userEmail: req.session.user.email });
    const newTask = new Task({
      title,
      description,
      startDate: parseDateTime(startDate),
      dueDate: parseDateTime(dueDate),
      order: count + 1,
      userEmail: req.session.user.email
    });
    await newTask.save();
    res.redirect(`/tasks?sid=${req.sessionId}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/tasks?sid=${req.sessionId}`);
  }
});


app.get('/tasks/edit/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const task = await Task.findById(req.params.id);
  if (!task) return res.redirect(`/tasks?sid=${req.sessionId}`);
  res.render('index', { page: 'edit-task', task, user: req.session.user, sid: req.sessionId });
});

app.post('/tasks/edit/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { title, description, startDate, dueDate } = req.body;
  await Task.findByIdAndUpdate(req.params.id, {
    title,
    description,
    startDate: startDate ? new Date(startDate) : new Date(),
    dueDate: dueDate ? new Date(dueDate) : new Date()
  });
  res.redirect(`/tasks?sid=${req.sessionId}`);
});


app.get('/tasks/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  await Task.findByIdAndDelete(req.params.id);
  res.redirect(`/tasks?sid=${req.sessionId}`);
});

app.get('/tasks/complete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const task = await Task.findById(req.params.id);
  if (task) {
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    await task.save();
  }
  res.redirect(`/tasks?sid=${req.sessionId}`);
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<pre>' + err.stack + '</pre>');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
