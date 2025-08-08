# MODA API Testing Suite

Comprehensive test suite for the MongoDB API Server that manages MODA (Modular Object Design Architecture) design data.

## Overview

This testing suite validates all functionality of the MODA API server, including upload, versioning, search, and deduplication features. Tests use real MODA sample files and work against both local development and production servers.

## Test Structure

```
mongo-sd-test/
├── sample_1.json           # Complex design with 10 panels (author: user-2)
├── sample_2.json           # Alternative design configuration
├── sample_3.json           # Different panel arrangement
├── sample_4.json           # Compact square layout with 4 panels (author: user-7)
├── MODA_schema.json        # MODA schema definition
├── local-testing/          # Tests for local development server
│   ├── test-list-endpoint.js    # Basic API endpoint tests
│   ├── test-upload.js           # Multi-file upload with versioning
│   ├── test-versioning.js       # Version management with MODA schema
│   ├── test-list-designs.js     # Deduplication and latest filtering
│   └── test-download-sd-pdf.js  # ShapeDiver PDF generation integration
└── deployed-testing/       # Tests for production server
    ├── test-list-endpoint.js    # Health check, list, search endpoints
    ├── test-upload.js           # Upload sample_1.json with versioning
    ├── test-versioning.js       # Create 3 versions using sample data
    ├── test-list-designs.js     # Verify deduplication works correctly
    └── test-download-sd-pdf.js  # ShapeDiver PDF generation integration
```

## Sample Data Files

### sample_1.json
- **Author**: `user-2`
- **Name**: "Sample Design 2"
- **Panels**: 10 complex panel arrangements
- **Features**: Full MODA schema with transforms and materials
- **Usage**: Primary test file for upload and versioning tests

### sample_2.json
- **Author**: `user-3`
- **Name**: "Sample Design 3" 
- **Panels**: Alternative panel configuration
- **Usage**: Multi-file upload testing

### sample_3.json
- **Author**: `user-4`
- **Name**: "Sample Design 4"
- **Panels**: Different panel arrangement
- **Usage**: Batch upload testing

### sample_4.json
- **Author**: `user-7`
- **Name**: "Another Compact Square Layout"
- **Panels**: 4 panels in compact square arrangement
- **Features**: Uses rotational transforms with 45-degree angles
- **Usage**: Compact design testing

## Running Tests

### Local Testing
Tests the local development server at `http://localhost:5000`:

```bash
# Start the API server first
cd ../mongo-sd-db
npm run dev

# Run local tests
cd ../mongo-sd-test/local-testing
node test-list-endpoint.js    # Basic API functionality
node test-upload.js           # Upload all sample files
node test-versioning.js       # Create versions using sample_1.json
node test-list-designs.js     # Test deduplication
node test-download-sd-pdf.js  # Test ShapeDiver PDF generation
```

### Production Testing  
Tests the live production server at `https://mongo-sd-server.onrender.com`:

```bash
cd deployed-testing
node test-list-endpoint.js    # Health check and basic endpoints
node test-upload.js           # Upload and version sample_1.json
node test-versioning.js       # Create 3 versions with MODA schema
node test-list-designs.js     # Verify latest version filtering
node test-download-sd-pdf.js  # Test ShapeDiver PDF generation
```

## Test Features

### MODA Schema Validation
- ✅ Tests proper `author + name` identification system
- ✅ Validates required fields: `name`, `author`, `moda-version`, `panels`
- ✅ Verifies optional fields: dimensions, patterns, materials
- ✅ No hardcoded JSON data - all tests use sample files

### Version Management
- ✅ Creates multiple versions of the same design name
- ✅ Verifies version ordering (newest first)
- ✅ Tests version history endpoints
- ✅ Validates version numbering (0 = current, 1 = previous, etc.)

### API Functionality
- ✅ Health check and database connectivity
- ✅ Upload new designs with automatic timestamping
- ✅ List all designs vs. latest versions only
- ✅ Search with query parameters
- ✅ Retrieve specific designs by ID
- ✅ Version history and specific version retrieval
- ✅ ShapeDiver PDF generation integration

### Data Integrity
- ✅ Deduplication works correctly (`list_latest` endpoint)
- ✅ Version counts match between endpoints
- ✅ Upload responses include proper MongoDB IDs
- ✅ Error handling for invalid requests

### ShapeDiver Integration
- ✅ Parameter validation (designId and ticket required)
- ✅ Real ShapeDiver export backend ticket processing
- ✅ Design data accessibility via API endpoints
- ✅ MODA schema validation for ShapeDiver consumption
- ✅ PDF generation and export result handling
- ✅ Error handling for network and processing issues

## Test Output Examples

### Successful Upload Test
```
🧪 Testing Upload Endpoint
✅ Upload successful! MongoDB ID: 6890c1748fd7fefbbc259430
✅ Design found in list: Position 11 of 11
✅ Version history retrieved: Total versions: 2
```

### Version Management Test
```
🧪 Testing Versioning System
✅ Version 1 uploaded successfully
✅ Version 2 uploaded successfully  
✅ Version 3 uploaded successfully
✅ Design found in list_latest with 3 total versions
```

### Production Database State
The tests work with real production data:
- **Total designs**: 15+ individual uploads
- **Unique designs**: 2 distinct names
- **"Sample Design 2"**: 6+ versions (author: user-2)
- **"Versioning Test Design"**: 6+ versions (author: versioning-test-script)

### ShapeDiver Test Details
```
🧪 Testing ShapeDiver PDF Download Endpoint
✅ Parameter validation working correctly
✅ Real ShapeDiver ticket accepted by endpoint  
✅ Design data accessible for ShapeDiver integration
🎉 PDF generation completed successfully!
   Session ID: af09b8d6-db9a-4f13-b334-64b9a6ae3177
   PDF Export Name: download-pdf
   ShapeDiver Version: 2.21.1
```

**Test Configuration**:
- Uses production design ID: `6890bea78fd7fefbbc259426` (Sample Design 2)
- Real ShapeDiver export backend ticket for authentication
- EU ShapeDiver server: `https://sdr8euc1.eu-central-1.shapediver.com`
- Tests both success and error conditions

## Requirements

- **Node.js** v18+ with `fetch` API support
- **Network access** to test servers
- **Sample JSON files** in the same directory as test scripts

## Notes

- Tests use the production MODA schema with author-based identification
- All sample files contain valid MODA panel data with transforms
- Tests create real data in both local and production databases
- Production tests may take longer due to Render.com cold starts
- Tests are designed to be run multiple times without conflicts
