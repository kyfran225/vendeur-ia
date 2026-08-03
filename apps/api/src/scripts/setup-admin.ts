import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/user.model.js';
import { CommerceMerchantModel, CommerceKnowledgeModel } from '../modules/commerce/commerce.model.js';

async function setup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);

    const email = 'kyfran6@gmail.com';
    let user = await UserModel.findOne({ email });

    if (!user) {
      console.log(`Creating new user: ${email}`);
      const passwordHash = await bcrypt.hash('admin123', 10);
      user = await UserModel.create({
        email,
        passwordHash,
        displayName: 'Franck Admin',
        roles: ['admin', 'user'],
        onboardingCompleted: true
      });
    } else {
      console.log(`User ${email} exists, updating roles and status...`);
      user.roles = ['admin', 'user'];
      user.onboardingCompleted = true;
      await user.save();
    }

    let merchant = await CommerceMerchantModel.findOne({ ownerId: user._id });
    if (!merchant) {
      console.log('Creating default merchant profile...');
      merchant = await CommerceMerchantModel.create({
        ownerId: user._id,
        businessName: 'Maat Admin Store',
        category: 'services',
        city: 'Abidjan',
        country: 'CI',
        address: 'Admin HQ',
        whatsappNumber: '+2250700000000'
      });

      await CommerceKnowledgeModel.create({
        merchantId: merchant._id,
        businessRules: {
          deliveryZones: ['Abidjan'],
          openingHours: '09:00 - 18:00',
          returnPolicy: 'Retours acceptés sous 48h.',
          paymentMethods: [
            { provider: 'Wave', number: '+2250700000000', label: 'Wave' }
          ]
        },
        customInstructions: 'Vends avec passion les produits de Maat Admin Store.'
      });
      console.log('Merchant profile created.');
    } else {
        console.log('Merchant profile already exists.');
    }

    console.log('✨ SUCCESS: Admin account and Merchant setup complete!');
    console.log(`📧 Email: ${email}`);
    console.log('🔑 Password: admin123 (if newly created)');
  } catch (err) {
    console.error('❌ ERROR during setup:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setup();
