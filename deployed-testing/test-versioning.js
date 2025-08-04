// Test script for versioning functionality on deployed server
// Tests the deployed server at: https://mongo-sd-server.onrender.com

const BASE_URL = 'https://mongo-sd-server.onrender.com';

// Read sample design from file
const fs = require('fs');
const path = require('path');
const sampleDesign = JSON.parse(fs.readFileSync(path.join(__dirname, '../sample_1.json'), 'utf8'));

// Create base design for versioning tests using MODA schema
const baseDesign = {
  name: "Versioning Test Design",
  author: "versioning-test-script",
  "moda-version": "1.0",
  "design-width-inches": sampleDesign['design-width-inches'],
  "design-height-inches": sampleDesign['design-height-inches'],
  "selected_pattern": 1,
  "selected_material": 1,
  panels: sampleDesign.panels.slice(0, 2) // Use first 2 panels from sample
};

async function testVersioning() {
  console.log('🧪 Testing Versioning System on Deployed Server');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    console.log('\n⏳ Warming up the server (Render free tier may need a moment)...');

    // Test 1: Upload initial version
    console.log('\n1️⃣ Uploading initial version...');
    const version1 = {
      ...baseDesign,
      "selected_pattern": 1
    };

    const upload1Response = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version1)
    });

    if (!upload1Response.ok) {
      throw new Error(`Upload 1 failed: HTTP ${upload1Response.status}`);
    }

    const upload1Result = await upload1Response.json();
    console.log('✅ Version 1 uploaded successfully');
    console.log(`   Name: ${version1.name}`);
    console.log(`   MongoDB ID: ${upload1Result.insertedId || upload1Result.id}`);

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Test 2: Upload second version with same name
    console.log('\n2️⃣ Uploading second version (same name)...');
    const version2 = {
      ...baseDesign,
      "selected_pattern": 2, // Changed pattern
      "selected_material": 2, // Changed material
      panels: baseDesign.panels.map(panel => ({
        ...panel,
        material: panel.material + 1 // Change panel materials
      }))
    };

    const upload2Response = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version2)
    });

    if (!upload2Response.ok) {
      throw new Error(`Upload 2 failed: HTTP ${upload2Response.status}`);
    }

    const upload2Result = await upload2Response.json();
    console.log('✅ Version 2 uploaded successfully');
    console.log(`   Name: ${version2.name}`);
    console.log(`   MongoDB ID: ${upload2Result.insertedId || upload2Result.id}`);

    // Wait a moment again
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Test 3: Upload third version
    console.log('\n3️⃣ Uploading third version...');
    const version3 = {
      ...baseDesign,
      "selected_pattern": 3, // Different pattern
      "selected_material": 3, // Different material
      "design-width-inches": baseDesign['design-width-inches'] + 12, // Wider design
      panels: baseDesign.panels.map(panel => ({
        ...panel,
        material: panel.material + 2, // Change panel materials more
        length: panel.length + 1 // Change panel length
      }))
    };

    const upload3Response = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version3)
    });

    if (!upload3Response.ok) {
      throw new Error(`Upload 3 failed: HTTP ${upload3Response.status}`);
    }

    const upload3Result = await upload3Response.json();
    console.log('✅ Version 3 uploaded successfully');
    console.log(`   Name: ${version3.name}`);
    console.log(`   MongoDB ID: ${upload3Result.insertedId || upload3Result.id}`);

    // Test 4: Retrieve version history
    console.log('\n4️⃣ Testing version history retrieval...');
    const designName = encodeURIComponent(baseDesign.name);
    const versionsResponse = await fetch(`${BASE_URL}/api/data/versions/${designName}`);

    if (!versionsResponse.ok) {
      throw new Error(`Versions retrieval failed: HTTP ${versionsResponse.status}`);
    }

    const versionsData = await versionsResponse.json();
    console.log('✅ Version history retrieved successfully:');
    console.log(`   Design name: "${versionsData.designName}"`);
    console.log(`   Total versions: ${versionsData.versions.length}`);
    console.log('   Version details:');
    
    versionsData.versions.forEach((version, index) => {
      console.log(`     Version ${index}: ${version.id}`);
      console.log(`       Uploaded: ${version.uploadedAt}`);
      console.log(`       Version Number: ${version.versionNumber}`);
      console.log(`       Is Current: ${version.isCurrent}`);
    });

    // Test 5: Verify latest version in list_latest
    console.log('\n5️⃣ Verifying latest version appears in list_latest...');
    const latestListResponse = await fetch(`${BASE_URL}/api/data/list_latest`);
    
    if (latestListResponse.ok) {
      const latestListData = await latestListResponse.json();
      const foundDesign = latestListData.find(item => item.name === baseDesign.name);
      
      if (foundDesign) {
        console.log('✅ Design found in list_latest:');
        console.log(`   MongoDB ID: ${foundDesign.id}`);
        console.log(`   Version count: ${foundDesign.totalVersions}`);
        console.log(`   Is latest: ${foundDesign.isLatestVersion}`);
        console.log(`   Upload time: ${foundDesign.uploadedAt}`);
      } else {
        console.log('❌ Design not found in latest list');
      }
    } else {
      console.log('⚠️ Could not check latest list');
    }

    // Test 6: Retrieve specific version
    console.log('\n6️⃣ Testing specific version retrieval...');
    const specificVersionResponse = await fetch(`${BASE_URL}/api/data/versions/${designName}/1`);
    
    if (specificVersionResponse.ok) {
      const specificVersion = await specificVersionResponse.json();
      console.log('✅ Specific version (version 1) retrieved:');
      console.log(`   MongoDB ID: ${specificVersion.id}`);
      console.log(`   Version Number: ${specificVersion.versionNumber}`);
      console.log(`   Is Current: ${specificVersion.isCurrent}`);
      console.log(`   Upload time: ${specificVersion.uploadedAt}`);
    } else {
      console.log('❌ Could not retrieve specific version');
    }

    // Test 7: Test version count consistency
    console.log('\n7️⃣ Verifying version count consistency...');
    const regularListResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (regularListResponse.ok) {
      const regularListData = await regularListResponse.json();
      const allVersions = regularListData.filter(item => item.name === baseDesign.name);
      
      console.log('✅ Version count verification:');
      console.log(`   Versions in regular list: ${allVersions.length}`);
      console.log(`   Versions in history endpoint: ${versionsData.versions.length}`);
      console.log(`   ${allVersions.length === versionsData.versions.length ? '✅' : '❌'} Counts match`);
      
      // Check order (should be newest first in history)
      const newestInHistory = versionsData.versions[0];
      const newestInRegular = allVersions.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
      
      const orderCorrect = newestInHistory.id === newestInRegular.id;
      console.log(`   ${orderCorrect ? '✅' : '❌'} Order consistency (newest first)`);
    }

    console.log('\n🎉 Versioning test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Total versions created: 3`);
    console.log(`   Design name: "${baseDesign.name}"`);
    console.log(`   Using MODA schema with author-based identification`);

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

// Run the test
testVersioning();
