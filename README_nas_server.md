# NAS Excel Downloader Server

A REST API server for downloading all Excel files (.xlsx) from NAS storage.

## Features

- 🚀 Flask-based REST API server
- 📁 Automatically scans all .xlsx files in NAS paths
- 🔐 Supports Windows network drive authentication
- 📦 Packages all Excel files into a downloadable ZIP file
- 📋 Provides file listing preview functionality
- 🛡️ Comprehensive error handling and logging
- 🧹 Automatic resource cleanup

## Installation

```bash
pip install -r requirements.txt
```

## Starting the Server

### Basic Startup
```bash
python nas_excel_downloader.py
```

### Custom Configuration Startup
```bash
python nas_excel_downloader.py --host 0.0.0.0 --port 8080 --debug
```

## API Endpoints

### 1. Health Check
- **URL**: `GET /health`
- **Description**: Check server status
- **Response**:
```json
{
    "status": "healthy",
    "timestamp": "2023-12-07T10:30:00",
    "service": "NAS Excel Downloader"
}
```

### 2. List Excel Files
- **URL**: `POST /list-xlsx`
- **Description**: List all .xlsx files in the specified NAS path
- **Request Body**:
```json
{
    "nas_path": "\\\\server\\share\\folder"
}
```
- **Response**:
```json
{
    "success": true,
    "nas_path": "\\\\server\\share\\folder",
    "files_found": 5,
    "files": [
        {
            "filename": "report.xlsx",
            "relative_path": "reports/report.xlsx",
            "size": 2048576,
            "modified_time": "2023-12-07T09:15:30"
        }
    ],
    "timestamp": "2023-12-07T10:30:00"
}
```

### 3. Download Excel Files
- **URL**: `POST /download-xlsx`
- **Description**: Download all .xlsx files from the specified NAS path, packaged as ZIP
- **Request Body**:
```json
{
    "nas_path": "\\\\server\\share\\folder"
}
```
- **Response**: ZIP file download

## Usage Examples

### Testing with curl

#### 1. Health Check
```bash
curl -X GET http://localhost:5000/health
```

#### 2. List Files
```bash
curl -X POST http://localhost:5000/list-xlsx \
  -H "Content-Type: application/json" \
  -d '{
    "nas_path": "\\\\server\\share\\folder"
  }'
```

#### 3. Download Files
```bash
curl -X POST http://localhost:5000/download-xlsx \
  -H "Content-Type: application/json" \
  -d '{
    "nas_path": "\\\\server\\share\\folder"
  }' \
  --output nas_files.zip
```

### Using Python Client

```python
from test_client import NASExcelClient

# Create client
client = NASExcelClient("http://localhost:5000")

# Health check
health = client.health_check()
print(health)

# List files
files = client.list_xlsx_files(
    nas_path="\\\\server\\share\\folder"
)

# Download files
download_path = client.download_xlsx_files(
    nas_path="\\\\server\\share\\folder"
)
```

### Using Interactive Client
```bash
python test_client.py
```

## Error Handling

The server provides detailed error information:

- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Path doesn't exist or no Excel files found
- **500 Internal Server Error**: Internal server error

Error response format:
```json
{
    "error": "Error Type",
    "message": "Detailed error message"
}
```

## Security Considerations

1. **Server Deployment**: This server should be deployed on a machine that already has access to the NAS resources
2. **Network Access**: Ensure the server has proper network connectivity to the target NAS paths
3. **Temporary Files**: All temporary files are automatically cleaned up after download completion
4. **Access Control**: It's recommended to add appropriate access control in production environments
5. **HTTPS**: Use HTTPS in production environments for secure communication

## File Structure

```
workspace/
├── nas_excel_downloader.py    # Main server file
├── test_client.py             # Test client
├── requirements.txt           # Python dependencies
└── README_nas_server.md       # Documentation
```

## Logging

The server provides detailed logging:
- INFO: General operation information
- WARNING: Warning messages
- ERROR: Error messages
- DEBUG: Debug information (only in debug mode)

## Troubleshooting

### Common Issues

1. **NAS Path Access Failed**
   - Check NAS path format (\\\\server\\share\\folder)
   - Ensure the server has proper network access to the NAS
   - Verify the server is running with appropriate permissions

2. **Excel Files Not Found**
   - Confirm .xlsx files exist in the path
   - Check file permissions and access rights

3. **Download Failed**
   - Check disk space on the server
   - Verify temporary directory permissions
   - Ensure network stability during large file operations

### Performance Optimization

- For large numbers of files, consider increasing server memory
- Parallel processing can be added by modifying the code
- Consider adding file size limits

## License

MIT License