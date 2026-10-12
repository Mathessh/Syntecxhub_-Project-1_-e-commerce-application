require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@chandrabazzar.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('👤 Admin user created: admin@chandrabazzar.com / admin123');

    // Create sample user
    const user = new User({
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      password: 'user123',
      role: 'user'
    });
    await user.save();
    console.log('👤 Sample user created: rahul@example.com / user123');

    // Sample Products
    const products = [
      // Rice
      {
        name: 'Basmati Rice - Premium',
        price: 180,
        category: 'Rice',
        stock: 50,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
        description: 'Long grain premium basmati rice, perfect for biryani and pulao. Aged for 2 years for the best aroma.',
        salesCount: 120
      },
      {
        name: 'Sona Masoori Rice',
        price: 65,
        category: 'Rice',
        stock: 80,
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop',
        description: 'Lightweight and aromatic medium-grain rice. Ideal for daily cooking and south Indian dishes.',
        salesCount: 95
      },
      {
        name: 'Brown Rice - Organic',
        price: 120,
        category: 'Rice',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&h=300&fit=crop',
        description: 'Healthy unpolished brown rice rich in fiber and nutrients. Great for health-conscious cooking.',
        salesCount: 45
      },
      {
        name: 'Idli Rice',
        price: 55,
        category: 'Rice',
        stock: 3,
        image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=300&fit=crop',
        description: 'Short grain parboiled rice specially processed for making soft and fluffy idlis and dosas.',
        salesCount: 60
      },

      // Oil
      {
        name: 'Sunflower Oil (1L)',
        price: 140,
        category: 'Oil',
        stock: 60,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop',
        description: 'Light and healthy refined sunflower oil. Low in saturated fats, perfect for everyday cooking.',
        salesCount: 88
      },
      {
        name: 'Groundnut Oil (1L)',
        price: 195,
        category: 'Oil',
        stock: 40,
        image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=300&fit=crop',
        description: 'Cold-pressed groundnut oil with rich flavor. Traditional oil for south Indian cooking.',
        salesCount: 72
      },
      {
        name: 'Coconut Oil (500ml)',
        price: 110,
        category: 'Oil',
        stock: 2,
        image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=300&fit=crop',
        description: 'Pure virgin coconut oil for cooking and hair care. Cold-pressed to retain nutrients.',
        salesCount: 55
      },

      // Vegetables
      {
        name: 'Fresh Tomatoes (1kg)',
        price: 40,
        category: 'Vegetables',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=300&fit=crop',
        description: 'Farm-fresh red tomatoes picked daily. Perfect for curries, salads, and chutneys.',
        salesCount: 200
      },
      {
        name: 'Onions (1kg)',
        price: 35,
        category: 'Vegetables',
        stock: 150,
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop',
        description: 'Fresh premium quality onions. Essential kitchen staple for every Indian meal.',
        salesCount: 180
      },
      {
        name: 'Potatoes (1kg)',
        price: 30,
        category: 'Vegetables',
        stock: 120,
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber50?w=400&h=300&fit=crop',
        description: 'Fresh farm potatoes perfect for curries, fries, and snacks. Versatile kitchen essential.',
        salesCount: 170
      },
      {
        name: 'Green Chillies (250g)',
        price: 15,
        category: 'Vegetables',
        stock: 4,
        image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&h=300&fit=crop',
        description: 'Fresh green chillies to add perfect spice to your dishes. Organically grown.',
        salesCount: 90
      },

      // Snacks
      {
        name: 'Masala Mixture (200g)',
        price: 60,
        category: 'Snacks',
        stock: 45,
        image: 'https://images.unsplash.com/photo-1599490659213-e2b9527b711f?w=400&h=300&fit=crop',
        description: 'Crispy and spicy traditional masala mixture. Perfect tea-time snack for the whole family.',
        salesCount: 110
      },
      {
        name: 'Banana Chips (250g)',
        price: 45,
        category: 'Snacks',
        stock: 55,
        image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=300&fit=crop',
        description: 'Crispy Kerala-style banana chips made in coconut oil. Lightly salted and crunchy.',
        salesCount: 85
      },
      {
        name: 'Murukku (200g)',
        price: 50,
        category: 'Snacks',
        stock: 35,
        image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400&h=300&fit=crop',
        description: 'Traditional crispy rice flour murukku. Hand-pressed for authentic taste and texture.',
        salesCount: 65
      },
      {
        name: 'Biscuits Variety Pack',
        price: 85,
        category: 'Snacks',
        stock: 5,
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop',
        description: 'Assorted biscuit pack with cream, digestive, and butter cookies. Family size.',
        salesCount: 50
      },

      // Beverages
      {
        name: 'Premium Tea Powder (500g)',
        price: 220,
        category: 'Beverages',
        stock: 70,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
        description: 'Strong Assam CTC tea powder for the perfect cup of chai. Rich aroma and bold flavor.',
        salesCount: 150
      },
      {
        name: 'Filter Coffee (250g)',
        price: 180,
        category: 'Beverages',
        stock: 40,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
        description: 'Authentic South Indian filter coffee blend. 80-20 coffee-chicory mix for rich decoction.',
        salesCount: 130
      },
      {
        name: 'Mango Juice (1L)',
        price: 75,
        category: 'Beverages',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop',
        description: 'Pure mango pulp juice made from Alphonso mangoes. No added preservatives.',
        salesCount: 70
      },
      {
        name: 'Buttermilk (500ml)',
        price: 25,
        category: 'Beverages',
        stock: 0,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
        description: 'Fresh spiced buttermilk with curry leaves and ginger. Natural probiotic drink.',
        salesCount: 40
      }
    ];

    await Product.insertMany(products);
    console.log(`🛍️ ${products.length} products seeded successfully!`);

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📧 Admin Login: admin@chandrabazzar.com / admin123');
    console.log('📧 User Login: rahul@example.com / user123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
