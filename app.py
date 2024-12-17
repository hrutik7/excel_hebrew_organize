from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import pandas as pd
import os
import re
from flask_cors import CORS
import io
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

app.config['DEBUG'] = True
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "CORS is working!"})

def parse_location(location_code):
    """Parse a location code like "1A-1/5" into components"""
    if pd.isna(location_code):
        return None

    try:
        # Remove any parentheses if present
        location_code = str(location_code).strip('()')

        # Split the location code into parts
        main_parts = location_code.split('-')
        if len(main_parts) != 2:
            return None  # Unexpected format, skip this location

        storage_shelf = main_parts[0]
        positions = main_parts[1].split('/')
        if len(positions) != 2:
            return None  # Unexpected format, skip this location

        # Extract components
        storage = storage_shelf[0]       # First character as storage
        shelf = storage_shelf[1]         # Second character as shelf
        pos1 = int(positions[0])         # First position number
        pos2 = int(positions[1])         # Second position number

        return {
            'Location': location_code,
            'Storage': storage,
            'Shelf': shelf,
            'Position1': pos1,
            'Position2': pos2,
        }
    except Exception:
        return None  # Skip this location if there's any issue parsing it

def process_excel_file(file_path):
    """Process Excel file and extract location information"""
    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        
       
        # Get the description column (column G, index 6)
        description_col = df.iloc[:, 6]
        serial_col = df.iloc[:,9] 
        quantity_col = df.iloc[:, 3]
        customer_col = df.iloc[:, 12]
        name_col = df.iloc[:, 6]
        client_col = df.iloc[:, 14] 
        
        # Extract location from parentheses
        def extract_location(text):
            if pd.isna(text):
                return None
            match = re.search(r'\((.*?)\)$', str(text))
            return match.group(1).strip() if match else None
        
        def extract_name(name_text):
            # Check if the value is NaN or None
            if pd.isna(name_text) or name_text is None:
                return None
            
        # def extract_client(client_text):
        #     if pd.isna(client_text):
        #         return None
        #     return re.sub(r'\s*None\s*', '', str(client_text))
        
    
    # Convert to string and remove any 'None' occurrences
            name_str = str(name_text).strip()
    
    # Remove location information in parentheses at the end
            name_str = re.sub(r'\s*\(.*\)\s*$', '', name_str)
    
    # Remove 'None' from the string
            name_str = re.sub(r'\s*None\s*', '', name_str)
    
    # Return the cleaned name, or None if the result is empty
            print(name_str if name_str else None,"name_str if name_str else None")
            return name_str if name_str else None
        
        def extract_serial(serial_text):
            if pd.isna(serial_text):
                return None
            return re.sub(r'\s*None\s*', '', str(serial_text))

        def extract_quantity(quantity_text):    
            if pd.isna(quantity_text):
                return None
            return re.sub(r'\D', '', str(quantity_text))
        
        def extract_customer(customer_text):
            if pd.isna(customer_text):
                return None
            return re.sub(r'\s*None\s*', '', str(customer_text))
        
        def extract_client(client_text):
            if pd.isna(client_text):
                return None
            return re.sub(r'\s*None\s*', '', str(client_text))
        # Extract locations and parse them
        locations = description_col.apply(extract_location)
        parsed_locations = locations.apply(lambda x: parse_location(x) if x is not None else None)
        serial_numbers = serial_col.apply(extract_serial)
        quantity = quantity_col.apply(extract_quantity)
        customers = customer_col.apply(extract_customer)
        productname = description_col.apply(extract_name)
        client = client_col.apply(extract_client)
        # Create new columns from parsed locations
        df['Original_Location'] = locations
        df['Parsed_Location'] = parsed_locations
        df['Serial_Number'] = serial_numbers
        df['Quantity'] = quantity
        df['Customer'] = customers
        df['Name'] = productname
        df['Client'] = client
        

        
# Convert the result to a list or any other format you want
        

# Output the list of catalog numbers
        
        # Expand the parsed location dictionary into separate columns
        location_columns = ['Storage', 'Shelf', 'Position1', 'Position2']
        for col in location_columns:
            df[f'Parsed_Location_{col}'] = df['Parsed_Location'].apply(
                lambda x: x[col] if x is not None else None
            )

        # Sort the dataframe using the expanded columns
        df_sorted = df.sort_values(
            by=['Parsed_Location_Storage', 'Parsed_Location_Shelf', 
                'Parsed_Location_Position1', 'Parsed_Location_Position2','Serial_Number','Quantity','Name','Customer','Client'],
            key=lambda x: pd.to_numeric(x, errors='ignore')
        )
       
       
        print(df_sorted,"laugh")
        
        return df_sorted, df_sorted.to_dict(orient='records')

    except Exception as e:
        raise ValueError(f"Error processing file: {str(e)}")


