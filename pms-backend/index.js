// server/index.js
import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import BoatRoutes from './Routes/boatRoute.js';
import truckRoutes from './Routes/truckRoute.js';
import vesselRoutes from './Routes/vesselRoute.js';
import userRoutes from './Routes/userRoute.js';
import cargoRoute from './Routes/cargoRoute.js';


dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('❌ MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(json());

// Test route
app.get('/', (req, res) => {
  res.send('🚢 Port Management System Backend is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Routes
app.use('/api/trucks', truckRoutes);
app.use('/api/boats', BoatRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cargo-storage', cargoRoute);
