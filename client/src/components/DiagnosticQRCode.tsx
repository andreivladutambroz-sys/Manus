import { useState, useRef } from "react";
import QRCode from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";

interface DiagnosticQRCodeProps {
  diagnosticId: number;
  vehicleBrand: string;
  vehicleModel: string;
}

export function DiagnosticQRCode({ diagnosticId, vehicleBrand, vehicleModel }: DiagnosticQRCodeProps) {
  const [open, setOpen] = useState(false);
  
  const qrValue = `${window.location.origin}/diagnostic/${diagnosticId}`;
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `diagnostic-${diagnosticId}-qr.png`;
      link.click();
      toast.success("QR code downloaded");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(qrValue);
    toast.success("Link copied to clipboard");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share QR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Diagnostic</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <div ref={qrRef} className="p-4 bg-white rounded-lg border">
              <QRCode
                value={qrValue}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              <p className="font-medium">{vehicleBrand} {vehicleModel}</p>
              <p>Diagnostic #{diagnosticId}</p>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="flex-1"
              >
                Copy Link
              </Button>
              <Button
                size="sm"
                onClick={downloadQR}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
