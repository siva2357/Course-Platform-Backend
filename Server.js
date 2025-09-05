require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// --------------------
// Webhook RAW Parser
// --------------------
// Must be before JSON parser
app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    require('./Payment/webHookController')
);

// --------------------
// Middleware
// --------------------
app.use(cors({
    origin: [
        'http://localhost:4200',
        'https://course-platform-247f5.web.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());

// JSON & URL-encoded parsers (after webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Database Connection
// --------------------
const mongoUri = process.env.NODE_ENV === 'production'
    ? process.env.MONGO_URI
    : process.env.MONGO_URI_LOCAL;

mongoose.connect(mongoUri)
.then(() => console.log(`✅ MongoDB connected (${process.env.NODE_ENV || 'development'})`))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
});

// --------------------
// Routes
// --------------------
const routes = {
    auth: require('./Authentication/loginRoutes'),
    instructorAuth: require('./Authentication/instructorRoutes'),
    instructorProfile: require('./ProfileDetails/instructorRoutes'),
    studentAuth: require('./Authentication/studentRoutes'),
    studentProfile: require('./ProfileDetails/studentRoutes'),
    otp: require('./otp verification/otpVerificationRoutes'),
    course: require('./courses/courseRoutes'),
    cart: require('./courses/cartRoutes'),
    wishlist: require('./courses/wishlistRoutes'),
    changePassword: require('./Password/changePasswordRoutes'),
    forgotPassword: require('./Password/forgotPasswordRoutes'),
    purchase: require('./Payment/purchaseRoutes'),
    certificate: require('./Certificate/certificateRoutes'),
    courseTracking: require('./courses/courseTrackingRoutes')
};

// Mount all routes under `/api`
Object.values(routes).forEach(route => app.use('/api', route));

// Static folder for certificates
app.use('/Certificates', express.static(path.join(__dirname, 'Certificates')));

// Default root route
app.get('/', (req, res) => res.json({ message: "Hello from the server" }));

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 3200;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