def process_excel_file_exe(file_content):
    """
    Processes the uploaded Excel file and extracts necessary columns.
    """
    try:
        # Read Excel into a DataFrame
        df = pd.read_excel(io.BytesIO(file_content))

        # Check for necessary columns
        required_columns = ['Original_Location', 'Parsed_Location']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"Missing required columns. Found columns: {list(df.columns)}")

        # Extract and expand 'Parsed_Location' into separate columns
        df['Storage'] = df['Parsed_Location'].apply(lambda x: x['Storage'] if pd.notna(x) else None)
        df['Shelf'] = df['Parsed_Location'].apply(lambda x: x['Shelf'] if pd.notna(x) else None)
        df['Position1'] = df['Parsed_Location'].apply(lambda x: x['Position1'] if pd.notna(x) else None)
        df['Position2'] = df['Parsed_Location'].apply(lambda x: x['Position2'] if pd.notna(x) else None)

        # Select and reorder required columns
        formatted_df = df[['Original_Location', 'Storage', 'Shelf', 'Position1', 'Position2']]

        # Drop rows with missing critical values
        formatted_df.dropna(subset=['Storage', 'Shelf', 'Position1', 'Position2'], inplace=True)

        # Sort the data
        formatted_df.sort_values(by=['Storage', 'Shelf', 'Position1', 'Position2'], inplace=True)

        return formatted_df
    except Exception as e:
        raise ValueError(f"Error processing file: {e}")

def format_response(data):
    """
    Format the parsed list of dictionaries to the desired structure.
    """
    # Ensure data is a list of dictionaries
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError("Invalid data format. Expected a list of dictionaries.")

    # Load data into a DataFrame
    df = pd.DataFrame(data)

    # Extract and rename the relevant columns
    required_columns = {
        "Original_Location": "Original_Location",
        "Parsed_Location_Storage": "Storage",
        "Parsed_Location_Shelf": "Shelf",
        "Parsed_Location_Position1": "Position1",
        "Parsed_Location_Position2": "Position2",
        "Serial_Number":"Serial_Number",
        "Quantity":"quantity",
        "Name":"Name",
        "Customer":"Customer",
        "Client":"Client"
    }

    # Check if all required columns are present
    if not all(col in df.columns for col in required_columns.keys()):
        raise ValueError(f"Missing required columns in data. Expected columns: {list(required_columns.keys())}")

    # Select and rename columns
    formatted_df = df[list(required_columns.keys())].rename(columns=required_columns)

    # Drop rows with missing required values
    formatted_df.dropna(subset=required_columns.values(), inplace=True)

    # Sort by the desired columns
    formatted_df.sort_values(by=["Storage", "Shelf", "Position1", "Position2","Serial_Number"], inplace=True)
    excel_filename = 'formatted_locations.xlsx'
    formatted_df.to_excel(excel_filename, index=False)
    formatted_df_json = formatted_df.to_dict(orient='records')
    return formatted_df_json

# Example data (replace this with your actual data)
    example_data = [
        {
            "Original_Location": "1B-2/1",
            "Parsed_Location_Storage": 1,
            "Parsed_Location_Shelf": "B",
            "Parsed_Location_Position1": 2.0,
            "Parsed_Location_Position2": 1.0
        },
    # Add more dictionaries here with the same structure
    ]
    
    # Format the data
    formatted_df = format_response(example_data)
    
    # Export to Excel
    
    
    print(f"Data exported to {excel_filename}")
    print("\nDataFrame Preview:")
    print(formatted_df)


# def format_response(data):
#     """
#     Format the parsed list of dictionaries to the desired structure.
#     """
#     # Ensure data is a list of dictionaries
#     if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
#         raise ValueError("Invalid data format. Expected a list of dictionaries.")

#     # Load data into a DataFrame
#     df = pd.DataFrame(data)

#     # Extract and rename the relevant columns
#     required_columns = {
#         "Original_Location": "Original_Location",
#         "Parsed_Location_Storage": "Storage",
#         "Parsed_Location_Shelf": "Shelf",
#         "Parsed_Location_Position1": "Position1",
#         "Parsed_Location_Position2": "Position2"
#     }

#     # Check if all required columns are present
#     if not all(col in df.columns for col in required_columns.keys()):
#         raise ValueError(f"Missing required columns in data. Expected columns: {list(required_columns.keys())}")

#     # Select and rename columns
#     formatted_df = df[list(required_columns.keys())].rename(columns=required_columns)

#     # Drop rows with missing required values
#     formatted_df.dropna(subset=required_columns.values(), inplace=True)

#     # Sort by the desired columns
#     formatted_df.sort_values(by=["Storage", "Shelf", "Position1", "Position2"], inplace=True)

#     return formatted_df


# Example: Process the uploaded data (replace `json_data` with your JSON response)
# json_data = { ... }  # Load the JSON response
# formatted_df = format_response(json_data)

# Save the DataFrame to Excel
# formatted_df.to_excel("formatted_output.xlsx", index=False)

@app.route('/api/upload-excel', methods=['POST'])
def upload_excel():
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        file.save(filepath)
        
        try:
            processed_df, processed_data = process_excel_file(filepath)
            
            # Save processed file to memory
            output = io.BytesIO()
            processed_df.to_excel(output, index=False)
            output.seek(0)
            
            # Optional: Remove the uploaded file after processing
            os.remove(filepath)
            formatted_df_json = format_response(processed_data)
            # catalog_number = processed_df[''].tolist()
            
            return jsonify({
                'message': 'File processed successfully',
                # 'data': processed_data,
                'filename': f'processed_{filename}',
                'data':formatted_df_json
            })
        
        except Exception as e:
            return jsonify({
                'error': str(e)
            }), 500

@app.route('/api/download-processed', methods=['POST'])
def download_processed():
    try:
        # Get data from request
        data = request.json
        filename = data.get('filename', 'formatted_location.xlsx')
        
        # Convert dict to DataFrame
        df = pd.DataFrame(data.get('data', []))
        
        # Save to memory
        output = io.BytesIO()
        df.to_excel(output, index=False)
        output.seek(0)
        
        return send_file(
            output, 
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True, 
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)