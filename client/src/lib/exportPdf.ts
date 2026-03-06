import jsPDF from 'jspdf';
import type { FavoriteCase } from '@/hooks/useFavorites';

export function exportFavoritesToPDF(favorites: FavoriteCase[]) {
  if (favorites.length === 0) {
    alert('No favorites to export');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Set default font
  doc.setFont('Helvetica', 'normal');

  // Title
  doc.setFontSize(24);
  doc.setFont('Helvetica', 'bold');
  doc.text('Diagnostic Cases Report', margin, yPosition);
  yPosition += 10;

  // Timestamp
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, margin, yPosition);
  yPosition += 8;

  // Summary
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Total Cases: ${favorites.length}`, margin, yPosition);
  yPosition += 10;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Process each favorite case
  favorites.forEach((caseItem, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Case number and header
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // Dark slate
    doc.text(`Case ${index + 1}: ${caseItem.vehicleMake} ${caseItem.vehicleModel}`, margin, yPosition);
    yPosition += 7;

    // Case details
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const details = [
      `Year: ${caseItem.year || 'N/A'}`,
      `Engine: ${caseItem.engine || 'N/A'}`,
      `Error Code: ${caseItem.errorCode}`,
      `Confidence: ${(parseFloat(caseItem.confidence) * 100).toFixed(0)}%`,
    ];

    details.forEach(detail => {
      doc.text(detail, margin + 5, yPosition);
      yPosition += 5;
    });

    yPosition += 3;

    // Symptoms
    if (Array.isArray(caseItem.symptoms) && caseItem.symptoms.length > 0) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Symptoms:', margin + 5, yPosition);
      yPosition += 5;

      doc.setFont('Helvetica', 'normal');
      caseItem.symptoms.forEach(symptom => {
        doc.text(`• ${symptom}`, margin + 10, yPosition);
        yPosition += 4;
      });

      yPosition += 2;
    }

    // Source URL
    if (caseItem.sourceUrl) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Source:', margin + 5, yPosition);
      yPosition += 4;

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(0, 0, 255);
      const urlText = caseItem.sourceUrl.substring(0, 60) + (caseItem.sourceUrl.length > 60 ? '...' : '');
      doc.text(urlText, margin + 10, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 5;
    }

    yPosition += 3;

    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
  });

  // Footer
  const totalPages = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const filename = `diagnostic-cases-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
