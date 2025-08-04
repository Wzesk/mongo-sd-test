// Test script for uploading JSON data to deployed server
// Tests the deployed server at: https://mongo-sd-server.onrender.com

const BASE_URL = 'https://mongo-sd-server.onrender.com';
//read json from file
const fs = require('fs');
const path = require('path');
const testDesign = JSON.parse(fs.readFileSync(path.join(__dirname, '../sample_1.json'), 'utf8'));
//print test design to console
console.log('📄 Test Design Loaded:', testDesign);

async function testUpload() {
  console.log('🧪 Testing Upload Endpoint on Deployed Server');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    console.log('\n⏳ Warming up the server (Render free tier may need a moment)...');

    // Test 1: Upload the test design
    console.log('\n1️⃣ Testing POST /api/data/upload endpoint...');
    console.log('\n📤 Uploading test design: ${testDesign.name}');

    const uploadResponse = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDesign)
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`HTTP ${uploadResponse.status}: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log('   Response:', uploadResult);
    
    const insertedId = uploadResult.insertedId || uploadResult.id;
    console.log(`   MongoDB ID: ${insertedId}`);

    // Test 2: Verify the uploaded data by fetching it back
    console.log('\n2️⃣ Verifying uploaded data...');
    
    // First try to get it by the specific ID
    const getByIdResponse = await fetch(`${BASE_URL}/api/data/${testDesign.id}`);
    
    if (getByIdResponse.ok) {
      const fetchedData = await getByIdResponse.json();
      console.log('✅ Successfully fetched uploaded design by ID:');
      console.log(`   ID matches: ${fetchedData.id === testDesign.id}`);
      console.log(`   Name matches: ${fetchedData.name === testDesign.name}`);
      console.log(`   Design ID matches: ${fetchedData.designId === testDesign.designId}`);
      console.log(`   Has uploadedAt timestamp: ${!!fetchedData.uploadedAt}`);
      
      if (fetchedData.uploadedAt) {
        const uploadTime = new Date(fetchedData.uploadedAt);
        const now = new Date();
        const timeDiff = Math.abs(now - uploadTime);
        console.log(`   Upload timestamp: ${fetchedData.uploadedAt} (${Math.round(timeDiff/1000)}s ago)`);
      }
    } else {
      console.log('⚠️ Could not fetch by specific ID, checking in list...');
    }

    // Test 3: Check if it appears in the general list
    console.log('\n3️⃣ Checking if design appears in list...');
    const listResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      const foundInList = listData.find(item => item.id === testDesign.id);
      
      if (foundInList) {
        console.log('✅ Design found in list:');
        console.log(`   Position in list: ${listData.indexOf(foundInList) + 1} of ${listData.length}`);
        console.log(`   Upload timestamp: ${foundInList.uploadedAt || 'N/A'}`);
      } else {
        console.log('❌ Design not found in list');
        console.log(`   Total items in list: ${listData.length}`);
        console.log('   Recent items:');
        listData.slice(0, 5).forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.id} - ${item.name}`);
        });
      }
    } else {
      console.log('❌ Could not fetch list to verify');
    }

    // Test 4: Test versioning by uploading the same design again
    console.log('\n4️⃣ Testing versioning - uploading same design again...');
    
    const versionedDesign = {
      ...testDesign,
      metadata: {
        ...testDesign.metadata,
        version: "2.0",
        updated: new Date().toISOString()
      },
      geometry: {
        ...testDesign.geometry,
        parameters: {
          ...testDesign.geometry.parameters,
          width: 150, // Changed parameter
          notes: "Updated version for versioning test"
        }
      }
    };

    const versionUploadResponse = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(versionedDesign)
    });

    if (versionUploadResponse.ok) {
      const versionResult = await versionUploadResponse.json();
      console.log('✅ Version upload successful!');
      console.log(`   New MongoDB ID: ${versionResult.insertedId || versionResult.id}`);

      // Check versions
      const designName = encodeURIComponent(testDesign.name);
      const versionsResponse = await fetch(`${BASE_URL}/api/data/versions/${designName}`);
      
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        console.log('✅ Version history retrieved:');
        console.log(`   Total versions: ${versionsData.versions.length}`);
        versionsData.versions.forEach((version, index) => {
          console.log(`     Version ${index}: ${version.id} (${version.uploadedAt})`);
        });
      } else {
        console.log('⚠️ Could not retrieve version history');
      }
    } else {
      console.log('❌ Version upload failed');
    }

    console.log('\n🎉 Upload test completed successfully!');

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
testUpload();
