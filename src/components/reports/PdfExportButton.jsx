import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PdfExportButton({ experiments, filterStatus }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;

    // Cover header
    pdf.setFillColor(10, 18, 35);
    pdf.rect(0, 0, pageW, 28, 'F');
    pdf.setTextColor(56, 189, 248);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ChaosOps — Experiment Report', margin, 14);
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleString()}  |  Filter: ${filterStatus}  |  Total: ${experiments.length}`, margin, 22);
    y = 36;

    for (const exp of experiments) {
      const el = document.getElementById(`report-${exp.id}`);
      if (!el) continue;
      const canvas = await html2canvas(el, { backgroundColor: '#0d1526', scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (y + imgH > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      y += imgH + 6;
    }

    pdf.save(`chaosops-report-${Date.now()}.pdf`);
    setExporting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      onClick={handleExport}
      disabled={exporting || experiments.length === 0}
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {exporting ? 'Exporting…' : 'Export PDF'}
    </Button>
  );
}