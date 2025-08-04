// Test script for the deployed MongoDB API endpoints on Render.com
// Tests the deployed server at: https://mongo-sd-server.onrender.com

const BASE_URL = 'https://mongo-sd-server.onrender.com';

async function testEndpoints() {
  console.log('🧪 Testing Deployed MongoDB API Endpoints');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    console.log('\n⏳ Warming up the server (Render free tier may need a moment)...');
    
    // Test 1: Health check first (and warm up the server)
    console.log('\n1️⃣ Testing /health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Health check:');
    console.log(`   Status: ${healthData.status}`);
    console.log(`   MongoDB: ${healthData.mongodb}`);
    console.log(`   Timestamp: ${healthData.timestamp}`);

    // Test 2: Get all items list
    console.log('\n2️⃣ Testing /api/data/list endpoint...');
    const listResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (!listResponse.ok) {
      throw new Error(`HTTP ${listResponse.status}: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json();
    console.log(`✅ Found ${listData.length} items:`);
    listData.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });
    if (listData.length > 10) {
      console.log(`   ... and ${listData.length - 10} more items`);
    }

    // Test 3: Search endpoint without query (should return all)
    console.log('\n3️⃣ Testing /api/data/search endpoint (no query)...');
    const searchAllResponse = await fetch(`${BASE_URL}/api/data/search`);
    
    if (!searchAllResponse.ok) {
      throw new Error(`HTTP ${searchAllResponse.status}: ${searchAllResponse.statusText}`);
    }
    
    const searchAllData = await searchAllResponse.json();
    console.log(`✅ Search results (query: "${searchAllData.query}"):`);
    console.log(`   Count: ${searchAllData.count}`);
    searchAllData.results.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });
    if (searchAllData.results.length > 5) {
      console.log(`   ... and ${searchAllData.results.length - 5} more results`);
    }

    // Test 4: Search endpoint with query
    console.log('\n4️⃣ Testing /api/data/search endpoint with query "sample"...');
    const searchQueryResponse = await fetch(`${BASE_URL}/api/data/search?q=sample&limit=10`);
    
    if (!searchQueryResponse.ok) {
      throw new Error(`HTTP ${searchQueryResponse.status}: ${searchQueryResponse.statusText}`);
    }
    
    const searchQueryData = await searchQueryResponse.json();
    console.log(`✅ Search results (query: "${searchQueryData.query}"):`);
    console.log(`   Count: ${searchQueryData.count}`);
    searchQueryData.results.forEach((item, index) => {
      console.log(`   ${index + 1}. MongoDB ID: ${item._id}, Name: "${item.name}", Author: "${item.author}"`);
    });

    console.log('\n🎉 All deployed endpoint tests completed successfully!');
    console.log(`📊 Server is running properly at: ${BASE_URL}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - The deployed server might be starting up (Render free tier)');
      console.log('   - Check Render dashboard for deployment status');
      console.log('   - Verify the service URL is correct');
    } else if (error.message.includes('503')) {
      console.log('\n💡 Service temporarily unavailable:');
      console.log('   - Server might be restarting or deploying');
      console.log('   - Check MongoDB Atlas connection');
      console.log('   - Wait a moment and try again');
    }
  }
}

// Run the tests
testEndpoints();
