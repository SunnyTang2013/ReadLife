#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import shutil
import subprocess
import zipfile
import tempfile
import logging
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_file, abort
from werkzeug.exceptions import BadRequest

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def parse_request_data(request):
    """
    Parse request data with robust handling for various formats
    """
    logger.info(f"Request content type: {request.content_type}")
    logger.info(f"Request data (raw bytes): {request.data}")
    
    # Try multiple parsing strategies
    import json
    
    # Strategy 1: Standard JSON parsing
    try:
        if request.is_json or request.content_type == 'application/json':
            data = request.get_json(force=True, silent=False)
            if data:
                logger.info(f"Successfully parsed JSON: {data}")
                return data
    except json.JSONDecodeError as e:
        logger.warning(f"JSON decode error: {e}")
        logger.warning(f"Error position: line {e.lineno}, column {e.colno}")
    except Exception as e:
        logger.warning(f"Standard JSON parsing failed: {e}")
    
    # Strategy 2: Decode and parse manually
    try:
        raw_data = request.data.decode('utf-8')
        logger.info(f"Raw string data: {raw_data}")
        
        # Try direct JSON parsing first
        data = json.loads(raw_data)
        logger.info(f"Successfully parsed with manual decode: {data}")
        return data
        
    except json.JSONDecodeError as e:
        logger.warning(f"Manual JSON parsing failed: {e}")
        # Log the specific character that caused the issue
        if hasattr(e, 'pos'):
            logger.warning(f"Problem at position {e.pos}: {raw_data[max(0, e.pos-10):e.pos+10]}")
    except UnicodeDecodeError as e:
        logger.error(f"Unicode decode error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in manual parsing: {e}")
    
    # Strategy 3: Try to fix common issues
    try:
        raw_data = request.data.decode('utf-8', errors='replace')
        
        # Try to fix single quotes to double quotes (but be careful with apostrophes in values)
        if raw_data.strip().startswith("'") or "': '" in raw_data or "': \"" in raw_data:
            fixed_data = raw_data.replace("'", '"')
            logger.info(f"Attempting to fix single quotes: {fixed_data}")
            data = json.loads(fixed_data)
            logger.info(f"Successfully parsed after fixing quotes: {data}")
            return data
            
    except Exception as fallback_error:
        logger.error(f"All parsing strategies failed: {fallback_error}")
    
    # If all strategies fail, provide detailed error
    raise BadRequest(
        f"Invalid JSON format. Please ensure the request body is valid JSON. "
        f"Common issues: 1) Use double quotes for strings, 2) Escape backslashes in paths (use \\\\ for UNC paths), "
        f"3) Ensure proper JSON structure. Raw data received: {request.data[:500]}"
    )

