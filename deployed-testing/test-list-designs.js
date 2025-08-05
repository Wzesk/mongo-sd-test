// Test script for design listing and deduplication on deployed server
// Tests the deployed server at: https://mongo-sd-server.onrender.com

const BASE_URL = 'https://mongo-sd-server.onrender.com';

async function testListDesigns() {
  console.log('🧪 Testing List Designs Endpoint on Deployed Server');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    console.log('\n⏳ Warming up the server (Render free tier may need a moment)...');

    // Test 1: Get regular list (all items)
    console.log('\n1️⃣ Testing regular /api/data/list endpoint...');
    const regularListResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (!regularListResponse.ok) {
      throw new Error(`HTTP ${regularListResponse.status}: ${regularListResponse.statusText}`);
    }
    
    const regularListData = await regularListResponse.json();
    console.log(`✅ Regular list found ${regularListData.length} total items:`);
    regularListData.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}, Name: "${item.name}"`);
    });
    if (regularListData.length > 10) {
      console.log(`   ... and ${regularListData.length - 10} more items`);
    }

    // Test 2: Get latest designs only (deduplicated)
    console.log('\n2️⃣ Testing new /api/data/list_latest endpoint...');
    const latestListResponse = await fetch(`${BASE_URL}/api/data/list_latest`);
    
    if (!latestListResponse.ok) {
      throw new Error(`HTTP ${latestListResponse.status}: ${latestListResponse.statusText}`);
    }
    
    const latestListData = await latestListResponse.json();
    console.log(`✅ Design list found ${latestListData.length} unique designs:`);
    latestListData.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}, Name: "${item.name}"`);
      console.log(`      Upload Timestamp: ${item.uploadedAt || 'N/A'}`);
      console.log(`      Is Latest: ${item.isLatestVersion}`);
      console.log(`      Total Versions: ${item.totalVersions}`);
    });

    // Test 3: Verify deduplication is working
    console.log('\n3️⃣ Verification - checking version details...');
    
    // Count designs by name from regular list
    const designCounts = {};
    regularListData.forEach(item => {
      const name = item.name || 'Unnamed Item';
      designCounts[name] = (designCounts[name] || 0) + 1;
    });
    
    console.log('📊 Design version counts (from regular list):');
    Object.entries(designCounts).forEach(([name, count]) => {
      console.log(`   "${name}": ${count} version(s)`);
    });
    
    console.log('🔍 Unique designs (from list_latest):');
    latestListData.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.name}" - Latest version only`);
    });

    // Test 4: Validate that returned designs are actually the latest versions
    console.log('\n4️⃣ Validating that returned designs are actually the latest versions...');
    for (const design of latestListData.slice(0, 3)) { // Test first 3 designs
      const designName = encodeURIComponent(design.name);
      const versionsResponse = await fetch(`${BASE_URL}/api/data/versions/${designName}`);
      
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        const latestVersionId = versionsData.versions[0].id; // Version 0 is current
        const isCorrect = latestVersionId === design.id;
        
        console.log(`   ${isCorrect ? '✅' : '❌'} "${design.name}": ${isCorrect ? 'Correctly returned latest version' : 'Version mismatch!'} (${design.id})`);
      } else {
        console.log(`   ⚠️ "${design.name}": Could not verify versions`);
      }
    }

    console.log('\n🎉 List designs test completed successfully!');
    console.log('📈 Summary:');
    console.log(`   Total items in database: ${regularListData.length}`);
    console.log(`   Unique designs: ${latestListData.length}`);
    console.log(`   Duplicate versions filtered out: ${regularListData.length - latestListData.length}`);

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
testListDesigns();
