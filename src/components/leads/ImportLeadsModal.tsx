import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { XIcon, UploadCloudIcon, FileTextIcon, CheckCircleIcon, AlertTriangleIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { leadSchema, LeadFormData } from '../../types/leadSchema'; // Import leadSchema
import { SelectField } from '../ui/SelectField'; // Assuming SelectField is created
import { useImportLeadsMutation } from '../../hooks/mutations/useImportLeadsMutation'; // Added

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void; // Added prop to refresh leads on parent page
}

// Structure for validation results
interface ValidationError {
  rowIndex: number; // Original file row index (approximated, considering header)
  field?: string;
  message: string;
  rowData?: Record<string, any>; // The raw data for the row that failed
}

interface ValidationResults {
  validLeads: LeadFormData[];
  errors: ValidationError[];
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[][]>([]);
  const [allRowsData, setAllRowsData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, keyof LeadFormData | 'ignore'>>({});
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);

  const importLeadsMutation = useImportLeadsMutation();

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

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined = undefined;
    if (importLeadsMutation.isSuccess) {
      onImportSuccess();
      timerId = setTimeout(() => {
        handleClose();
      }, 1500);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [importLeadsMutation.isSuccess, onImportSuccess, handleClose]);

  const targetLeadFields = Object.keys(leadSchema.shape) as Array<keyof LeadFormData>;

  const getLeadFieldOptions = () => {
    const options = targetLeadFields.map(field => ({ value: field, label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }));
    return [{ value: 'ignore', label: 'Ignore this column' }, ...options];
  };