class NASExcelDownloader:
    def __init__(self):
        self.temp_dir = None

    def normalize_path(self, path_str):
        """
        Normalize various path formats to a consistent format
        Handles UNC paths, local paths, and various delimiters
        
        Args:
            path_str (str): Input path string
            
        Returns:
            str: Normalized path
        """
        if not path_str:
            raise ValueError("Path cannot be empty")
        
        # Log original path
        logger.info(f"Original path received: '{path_str}'")
        logger.info(f"Path length: {len(path_str)} characters")
        
        # Strip any surrounding whitespace
        path_str = path_str.strip()
        
        import re
        import os
        
        # Detect if this is meant to be a UNC path
        is_unc = False
        if path_str.startswith(('\\\\', '//', '\\')):
            is_unc = True
            logger.info("Detected UNC path format")
        
        # For UNC paths, normalize to Windows format
        if is_unc:
            # Convert forward slashes to backslashes
            path_str = path_str.replace('/', '\\')
            
            # Remove excessive leading backslashes
            while path_str.startswith('\\\\\\'):
                path_str = path_str[1:]
            
            # Ensure exactly two leading backslashes
            if not path_str.startswith('\\\\'):
                # Remove all leading backslashes first
                path_str = path_str.lstrip('\\')
                # Add exactly two
                path_str = '\\\\' + path_str
            
            # Clean up the rest of the path (but preserve the UNC prefix)
            prefix = path_str[:2]
            rest = path_str[2:]
            
            # Replace multiple consecutive backslashes with single
            rest = re.sub(r'\\+', r'\\', rest)
            
            # Reconstruct
            path_str = prefix + rest
        else:
            # For local paths, use OS-appropriate separator
            # Replace multiple slashes with single
            path_str = re.sub(r'[\\/]+', os.sep, path_str)
        
        # Remove trailing slashes/backslashes
        path_str = path_str.rstrip('\\/:')
        
        logger.info(f"Normalized path: '{path_str}'")
        
        # Validate the normalized path
        if is_unc and not path_str.startswith('\\\\'):
            raise ValueError(f"Invalid UNC path after normalization: {path_str}")
        
        return path_str

    def find_xlsx_files(self, nas_path):
        """
        Find all xlsx files in the NAS path
        
        Args:
            nas_path (str): NAS path to search
        
        Returns:
            list: List of xlsx file paths
        """
        xlsx_files = []
        try:
            # Normalize the path first
            normalized_path = self.normalize_path(nas_path)
            logger.info(f"Searching for xlsx files in: '{normalized_path}'")
            
            nas_dir = Path(normalized_path)
            
            # Check if path exists
            if not nas_dir.exists():
                logger.error(f"Path does not exist: '{normalized_path}'")
                # Try to provide more helpful error message
                if normalized_path.startswith('\\\\'):
                    logger.error("This appears to be a UNC path. Ensure the network share is accessible.")
                raise FileNotFoundError(f"Path does not exist: {normalized_path}")
            
            # Check if it's a directory
            if not nas_dir.is_dir():
                logger.error(f"Path is not a directory: '{normalized_path}'")
                raise NotADirectoryError(f"Path is not a directory: {normalized_path}")
            
            # Find all .xlsx files recursively
            xlsx_files = list(nas_dir.rglob("*.xlsx"))
            logger.info(f"Found {len(xlsx_files)} xlsx files in {normalized_path}")
            
            # Log first few files for debugging
            if xlsx_files:
                logger.debug(f"First few files found: {[str(f) for f in xlsx_files[:3]]}")
            
        except Exception as e:
            logger.error(f"Error finding xlsx files: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            raise
            
        return xlsx_files

    def copy_xlsx_files(self, xlsx_files, nas_path):
        """
        Copy xlsx files to temporary directory
        
        Args:
            xlsx_files (list): List of xlsx file paths
            nas_path (str): Original NAS path
        
        Returns:
            str: Path to temporary directory containing copied files
        """
        try:
            # Create temporary directory
            self.temp_dir = tempfile.mkdtemp(prefix="nas_xlsx_")
            temp_path = Path(self.temp_dir)
            
            # Normalize the NAS path for consistent comparison
            normalized_nas_path = self.normalize_path(nas_path)
            nas_base = Path(normalized_nas_path)
            
            files_copied = 0
            
            for xlsx_file in xlsx_files:
                try:
                    # Calculate relative path to maintain directory structure
                    relative_path = xlsx_file.relative_to(nas_base)
                    target_file = temp_path / relative_path
                    
                    # Create parent directory for target file
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(xlsx_file, target_file)
                    logger.debug(f"Copied: {relative_path}")
                    files_copied += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to copy {xlsx_file}: {str(e)}")
                    continue
            
            logger.info(f"Successfully copied {files_copied} xlsx files to {self.temp_dir}")
            return self.temp_dir
            
        except Exception as e:
            logger.error(f"Error copying xlsx files: {str(e)}")
            self.cleanup_temp_dir()
            raise

    def create_zip_archive(self, temp_dir):
        """
        Create zip archive from temporary directory
        
        Args:
            temp_dir (str): Path to temporary directory
        
        Returns:
            str: Path to zip archive
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_path = os.path.join(tempfile.gettempdir(), f"nas_xlsx_files_{timestamp}.zip")
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                temp_path = Path(temp_dir)
                
                for file_path in temp_path.rglob("*"):
                    if file_path.is_file():
                        # Calculate relative path for archive
                        arcname = file_path.relative_to(temp_path)
                        zipf.write(file_path, arcname)
                        logger.debug(f"Added to zip: {arcname}")
            
            logger.info(f"Created zip archive: {zip_path}")
            return zip_path
            
        except Exception as e:
            logger.error(f"Error creating zip archive: {str(e)}")
            raise

    def cleanup_temp_dir(self):
        """Clean up temporary directory"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {str(e)}")
            finally:
                self.temp_dir = None

    def cleanup_all(self):
        """Clean up all resources"""
        # Clean up temporary directory
        self.cleanup_temp_dir()

# Global instance
downloader = NASExcelDownloader()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'NAS Excel Downloader'
    })

