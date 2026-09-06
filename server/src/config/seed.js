require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Check if CEO already exists
    const ceoExists = await User.findOne({ email: 'ceo@ciphermutex.com' });
    if (ceoExists) {
      console.log('CEO user already exists. Skipping creation.');
    } else {
      await User.create({
        name: 'CEO Admin',
        email: 'ceo@ciphermutex.com',
        password: 'password123',
        role: 'CEO',
        department: 'Management',
        isActive: true,
      });
      console.log('CEO user created: ceo@ciphermutex.com / password123');
    }

    console.log('Database seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
