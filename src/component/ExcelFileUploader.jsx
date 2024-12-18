import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_PORT = process.env.NODE_ENV === 'production' 
  ? 'https://excel-hebrew-organize.onrender.com' 
  : 'http://localhost:5000';

const ExcelFileUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a valid Excel file (.xls, .xlsx)');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);

    try {
      const response = await axios.post(`${BACKEND_PORT}/api/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      setLoading(false);
      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    console.log(uploadResult,"xxxxxxx");
    if (!uploadResult) {
       
        
      setError('No processed data available to download');
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_PORT}/api/download-processed`, 
        {
          data: uploadResult.data,
          filename: uploadResult.filename || 'processed_file.xlsx'
        },
        {
          responseType: 'blob'
        }
      );

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', uploadResult.filename || 'processed_file.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed');
      console.error(err);
    }
  };

  return (
    <div className="mt-7 p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label 
          htmlFor="excel-upload" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Upload Excel File
        </label>
        
        <div className="flex items-center space-x-4">
          <input
            type="file"
            id="excel-upload"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <p className="mt-2 text-sm text-gray-500">
            Selected: {file.name}
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleFileUpload}
          disabled={!file || uploading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold 
            ${!file || uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>

        {uploadResult && (
          <button
            onClick={handleDownload}
            className="w-full py-2 px-4 rounded-md text-white font-semibold 
              bg-green-600 hover:bg-green-700 active:bg-green-800"
          >
            Download Processed File
          </button>
        )}
      </div>

      {uploadResult && (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <h3 className="text-green-800 font-bold mb-2">Upload Successful</h3>
          <pre className="text-xs overflow-x-auto">
            {/* {JSON.stringify(uploadResult, null, 2)} */}
            {loading ? (
        <div className="text-center text-lg">Loading...</div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-w-screen-lg w-[100%] bg-white shadow rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Serial Number</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Original Location</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Position 1</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Position 2</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Shelf</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Storage</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Quantity</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {uploadResult.data.map((item, index) => (
                <tr key={index}>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Name}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.Serial_Number}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Original_Location}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Position1}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Position2}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Shelf}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">{item.Storage}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.quantity}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.Customer}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.Client}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ExcelFileUploader;