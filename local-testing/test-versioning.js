// Test script for versioning functionality on deployed server
// Tests the deployed server at: http://localhost:5000

const BASE_URL = 'http://localhost:5000';

// Test design that we'll create multiple versions of
const baseDesign = {
  name: "Versioning Test Design",
  designId: "versioning_test_" + Date.now(),
  geometry: {
    type: "parametric",
    parameters: {
      width: 100,
      height: 50,
      depth: 25
    }
  },
  metadata: {
    author: "Versioning Test Script",
    created: new Date().toISOString()
  }
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
      id: `${baseDesign.designId}_v1`,
      metadata: {
        ...baseDesign.metadata,
        version: "1.0",
        notes: "Initial version"
      }
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
    console.log(`   ID: ${version1.id}`);
    console.log(`   MongoDB ID: ${upload1Result.insertedId || upload1Result.id}`);

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Test 2: Upload second version with same name
    console.log('\n2️⃣ Uploading second version (same name)...');
    const version2 = {
      ...baseDesign,
      id: `${baseDesign.designId}_v2`,
      geometry: {
        ...baseDesign.geometry,
        parameters: {
          ...baseDesign.geometry.parameters,
          width: 150, // Changed parameter
          material: "aluminum"
        }
      },
      metadata: {
        ...baseDesign.metadata,
        version: "2.0",
        notes: "Updated width and added material"
      }
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
    console.log(`   ID: ${version2.id}`);
    console.log(`   MongoDB ID: ${upload2Result.insertedId || upload2Result.id}`);

    // Wait a moment again
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Test 3: Upload third version
    console.log('\n3️⃣ Uploading third version...');
    const version3 = {
      ...baseDesign,
      id: `${baseDesign.designId}_v3`,
      geometry: {
        ...baseDesign.geometry,
        parameters: {
          ...baseDesign.geometry.parameters,
          width: 200,
          height: 75,
          material: "carbon fiber",
          finish: "matte"
        }
      },
      metadata: {
        ...baseDesign.metadata,
        version: "3.0",
        notes: "Final version with carbon fiber and custom finish"
      }
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
    console.log(`   ID: ${version3.id}`);
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
      console.log(`       Width: ${version.geometry?.parameters?.width || 'N/A'}`);
      console.log(`       Version: ${version.metadata?.version || 'N/A'}`);
      console.log(`       Notes: ${version.metadata?.notes || 'N/A'}`);
    });

    // Test 5: Verify latest version in list_latest
    console.log('\n5️⃣ Verifying latest version appears in list_latest...');
    const latestListResponse = await fetch(`${BASE_URL}/api/data/list_latest`);
    
    if (latestListResponse.ok) {
      const latestListData = await latestListResponse.json();
      const foundDesign = latestListData.find(item => item.name === baseDesign.name);
      
      if (foundDesign) {
        console.log('✅ Design found in list_latest:');
        console.log(`   ID: ${foundDesign.id}`);
        console.log(`   Version count: ${foundDesign.totalVersions}`);
        console.log(`   Is latest: ${foundDesign.isLatestVersion}`);
        console.log(`   Upload time: ${foundDesign.uploadedAt}`);
        
        // Verify it's actually the latest (version 3)
        const isActuallyLatest = foundDesign.id === version3.id;
        console.log(`   ${isActuallyLatest ? '✅' : '❌'} Correctly shows latest version (v3)`);
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
      console.log(`   ID: ${specificVersion.id}`);
      console.log(`   Width: ${specificVersion.geometry?.parameters?.width || 'N/A'}`);
      console.log(`   Version: ${specificVersion.metadata?.version || 'N/A'}`);
      
      // Verify it's actually version 1
      const isVersion1 = specificVersion.id === version1.id;
      console.log(`   ${isVersion1 ? '✅' : '❌'} Correctly retrieved version 1`);
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
    console.log(`   Latest version ID: ${version3.id}`);
    console.log(`   Design name: "${baseDesign.name}"`);

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
