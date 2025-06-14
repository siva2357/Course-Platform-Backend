require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');

const app = express();

app.use(cors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const mongoUri = process.env.MONGO_URI_LOCAL;
mongoose.connect(mongoUri)
    .then(() => console.log("✅ Database connected"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// Routes
const authRoutes =  require('./Authentication/loginRoutes')
const instructorAuthRoutes = require('./Authentication/instructorRoutes')
const instructorProfileRoutes = require('./ProfileDetails/instructorRoutes')
const otpVerificationRoutes = require('./otp verification/otpVerificationRoutes')
const courseRoutes = require('./courses/courseRoutes');
const cartRoutes = require('./courses/cartRoutes');
const wishlistRoutes  = require('./courses/wishlistRoutes');
const changePasswordRoutes = require('./Password/changePasswordRoutes')
const forgotPasswordRoutes = require('./Password/forgotPasswordRoutes')
const studentAuthRoutes = require('./Authentication/studentRoutes')
const studentProfileRoutes = require('./ProfileDetails/studentRoutes')

app.use('/api',instructorAuthRoutes);
app.use('/api',studentAuthRoutes);

app.use('/api',authRoutes);
app.use('/api',otpVerificationRoutes)
app.use('/api',instructorProfileRoutes);
app.use('/api',studentProfileRoutes);

app.use('/api',changePasswordRoutes);
app.use('/api',forgotPasswordRoutes);

app.use('/api',courseRoutes);
app.use('/api',cartRoutes);
app.use('/api',wishlistRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Hello from the server" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started on port ${PORT}`);
});
