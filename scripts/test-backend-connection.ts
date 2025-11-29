/**
 * Quick script to test backend connection and API endpoints
 * Run with: npx ts-node scripts/test-backend-connection.ts
 */

import { logger } from '../utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function testBackendConnection() {
  logger.info('\n🔍 Testing NaviKid Backend Connection...\n');
  logger.info(`Backend URL: ${BASE_URL}\n`);

  try {
    // Test 1: Health Check
    logger.info('1️⃣  Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();

    if (healthData.status === 'healthy') {
      logger.info('✅ Backend is healthy');
      logger.info(`   - Database: ${healthData.services.database}`);
      logger.info(`   - Redis: ${healthData.services.redis}`);
    } else {
      console.log('⚠️  Backend is unhealthy');
      return;
    }

    // Test 2: API Info
    logger.info('\n2️⃣  Testing API info endpoint...');
    const infoResponse = await fetch(`${BASE_URL}/`);
    const infoData = await infoResponse.json();

    logger.info('✅ API info retrieved');
    logger.info(`   - Name: ${infoData.name}`);
    logger.info(`   - Version: ${infoData.version}`);

    // Test 3: Register User
    logger.info('\n3️⃣  Testing user registration...');
    const testUser = {
      email: `test-${Date.now()}@navikid.com`,
      password: 'Test@123456',
      role: 'parent',
    };

    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    const registerData = await registerResponse.json();

    if (registerData.success) {
      logger.info('✅ User registration successful');
      logger.info(`   - User ID: ${registerData.data.user.id}`);
      logger.info(`   - Email: ${registerData.data.user.email}`);
    } else {
      logger.warn('❌ User registration failed', { error: registerData.error?.message });
      return;
    }

    // Test 4: Login
    logger.info('\n4️⃣  Testing user login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginData.success) {
      logger.info('✅ User login successful');
      logger.info(`   - Access Token: ${loginData.data.tokens.accessToken.substring(0, 20)}...`);

      const accessToken = loginData.data.tokens.accessToken;

      // Test 5: Authenticated Request
      logger.info('\n5️⃣  Testing authenticated endpoint...');
      const meResponse = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const meData = await meResponse.json();

      if (meData.success) {
        logger.info('✅ Authenticated request successful');
        logger.info(`   - User: ${meData.data.user.email}`);
      } else {
        logger.warn('❌ Authenticated request failed');
      }

      // Test 6: Location Endpoint
      logger.info('\n6️⃣  Testing location endpoint...');
      const locationResponse = await fetch(`${BASE_URL}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          context: {
            batteryLevel: 85,
            isMoving: true,
          },
        }),
      });

      const locationData = await locationResponse.json();

      if (locationData.success) {
        logger.info('✅ Location submission successful');
        logger.info(`   - Location ID: ${locationData.data.id}`);
      } else {
        logger.warn('❌ Location submission failed');
      }

      // Test 7: Safe Zone Endpoint
      logger.info('\n7️⃣  Testing safe zone endpoint...');
      const safeZoneResponse = await fetch(`${BASE_URL}/safe-zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: 'Test Home',
          centerLatitude: 40.7128,
          centerLongitude: -74.006,
          radius: 200,
          type: 'home',
        }),
      });

      const safeZoneData = await safeZoneResponse.json();

      if (safeZoneData.success) {
        logger.info('✅ Safe zone creation successful');
        logger.info(`   - Safe Zone ID: ${safeZoneData.data.id}`);
      } else {
        logger.warn('❌ Safe zone creation failed');
      }

      logger.info('\n✨ All tests passed! Backend is ready for integration.\n');
    } else {
      logger.warn('❌ User login failed', { error: loginData.error?.message });
    }
  } catch (error) {
    logger.error('\n❌ Connection failed:', error as Error);
    logger.info('\n📝 Troubleshooting:');
    logger.info('   1. Make sure backend is running: cd backend && npm run dev');
    logger.info('   2. Check backend URL in .env file');
    logger.info('   3. Verify PostgreSQL and Redis are running');
    logger.info('   4. Check firewall settings\n');
  }
}

// Run the test
testBackendConnection();
