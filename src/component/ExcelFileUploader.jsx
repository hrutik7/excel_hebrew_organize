import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

const BACKEND_PORT =
  process.env.NODE_ENV === "production"
    ? "https://excel-hebrew-organize.onrender.com"
    : "http://localhost:5000";

const ExcelFileUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState({
    Storage: true,
    Shelf: true,
    Position1: true,
    Position2: true,
    Name: true,
    Serial_Number: true,
    Original_Location: true,
    quantity: true,
    Customer: true,
    Client: true,
    Price_Per_Unit: true,
    Total_NIS: true
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    // Validate file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please upload a valid Excel file (.xls, .xlsx)");
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BACKEND_PORT}/api/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const string = response.data;
      const validate_string = string.replace(/NaN/g, "null");
      try {
        const resultArray = JSON.parse(validate_string);
        console.log(resultArray, "resultArray");
        setUploadResult(resultArray);
      } catch (error) {
        console.log("error", error);
      }
      setLoading(false);
      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    console.log(uploadResult, "xxxxxxx");
    if (!uploadResult) {
      setError("No processed data available to download");
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_PORT}/api/download-processed`,
        {
          data: uploadResult,
          filename: uploadResult.filename || "processed_file.xlsx",
        },
        {
          responseType: "blob",
        }
      );

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        uploadResult.filename || "processed_file.xlsx"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Download failed");
      console.error(err);
    }
  };

  const handleColumnToggle = (columnName) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const exportToPDF = () => {
    if (!uploadResult) {
      setError("No data available to export as PDF");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4"
      });

      // Set RTL mode and font
      doc.setR2L(true);
      doc.setFont("helvetica");

      // Process Hebrew text safely
      const processText = (text) => {
        if (!text) return '';
        if (typeof text === 'number') return text.toString();
        
        try {
          // Handle Hebrew text
          if (/[\u0590-\u05FF]/.test(text)) {
            return text.split('').reverse().join('');
          }
          return text;
        } catch (e) {
          console.error('Text processing error:', e);
          return text || '';
        }
      };

      // Only include selected columns
      const tableColumns = Object.entries(selectedColumns)
        .filter(([_, isSelected]) => isSelected)
        .map(([columnName]) => ({
          header: columnName.replace(/_/g, ' '),
          dataKey: columnName
        }));

      const tableData = uploadResult.map(item => {
        const row = {};
        Object.entries(selectedColumns)
          .filter(([columnName, isSelected]) => isSelected)
          .forEach(([columnName]) => {
            row[columnName] = processText(item[columnName]);
          });
        return row;
      });

      // Rest of your PDF generation code...
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError("Failed to generate PDF. Error: " + err.message);
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
          <p className="mt-2 text-sm text-gray-500">Selected: {file.name}</p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleFileUpload}
          disabled={!file || uploading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold 
            ${
              !file || uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>

        {uploadResult && (
         <div className="flex gap-10"> 
          <button onClick={handleDownload} className="w-full py-2 px-4 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 active:bg-green-800">
            Download Processed File
          </button>
          <button onClick={exportToPDF} className="w-full py-2 px-4 rounded-md text-white font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800">
            Export to PDF
          </button>
         </div>
        )}
      </div>
      
      {uploadResult && (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <h3 className="text-green-800 font-bold mb-2">Upload Successful</h3>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Select Columns to Display:</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(selectedColumns).map((columnName) => (
                <label key={columnName} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedColumns[columnName]}
                    onChange={() => handleColumnToggle(columnName)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {columnName.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-w-screen-lg w-[100%] bg-white shadow rounded-lg">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200">
                <tr>
                  {Object.entries(selectedColumns).map(([columnName, isSelected]) => 
                    isSelected && (
                      <th key={columnName} className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        {columnName.replace(/_/g, ' ')}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uploadResult?.map((item, index) => (
                  <tr key={index}>
                    {Object.entries(selectedColumns).map(([columnName, isSelected]) => 
                      isSelected && (
                        <td key={columnName} className="py-4 px-6 text-sm text-gray-700">
                          {item[columnName]}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelFileUploader;
