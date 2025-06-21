// Enhanced ImportLeadsModal.tsx - Auto-assigns leads to the importing user

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { XIcon, UploadCloudIcon, FileTextIcon, CheckCircleIcon, AlertTriangleIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SelectField } from '../ui/SelectField';
import { useImportLeadsMutation } from '../../hooks/mutations/useImportLeadsMutation';
import { useAuth } from '../../contexts/AuthContext';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

// Enhanced validation results to include warnings
interface ValidationError {
  rowIndex: number;
  field?: string;
  message: string;
  rowData?: Record<string, any>;
  type: 'error' | 'warning';
}

interface ValidationResults {
  validLeads: any[];
  errors: ValidationError[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
  };
}

// Smart field mapping suggestions (with industry added)
const SMART_MAPPING_RULES = {
  // Client name mappings
  clientName: [
    'client name', 'client', 'customer name', 'customer', 'contact name',
    'prospect name', 'prospect', 'lead name'
  ],
  // Company mappings
  companyName: [
    'company name', 'company', 'organization', 'business name', 'firm'
  ],
  // Contact person mappings
  contactPerson: [
    'contact person', 'contact', 'person', 'representative', 'rep'
  ],
  // Email mappings
  email: [
    'email', 'email address', 'e-mail', 'contact email', 'mail'
  ],
  // Phone mappings
  phone: [
    'phone', 'phone number', 'contact number', 'mobile', 'number', 'tel'
  ],
  // Deal value mappings
  dealValue: [
    'deal value', 'expected value', 'value', 'amount', 'deal amount', 
    'revenue', 'potential value', 'opportunity value'
  ],
  // Status mappings
  status: [
    'status', 'lead status', 'stage', 'priority', 'bucket'
  ],
  // Industry mappings - ADD THIS
  industry: [
    'industry', 'sector', 'business type', 'vertical', 'category', 'field'
  ],
  // Lead source mappings
  leadSource: [
    'lead source', 'source', 'origin', 'channel', 'how did you hear'
  ],
  // Next step mappings
  nextStep: [
    'next step', 'next steps', 'action', 'follow up', 'todo'
  ],
  // Notes mappings
  notes: [
    'notes', 'comments', 'remarks', 'description', 'details', 'progress'
  ]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportSuccess 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[][]>([]);
  const [allRowsData, setAllRowsData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);

  const importLeadsMutation = useImportLeadsMutation();
  const { profile } = useAuth();

  const resetWizard = useCallback(() => {
    setFile(null);
    setFilePreview([]);
    setAllRowsData([]);
    setHeaders([]);
    setFieldMapping({});
    setValidationResults(null);
    setCurrentStep(1);
    setIsLoading(false);
    importLeadsMutation.reset();
  }, [importLeadsMutation]);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  // Smart field mapping function
  const smartMapFields = useCallback((fileHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    
    fileHeaders.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Find the best match for each field type
      for (const [fieldType, keywords] of Object.entries(SMART_MAPPING_RULES)) {
        const match = keywords.find(keyword => 
          normalizedHeader.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(normalizedHeader)
        );
        
        if (match) {
          mapping[header] = fieldType;
          break;
        }
      }
      
      // If no match found, set to ignore
      if (!mapping[header]) {
        mapping[header] = 'ignore';
      }
    });
    
    setFieldMapping(mapping);
  }, []);

  const parseFile = useCallback((acceptedFile: File) => {
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const binaryStr = e.target?.result;
        if (!binaryStr) {
          toast.error('Could not read file content.');
          setIsLoading(false);
          return;
        }

        let rows: string[][] = [];
        let fileHeaders: string[] = [];

        if (acceptedFile.type === 'text/csv') {
          const result = Papa.parse<string[]>(binaryStr as string, { 
            header: false, 
            skipEmptyLines: true,
            transform: (value) => {
              // Clean up NULL values and trim whitespace
              if (value === 'NULL' || value === 'null' || value === '') {
                return '';
              }
              return value.trim();
            }
          });
          if (result.data.length > 0) {
            fileHeaders = result.data[0];
            rows = result.data.slice(1);
          }
        } else if (acceptedFile.type.startsWith('application/vnd')) {
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { 
            header: 1, 
            blankrows: false,
            raw: false
          });

          if (jsonData && jsonData.length > 0) {
            fileHeaders = (jsonData[0] as Array<any>).map(String);
            rows = jsonData.slice(1).map(rowArray => 
              (rowArray as Array<any>).map(cell => {
                const str = String(cell || '').trim();
                return str === 'NULL' || str === 'null' ? '' : str;
              })
            );
          }
        }

        setHeaders(fileHeaders);
        setFilePreview(rows.slice(0, 5));
        setAllRowsData(rows);
        setFile(acceptedFile);
        
        // Apply smart mapping
        smartMapFields(fileHeaders);
        
        setCurrentStep(2);
        toast.success(`File parsed successfully! Found ${rows.length} data rows.`);
        
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error('Error parsing file. Please ensure it is a valid CSV/XLSX file.');
        setFile(null);
        setFilePreview([]);
        setAllRowsData([]);
        setHeaders([]);
      }
      setIsLoading(false);
    };

    reader.onerror = () => {
      toast.error('Failed to read file.');
      setIsLoading(false);
    };

    if (acceptedFile.type === 'text/csv') {
      reader.readAsText(acceptedFile);
    } else {
      reader.readAsBinaryString(acceptedFile);
    }
  }, [smartMapFields]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejectedFile: any) => {
        rejectedFile.errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`File is larger than ${MAX_FILE_SIZE / (1024*1024)}MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`Invalid file type. Accepted: ${Object.values(ACCEPTED_FILE_TYPES).flat().join(', ')}`);
          } else {
            toast.error(`Error: ${error.message}`);
          }
        });
      });
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      parseFile(acceptedFiles[0]);
    }
  }, [parseFile]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const getFieldOptions = () => [
    { value: 'ignore', label: '🚫 Ignore this column' },
    { value: 'clientName', label: '👤 Client Name *' },
    { value: 'companyName', label: '🏢 Company Name *' },
    { value: 'contactPerson', label: '👨‍💼 Contact Person' },
    { value: 'email', label: '📧 Email *' },
    { value: 'phone', label: '📞 Phone *' },
    { value: 'dealValue', label: '💰 Deal Value' },
    { value: 'status', label: '📊 Status/Priority' },
    { value: 'industry', label: '🏭 Industry/Category' }, // ADD THIS
    { value: 'leadSource', label: '📍 Lead Source' },
    { value: 'nextStep', label: '➡️ Next Step' },
    { value: 'notes', label: '📝 Notes/Comments' },
  ];

  const handleFieldMappingChange = (header: string, selectedField: string) => {
    setFieldMapping(prev => ({ ...prev, [header]: selectedField }));
  };

  const handleProceedToValidation = async () => {
    if (!allRowsData.length || !headers.length) {
      toast.error("No data available for validation.");
      return;
    }

    if (!profile?.id) {
      toast.error("User profile not found. Cannot import leads.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Process and validate leads
      const results: ValidationResults = {
        validLeads: [],
        errors: [],
        summary: { totalRows: allRowsData.length, validCount: 0, errorCount: 0, warningCount: 0 },
      };

      for (let rowIndex = 0; rowIndex < allRowsData.length; rowIndex++) {
        const row = allRowsData[rowIndex];
        const leadData: any = {
          // Automatically assign to current user
          agent_id: profile.id,
          assignedTo: profile.full_name || 'Current User'
        };
        let hasRequiredFields = false;
        let warnings: string[] = [];

        // Map fields (including industry)
        headers.forEach((header, headerIndex) => {
          const mappedField = fieldMapping[header];
          const cellValue = row[headerIndex]?.trim() || '';
          
          if (mappedField && mappedField !== 'ignore' && cellValue) {
            switch (mappedField) {
              case 'dealValue':
                const numValue = parseFloat(cellValue.replace(/[$,]/g, ''));
                if (!isNaN(numValue)) {
                  leadData.dealValue = numValue;
                }
                break;
              case 'phone':
                leadData.phone = cellValue.replace(/\D/g, ''); // Remove non-digits
                break;
              case 'status':
                // Map common status values to P1, P2, P3
                const statusMap: Record<string, string> = {
                  'high': 'P1', 'urgent': 'P1', 'hot': 'P1', 'priority': 'P1',
                  'medium': 'P2', 'warm': 'P2', 'interested': 'P2',
                  'low': 'P3', 'cold': 'P3', 'future': 'P3'
                };
                leadData.status = statusMap[cellValue.toLowerCase()] || cellValue;
                break;
              case 'industry':
                // Normalize industry values
                const industryMap: Record<string, string> = {
                  'tech': 'technology',
                  'it': 'technology',
                  'software': 'technology',
                  'medical': 'healthcare',
                  'health': 'healthcare',
                  'banking': 'finance',
                  'financial': 'finance',
                  'retail': 'retail',
                  'e-commerce': 'retail',
                  'manufacturing': 'manufacturing',
                  'education': 'education',
                  'real estate': 'real-estate',
                  'realestate': 'real-estate',
                  'consulting': 'consulting',
                  'media': 'media',
                  'entertainment': 'media',
                  'transport': 'transportation',
                  'logistics': 'transportation',
                  'energy': 'energy',
                  'utilities': 'energy',
                  'agriculture': 'agriculture',
                  'farming': 'agriculture',
                  'construction': 'construction',
                  'hospitality': 'hospitality',
                  'tourism': 'hospitality',
                  'legal': 'legal',
                  'law': 'legal',
                  'nonprofit': 'nonprofit',
                  'non-profit': 'nonprofit',
                  'government': 'government',
                  'gov': 'government',
                };
                leadData.industry = industryMap[cellValue.toLowerCase()] || cellValue.toLowerCase();
                break;
              default:
                leadData[mappedField] = cellValue;
            }
            
            if (['clientName', 'email', 'phone'].includes(mappedField)) {
              hasRequiredFields = true;
            }
          }
        });

        // Validate required fields
        if (!hasRequiredFields) {
          results.errors.push({
            rowIndex: rowIndex + 1,
            message: 'Missing required fields (Client Name, Email, or Phone)',
            rowData: row.reduce((acc, cell, idx) => ({...acc, [headers[idx]]: cell }), {}),
            type: 'error'
          });
          results.summary.errorCount++;
          continue;
        }

        // Add warnings if any
        if (warnings.length > 0) {
          warnings.forEach(warning => {
            results.errors.push({
              rowIndex: rowIndex + 1,
              message: warning,
              type: 'warning'
            });
          });
          results.summary.warningCount++;
        }

        results.validLeads.push(leadData);
        results.summary.validCount++;
      }
      
      setValidationResults(results);
      setCurrentStep(3);
      
      if (results.summary.validCount > 0) {
        toast.success(
          `Validation complete! ${results.summary.validCount} valid leads will be assigned to ${profile.full_name}.`
        );
      } else {
        toast.error('No valid leads found. Please check your data and mapping.');
      }
      
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Error during validation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLeads = async () => {
    if (!validationResults || validationResults.validLeads.length === 0) {
      toast.error("No valid leads to import.");
      return;
    }
    
    if (!profile?.id) {
      toast.error("User profile not found. Cannot import leads.");
      return;
    }
    
    setCurrentStep(4);
    
    try {
      // Import leads with current user as agent
      await importLeadsMutation.mutateAsync({ 
        leads: validationResults.validLeads,
        currentUserId: profile.id,
        skipValidationErrors: true
      });
      
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('Import failed:', error);
      setCurrentStep(3); // Go back to validation on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Smart Lead Import - Step {currentStep}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {/* Step 1: File Upload with Tips */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Import Tips for Best Results:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Include columns like: Client Name, Company, Email, Phone, Deal Value, Industry</li>
                  <li>• Use clear column headers (our system will auto-detect them!)</li>
                  <li>• Replace "NULL" values with empty cells or actual data</li>
                  <li>• <strong>All leads will be automatically assigned to you ({profile?.full_name || 'Current User'})</strong></li>
                </ul>
              </div>

              {profile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">👤 Lead Assignment</h3>
                  <p className="text-sm text-green-700">
                    All imported leads will be automatically assigned to: <strong>{profile.full_name}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    No need to include agent/sales rep columns in your file!
                  </p>
                </div>
              )}

              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input {...getInputProps()} />
                <UploadCloudIcon className={`h-16 w-16 mb-4 mx-auto ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {isDragActive ? (
                  <p className="text-lg font-medium text-indigo-700">Drop the file here!</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drag & drop your file here</p>
                    <p className="text-sm text-gray-500 mt-1">Supports CSV, XLS, XLSX (Max 10MB)</p>
                  </div>
                )}
                <Button onClick={openFileDialog} disabled={isLoading} className="mt-4">
                  {isLoading ? 'Processing...' : 'Choose File'}
                </Button>
              </div>

              {file && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center">
                    <FileTextIcon className="h-8 w-8 text-indigo-500 mr-3" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Smart Field Mapping */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">🎯 Smart Mapping Applied!</h3>
                <p className="text-sm text-green-700">
                  We've automatically detected and mapped your columns. Review and adjust if needed.
                  Required fields are marked with *. All leads will be assigned to <strong>{profile?.full_name}</strong>.
                </p>
              </div>

              {/* Data Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium">Data Preview (first 5 rows)</h4>
                </div>
                <div className="overflow-x-auto max-h-48">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left font-medium text-gray-600">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filePreview.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-gray-700 max-w-32 truncate">
                              {cell || <span className="text-gray-400 italic">empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Mapping */}
              <div className="space-y-4">
                <h4 className="font-semibold">Column Mapping</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {headers.map((header, index) => {
                    const mappedField = fieldMapping[header];
                    const isRequired = ['clientName', 'email', 'phone'].includes(mappedField);
                    
                    return (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <span className="truncate block" title={header}>
                            📂 {header}
                          </span>
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <SelectField
                          value={mappedField || 'ignore'}
                          onChange={(e) => handleFieldMappingChange(header, e.target.value)}
                          options={getFieldOptions()}
                          className="text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {currentStep === 3 && validationResults && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-800 mb-2">👤 Lead Assignment Summary</h3>
                <p className="text-sm text-indigo-700">
                  <strong>{validationResults.summary.validCount}</strong> leads will be assigned to: <strong>{profile?.full_name}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationResults.summary.totalRows}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{validationResults.summary.validCount}</div>
                  <div className="text-sm text-green-700">Valid Leads</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{validationResults.summary.warningCount}</div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResults.summary.errorCount}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {/* Issues List */}
              {validationResults.errors.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold">⚠️ Issues Found</h4>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {validationResults.errors.map((error, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border-b last:border-b-0 ${
                          error.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
                        }`}
                      >
                        <div className="flex items-start">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                            error.type === 'error' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Row {error.rowIndex}
                          </span>
                          <div className="flex-1">
                            <p className={`text-sm ${
                              error.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              {error.message}
                            </p>
                            {error.rowData && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                  View row data
                                </summary>
                                <div className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {Object.entries(error.rowData).map(([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="font-medium w-24 shrink-0">{key}:</span>
                                      <span className="text-gray-600">{value || '(empty)'}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResults.summary.validCount === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800">No Valid Leads Found</h3>
                  <p className="text-red-600 mt-2">
                    Please review the errors above and go back to fix your data or column mapping.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Import Progress */}
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              {importLeadsMutation.isLoading && (
                <div>
                  <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">Importing Your Leads...</h3>
                  <p className="text-gray-600">
                    Processing {validationResults?.validLeads?.length || 0} leads and assigning them to {profile?.full_name}.
                  </p>
                  <div className="mt-4 bg-gray-200 rounded-full h-2 w-64 mx-auto">
                    <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              )}

              {importLeadsMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800">Import Failed</h3>
                  <p className="text-red-600 mt-2">{importLeadsMutation.error?.message}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(3)} 
                    className="mt-4"
                  >
                    Back to Validation
                  </Button>
                </div>
              )}

              {importLeadsMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800">Import Successful!</h3>
                  <p className="text-green-600 mt-2">
                    Successfully imported {validationResults?.validLeads?.length || 0} leads assigned to {profile?.full_name}.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    You can now view and manage your leads in the dashboard.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Footer with Context-Aware Actions */}
        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {currentStep === 2 && `${headers.length} columns detected`}
            {currentStep === 3 && validationResults && `${validationResults.summary.validCount} leads ready to import`}
            {profile && (
              <span className="ml-4 text-indigo-600">
                Importing as: {profile.full_name}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {currentStep > 1 && currentStep < 4 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isLoading}
              >
                ← Previous
              </Button>
            )}

            {currentStep === 1 && file && !isLoading && (
              <Button onClick={() => parseFile(file)} className="bg-indigo-600 text-white">
                Process File →
              </Button>
            )}

            {currentStep === 2 && (
              <Button 
                onClick={handleProceedToValidation}
                disabled={isLoading || Object.values(fieldMapping).every(field => field === 'ignore')}
                className="bg-indigo-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Data →'
                )}
              </Button>
            )}

            {currentStep === 3 && validationResults && validationResults.summary.validCount > 0 && (
              <Button 
                onClick={handleImportLeads}
                disabled={importLeadsMutation.isLoading}
                className="bg-green-600 text-white"
              >
                Import {validationResults.summary.validCount} Leads →
              </Button>
            )}

            {currentStep === 4 && !importLeadsMutation.isLoading && (
              <Button onClick={handleClose} className="bg-indigo-600 text-white">
                {importLeadsMutation.isSuccess ? 'Done ✓' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the enhanced version as well for future use
export const EnhancedImportLeadsModal = ImportLeadsModal;

// Default export for maximum compatibility
export default ImportLeadsModal;