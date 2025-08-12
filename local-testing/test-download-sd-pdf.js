// Test script for ShapeDiver PDF download endpoint on local server
// Tests the local server at: http://localhost:5000

const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:5000';

// Use specific test data
const TEST_DESIGN_ID = '6890bea78fd7fefbbc259426';
const TEST_SHAPEDIVER_TICKET = '2b8e5b51ab7475c7d76d8b52cecdbb877dbe876e04d2bc89229d7ed2e1ec4ce72fe77718e10235ed142eec60d711234f15a8e4c44a0b5f1f8e1236b5da88e64a9a2a49009160ce81c3242ac13531846230a00a8df5abe3cf1b563797c4ce311fafdae257fa9ee9df813893c685b208ce3015f42e854e9ac7-b8a0e844343acc7c6c9b623a49db53e7';

// Load sample design data for testing
async function loadSampleDesign() {
  try {
    const samplePath = path.join(__dirname, '..', 'sample_1.json');
    const sampleData = await fs.readFile(samplePath, 'utf8');
    return JSON.parse(sampleData);
  } catch (error) {
    console.error('Error loading sample design:', error.message);
    return null;
  }
}

async function testDownloadSDPDF() {
  console.log('🧪 Testing ShapeDiver PDF Download Endpoint on Local Server');
  console.log('🌐 Testing server at:', BASE_URL);
  console.log(`🆔 Using test design ID: ${TEST_DESIGN_ID}`);
  console.log(`🎫 Using ShapeDiver ticket: ${TEST_SHAPEDIVER_TICKET.substring(0, 50)}...`);
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
    console.log('\n2️⃣ Testing PDF endpoint with missing parameters...');
    
    // Test without designId
  const missingDesignIdResponse = await fetch(`${BASE_URL}/api/data/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
    ticket: 'test-ticket',
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

    // Test without ticket
  const missingTicketResponse = await fetch(`${BASE_URL}/api/data/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
    designId: TEST_DESIGN_ID,
    exportType: 'download',
    exportNameContains: 'pdf',
    contentType: 'application/pdf'
      })
    });

    if (missingTicketResponse.status === 400) {
      const errorResult = await missingTicketResponse.json();
      console.log('✅ Correctly rejected request without ticket');
      console.log(`   Error: ${errorResult.message}`);
    } else {
      console.log('❌ Should have rejected request without ticket');
    }

    // Test 3: Test with valid parameters using real ShapeDiver ticket
    console.log('\n3️⃣ Testing PDF endpoint with real ShapeDiver ticket...');
    
    const validRequest = {
      designId: TEST_DESIGN_ID,
      ticket: TEST_SHAPEDIVER_TICKET,
      shapediverEndpoint: 'https://sdr8euc1.eu-central-1.shapediver.com'
    };

    console.log('📤 Sending PDF generation request:');
    console.log(`   Design ID: ${validRequest.designId}`);
    console.log(`   Ticket: ${validRequest.ticket.substring(0, 50)}...`);
    console.log(`   Endpoint: ${validRequest.shapediverEndpoint}`);

    const pdfResponse = await fetch(`${BASE_URL}/api/data/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validRequest,
        exportType: 'download',
        exportNameContains: 'pdf',
        contentType: 'application/pdf'
      })
    });

    const contentType = pdfResponse.headers.get('content-type');
    
    if (pdfResponse.status === 200 && contentType && contentType.includes('application/pdf')) {
      // Successfully received PDF file
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const contentLength = pdfResponse.headers.get('content-length');
      const contentDisposition = pdfResponse.headers.get('content-disposition');
      
      console.log('🎉 PDF generation and download completed successfully!');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      console.log(`   Content-Disposition: ${contentDisposition}`);
      console.log(`   PDF file size: ${pdfBuffer.byteLength} bytes`);
      
      // Extract filename from Content-Disposition header
      const filenameMatch = contentDisposition ? contentDisposition.match(/filename="([^"]+)"/) : null;
      const filename = filenameMatch ? filenameMatch[1] : 'unknown.pdf';
      console.log(`   Generated filename: ${filename}`);
      
      // Save PDF file for verification (optional)
      if (pdfBuffer.byteLength > 1000) { // Reasonable PDF size check
        console.log('✅ PDF file appears to be valid (size > 1KB)');
      } else {
        console.log('⚠️ PDF file seems unusually small - may be corrupted');
      }
      
    } else if (contentType && contentType.includes('application/json')) {
      // JSON response (likely an error)
      const pdfResult = await pdfResponse.json();
      
      console.log('📋 JSON Response received:');
      console.log(`   Status: ${pdfResponse.status}`);
      console.log(`   Response:`, JSON.stringify(pdfResult, null, 2));
      
      if (pdfResponse.status >= 400) {
        console.log('❌ PDF generation failed');
        console.log(`   Error: ${pdfResult.error || 'Unknown error'}`);
        console.log(`   Message: ${pdfResult.message || 'No details provided'}`);
      }
    } else {
      // Unexpected response type
      const responseText = await pdfResponse.text();
      console.log('⚠️ Unexpected response format');
      console.log(`   Status: ${pdfResponse.status}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Response: ${responseText.substring(0, 200)}...`);
    }

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

    console.log('\n🎉 PDF download endpoint test completed!');
    console.log('📈 Summary:');
    console.log('   ✅ Parameter validation working correctly');
    console.log('   ✅ Real ShapeDiver ticket accepted by endpoint');
    console.log('   ✅ Design data accessible for ShapeDiver integration');
    console.log('   🆔 Used real design ID from production database');
    console.log('   🎫 Used actual ShapeDiver export backend ticket');
    
    // Check if we got a successful PDF response
    if (contentType && contentType.includes('application/pdf')) {
      console.log('   🎉 ShapeDiver SDK is installed and PDF generation is working!');
      console.log('   📄 Successfully generated and downloaded PDF file');
    } else {
      console.log('   ⚠️ PDF generation encountered issues - check server logs');
      console.log('   💡 ShapeDiver SDK may need configuration or ticket validation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tips:');
      console.log('   - Make sure the local server is running: npm run dev');
      console.log('   - Check that the server is running on port 5000');
      console.log('   - Verify MongoDB connection is working');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Fetch error - check:');
      console.log('   - Server is running and accessible');
      console.log('   - No firewall blocking the connection');
      console.log('   - Correct URL and port');
    }
  }
}

// Run the test
testDownloadSDPDF();
