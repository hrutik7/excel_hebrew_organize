import React, { useState } from 'react';

const InventoryManagementApp = () => {
  // State for file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [sortedLocations, setSortedLocations] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Backend URL - make this configurable
  const BACKEND_URL = 'http://localhost:5000';

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Centralized error handling
  const handleError = (message) => {
    console.error(message);
    setError(message);
    setIsLoading(false);
  };

  // Upload Excel file
  const handleUpload = async () => {
    if (!selectedFile) {
      handleError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsLoading(true);
    setError(null);

    try {
      // Add timeout and network error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server error during file upload');
      }

      const data = await response.json();
      setUploadedData(data);
      
      // Extract unique locations from uploaded data
      const uniqueLocations = [...new Set(
        data.data
          .map(item => item.מיקום)
          .filter(loc => loc && loc.trim() !== '')
      )];

      setLocations(uniqueLocations);
    } catch (err) {
      handleError(`Upload failed: ${err.message}`);
      setUploadedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort locations
  const handleSortLocations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/sort-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ locations: locations })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server error during location sorting');
      }

      const data = await response.json();
      setSortedLocations(data);
    } catch (err) {
      handleError(`Location sorting failed: ${err.message}`);
      setSortedLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component remains the same as in the previous version
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Management System</h1>

      {/* File Upload Section */}
      <div className="mb-4 flex items-center space-x-4">
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          onClick={handleUpload}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Uploading...' : 'Upload Excel File'}
        </button>

        <button
          onClick={handleSortLocations}
          disabled={isLoading }
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
        >
          {isLoading ? 'Sorting...' : 'Sort Locations'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Rest of the component remains the same */}
      {/* ... (previous implementation) ... */}
    </div>
  );
};

export default InventoryManagementApp;