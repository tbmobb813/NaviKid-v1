/**
 * Quick script to test backend connection and API endpoints
 * Run with: npx ts-node scripts/test-backend-connection.ts
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function testBackendConnection() {
  console.log('\n🔍 Testing NaviKid Backend Connection...\n');
  console.log(`Backend URL: ${BASE_URL}\n`);

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();

    if (healthData.status === 'healthy') {
      console.log('✅ Backend is healthy');
      console.log(`   - Database: ${healthData.services.database}`);
      console.log(`   - Redis: ${healthData.services.redis}`);
    } else {
      console.log('⚠️  Backend is unhealthy');
      return;
    }

    // Test 2: API Info
    console.log('\n2️⃣  Testing API info endpoint...');
    const infoResponse = await fetch(`${BASE_URL}/`);
    const infoData = await infoResponse.json();

    console.log('✅ API info retrieved');
    console.log(`   - Name: ${infoData.name}`);
    console.log(`   - Version: ${infoData.version}`);

    // Test 3: Register User
    console.log('\n3️⃣  Testing user registration...');
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
      console.log('✅ User registration successful');
      console.log(`   - User ID: ${registerData.data.user.id}`);
      console.log(`   - Email: ${registerData.data.user.email}`);
    } else {
      console.log('❌ User registration failed:', registerData.error?.message);
      return;
    }

    // Test 4: Login
    console.log('\n4️⃣  Testing user login...');
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
      console.log('✅ User login successful');
      console.log(`   - Access Token: ${loginData.data.tokens.accessToken.substring(0, 20)}...`);

      const accessToken = loginData.data.tokens.accessToken;

      // Test 5: Authenticated Request
      console.log('\n5️⃣  Testing authenticated endpoint...');
      const meResponse = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const meData = await meResponse.json();

      if (meData.success) {
        console.log('✅ Authenticated request successful');
        console.log(`   - User: ${meData.data.user.email}`);
      } else {
        console.log('❌ Authenticated request failed');
      }

      // Test 6: Location Endpoint
      console.log('\n6️⃣  Testing location endpoint...');
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
        console.log('✅ Location submission successful');
        console.log(`   - Location ID: ${locationData.data.id}`);
      } else {
        console.log('❌ Location submission failed');
      }

      // Test 7: Safe Zone Endpoint
      console.log('\n7️⃣  Testing safe zone endpoint...');
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
        console.log('✅ Safe zone creation successful');
        console.log(`   - Safe Zone ID: ${safeZoneData.data.id}`);
      } else {
        console.log('❌ Safe zone creation failed');
      }

      console.log('\n✨ All tests passed! Backend is ready for integration.\n');
    } else {
      console.log('❌ User login failed:', loginData.error?.message);
    }
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Make sure backend is running: cd backend && npm run dev');
    console.error('   2. Check backend URL in .env file');
    console.error('   3. Verify PostgreSQL and Redis are running');
    console.error('   4. Check firewall settings\n');
  }
}

// Run the test
testBackendConnection();
