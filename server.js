const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Initialize app
const app = express();
const port = 3020;

// Set up middleware
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/driverUserData');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});

// Define schema for users
const userSchema = new mongoose.Schema({
  Name: String,
  email: String,
  password: String
});
const Users = mongoose.model("User", userSchema);

// Define schema for drivers
const driverSchema = new mongoose.Schema({
  driverName: String,
  email: String,
  phoneNumber: String,
  licenseNumber: String,
  adharNumber: String,
  licenseImage: String, // File paths
  adharImage: String,
  carModel: String
});
const Driver = mongoose.model('Driver', driverSchema);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploads to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});
const upload = multer({ storage });

// Routes for serving HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/submit_form', (req, res) => {
  res.sendFile(path.join(__dirname, 'submit_form.html'));
});

// Handling user registration
app.post('/register', async (req, res) => {
  try {
    const { Name, email, password } = req.body;
    
    // Check if the user already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.sendFile(path.join(__dirname, 'response/registrationFailed.html'));
    }

    const user = new Users({ Name, email, password });
    await user.save();
    console.log('User saved:', user);
    res.sendFile(path.join(__dirname, 'response/registrationSuccessful.html'));
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).send('Error saving user');
  }
});

// Handling user login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email, password });
    
    if (user) {
      res.sendFile(path.join(__dirname, 'response/loginSuccessful.html'));
    } else {
      res.sendFile(path.join(__dirname, 'response/loginFailed.html'));
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

// Handling driver data submission
app.post('/submit_form', upload.fields([
  { name: 'licenseImage', maxCount: 1 },
  { name: 'adharImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      driverName,
      email,
      phoneNumber,
      licenseNumber,
      adharNumber,
      carModel
    } = req.body;

    if (!req.files['licenseImage'] || !req.files['adharImage']) {
      return res.sendFile(path.join(__dirname, 'response/submissionFailed.html'));
    }

    const licenseImage = req.files['licenseImage'][0].path;
    const adharImage = req.files['adharImage'][0].path;

    const driver = new Driver({
      driverName,
      email,
      phoneNumber,
      licenseNumber,
      adharNumber,
      licenseImage,
      adharImage,
      carModel
    });

    await driver.save();
    res.sendFile(path.join(__dirname, 'response/submissionSuccessful.html'));
  } catch (error) {
    console.error('Error submitting driver data:', error);
    res.sendFile(path.join(__dirname, 'response/submissionFailed.html'));
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
