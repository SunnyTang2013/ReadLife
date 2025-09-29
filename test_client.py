#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import os
from datetime import datetime

class NASExcelClient:
    def __init__(self, server_url="http://localhost:5000"):
        self.server_url = server_url.rstrip('/')
        self.session = requests.Session()
    
    def health_check(self):
        """Check if the server is healthy"""
        try:
            response = self.session.get(f"{self.server_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Health check failed: {str(e)}")
            return None
    
    def list_xlsx_files(self, nas_path):
        """List all xlsx files in the NAS path"""
        try:
            payload = {
                "nas_path": nas_path
            }
            
            response = self.session.post(
                f"{self.server_url}/list-xlsx",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            try:
                error_info = response.json()
                print(f"Error details: {error_info}")
                return error_info
            except:
                return None
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None
    
    def download_xlsx_files(self, nas_path, download_path="."):
        """Download all xlsx files from NAS path as a zip file"""
        try:
            payload = {
                "nas_path": nas_path
            }
            
            response = self.session.post(
                f"{self.server_url}/download-xlsx",
                json=payload,
                headers={'Content-Type': 'application/json'},
                stream=True
            )
            response.raise_for_status()
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nas_xlsx_files_{timestamp}.zip"
            filepath = os.path.join(download_path, filename)
            
            # Download file
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = os.path.getsize(filepath)
            print(f"Successfully downloaded: {filename}")
            print(f"File size: {file_size} bytes")
            print(f"Saved to: {filepath}")
            
            return filepath
            
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            try:
                error_info = response.json()
                print(f"Error details: {error_info}")
                return None
            except:
                return None
        except Exception as e:
            print(f"Download failed: {str(e)}")
            return None

def main():
    """Test client example"""
    # Initialize client
    client = NASExcelClient("http://localhost:5000")
    
    # Check server health
    print("=== Health Check ===")
    health = client.health_check()
    if health:
        print(f"Server status: {health['status']}")
        print(f"Service: {health['service']}")
        print(f"Timestamp: {health['timestamp']}")
    else:
        print("Server is not responding")
        return
    
    print("\n" + "="*50)
    
    # Example usage - modify these parameters according to your needs
    nas_path = input("Enter NAS path (e.g., \\\\server\\share\\folder): ").strip()
    if not nas_path:
        print("NAS path is required")
        return
    
    # List xlsx files first
    print(f"\n=== Listing xlsx files in {nas_path} ===")
    file_list = client.list_xlsx_files(nas_path)
    
    if file_list and file_list.get('success'):
        print(f"Found {file_list['files_found']} xlsx files:")
        for file_info in file_list['files']:
            print(f"  - {file_info['filename']} ({file_info['size']} bytes)")
            print(f"    Path: {file_info['relative_path']}")
            if file_info['modified_time']:
                print(f"    Modified: {file_info['modified_time']}")
        
        # Ask if user wants to download
        if file_list['files_found'] > 0:
            download = input(f"\nDownload all {file_list['files_found']} files? (y/n): ").strip().lower()
            if download == 'y':
                print(f"\n=== Downloading xlsx files ===")
                download_path = client.download_xlsx_files(nas_path, ".")
                if download_path:
                    print(f"Download completed successfully!")
                else:
                    print("Download failed")
    else:
        print("Failed to list files or no files found")

if __name__ == '__main__':
    main()