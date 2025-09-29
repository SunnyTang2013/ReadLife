pipeline {
    agent {
        label 'linux'
    }
    
    parameters {
        string(
            name: 'NAS_PATH',
            defaultValue: '',
            description: 'NAS path, e.g.: \\\\server\\share\\folder'
        )
        string(
            name: 'API_SERVER_URL',
            defaultValue: 'http://localhost:5000',
            description: 'NAS Excel Downloader API server URL'
        )
        string(
            name: 'EMAIL_RECIPIENTS',
            defaultValue: '',
            description: 'Email recipients, separate multiple emails with commas'
        )
        string(
            name: 'EMAIL_SUBJECT',
            defaultValue: 'NAS Excel File Backup',
            description: 'Email subject'
        )
    }
    
    environment {
        ARCHIVE_NAME = "nas_excel_backup_${BUILD_NUMBER}_${env.BUILD_TIMESTAMP}.zip"
        DOWNLOADED_FILE = "${WORKSPACE}/downloaded_excel_files.zip"
        EXTRACT_DIR = "${WORKSPACE}/extracted_excel_files"
    }
    
    stages {
        stage('Parameter Validation') {
            steps {
                script {
                    if (!params.NAS_PATH) {
                        error("NAS_PATH parameter cannot be empty")
                    }
                    if (!params.API_SERVER_URL) {
                        error("API_SERVER_URL parameter cannot be empty")
                    }
                    if (!params.EMAIL_RECIPIENTS) {
                        error("EMAIL_RECIPIENTS parameter cannot be empty")
                    }
                    echo "NAS Path: ${params.NAS_PATH}"
                    echo "API Server URL: ${params.API_SERVER_URL}"
                    echo "Email Recipients: ${params.EMAIL_RECIPIENTS}"
                }
            }
        }
        
        stage('API Health Check') {
            steps {
                script {
                    try {
                        // Check if the API server is healthy
                        def healthResponse = sh(
                            script: """
                                curl -s -o health_response.json -w "%{http_code}" "${params.API_SERVER_URL}/health"
                            """,
                            returnStdout: true
                        ).trim()
                        
                        echo "API Health Check HTTP Status: ${healthResponse}"
                        
                        if (healthResponse != "200") {
                            error("API server is not healthy. HTTP Status: ${healthResponse}")
                        }
                        
                        // Read and display health response
                        def healthContent = sh(
                            script: "cat health_response.json",
                            returnStdout: true
                        ).trim()
                        
                        echo "API Health Response: ${healthContent}"
                        
                        // Clean up temp file
                        sh "rm health_response.json"
                        
                    } catch (Exception e) {
                        error("Failed to connect to API server: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('List Excel Files via API') {
            steps {
                script {
                    try {
                        // Create JSON payload for API request
                        // Use groovy.json.JsonOutput for proper JSON encoding
                        def jsonPayload = groovy.json.JsonOutput.toJson([
                            nas_path: params.NAS_PATH
                        ])
                        def payload = groovy.json.JsonOutput.prettyPrint(jsonPayload)
                        
                        echo "Original NAS_PATH: ${params.NAS_PATH}"
                        echo "JSON payload for list API: ${payload}"
                        
                        // Write payload to file
                        writeFile file: 'list_payload.json', text: payload
                        
                        // Call API to list Excel files
                        def listResponse = sh(
                            script: """
                                curl -s -o list_response.json -w "%{http_code}" -X POST "${params.API_SERVER_URL}/list-xlsx" -H "Content-Type: application/json" -d @list_payload.json
                            """,
                            returnStdout: true
                        ).trim()
                        
                        echo "List Excel Files API HTTP Status: ${listResponse}"
                        
                        if (listResponse != "200") {
                            // Try to read error response
                            def errorContent = ""
                            try {
                                errorContent = sh(
                                    script: "cat list_response.json",
                                    returnStdout: true
                                ).trim()
                            } catch (Exception e) {
                                errorContent = "Could not read error response"
                            }
                            error("Failed to list Excel files. HTTP Status: ${listResponse}. Response: ${errorContent}")
                        }
                        
                        // Read and display file list
                        def listContent = sh(
                            script: "cat list_response.json",
                            returnStdout: true
                        ).trim()
                        
                        echo "Found Excel Files: ${listContent}"
                        
                        // Clean up temp files
                        sh """
                            rm list_payload.json
                            rm list_response.json
                        """
                    } catch (Exception e) {
                        error("Failed to list Excel files via API: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('Download Excel Files via API') {
            steps {
                script {
                    try {
                        // Create JSON payload for API request
                        // Use groovy.json.JsonOutput for proper JSON encoding
                        def jsonPayload = groovy.json.JsonOutput.toJson([
                            nas_path: params.NAS_PATH
                        ])
                        def payload = groovy.json.JsonOutput.prettyPrint(jsonPayload)
                        
                        echo "Original NAS_PATH: ${params.NAS_PATH}"
                        echo "JSON payload for download API: ${payload}"
                        
                        // Write payload to file
                        writeFile file: 'download_payload.json', text: payload
                        
                        // Call API to download Excel files
                        def downloadResponse = sh(
                            script: """
                                curl -s -o "${DOWNLOADED_FILE}" -w "%{http_code}" -X POST "${params.API_SERVER_URL}/download-xlsx" -H "Content-Type: application/json" -d @download_payload.json
                            """,
                            returnStdout: true
                        ).trim()
                        
                        echo "Download Excel Files API HTTP Status: ${downloadResponse}"
                        
                        if (downloadResponse != "200") {
                            error("Failed to download Excel files. HTTP Status: ${downloadResponse}")
                        }
                        
                        // Check if downloaded file exists and get its size
                        def fileExists = sh(
                            script: "test -f \"${DOWNLOADED_FILE}\" && echo EXISTS || echo NOT_EXISTS",
                            returnStdout: true
                        ).trim()
                        
                        if (!fileExists.contains("EXISTS")) {
                            error("Downloaded file does not exist")
                        }
                        
                        // Get file size
                        def fileSize = sh(
                            script: "stat -c%s \"${DOWNLOADED_FILE}\"",
                            returnStdout: true
                        ).trim()
                        
                        echo "Successfully downloaded Excel files: ${DOWNLOADED_FILE} (size: ${fileSize} bytes)"
                        
                        // Clean up temp files
                        sh """
                            rm download_payload.json
                        """
                    } catch (Exception e) {
                        error("Failed to download Excel files via API: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('Extract and Validate Files') {
            steps {
                script {
                    try {
                        // Check if downloaded file exists and get its size
                        def fileExists = sh(
                            script: "test -f \"${DOWNLOADED_FILE}\" && echo EXISTS || echo NOT_EXISTS",
                            returnStdout: true
                        ).trim()
                        
                        if (!fileExists.contains("EXISTS")) {
                            error("Downloaded Excel files ZIP does not exist")
                        }
                        
                        // Get ZIP file size
                        def zipSize = sh(
                            script: "stat -c%s \"${DOWNLOADED_FILE}\"",
                            returnStdout: true
                        ).trim()
                        
                        echo "Downloaded ZIP file validated: ${DOWNLOADED_FILE} (size: ${zipSize} bytes)"
                        
                        // Create extraction directory
                        sh """
                            rm -rf "${EXTRACT_DIR}"
                            mkdir -p "${EXTRACT_DIR}"
                        """
                        
                        // Extract ZIP file
                        echo "Extracting Excel files from ZIP..."
                        sh """
                            unzip -q "${DOWNLOADED_FILE}" -d "${EXTRACT_DIR}"
                        """
                        
                        // List extracted Excel files
                        def extractedFiles = sh(
                            script: """
                                find "${EXTRACT_DIR}" -name "*.xlsx" -type f | head -20
                            """,
                            returnStdout: true
                        ).trim()
                        
                        if (!extractedFiles) {
                            error("No Excel files found after extraction")
                        }
                        
                        echo "Extracted Excel files:"
                        echo "${extractedFiles}"
                        
                        // Count extracted files
                        def fileCount = sh(
                            script: """
                                find "${EXTRACT_DIR}" -name "*.xlsx" -type f | wc -l
                            """,
                            returnStdout: true
                        ).trim()
                        
                        echo "Total Excel files extracted: ${fileCount}"
                        
                        // Store file list for email
                        env.EXTRACTED_FILES_COUNT = fileCount
                        env.EXTRACTED_FILES_LIST = extractedFiles
                        
                    } catch (Exception e) {
                        error("File extraction failed: ${e.getMessage()}")
                    }
                }
            }
        }
        
        stage('Send Email') {
            steps {
                script {
                    try {
                        // Get list of Excel files for attachment
                        def attachmentPattern = sh(
                            script: """
                                find "${EXTRACT_DIR}" -name "*.xlsx" -type f | sed "s|${WORKSPACE}/||g" | tr '\\n' ',' | sed 's/,\$//'
                            """,
                            returnStdout: true
                        ).trim()
                        
                        echo "Files to attach: ${attachmentPattern}"
                        
                        // Prepare file list for email body
                        def fileListHtml = ""
                        if (env.EXTRACTED_FILES_LIST) {
                            def files = env.EXTRACTED_FILES_LIST.split('\n')
                            files.each { file ->
                                def fileName = file.substring(file.lastIndexOf('/') + 1)
                                fileListHtml += "<li>${fileName}</li>"
                            }
                        }
                        
                        // Prepare email content
                        def emailBody = """
                        <h2>NAS Excel Files - Direct Attachment</h2>
                        <p><strong>Build Information:</strong></p>
                        <ul>
                            <li>Build Number: ${BUILD_NUMBER}</li>
                            <li>Build Time: ${BUILD_TIMESTAMP}</li>
                            <li>NAS Source Path: ${params.NAS_PATH}</li>
                            <li>API Server URL: ${params.API_SERVER_URL}</li>
                            <li>Total Excel Files: ${env.EXTRACTED_FILES_COUNT ?: 'Unknown'}</li>
                        </ul>
                        <p><strong>Process Summary:</strong></p>
                        <ul>
                            <li>✅ API Health Check: Passed</li>
                            <li>✅ Excel Files Listed: Successfully via API</li>
                            <li>✅ Files Downloaded: All .xlsx files downloaded</li>
                            <li>✅ Files Extracted: ${env.EXTRACTED_FILES_COUNT ?: 'Unknown'} Excel files extracted</li>
                        </ul>
                        <p><strong>Attached Excel Files:</strong></p>
                        <ul>
                            ${fileListHtml}
                        </ul>
                        <p><strong>Jenkins Build Link:</strong> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                        <p>All Excel files from the specified NAS path have been downloaded and are attached to this email.</p>
                        """
                        
                        // Send email with Excel files as attachments
                        emailext (
                            subject: "${params.EMAIL_SUBJECT} - Build #${BUILD_NUMBER}",
                            body: emailBody,
                            mimeType: 'text/html',
                            to: "${params.EMAIL_RECIPIENTS}",
                            attachmentsPattern: attachmentPattern,
                            replyTo: '$DEFAULT_REPLYTO'
                        )
                        
                        echo "Email sent successfully to: ${params.EMAIL_RECIPIENTS}"
                        echo "Attached ${env.EXTRACTED_FILES_COUNT ?: 'Unknown'} Excel files"
                        
                    } catch (Exception e) {
                        error("Email sending failed: ${e.getMessage()}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Clean temporary files from API download and extraction
                sh """
                    test -f "${DOWNLOADED_FILE}" && rm "${DOWNLOADED_FILE}" || true
                    test -d "${EXTRACT_DIR}" && rm -rf "${EXTRACT_DIR}" || true
                """
                echo "Temporary files cleanup completed"
            }
        }
        
        success {
            echo "NAS Excel file backup and email sending completed successfully!"
        }
        
        failure {
            script {
                // Send failure notification email
                if (params.EMAIL_RECIPIENTS) {
                    emailext (
                        subject: "Failed: ${params.EMAIL_SUBJECT} - Build #${BUILD_NUMBER}",
                        body: """
                        <h2>NAS Excel File Backup Failed</h2>
                        <p><strong>Build Information:</strong></p>
                        <ul>
                            <li>Build Number: ${BUILD_NUMBER}</li>
                            <li>Build Time: ${BUILD_TIMESTAMP}</li>
                            <li>NAS Source Path: ${params.NAS_PATH}</li>
                            <li>API Server URL: ${params.API_SERVER_URL}</li>
                        </ul>
                        <p><strong>Possible Issues:</strong></p>
                        <ul>
                            <li>API server may be unavailable or unhealthy</li>
                            <li>Server does not have access to the specified NAS path</li>
                            <li>NAS path may not exist or be inaccessible</li>
                            <li>No Excel files found in the specified path</li>
                            <li>Downloaded ZIP file could not be extracted</li>
                            <li>Network connectivity issues</li>
                        </ul>
                        <p><strong>Error Details:</strong> Please check the build log for detailed error information</p>
                        <p><strong>Jenkins Build Link:</strong> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                        """,
                        mimeType: 'text/html',
                        to: "${params.EMAIL_RECIPIENTS}",
                        replyTo: '$DEFAULT_REPLYTO'
                    )
                }
            }
            echo "NAS Excel file backup failed, please check build log"
        }
        
        cleanup {
            // Clean up all temporary files and directories
            sh """
                test -f "${WORKSPACE}/${ARCHIVE_NAME}" && rm "${WORKSPACE}/${ARCHIVE_NAME}" || true
                test -f "${DOWNLOADED_FILE}" && rm "${DOWNLOADED_FILE}" || true
                test -d "${EXTRACT_DIR}" && rm -rf "${EXTRACT_DIR}" || true
            """
        }
    }
}