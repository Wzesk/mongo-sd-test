// Test script for the new MongoDB list endpoints
// Run this after starting the server with: npm run server

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing MongoDB List Endpoints');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get all items list
    console.log('\n1️⃣ Testing /api/data/list endpoint...');
    const listResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (!listResponse.ok) {
      throw new Error(`HTTP ${listResponse.status}: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json();
    console.log(`✅ Found ${listData.length} items:`);
    listData.forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });

    // Test 2: Search endpoint without query (should return all)
    console.log('\n2️⃣ Testing /api/data/search endpoint (no query)...');
    const searchAllResponse = await fetch(`${BASE_URL}/api/data/search`);
    
    if (!searchAllResponse.ok) {
      throw new Error(`HTTP ${searchAllResponse.status}: ${searchAllResponse.statusText}`);
    }
    
    const searchAllData = await searchAllResponse.json();
    console.log(`✅ Search results (query: "${searchAllData.query}"):`);
    console.log(`   Count: ${searchAllData.count}`);
    searchAllData.results.forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });

    // Test 3: Search endpoint with query
    console.log('\n3️⃣ Testing /api/data/search endpoint with query "test"...');
    const searchQueryResponse = await fetch(`${BASE_URL}/api/data/search?q=test&limit=10`);
    
    if (!searchQueryResponse.ok) {
      throw new Error(`HTTP ${searchQueryResponse.status}: ${searchQueryResponse.statusText}`);
    }
    
    const searchQueryData = await searchQueryResponse.json();
    console.log(`✅ Search results (query: "${searchQueryData.query}"):`);
    console.log(`   Count: ${searchQueryData.count}`);
    searchQueryData.results.forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });

    // Test 4: Health check
    console.log('\n4️⃣ Testing /health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Health check:');
    console.log(`   Status: ${healthData.status}`);
    console.log(`   MongoDB: ${healthData.mongodb}`);
    console.log(`   Timestamp: ${healthData.timestamp}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - Make sure the server is running: npm run server');
      console.log('   - Check if the server is running on port 5000');
      console.log('   - Verify MongoDB connection in your .env file');
    }
  }
}

// Run the tests
testEndpoints();