  const autoMapFields = useCallback((fileHeaders: string[]) => {
    const initialMapping: Record<string, keyof LeadFormData | 'ignore'> = {};
    const normalizedTargetFields = targetLeadFields.reduce((acc, field) => {
      acc[field.toLowerCase().replace(/\s+/g, '')] = field;
      return acc;
    }, {} as Record<string, keyof LeadFormData>);

    fileHeaders.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
      const matchedField = normalizedTargetFields[normalizedHeader];
      if (matchedField) {
        initialMapping[header] = matchedField;
      } else {
        initialMapping[header] = 'ignore';
      }
    });
    setFieldMapping(initialMapping);
  }, [targetLeadFields]);

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
          const result = Papa.parse<string[]>(binaryStr as string, { header: false, skipEmptyLines: true });
          if (result.data.length > 0) {
            fileHeaders = result.data[0];
            rows = result.data.slice(1);
          }
        } else if (acceptedFile.type.startsWith('application/vnd')) {
          try {
            const workbook = XLSX.read(binaryStr, { type: 'binary' });
            if (workbook.SheetNames.length === 0) {
              toast.error('Excel file contains no sheets.');
              setIsLoading(false);
              return;
            }
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, blankrows: false });

            if (jsonData && jsonData.length > 0) {
              fileHeaders = (jsonData[0] as Array<any>).map(String);
              rows = jsonData.slice(1).map(rowArray => (rowArray as Array<any>).map(String));
            } else {
              toast.error('Could not extract data from the Excel sheet.');
            }
          } catch (excelError) {
            console.error('[ImportLeadsModal] Error during Excel parsing process:', excelError);
            toast.error('An error occurred while processing the Excel file.');
            setIsLoading(false);
            return;
          }
        } else {
          toast.error('Unsupported file type for parsing.');
          setIsLoading(false);
          return;
        }

        if (fileHeaders.length === 0 && rows.length === 0) {
            toast.error('File appears to be empty or headers could not be parsed.');
            setIsLoading(false);
            return;
        }

        setHeaders(fileHeaders);
        setFilePreview(rows.slice(0, 5));
        setAllRowsData(rows);
        setFile(acceptedFile);
        autoMapFields(fileHeaders);
        setCurrentStep(2);
        toast.success(`File ${acceptedFile.name} parsed. Proceed to map fields.`);
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
  }, [autoMapFields]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejectedFile: any) => {
        rejectedFile.errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`Error: File is larger than ${MAX_FILE_SIZE / (1024*1024)}MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`Error: Invalid file type. Accepted: ${Object.values(ACCEPTED_FILE_TYPES).flat().join(', ')}`);
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

  const handleFieldMappingChange = (header: string, selectedField: keyof LeadFormData | 'ignore') => {
    setFieldMapping(prev => ({ ...prev, [header]: selectedField }));
  };

  const handleProceedToValidation = () => {
    importLeadsMutation.reset();
    if (!allRowsData.length || !headers.length || Object.keys(fieldMapping).length === 0) {
      toast.error("No data or mapping available for validation.");
      return;
    }
    setIsLoading(true);
    
    const results: ValidationResults = {
      validLeads: [],
      errors: [],
      summary: { totalRows: allRowsData.length, validCount: 0, errorCount: 0 },
    };

    allRowsData.forEach((row, rowIndex) => {
      const potentialLead: Partial<LeadFormData> = {};
      let hasMappedFields = false;

      headers.forEach((header, headerIndex) => {
        const mappedFieldKey = fieldMapping[header];
        if (mappedFieldKey && mappedFieldKey !== 'ignore') {
          potentialLead[mappedFieldKey] = row[headerIndex] as any; // Cast to any, Zod will validate
          hasMappedFields = true;
        }
      });

      if (!hasMappedFields) {
        return; 
      }

      const validation = leadSchema.safeParse(potentialLead);

      if (validation.success) {
        results.validLeads.push(validation.data as LeadFormData);
        results.summary.validCount++;
      } else {
        validation.error.errors.forEach(err => {
          results.errors.push({
            rowIndex: rowIndex + 1,
            field: err.path.join('.'),
            message: err.message,
            rowData: row.reduce((acc, cell, idx) => ({...acc, [headers[idx]]: cell }), {})
          });
        });
        results.summary.errorCount++;
      }
    });
    
    setValidationResults(results);
    setIsLoading(false);
    setCurrentStep(3);
    toast.success(`Validation complete: ${results.summary.validCount} valid, ${results.summary.errorCount} errors.`);
  };

  const handleImportLeads = () => {
    if (!validationResults || validationResults.validLeads.length === 0) {
      toast.error("No valid leads to import.");
      return;
    }
    setCurrentStep(4);
    importLeadsMutation.mutate({ leads: validationResults.validLeads });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" aria-labelledby="import-leads-modal-title" role="dialog" aria-modal="true">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 id="import-leads-modal-title" className="text-2xl font-semibold text-gray-800">Import Leads Wizard - Step {currentStep}</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close modal">
            <XIcon className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <input {...getInputProps()} />
              <UploadCloudIcon className={`h-16 w-16 mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {isDragActive ? (
                <p className="text-lg font-medium text-indigo-700">Drop the file here ...</p>
              ) : (
                <p className="text-lg font-medium text-gray-700">Drag & drop your CSV, XLS, or XLSX file here</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Max file size: {MAX_FILE_SIZE / (1024*1024)}MB. Accepted types: .csv, .xls, .xlsx</p>
              <Button onClick={openFileDialog} disabled={isLoading} className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700">
                {isLoading ? 'Processing...' : 'Or Click to Select File'}
              </Button>
              {file && !isLoading && (
                <div className="mt-4 text-left p-3 border rounded-md bg-gray-50 w-full max-w-md">
                    <div className="flex items-center">
                        <FileTextIcon className="h-10 w-10 text-indigo-500 mr-3 shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-700">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">Map Your Data Fields</h3>
              <p className="mb-4 text-sm text-gray-600">
                Review the first few rows of your file and map the columns from your file (left) to the corresponding application fields (right).
                Required fields are marked with <span className="text-red-500">*</span>.
              </p>
              
              {/* Data Preview Table */}
              {!isLoading && headers.length > 0 && (
                <div className="overflow-x-auto mb-6 border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">{header || `Column ${index + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filePreview.map((row, rowIndex) => (
                        <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-gray-700">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Field Mapping Interface */}
              {!isLoading && headers.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Map columns to application fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-4 border rounded-md bg-slate-50">
                    {headers.map((header, index) => {
                      const fieldDefinition = leadSchema.shape[fieldMapping[header] as keyof LeadFormData];
                      const isRequired = fieldDefinition ? !fieldDefinition.isOptional() : false;
                      const displayHeader = header || `Column ${index + 1}`;
                      return (
                        <div key={index} className="flex flex-col">
                            <label htmlFor={`map-${index}`} className="block text-sm font-medium text-gray-700 mb-1 truncate" title={displayHeader}>
                                <span className="font-semibold">{displayHeader}</span>
                                {isRequired && fieldMapping[header] !== 'ignore' && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <SelectField
                                id={`map-${index}`}
                                name={`map-${index}`}
                                value={fieldMapping[header] || 'ignore'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldMappingChange(header, e.target.value as keyof LeadFormData | 'ignore')}
                                options={getLeadFieldOptions()}
                                className="mt-0 mb-0" // Override default margins if SelectField has them
                            />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {isLoading && <p className="text-center text-gray-500 my-4">Loading file data...</p>}
              {!isLoading && headers.length === 0 && file && <p className="text-center text-red-500 my-4">Could not detect any headers or data in the file.</p>}
            </div>
          )}

          {/* Step 3: Validation */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Validation & Confirmation</h3>
              {isLoading && <p className="text-center text-gray-500 my-4">Validating data...</p>}
              {!isLoading && validationResults && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-slate-50">
                    <h4 className="text-lg font-medium text-gray-800">Validation Summary:</h4>
                    <p className="text-sm text-gray-600">Total Rows Processed: {validationResults.summary.totalRows}</p>
                    <p className="text-sm text-green-600">Valid Leads: {validationResults.summary.validCount}</p>
                    <p className="text-sm text-red-600">Rows with Errors: {validationResults.summary.errorCount}</p>
                  </div>

                  {validationResults.errors.length > 0 && (
                    <div className="max-h-96 overflow-y-auto border rounded-md p-2">
                      <h4 className="text-md font-semibold text-red-700 mb-2 sticky top-0 bg-white py-1 px-2 border-b">Error Details:</h4>
                      <ul className="divide-y divide-gray-200">
                        {validationResults.errors.map((err, index) => (
                          <li key={index} className="py-3 px-2 hover:bg-red-50/50">
                            <p className="text-sm font-medium text-red-600">
                              Row {err.rowIndex}: 
                              {err.field && <span className="font-semibold"> Field '{err.field}' - </span>}
                              {err.message}
                            </p>
                            {err.rowData && (
                              <details className="text-xs text-gray-500 mt-1">
                                <summary className="cursor-pointer hover:underline">Show Row Data</summary>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.rowData, null, 2)}
                                </pre>
                              </details>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResults.summary.validCount === 0 && validationResults.summary.errorCount > 0 && (
                    <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-700">
                        <AlertTriangleIcon className="h-5 w-5 inline mr-2" />
                        No leads can be imported due to errors. Please review the errors above or go back to correct mappings/file.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Progress */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Importing Leads</h3>
              {importLeadsMutation.isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-lg text-gray-600">Importing {validationResults?.validLeads?.length || 0} leads...</p>
                  <p className="text-sm text-gray-500">Please wait, this may take a few moments.</p>
                </div>
              )}
              {importLeadsMutation.isError && (
                <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700 text-center">
                    <AlertTriangleIcon className="h-8 w-8 inline mr-2 mb-2" />
                    <p className="font-semibold">Import Failed</p>
                    <p className="text-sm">{importLeadsMutation.error?.message || 'An unknown error occurred.'}</p>
                    <Button variant="outline" onClick={() => setCurrentStep(3)} className="mt-4">
                        Back to Validation Summary
                    </Button>
                </div>
              )}
              {/* Success is handled by useEffect and closing the modal */}
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t flex justify-between items-center">
          <div>
            {currentStep > 1 && currentStep !== 4 && /* Show Previous unless on step 1 or step 4 (during/after import)*/ (
                <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={isLoading || importLeadsMutation.isLoading}>
                    Previous
                </Button>
            )}
          </div>
          <div>
            {currentStep === 2 && (
                <Button onClick={handleProceedToValidation} disabled={isLoading || importLeadsMutation.isLoading || !file || headers.length === 0}>
                    {isLoading ? 'Validating...' : 'Validate & Proceed'}
                </Button>
            )}
            {currentStep === 3 && (
                <Button 
                    onClick={handleImportLeads} 
                    disabled={isLoading || importLeadsMutation.isLoading || !validationResults || validationResults.summary.validCount === 0}
                >
                    {importLeadsMutation.isLoading ? 'Importing...' : `Import ${validationResults?.summary.validCount || 0} Valid Leads`}
                </Button>
            )}
            {currentStep === 1 && file && (
                 <Button onClick={() => parseFile(file)} disabled={isLoading || importLeadsMutation.isLoading}>
                    {isLoading? 'Parsing...' : 'Parse File & Proceed'}
                </Button>
            )}
            {currentStep === 4 && (
                 <Button onClick={handleClose} disabled={importLeadsMutation.isLoading}> 
                    {importLeadsMutation.isSuccess ? 'Done' : (importLeadsMutation.isError ? 'Close' : 'Cancel')}
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 