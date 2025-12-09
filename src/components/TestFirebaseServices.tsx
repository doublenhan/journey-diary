/**
 * Test Page for Firebase V3.0 Services
 * Quick UI to test Firebase Direct services
 */

import React, { useState } from 'react';
import { runAllTests, testCloudinaryUpload } from '../services/testFirebaseServices';

const TestFirebaseServices: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleRunTests = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    setTesting(true);
    setUploadResult(null);

    try {
      const result = await testCloudinaryUpload(uploadFile);
      setUploadResult(result);
    } catch (error) {
      console.error('Upload test failed:', error);
      setUploadResult({ error: true });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Firebase V3.0 Services Test</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Test Firebase Direct Integration services
      </p>

      {/* Main Tests */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Run All Tests</h2>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Tests: Memory CRUD, Real-time Subscription, Anniversary CRUD, Cloudinary URLs
        </p>
        
        <button
          onClick={handleRunTests}
          disabled={testing}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: testing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            marginTop: '1rem',
          }}
        >
          {testing ? '⏳ Running Tests...' : '▶️ Run All Tests'}
        </button>

        {testResults && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h3>📊 Test Results:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>Memory CRUD: {testResults.memoryCRUD ? '✅ PASS' : '❌ FAIL'}</li>
              <li>Real-time Subscription: {testResults.realTime ? '✅ PASS' : '❌ FAIL'}</li>
              <li>Anniversary CRUD: {testResults.anniversaryCRUD ? '✅ PASS' : '❌ FAIL'}</li>
              <li>Cloudinary URLs: {testResults.cloudinaryURLs ? '✅ PASS' : '❌ FAIL'}</li>
            </ul>
            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
              {Object.values(testResults).filter(Boolean).length}/{Object.keys(testResults).length} tests passed
            </p>
          </div>
        )}
      </div>

      {/* Cloudinary Upload Test */}
      <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Test Cloudinary Upload</h2>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          Upload an image directly to Cloudinary
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          style={{ marginTop: '1rem', display: 'block' }}
        />

        <button
          onClick={handleFileUpload}
          disabled={testing || !uploadFile}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: testing || !uploadFile ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing || !uploadFile ? 'not-allowed' : 'pointer',
            marginTop: '1rem',
          }}
        >
          {testing ? '⏳ Uploading...' : '📤 Upload Test Image'}
        </button>

        {uploadResult && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            {uploadResult.error ? (
              <p style={{ color: 'red' }}>❌ Upload failed - check console</p>
            ) : (
              <>
                <h3>✅ Upload Successful!</h3>
                <p style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  <strong>Public ID:</strong> {uploadResult.public_id}
                </p>
                {uploadResult.secure_url && (
                  <img 
                    src={uploadResult.secure_url} 
                    alt="Uploaded" 
                    style={{ maxWidth: '100%', marginTop: '1rem', borderRadius: '4px' }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Console Instructions */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
        <h3>💡 Console Tests</h3>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
          Open browser console and run:
        </p>
        <code style={{ 
          display: 'block', 
          padding: '0.5rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '0.85rem'
        }}>
          window.testFirebaseServices.runAllTests()
        </code>
      </div>

      {/* Check Console Message */}
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          ℹ️ Check browser console for detailed test logs
        </p>
      </div>
    </div>
  );
};

export default TestFirebaseServices;
