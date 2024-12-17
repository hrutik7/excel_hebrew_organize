import React, { useState } from 'react';
import axios from 'axios';

const ExcelUploader = () => {
  const [file, setFile] = useState(null);
  const [rules, setRules] = useState([]);
  const [response, setResponse] = useState(null);
  const [tableData, setTableData] = useState(null); // State for table preview
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const addRule = () => {
    setRules([...rules, { column: '', condition: '', position: '' }]);
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (rules.length > 0) {
      formData.append('rules', JSON.stringify(rules.map(rule => 
        [rule.column, rule.condition, rule.position]
      )));
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponse(response.data);

      // Parse CSV or table data for display
      setTableData(response.data.preview); // Assuming `preview` contains parsed table rows.
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        (err.message === 'Network Error' ? 'Network error. Check server connection.' : 'Upload failed')
      );
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (response?.filename) {
      try {
        const downloadResponse = await axios({
          url: `/api/v1/download/${response.filename}`,
          method: 'GET',
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        setError('Download failed');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Excel File Processor</h1>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Excel File
        </label>
        <input 
          type="file" 
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Processing Rules</h2>
          <button 
            onClick={addRule}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Add Rule
          </button>
        </div>

        {rules.map((rule, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <input 
              placeholder="Column"
              value={rule.column}
              onChange={(e) => updateRule(index, 'column', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <input 
              placeholder="Condition"
              value={rule.condition}
              onChange={(e) => updateRule(index, 'condition', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <input 
              placeholder="Position"
              value={rule.position}
              onChange={(e) => updateRule(index, 'position', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button 
              onClick={() => removeRule(index)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={handleUpload}
        disabled={!file || loading}
        className={`w-full p-2 rounded ${
          !file || loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {loading ? 'Processing...' : 'Upload and Process'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {tableData && (
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Preview Data</h3>
          <table className="table-auto border-collapse border border-gray-300 w-full">
            <thead>
              <tr>
                {Object.keys(tableData[0]).map((key, idx) => (
                  <th key={idx} className="border border-gray-300 p-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="border border-gray-300 p-2">{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h3 className="font-bold text-green-700 mb-2">
            File Processed Successfully
          </h3>
          <p>Filename: {response.filename}</p>
          <button 
            onClick={handleDownload}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Download Processed File
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;