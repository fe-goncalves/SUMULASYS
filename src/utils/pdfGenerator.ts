import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const drawMatchScoreSheet = (doc: jsPDF, match: any) => {
    // A4 Portrait: 210mm x 297mm
    
    // Tournament Main Color for headers
    let headerColor = [200, 200, 200];
    if (match.tournament_main_color) {
        const hex = match.tournament_main_color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        headerColor = [r, g, b];
    }
    
    // --- TABLE 1: MATCH INFO ---
    // Width: 190mm
    // Margins: 10mm (Left/Right)
    
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    const teamAName = match.team_a?.fullname || 'Team A';
    const teamBName = match.team_b?.fullname || 'Team B';

    const table1Body = [
      // Row 1 (Index 0) - Height 22.5mm
      [
        { content: teamAName, styles: { halign: 'left', valign: 'middle', fontSize: 14, fontStyle: 'bold', minCellHeight: 22.5 } as any },
        { content: '', styles: { minCellHeight: 22.5 } }, // Team A Logo
        { content: '', styles: { minCellHeight: 22.5 } }, // Col 3 - Merged 1-3
        { content: '', styles: { minCellHeight: 22.5 } }, // Col 4 - Merged 1-3
        { content: '', styles: { minCellHeight: 22.5 } }, // Team B Logo
        { content: teamBName, styles: { halign: 'right', valign: 'middle', fontSize: 14, fontStyle: 'bold', minCellHeight: 22.5 } as any },
      ],
      // Row 2 (Index 1) - Match Info - Height 6.0mm
      [
        { content: match.tournament_name || '', styles: { halign: 'left', minCellHeight: 6.0, fillColor: [29, 29, 29], textColor: [255, 255, 255] } as any },
        { content: match.phase || '', styles: { halign: 'center', minCellHeight: 6.0, fillColor: [65, 65, 65], textColor: [255, 255, 255] } as any },
        { content: formatDate(match.date), colSpan: 2, styles: { halign: 'center', minCellHeight: 6.0, fillColor: [65, 65, 65], textColor: [255, 255, 255] } as any },
        { content: match.round || '', styles: { halign: 'center', minCellHeight: 6.0, fillColor: [65, 65, 65], textColor: [255, 255, 255] } as any },
        { content: "ORANGE 2026", styles: { halign: 'center', minCellHeight: 6.0, fillColor: [29, 29, 29], textColor: [255, 255, 255] } as any }
      ]
    ];

    autoTable(doc, {
      body: table1Body,
      theme: 'grid',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.25, // 0.7pt
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
        cellPadding: 1,
        minCellHeight: 7.5
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 50.0 },
        1: { cellWidth: 22.5 },
        2: { cellWidth: 22.5 },
        3: { cellWidth: 22.5 },
        4: { cellWidth: 22.5 },
        5: { cellWidth: 50.0 },
      },
      margin: { top: 10, left: 10, right: 10 },
      tableWidth: 190,
      startY: 10,
      didDrawCell: (data) => {
        if (data.section === 'body') {
           // Team A Logo (Row 0, Col 1)
           if (data.row.index === 0 && data.column.index === 1 && match.team_a?.logotype) {
               try {
                   const imgSize = 18; // 18mm image in 22.5mm cell
                   const x = data.cell.x + (data.cell.width - imgSize) / 2;
                   const y = data.cell.y + (data.cell.height - imgSize) / 2;
                   doc.addImage(match.team_a.logotype, 'PNG', x, y, imgSize, imgSize, undefined, 'FAST');
               } catch (e) { console.error("Error adding Team A logo", e); }
           }
           // Team B Logo (Row 0, Col 4)
           if (data.row.index === 0 && data.column.index === 4 && match.team_b?.logotype) {
               try {
                   const imgSize = 18; // 18mm image in 22.5mm cell
                   const x = data.cell.x + (data.cell.width - imgSize) / 2;
                   const y = data.cell.y + (data.cell.height - imgSize) / 2;
                   doc.addImage(match.team_b.logotype, 'PNG', x, y, imgSize, imgSize, undefined, 'FAST');
               } catch (e) { console.error("Error adding Team B logo", e); }
           }
        }

      }
    });

    // --- TABLE 2 & 3 GENERATION ---
    // Width: 191.5mm
    // Margins: 9.25mm (Left/Right)
    
    const generateTeamTable = (team: any, startY: number) => {
        if (!team) return;

        const rows = [];
        
        // Row 1: Title
        rows.push([{ content: (team.fullname || '').toUpperCase(), colSpan: 18, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'left', minCellHeight: 6.5 } as any }]);

        // Row 2: Categories
        const row2Style = { fillColor: headerColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', minCellHeight: 5.5 } as any;
        rows.push([
            { content: 'N°', styles: row2Style },
            { content: 'RG', styles: row2Style },
            { content: 'ATLETA', styles: row2Style },
            { content: 'C. AMA', colSpan: 2, styles: row2Style },
            { content: 'CV', styles: row2Style },
            { content: 'GOLS', colSpan: 6, styles: row2Style },
            { content: 'COMISSÃO TÉCNICA', colSpan: 6, styles: row2Style },
        ]);

        // Helper to get athlete/committee safely
        const getAth = (idx: number) => (team.athletes || [])[idx] || {};
        const getCom = (idx: number) => (team.committee || [])[idx] || {};
        
        const goalIdStyle = { fillColor: [29, 29, 29], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', minCellHeight: 5.3 } as any;
        const rgStyle = { halign: 'left', fontSize: 9, minCellHeight: 5.3 } as any;
        const athleteStyle = { halign: 'left', fontSize: 9, fontStyle: 'bold', minCellHeight: 5.3 } as any;
        const committeeStyle = { halign: 'left', fontSize: 8, minCellHeight: 5.3 } as any;
        const headerCategoryStyle = { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', minCellHeight: 5.3 } as any;
        const timePeriodStyle = { fillColor: [203, 203, 203], textColor: [0, 0, 0], minCellHeight: 5.3 } as any;

        // Data Rows (3-22) - 20 rows
        // Fixed structure for specific rows
        
        // Row 3 (Data 1)
        rows.push([
            '', 
            { content: getAth(0).id || '', styles: rgStyle }, 
            { content: getAth(0).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '1', styles: goalIdStyle }, '', '', { content: '2', styles: goalIdStyle }, '', '',
            { content: getCom(0).surname || '', colSpan: 4, styles: committeeStyle }, { content: '', colSpan: 2 }
        ]);

        // Row 4 (Data 2)
        rows.push([
            '', 
            { content: getAth(1).id || '', styles: rgStyle }, 
            { content: getAth(1).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: getCom(1).surname || '', colSpan: 4, styles: committeeStyle }, { content: '', colSpan: 2 }
        ]);

        // Row 5 (Data 3)
        rows.push([
            '', 
            { content: getAth(2).id || '', styles: rgStyle }, 
            { content: getAth(2).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '3', styles: goalIdStyle }, '', '', { content: '4', styles: goalIdStyle }, '', '',
            { content: getCom(2).surname || '', colSpan: 4, styles: committeeStyle }, { content: '', colSpan: 2 }
        ]);

        // Row 6 (Data 4) - FALTAS Header
        rows.push([
            '', 
            { content: getAth(3).id || '', styles: rgStyle }, 
            { content: getAth(3).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: 'FALTAS', colSpan: 6, styles: headerCategoryStyle }
        ]);

        // Row 7 (Data 5)
        rows.push([
            '', 
            { content: getAth(4).id || '', styles: rgStyle }, 
            { content: getAth(4).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '5', styles: goalIdStyle }, '', '', { content: '6', styles: goalIdStyle }, '', '',
            { content: '1T', styles: timePeriodStyle }, '', '', '', '', ''
        ]);

        // Row 8 (Data 6)
        rows.push([
            '', 
            { content: getAth(5).id || '', styles: rgStyle }, 
            { content: getAth(5).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: '2T', styles: timePeriodStyle }, '', '', '', '', ''
        ]);

        // Row 9 (Data 7) - PEDIDO DE TEMPO Header
        rows.push([
            '', 
            { content: getAth(6).id || '', styles: rgStyle }, 
            { content: getAth(6).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '7', styles: goalIdStyle }, '', '', { content: '8', styles: goalIdStyle }, '', '',
            { content: 'PEDIDO DE TEMPO', colSpan: 6, styles: headerCategoryStyle }
        ]);

        // Row 10 (Data 8)
        rows.push([
            '', 
            { content: getAth(7).id || '', styles: rgStyle }, 
            { content: getAth(7).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: '1T', colSpan: 3, styles: timePeriodStyle }, { content: '2T', colSpan: 3, styles: timePeriodStyle }
        ]);

        // Row 11 (Data 9)
        rows.push([
            '', 
            { content: getAth(8).id || '', styles: rgStyle }, 
            { content: getAth(8).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '9', styles: goalIdStyle }, '', '', { content: '10', styles: goalIdStyle }, '', '',
            { content: '', colSpan: 3 }, { content: '', colSpan: 3 }
        ]);

        // Row 12 (Data 10) - ASSINATURAS Header
        rows.push([
            '', 
            { content: getAth(9).id || '', styles: rgStyle }, 
            { content: getAth(9).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: 'ASSINATURAS', colSpan: 6, styles: headerCategoryStyle }
        ]);

        // Row 13 (Data 11)
        rows.push([
            '', 
            { content: getAth(10).id || '', styles: rgStyle }, 
            { content: getAth(10).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '11', styles: goalIdStyle }, '', '', { content: '12', styles: goalIdStyle }, '', '',
            { content: '', colSpan: 6, rowSpan: 3 }
        ]);

        // Row 14 (Data 12)
        rows.push([
            '', 
            { content: getAth(11).id || '', styles: rgStyle }, 
            { content: getAth(11).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            // Rowspan covered
        ]);

        // Row 15 (Data 13)
        rows.push([
            '', 
            { content: getAth(12).id || '', styles: rgStyle }, 
            { content: getAth(12).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '13', styles: goalIdStyle }, '', '', { content: '14', styles: goalIdStyle }, '', '',
            // Rowspan covered
        ]);

        // Row 16 (Data 14) - OBSERVAÇÕES Header
        rows.push([
            '', 
            { content: getAth(13).id || '', styles: rgStyle }, 
            { content: getAth(13).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            { content: 'OBSERVAÇÕES', colSpan: 6, styles: headerCategoryStyle }
        ]);

        // Row 17 (Data 15)
        rows.push([
            '', 
            { content: getAth(14).id || '', styles: rgStyle }, 
            { content: getAth(14).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '15', styles: goalIdStyle }, '', '', { content: '16', styles: goalIdStyle }, '', '',
            { content: '', colSpan: 6, rowSpan: 6 }
        ]);

        // Row 18 (Data 16)
        rows.push([
            '', 
            { content: getAth(15).id || '', styles: rgStyle }, 
            { content: getAth(15).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            // Rowspan covered
        ]);

        // Row 19 (Data 17)
        rows.push([
            '', 
            { content: getAth(16).id || '', styles: rgStyle }, 
            { content: getAth(16).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '17', styles: goalIdStyle }, '', '', { content: '18', styles: goalIdStyle }, '', '',
            // Rowspan covered
        ]);

        // Row 20 (Data 18)
        rows.push([
            '', 
            { content: getAth(17).id || '', styles: rgStyle }, 
            { content: getAth(17).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            // Rowspan covered
        ]);

        // Row 21 (Data 19)
        rows.push([
            '', 
            { content: getAth(18).id || '', styles: rgStyle }, 
            { content: getAth(18).surname || '', styles: athleteStyle }, 
            '', '', '',
            { content: '19', styles: goalIdStyle }, '', '', { content: '20', styles: goalIdStyle }, '', '',
            // Rowspan covered
        ]);

        // Row 22 (Data 20)
        rows.push([
            '', 
            { content: getAth(19).id || '', styles: rgStyle }, 
            { content: getAth(19).surname || '', styles: athleteStyle }, 
            '', '', '',
            { colSpan: 3, content: '' }, { colSpan: 3, content: '' },
            // Rowspan covered
        ]);

        autoTable(doc, {
            startY: startY,
            body: rows,
            theme: 'grid',
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.19, // 0.55pt
                textColor: [0, 0, 0],
                halign: 'center',
                valign: 'middle',
                fontSize: 6,
                cellPadding: 0.5,
                minCellHeight: 5.0
            },
            columnStyles: {
                0: { cellWidth: 8.0 },
                1: { cellWidth: 22.0 },
                2: { cellWidth: 48.5 },
                3: { cellWidth: 7.0 },
                4: { cellWidth: 7.0 },
                5: { cellWidth: 7.0 },
                6: { cellWidth: 7.0 },
                7: { cellWidth: 9.0 },
                8: { cellWidth: 9.0 },
                9: { cellWidth: 7.0 },
                10: { cellWidth: 9.0 },
                11: { cellWidth: 9.0 },
                12: { cellWidth: 7.0 },
                13: { cellWidth: 7.0 },
                14: { cellWidth: 7.0 },
                15: { cellWidth: 7.0 },
                16: { cellWidth: 7.0 },
                17: { cellWidth: 7.0 },
            },
            margin: { left: 9.25, right: 9.25 },
            tableWidth: 191.5
        });
    };

    // Generate Table 2 (Team A)
    generateTeamTable(match.team_a, (doc as any).lastAutoTable.finalY + 3);

    // Generate Table 3 (Team B)
    generateTeamTable(match.team_b, (doc as any).lastAutoTable.finalY + 3);
};

export const generateMatchPDF = (match: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    drawMatchScoreSheet(doc, match);
    return doc;
};

export const generateMatchesPDF = (matches: any[]) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    matches.forEach((match, index) => {
        if (index > 0) {
            doc.addPage();
        }
        drawMatchScoreSheet(doc, match);
    });
    return doc;
};
