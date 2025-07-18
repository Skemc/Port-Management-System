// server/index.js
import express, { json } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import vesselRoutes from './Routes/vesselRoute.js';
import truckRoutes from './Routes/truckRoute.js'


dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(json());

// Test route
app.get('/', (req, res) => {
  res.send('Port Management System Backend is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const vesselRoutes = require('./Routes/vessels');
app.use('/api/vessels', vesselRoutes);
// const truckRoutes = require('./Routes/trucks');
app.use('/api/trucks', truckRoutes);