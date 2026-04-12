
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Use the secret from the .env file
const secret = 'gdfdsddsadsadghhhhsdsdsdansa';

// Create a dummy user payload
const payload = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

// Sign the token
const token = jwt.sign(payload, secret);
console.log('Generated Token:', token);

async function testUpload() {
  const formData = new FormData();
  
  // Create a small test image buffer (1x1 transparent pixel)
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Image, 'base64');
  
  formData.append('file', buffer, {
    filename: 'test-image.png',
    contentType: 'image/png',
  });
  formData.append('type', 'image');

  try {
    console.log('Uploading to http://localhost:4001/api/upload...');
    const response = await axios.post('http://localhost:4001/api/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Image Upload Success:', response.data);
  } catch (error) {
    console.error('Image Upload Failed:', error.response ? error.response.data : error.message);
  }

  // Test Video Upload
  const videoFormData = new FormData();
  // Small dummy MP4 buffer (header only)
  const videoBuffer = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp
    0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
    0x6d, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6f, 0x6d
  ]);
  
  videoFormData.append('file', videoBuffer, {
    filename: 'test-video.mp4',
    contentType: 'video/mp4',
  });
  videoFormData.append('type', 'video');

  try {
    console.log('Uploading video to http://localhost:4001/api/upload...');
    const response = await axios.post('http://localhost:4001/api/upload', videoFormData, {
      headers: {
        ...videoFormData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Video Upload Success:', response.data);
  } catch (error) {
    console.error('Video Upload Failed:', error.response ? error.response.data : error.message);
  }
}

// Check if backend is running before testing
axios.get('http://localhost:4001/health')
  .then(() => {
    console.log('Backend is running. Proceeding with upload test...');
    testUpload();
  })
  .catch(() => {
    console.log('Backend is NOT running on http://localhost:4001. Please start it first.');
  });
