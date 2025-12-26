'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportButtonProps {
  onImportComplete?: () => void;
}

export function ImportButton({ onImportComplete }: ImportButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          const response = await fetch('/api/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
          });

          if (response.ok) {
            console.log('Importação bem-sucedida!');
            onImportComplete?.();
          } else {
            const errorData = await response.json();
            console.error('Erro na importação:', errorData.message);
          }
        } catch (error) {
          console.error('Erro ao processar o arquivo:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao ler o arquivo:', error);
    } finally {
      setLoading(false);
      // Resetar o input para permitir o upload do mesmo arquivo novamente
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <Button 
        variant="outline" 
        onClick={handleButtonClick} 
        disabled={loading}
      >
        <Upload className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Importando...' : 'Importar Planilha'}
      </Button>
    </>
  );
}