import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    firstName: String, lastName: String, email: String,
    password: String, role: String, status: String,
    emailVerified: Boolean, profileCompletion: Number,
    createdAt: Date, updatedAt: Date,
  }, { timestamps: true });

  const CategorySchema = new mongoose.Schema({
    name: String, slug: String, description: String,
    icon: String, isActive: Boolean, sortOrder: Number,
    serviceCount: Number, bookingCount: Number,
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@OMIQORA.com';
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@Royal2024', 12);
    await User.create({
      firstName: 'Royal', lastName: 'Admin',
      email: adminEmail, password: hashed,
      role: 'admin', status: 'active', emailVerified: true, profileCompletion: 100,
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Seed categories
  const cats = [
    { name: 'Photography', slug: 'photography', icon: '📸', description: 'Professional photography services', sortOrder: 1 },
    { name: 'Decoration', slug: 'decoration', icon: '🎨', description: 'Event decoration and styling', sortOrder: 2 },
    { name: 'Catering', slug: 'catering', icon: '🍽️', description: 'Food and beverage services', sortOrder: 3 },
    { name: 'Makeup', slug: 'makeup', icon: '💄', description: 'Bridal and event makeup', sortOrder: 4 },
    { name: 'Entertainment', slug: 'entertainment', icon: '🎵', description: 'Music, DJ and entertainment', sortOrder: 5 },
    { name: 'Venues', slug: 'venues', icon: '🏛️', description: 'Event venues and spaces', sortOrder: 6 },
    { name: 'Lifestyle', slug: 'lifestyle', icon: '✨', description: 'Personal lifestyle services', sortOrder: 7 },
    { name: 'Mehendi', slug: 'mehendi', icon: '🌿', description: 'Mehendi/Henna artists', sortOrder: 8 },
  ];

  for (const cat of cats) {
    await Category.findOneAndUpdate({ slug: cat.slug }, { ...cat, isActive: true, serviceCount: 0, bookingCount: 0 }, { upsert: true });
  }
  console.log('✅ Categories seeded');

  await mongoose.disconnect();
  console.log('✅ Seed complete');
}

seed().catch(err => { console.error(err); process.exit(1); });