@app.route('/test-json', methods=['POST'])
def test_json():
    """Test JSON parsing endpoint for debugging"""
    try:
        data = parse_request_data(request)
        return jsonify({
            'success': True,
            'message': 'JSON parsed successfully',
            'received_data': data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/test-path', methods=['POST'])
def test_path():
    """Test path normalization endpoint for debugging"""
    try:
        data = parse_request_data(request)
        nas_path = data.get('nas_path')
        
        if not nas_path:
            raise BadRequest("nas_path is required")
        
        # Test path normalization
        normalized = downloader.normalize_path(nas_path)
        
        # Test if path exists
        path_obj = Path(normalized)
        exists = path_obj.exists()
        is_dir = path_obj.is_dir() if exists else False
        
        return jsonify({
            'success': True,
            'original_path': nas_path,
            'normalized_path': normalized,
            'path_exists': exists,
            'is_directory': is_dir,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'timestamp': datetime.now().isoformat()
        }), 400

@app.route('/download-xlsx', methods=['POST'])
def download_xlsx_files():
    """
    Download all xlsx files from specified NAS path
    
    Expected JSON payload:
    {
        "nas_path": "\\\\server\\share\\folder"
    }
    
    Returns:
        ZIP file containing all xlsx files or error message
    """
    try:
        # Parse request data with fallback handling
        data = parse_request_data(request)
        
        # Validate required parameters
        nas_path = data.get('nas_path')
        
        if not nas_path:
            raise BadRequest("nas_path is required")
        
        logger.info(f"Starting xlsx download from: {nas_path}")
        
        # Find all xlsx files
        xlsx_files = downloader.find_xlsx_files(nas_path)
        
        if not xlsx_files:
            return jsonify({
                'error': 'No xlsx files found',
                'message': f'No Excel files found in {nas_path}',
                'files_found': 0
            }), 404
        
        # Copy files to temporary directory
        temp_dir = downloader.copy_xlsx_files(xlsx_files, nas_path)
        
        # Create zip archive
        zip_path = downloader.create_zip_archive(temp_dir)
        
        # Generate download filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        download_filename = f"nas_xlsx_files_{timestamp}.zip"
        
        logger.info(f"Successfully prepared {len(xlsx_files)} xlsx files for download")
        
        # Send file and cleanup after sending
        def cleanup_after_send():
            try:
                if os.path.exists(zip_path):
                    os.remove(zip_path)
                downloader.cleanup_temp_dir()
            except Exception as e:
                logger.warning(f"Cleanup error: {str(e)}")
        
        response = send_file(
            zip_path,
            as_attachment=True,
            download_name=download_filename,
            mimetype='application/zip'
        )
        
        # Schedule cleanup (note: this is basic cleanup, for production use consider background task)
        @response.call_on_close
        def cleanup_files():
            cleanup_after_send()
        
        return response
        
    except BadRequest as e:
        logger.warning(f"Bad request: {str(e)}")
        return jsonify({
            'error': 'Bad Request',
            'message': str(e)
        }), 400
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        return jsonify({
            'error': 'Path not found',
            'message': str(e)
        }), 404
        
    except PermissionError as e:
        logger.error(f"Permission error: {str(e)}")
        return jsonify({
            'error': 'Permission denied',
            'message': 'Access denied to the specified path'
        }), 403
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/list-xlsx', methods=['POST'])
def list_xlsx_files():
    """
    List all xlsx files from specified NAS path without downloading
    
    Expected JSON payload:
    {
        "nas_path": "\\\\server\\share\\folder"
    }
    
    Returns:
        JSON with list of xlsx files
    """
    try:
        # Parse request data with fallback handling
        data = parse_request_data(request)
        
        # Validate required parameters
        nas_path = data.get('nas_path')
        
        if not nas_path:
            raise BadRequest("nas_path is required")
        
        logger.info(f"Listing xlsx files from: {nas_path}")
        
        # Find all xlsx files (find_xlsx_files will normalize the path)
        xlsx_files = downloader.find_xlsx_files(nas_path)
        
        # Convert paths to relative paths for response
        normalized_nas_path = downloader.normalize_path(nas_path)
        nas_base = Path(normalized_nas_path)
        file_list = []
        
        for xlsx_file in xlsx_files:
            relative_path = xlsx_file.relative_to(nas_base)
            file_info = {
                'filename': xlsx_file.name,
                'relative_path': str(relative_path),
                'size': xlsx_file.stat().st_size if xlsx_file.exists() else 0,
                'modified_time': datetime.fromtimestamp(
                    xlsx_file.stat().st_mtime
                ).isoformat() if xlsx_file.exists() else None
            }
            file_list.append(file_info)
        
        return jsonify({
            'success': True,
            'nas_path': nas_path,
            'files_found': len(file_list),
            'files': file_list,
            'timestamp': datetime.now().isoformat()
        })
        
    except BadRequest as e:
        logger.warning(f"Bad request: {str(e)}")
        return jsonify({
            'error': 'Bad Request',
            'message': str(e)
        }), 400
        
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        return jsonify({
            'error': 'Path not found',
            'message': str(e)
        }), 404
        
    except PermissionError as e:
        logger.error(f"Permission error: {str(e)}")
        return jsonify({
            'error': 'Permission denied',
            'message': 'Access denied to the specified path'
        }), 403
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method Not Allowed',
        'message': 'The method is not allowed for the requested URL'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An internal server error occurred'
    }), 500

def cleanup_on_exit():
    """Cleanup function to be called on exit"""
    logger.info("Cleaning up resources...")
    downloader.cleanup_all()

import atexit
atexit.register(cleanup_on_exit)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description="NAS Excel File Downloader Server")
    parser.add_argument(
        '--host', 
        default='0.0.0.0',
        help='Host to bind to (default: 0.0.0.0)'
    )
    parser.add_argument(
        '--port', 
        type=int, 
        default=5000,
        help='Port to bind to (default: 5000)'
    )
    parser.add_argument(
        '--debug', 
        action='store_true',
        help='Enable debug mode'
    )
    
    args = parser.parse_args()
    
    logger.info(f"Starting NAS Excel Downloader Server on {args.host}:{args.port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  POST /test-json - Test JSON parsing")
    logger.info("  POST /test-path - Test path normalization")
    logger.info("  POST /list-xlsx - List xlsx files")
    logger.info("  POST /download-xlsx - Download xlsx files as zip")
    
    try:
        app.run(
            host=args.host, 
            port=args.port, 
            debug=args.debug,
            threaded=True
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
    finally:
        cleanup_on_exit()