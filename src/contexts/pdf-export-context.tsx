'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PDFExportContextType {
  onExportPDF?: () => void;
  isExportingPDF: boolean;
  setOnExportPDF: (callback: (() => void) | undefined) => void;
  setIsExportingPDF: (value: boolean) => void;
}

const PDFExportContext = createContext<PDFExportContextType | undefined>(undefined);

export function PDFExportProvider({ children }: { children: ReactNode }) {
  const [onExportPDF, setOnExportPDF] = useState<(() => void) | undefined>(undefined);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  return (
    <PDFExportContext.Provider
      value={{
        onExportPDF,
        isExportingPDF,
        setOnExportPDF,
        setIsExportingPDF,
      }}
    >
      {children}
    </PDFExportContext.Provider>
  );
}

export function usePDFExportContext() {
  const context = useContext(PDFExportContext);
  if (context === undefined) {
    throw new Error('usePDFExportContext must be used within a PDFExportProvider');
  }
  return context;
}



