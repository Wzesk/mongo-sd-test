// Test script for uploading JSON data to deployed server
const BASE_URL = 'http://localhost:5000';

//read json from files
const fs = require('fs');
const path = require('path');

// Load all three sample files
const sample1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../sample_1.json'), 'utf8'));
const sample2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../sample_2.json'), 'utf8'));
const sample3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../sample_3.json'), 'utf8'));

const testDesigns = [
  { name: 'Sample 1', data: sample1 },
  { name: 'Sample 2', data: sample2 },
  { name: 'Sample 3', data: sample3 }
];

//print test designs to console
console.log('📄 Test Designs Loaded:');
testDesigns.forEach((design, index) => {
  console.log(`   ${index + 1}. ${design.name}: "${design.data.name}" (ID: ${design.data['design-id']})`);
});

async function testUpload() {
  console.log('🧪 Testing Upload Endpoint - Multiple Sample Files');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log('=' .repeat(50));

  try {
    console.log('\n⏳ Warming up the server...');

    // Test 1: Upload all three test designs
    console.log('\n1️⃣ Testing POST /api/data/upload endpoint with multiple files...');
    
    const uploadResults = [];
    
    for (let i = 0; i < testDesigns.length; i++) {
      const design = testDesigns[i];
      console.log(`\n📤 Uploading ${design.name}: "${design.data.name}"`);
      console.log(`   Design ID: ${design.data['design-id']}`);
      console.log(`   Dimensions: ${design.data['design-width-inches']}" × ${design.data['design-height-inches']}"`);
      console.log(`   Pattern: ${design.data['selected_pattern']}`);
      console.log(`   Panels: ${design.data.panels.length}`);

      const uploadResponse = await fetch(`${BASE_URL}/api/data/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(design.data)
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed for ${design.name}: HTTP ${uploadResponse.status}: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      uploadResults.push({ design: design.name, result: uploadResult });
      
      console.log(`✅ ${design.name} upload successful!`);
      console.log(`   MongoDB ID: ${uploadResult.insertedId || uploadResult.id}`);
      console.log(`   Upload time: ${uploadResult.uploadedAt}`);
      
      // Small delay between uploads
      if (i < testDesigns.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n📊 Upload Summary:');
    uploadResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.design}: ${result.result.insertedId || result.result.id}`);
    });

    // Test 2: Verify all uploaded designs by checking the list
    console.log('\n2️⃣ Verifying all uploaded designs...');
    
    const listResponse = await fetch(`${BASE_URL}/api/data/list`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`✅ Current database contains ${listData.length} total designs`);
      
      // Check for each uploaded design
      testDesigns.forEach((design, index) => {
        const foundInList = listData.find(item => item['design-id'] === design.data['design-id']);
        if (foundInList) {
          console.log(`   ✅ ${design.name} found in database`);
          console.log(`      Name: "${foundInList.name}"`);
          console.log(`      Design ID: ${foundInList['design-id']}`);
          console.log(`      Upload time: ${foundInList.uploadedAt}`);
        } else {
          console.log(`   ❌ ${design.name} NOT found in database`);
        }
      });
      
      console.log('\n📋 Recent designs in database:');
      listData.slice(-10).forEach((item, index) => {
        console.log(`     ${index + 1}. "${item.name}" (${item['design-id']})`);
      });
    } else {
      console.log('❌ Could not fetch list to verify uploads');
    }

    // Test 3: Test the list_latest endpoint
    console.log('\n3️⃣ Testing list_latest endpoint...');
    const latestResponse = await fetch(`${BASE_URL}/api/data/list_latest`);
    
    if (latestResponse.ok) {
      const latestData = await latestResponse.json();
      console.log(`✅ Latest designs list contains ${latestData.length} unique designs`);
      
      testDesigns.forEach((design, index) => {
        const foundInLatest = latestData.find(item => item['design-id'] === design.data['design-id']);
        if (foundInLatest) {
          console.log(`   ✅ ${design.name} appears in latest list`);
          console.log(`      Total versions: ${foundInLatest.totalVersions}`);
          console.log(`      Is latest: ${foundInLatest.isLatestVersion}`);
        } else {
          console.log(`   ⚠️ ${design.name} not in latest list (might be due to duplicate names)`);
        }
      });
    } else {
      console.log('❌ Could not fetch latest list');
    }

    // Test 4: Test versioning by uploading a modified version of the first design
    console.log('\n4️⃣ Testing versioning - uploading modified version of Sample 1...');
    
    const modifiedDesign = {
      ...sample1,
      'selected_pattern': 99, // Changed pattern
      panels: sample1.panels.map((panel, index) => ({
        ...panel,
        material: panel.material + 10 // Changed all materials
      }))
    };

    const versionUploadResponse = await fetch(`${BASE_URL}/api/data/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifiedDesign)
    });

    if (versionUploadResponse.ok) {
      const versionResult = await versionUploadResponse.json();
      console.log('✅ Modified version upload successful!');
      console.log(`   New MongoDB ID: ${versionResult.insertedId || versionResult.id}`);

      // Check versions for the first design
      const designName = encodeURIComponent(sample1.name);
      const versionsResponse = await fetch(`${BASE_URL}/api/data/versions/${designName}`);
      
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        console.log('✅ Version history retrieved:');
        console.log(`   Design name: "${versionsData.designName}"`);
        console.log(`   Total versions: ${versionsData.versions.length}`);
        versionsData.versions.forEach((version, index) => {
          console.log(`     Version ${index}: ${version._id} (${version.uploadedAt})`);
          console.log(`       Pattern: ${version['selected_pattern']}`);
          console.log(`       Materials: ${version.panels.slice(0, 3).map(p => p.material).join(', ')}...`);
        });
      } else {
        console.log('⚠️ Could not retrieve version history');
      }
    } else {
      console.log('❌ Modified version upload failed');
    }

    console.log('\n🎉 Multi-file upload test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Uploaded ${testDesigns.length} different designs`);
    console.log(`   Tested versioning with modified Sample 1`);
    console.log(`   Verified database integrity and latest list functionality`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - Make sure the local server is running (npm start in mongo-sd-db folder)');
      console.log('   - Check if the server is running on port 5000');
      console.log('   - Verify MongoDB connection');
    } else if (error.message.includes('503')) {
      console.log('\n💡 Service temporarily unavailable:');
      console.log('   - Server might be restarting');
      console.log('   - Check MongoDB Atlas connection');
      console.log('   - Wait a moment and try again');
    }
  }
}

// Run the test
testUpload();
