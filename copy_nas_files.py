#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import shutil
import argparse
import subprocess
from pathlib import Path

def map_network_drive(nas_path, username, password):
    """
    Map network drive with credentials
    
    Args:
        nas_path (str): NAS path
        username (str): Username for authentication
        password (str): Password for authentication
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Use net use command to map the network drive with credentials
        cmd = f'net use "{nas_path}" /user:"{username}" "{password}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Successfully mapped network drive: {nas_path}")
            return True
        else:
            print(f"Failed to map network drive: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Error mapping network drive: {str(e)}")
        return False

def unmap_network_drive(nas_path):
    """
    Unmap network drive
    
    Args:
        nas_path (str): NAS path to unmap
    """
    try:
        cmd = f'net use "{nas_path}" /delete'
        subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"Unmapped network drive: {nas_path}")
    except Exception as e:
        print(f"Error unmapping network drive: {str(e)}")

def copy_nas_files(nas_path, target_dir=".", username=None, password=None):
    """
    Copy files from NAS path to target directory
    
    Args:
        nas_path (str): NAS path
        target_dir (str): Target directory, default is current directory
        username (str): Username for NAS authentication
        password (str): Password for NAS authentication
    """
    drive_mapped = False
    try:
        # If credentials are provided, map the network drive first
        if username and password:
            if not map_network_drive(nas_path, username, password):
                return False
            drive_mapped = True
        
        # Validate if NAS path exists
        if not os.path.exists(nas_path):
            print(f"Error: NAS path does not exist: {nas_path}")
            return False
            
        if not os.path.isdir(nas_path):
            print(f"Error: NAS path is not a directory: {nas_path}")
            return False
        
        # Create target directory
        target_path = Path(target_dir)
        target_path.mkdir(parents=True, exist_ok=True)
        
        # Get all files under NAS directory
        nas_dir = Path(nas_path)
        files_copied = 0
        
        print(f"Starting to copy files from {nas_path} to {target_dir}")
        
        # Traverse all files and subdirectories under NAS directory
        for item in nas_dir.rglob("*"):
            if item.is_file():
                # Calculate relative path to maintain directory structure
                relative_path = item.relative_to(nas_dir)
                target_file = target_path / relative_path
                
                # Create parent directory for target file
                target_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy file
                shutil.copy2(item, target_file)
                print(f"Copied: {relative_path}")
                files_copied += 1
        
        print(f"Copy completed! Total {files_copied} files copied")
        return True
        
    except Exception as e:
        print(f"Error occurred during copy process: {str(e)}")
        return False
    finally:
        # Unmap the network drive if it was mapped
        if drive_mapped:
            unmap_network_drive(nas_path)

def main():
    parser = argparse.ArgumentParser(description="Copy files from NAS path to current directory")
    parser.add_argument("nas_path", help="NAS path")
    parser.add_argument("-t", "--target", default=".", help="Target directory (default: current directory)")
    parser.add_argument("-u", "--username", help="Username for NAS authentication")
    parser.add_argument("-p", "--password", help="Password for NAS authentication")
    
    args = parser.parse_args()
    
    # Get credentials from environment variables if not provided as arguments
    username = args.username or os.getenv('NAS_USERNAME')
    password = args.password or os.getenv('NAS_PASSWORD')
    
    # Execute copy operation
    success = copy_nas_files(args.nas_path, args.target, username, password)
    
    # Set exit code based on execution result
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()