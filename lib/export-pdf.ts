'use client';

import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';

interface Transaction {
    created_at: string;
    driver_name: string;
    plate: string;
    duration_min: number;
    amount: number;
    method: string;
}

interface SolineraInfo {
    name: string;
    address: string;
    phone?: string | null;
}

interface ExportOptions {
    solinera: SolineraInfo;
    transactions: Transaction[];
    monthLabel: string;
    totalRevenue: number;
}

export async function exportReportPDF(options: ExportOptions) {
    const { solinera, transactions, monthLabel, totalRevenue } = options;

    // ===== 1. Crear PDF =====
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ===== Header naranja =====
    doc.setFillColor(255, 140, 0);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SoliNet', margin, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de operaciones', margin, 27);

    // ===== Info de la solinera =====
    let y = 45;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(solinera.name, margin, y);

    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(solinera.address, margin, y);

    if (solinera.phone) {
        y += 5;
        doc.text(`Tel: ${solinera.phone}`, margin, y);
    }

    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);

    // ===== Resumen =====
    y += 10;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen del período', margin, y);

    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    doc.text(`Período: ${monthLabel}`, margin, y);
    y += 6;
    doc.text(`Total de cargas: ${transactions.length}`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 140, 0);
    doc.text(`Ingresos totales: ${totalRevenue.toLocaleString()} CUP`, margin, y);

    // ===== Tabla =====
    y += 15;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de cargas', margin, y);

    y += 8;

    // Cabecera de tabla
    const colX = {
        fecha: margin,
        cliente: margin + 28,
        matricula: margin + 75,
        duracion: margin + 115,
        metodo: margin + 140,
        monto: pageWidth - margin,
    };

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Fecha', colX.fecha, y);
    doc.text('Cliente', colX.cliente, y);
    doc.text('Matrícula', colX.matricula, y);
    doc.text('Duración', colX.duracion, y);
    doc.text('Método', colX.metodo, y);
    doc.text('Monto', colX.monto, y, { align: 'right' });

    y += 6;

    // Filas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    transactions.forEach((t, i) => {
        // Salto de página
        if (y > pageHeight - 25) {
            doc.addPage();
            y = 20;
        }

        const fecha = new Date(t.created_at);
        const fechaStr = `${fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
        })} ${fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
        })}`;

        // Fondo alternado
        if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
        }

        doc.text(fechaStr, colX.fecha, y);
        doc.text(t.driver_name.substring(0, 22), colX.cliente, y);
        doc.text(t.plate, colX.matricula, y);
        doc.text(`${t.duration_min} min`, colX.duracion, y);
        doc.text(t.method, colX.metodo, y);
        doc.text(`${t.amount}`, colX.monto, y, { align: 'right' });

        y += 7;
    });

    // ===== Footer =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `SoliNet · Generado el ${new Date().toLocaleDateString('es-ES')} · Página ${i} de ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // ===== 2. Guardar/compartir =====
    const fileName = `reporte-solinet-${new Date().toISOString().slice(0, 10)}.pdf`;

    if (Capacitor.isNativePlatform()) {
        // ===== APK: guardar + compartir nativo =====
        try {
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            const result = await Filesystem.writeFile({
                path: fileName,
                data: pdfBase64,
                directory: Directory.Cache,
            });

            await Share.share({
                title: 'Reporte SoliNet',
                text: `Reporte de operaciones · ${monthLabel}`,
                url: result.uri,
                dialogTitle: 'Compartir reporte',
            });

            toast.success('Reporte generado');
        } catch (err: any) {
            console.error(err);
            toast.error('Error al guardar el reporte');
        }
    } else {
        // ===== Web: descarga directa =====
        doc.save(fileName);
        toast.success('Reporte descargado');
    }
}