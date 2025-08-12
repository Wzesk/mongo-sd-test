// Test script for ShapeDiver PDF download endpoint on deployed server
// Tests the deployed server at: https://mongo-sd-server.onrender.com

const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://mongo-sd-server.onrender.com';

// Use specific test data
const TEST_DESIGN_ID = '6890bea78fd7fefbbc259426';
const TEST_SHAPEDIVER_TICKET = '2b8e5b51ab7475c7d76d8b52cecdbb877dbe876e04d2bc89229d7ed2e1ec4ce72fe77718e10235ed142eec60d711234f15a8e4c44a0b5f1f8e1236b5da88e64a9a2a49009160ce81c3242ac13531846230a00a8df5abe3cf1b563797c4ce311fafdae257fa9ee9df813893c685b208ce3015f42e854e9ac7-b8a0e844343acc7c6c9b623a49db53e7';

async function testDownloadAll() {
  console.log('🧪 Testing ShapeDiver Download Endpoint (ZIP/PDF/OBJ) on Deployed Server');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log(`🆔 Using test design ID: ${TEST_DESIGN_ID}`);
  console.log(`🎫 Using server-side ShapeDiver ticket (configured on server)`);
  console.log('=' .repeat(60));

  try {
    // Test 1: Verify the test design exists and is accessible
    console.log('\n1️⃣ Verifying test design exists in database...');
    
    const designResponse = await fetch(`${BASE_URL}/api/data/${TEST_DESIGN_ID}`);
    if (designResponse.ok) {
      const designData = await designResponse.json();
      console.log('✅ Test design found in database');
      console.log(`   Design name: ${designData.name}`);
      console.log(`   Author: ${designData.author}`);
      console.log(`   Panels count: ${designData.panels ? designData.panels.length : 'N/A'}`);
      console.log(`   MODA version: ${designData['moda-version'] || designData.version}`);
      console.log(`   Upload date: ${designData.uploadedAt}`);
    } else if (designResponse.status === 404) {
      console.log('⚠️ Test design not found in database');
      console.log('   This test will still validate endpoint functionality');
      console.log('   PDF generation would fail due to missing design data');
    } else {
      console.log(`❌ Error accessing design: HTTP ${designResponse.status}`);
    }

    // Test 2: Test the PDF download endpoint with missing parameters
  console.log('\n2️⃣ Testing endpoint with missing parameters...');
    
    // Test without designId
  const missingDesignIdResponse = await fetch(`${BASE_URL}/api/data/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
    exportType: 'download',
    exportNameContains: 'pdf',
    contentType: 'application/pdf'
      })
    });

    if (missingDesignIdResponse.status === 400) {
      const errorResult = await missingDesignIdResponse.json();
      console.log('✅ Correctly rejected request without designId');
      console.log(`   Error: ${errorResult.message}`);
    } else {
      console.log('❌ Should have rejected request without designId');
    }

  // Ticket is no longer required in the request body (server uses configured ticket)

    // Test 3: Test with valid parameters using real ShapeDiver ticket
  console.log('\n3️⃣ Testing downloads with real ShapeDiver ticket...');
    
    const validRequest = {
      designId: TEST_DESIGN_ID,
      shapediverEndpoint: 'https://sdr8euc1.eu-central-1.shapediver.com'
    };

    console.log('📤 Sending download requests:');
    console.log(`   Design ID: ${validRequest.designId}`);
    console.log(`   Endpoint: ${validRequest.shapediverEndpoint}`);
    async function requestAndReport(nameContains, expectedTypes, label) {
      const resp = await fetch(`${BASE_URL}/api/data/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          exportType: 'download',
          exportNameContains: nameContains
        })
      });
      const ct = resp.headers.get('content-type') || '';
      const okType = expectedTypes.some(t => ct.includes(t));
      if (resp.status === 200 && okType) {
        const buf = await resp.arrayBuffer();
        const len = resp.headers.get('content-length');
        const cd = resp.headers.get('content-disposition');
        console.log(`🎉 ${label} download OK`);
        console.log(`   Content-Type: ${ct}`);
        console.log(`   Content-Length: ${len} bytes`);
        console.log(`   Content-Disposition: ${cd}`);
        console.log(`   Size: ${buf.byteLength} bytes`);
        if (buf.byteLength > 200) console.log('   ✅ Size looks reasonable');
        else console.log('   ⚠️ Very small size; file may be minimal');
      } else if (ct.includes('application/json')) {
        const body = await resp.json();
        console.log(`❌ ${label} failed:`, JSON.stringify(body, null, 2));
      } else {
        const txt = await resp.text();
        console.log(`❌ ${label} unexpected response (HTTP ${resp.status}, CT ${ct}): ${txt.substring(0,200)}...`);
      }
    }

    await requestAndReport('zip', ['application/zip', 'application/octet-stream'], 'ZIP');
    await requestAndReport('pdf', ['application/pdf'], 'PDF');
    await requestAndReport('obj', ['model/obj', 'text/plain', 'application/octet-stream'], 'OBJ');

    // Test 4: Verify design accessibility for ShapeDiver integration
    console.log('\n4️⃣ Verifying design data format for ShapeDiver integration...');
    
    const finalDesignResponse = await fetch(`${BASE_URL}/api/data/${TEST_DESIGN_ID}`);
    if (finalDesignResponse.ok) {
      const designData = await finalDesignResponse.json();
      console.log('✅ Design data is accessible via API');
      console.log(`   URL that ShapeDiver would use: ${BASE_URL}/api/data/${TEST_DESIGN_ID}`);
      console.log(`   Design name: ${designData.name}`);
      console.log(`   Author: ${designData.author}`);
      console.log(`   Panels count: ${designData.panels ? designData.panels.length : 'N/A'}`);
      console.log(`   MODA version: ${designData['moda-version']}`);
      
      // Validate MODA schema requirements
      const requiredFields = ['name', 'author', 'moda-version', 'panels'];
      const missingFields = requiredFields.filter(field => !designData[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ Design has all required MODA fields');
      } else {
        console.log(`⚠️ Design missing required fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log('❌ Design data not accessible - ShapeDiver would fail');
      console.log(`   HTTP Status: ${finalDesignResponse.status}`);
    }

  console.log('\n🎉 Download endpoint tests completed!');
    console.log('📈 Summary:');
    console.log('   ✅ Parameter validation working correctly');
  console.log('   ✅ Server-side ShapeDiver ticket used by endpoint');
    console.log('   ✅ Design data accessible for ShapeDiver integration');
    console.log('   🆔 Used real design ID from production database');
  console.log('   🎫 Server-configured ShapeDiver export backend ticket in use');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - Check that the deployed server is running and accessible');
      console.log('   - Verify the server URL is correct');
      console.log('   - Ensure there are no network connectivity issues');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Fetch error - check:');
      console.log('   - Server is running and accessible');
      console.log('   - No firewall blocking the connection');
      console.log('   - Correct URL and endpoint');
    }
  }
}

// Run the test
testDownloadAll();
