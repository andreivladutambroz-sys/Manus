import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface VINDecoderProps {
  onDecoded: (data: {
    brand: string;
    model: string;
    year: number;
  }) => void;
  initialVin?: string;
}

export function VINDecoder({ onDecoded, initialVin = '' }: VINDecoderProps) {
  const [vin, setVin] = useState(initialVin);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState<any>(null);

  const handleDecode = async () => {
    if (vin.length !== 17) {
      toast.error('VIN trebuie să aibă exact 17 caractere');
      return;
    }

    setIsDecoding(true);
    try {
      const result = await (trpc.automotiveData.decodeVin as any)({ vin: vin.toUpperCase() });
      
      if (result && result.success && result.data) {
        const decoded = result.data;
        setDecodedData(decoded);
        
        // Auto-populate form fields
        if (decoded.make && decoded.model && decoded.year) {
          onDecoded({
            brand: decoded.make,
            model: decoded.model,
            year: decoded.year,
          });
          toast.success('VIN decodat cu succes!');
        } else {
          toast.warning('VIN parțial decodat - completați datele lipsă');
        }
      } else {
        toast.error('Nu am putut decoda VIN-ul');
      }
    } catch (error) {
      toast.error('Eroare la decodare VIN');
      console.error(error);
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decodare VIN</CardTitle>
          <CardDescription>
            Introduceți seria caroseriei (VIN) pentru a decoda automat datele vehiculului
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vin-input" className="text-base font-semibold">
              Serie Caroserie (VIN)
            </Label>
            <p className="text-sm text-slate-500 mb-3">
              17 caractere - se găsește pe certificatul de înmatriculare sau pe ușa șoferului
            </p>
            <div className="flex gap-2">
              <Input
                id="vin-input"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="WVWZZZ3CZWE123456"
                maxLength={17}
                className="text-lg font-mono tracking-wider"
              />
              <Button
                onClick={handleDecode}
                disabled={vin.length !== 17 || isDecoding}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isDecoding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Decodare...
                  </>
                ) : (
                  'Decodare'
                )}
              </Button>
            </div>
          </div>

          {vin.length === 17 && !decodedData && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              VIN valid - apasă "Decodare" pentru a extrage datele
            </div>
          )}

          {decodedData && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">VIN Decodat cu Succes</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {decodedData.make} {decodedData.model} ({decodedData.year})
                      </p>
                    </div>
                  </div>

                  {decodedData.engine && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Motor:</span> {decodedData.engine}
                    </div>
                  )}

                  {decodedData.transmission && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Transmisie:</span> {decodedData.transmission}
                    </div>
                  )}

                  {decodedData.fuelType && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Combustibil:</span> {decodedData.fuelType}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {decodedData && !decodedData.make && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">VIN Parțial Decodat</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Nu am putut extrage toate datele. Completați manual marca și modelul.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
