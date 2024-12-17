import React from 'react';
import ExcelUploader from './component/Upload';
import InventoryManagementApp from './component/InventoryManagementApp';
import ExcelFileUploader from './component/ExcelFileUploader';

const App = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            {/* <ExcelUploader /> */}
            {/* <InventoryManagementApp /> */}
            <ExcelFileUploader />
        </div>
    );
};

export default App;
