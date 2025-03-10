
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { RefreshCw } from 'lucide-react';
import SuccessAnimation from '../SuccessAnimation';
import { fetchPropertyData, PropertyData, findPropertyByUnitId } from '../../utils/googleSheets';
import EmailForm from './EmailForm';
import ResultDisplay from './ResultDisplay';
import ConnectionError from './ConnectionError';
import LoadingOverlay from './LoadingOverlay';

const ResultChecker: React.FC = () => {
  const [unitId, setUnitId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PropertyData | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setTimeout(() => setFadeIn(true), 100);
    
    // Load property data from Google Sheets
    loadPropertyData();
  }, []);

  const loadPropertyData = async () => {
    setDataLoading(true);
    setConnectionError(false);
    try {
      const data = await fetchPropertyData();
      if (data.length === 0) {
        setConnectionError(true);
        toast.error("Connection issue with our property database. Please try refreshing.", {
          duration: 5000,
          id: "connection-error"
        });
      } else {
        setProperties(data);
        toast.success(`Connected to property database with ${data.length} units`, {
          duration: 3000,
          id: "connection-success"
        });
      }
    } catch (error) {
      console.error("Failed to load property data:", error);
      setConnectionError(true);
      toast.error("Unable to load our property database. Please refresh or try again later.", {
        duration: 5000,
        id: "connection-error"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleCheck = () => {
    if (!unitId) {
      toast.error('Please enter a unit ID to verify');
      return;
    }

    if (unitId.length < 2) {
      toast.error('Please enter a valid unit ID');
      return;
    }

    if (dataLoading) {
      toast.error('Our property database is still loading. Please wait a moment.');
      return;
    }

    if (connectionError || properties.length === 0) {
      toast.error('Unable to connect to our database. Please refresh and try again.');
      return;
    }

    setIsLoading(true);
    setHasChecked(false);
    setResult(null);

    // Small delay for UX purposes
    setTimeout(() => {
      const property = findPropertyByUnitId(properties, unitId);
      setResult(property);
      setIsLoading(false);
      setHasChecked(true);
      
      if (property?.verified) {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
      }
    }, 1200);
  };

  const resetForm = () => {
    // Animate out before resetting
    setFadeIn(false);
    setTimeout(() => {
      setUnitId('');
      setResult(null);
      setHasChecked(false);
      setFadeIn(true);
    }, 300);
  };

  const refreshData = async () => {
    toast.info("Refreshing property database...", {
      id: "refreshing-data"
    });
    await loadPropertyData();
    
    // If user already checked result, update it with fresh data
    if (result && unitId) {
      const updatedResult = findPropertyByUnitId(properties, unitId);
      setResult(updatedResult);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <SuccessAnimation show={showSuccessAnimation} />
      
      <div className={`glass-panel rounded-2xl px-6 py-8 md:p-8 transition-all duration-500 shadow-xl hover:shadow-2xl ${fadeIn ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
        {dataLoading && !hasChecked && <LoadingOverlay />}
        
        {connectionError && !hasChecked && !dataLoading && (
          <ConnectionError onRefresh={refreshData} />
        )}
        
        {!hasChecked ? (
          <EmailForm 
            unitId={unitId}
            setUnitId={setUnitId}
            isLoading={isLoading}
            handleCheck={handleCheck}
            refreshData={refreshData}
            dataLoading={dataLoading}
            connectionError={connectionError}
          />
        ) : (
          <ResultDisplay 
            result={result} 
            resetForm={resetForm} 
            refreshData={refreshData} 
          />
        )}
      </div>
    </div>
  );
};

export default ResultChecker;
