import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const outputDir=process.argv[2]||'/tmp/mapem-export-template';await fs.mkdir(outputDir,{recursive:true});
const wb=Workbook.create();
for(const [name,widths] of [['Ringkasan',[7,53,13,13,13,13]],['Kategori',[7,10,19,49,20,21]]]){
 const s=wb.worksheets.add(name);s.showGridLines=false;s.tabColor=name==='Ringkasan'?'#64172F':'#C8A05A';
 s.getRange('A1:F23').format.font={name:'Arial',size:11,color:'#452333'};s.getRange('A1:F23').format.verticalAlignment='center';
 for(let i=0;i<6;i++)s.getRange(String.fromCharCode(65+i)+'1:'+String.fromCharCode(65+i)+'23').format.columnWidth=widths[i];
 for(const row of [2,3,4]){s.mergeCells(`A${row}:F${row}`);s.getRange(`A${row}`).values=[[row===2?'MaPeM SKPT 2026':row===3?'Laporan mengikut kategori':'Sumber: Portal MaPeM SKPT 2026']];}
 s.getRange('A2:F2').format.font={name:'Arial',size:16,bold:true,color:'#64172F'};s.getRange('A2:F2').format.rowHeight=31;s.getRange('A2:F2').format.borders={bottom:{style:'medium',color:'#C8A05A'}};
 s.getRange('A3:F3').format.font={name:'Arial',size:12,bold:true,color:'#71492B'};s.getRange('A3:F3').format.rowHeight=37;s.getRange('A3:F4').format.wrapText=true;s.getRange('A4:F4').format.font={name:'Arial',size:10,color:'#74615B'};s.getRange('A4:F4').format.rowHeight=30;
 s.getRange('A5:F5').values=[name==='Ringkasan'?['Bil','Kategori anugerah','Tahun 1','Tahun 2','Tahun 3','Jumlah']:['Bil','Tahun','Kelas','Nama penuh murid','Status pengisian','Penerbitan']];
 s.getRange('A5:F5').format={fill:'#64172F',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:31,wrapText:true};
 for(const row of [6,7]){s.getRange(`A${row}:F${row}`).values=[[1,3,'3 Crystal','Nama murid contoh','Dihantar','Belum diterbitkan']];s.getRange(`A${row}:F${row}`).format.fill=row===6?'#FFF8E8':'#F2E7D2';s.getRange(`A${row}:F${row}`).format.rowHeight=30;s.getRange(`A${row}:F${row}`).format.wrapText=true;s.getRange(`A${row}:C${row}`).format.horizontalAlignment='center';s.getRange(`E${row}:F${row}`).format.horizontalAlignment='center';s.getRange(`D${row}`).format.font={name:'Arial',size:11,bold:true,color:'#64172F'};}
 s.getRange('A8:F8').format={fill:'#DFC385',font:{name:'Arial',size:11,bold:true,color:'#4D2231'},rowHeight:30};s.getRange('A8').values=[['Jumlah penerima']];s.getRange('D8').formulas=[['=COUNT(B6:B7)']];
 if(name==='Ringkasan'){s.getRange('B6:B7').format.horizontalAlignment='left';s.getRange('C6:F7').format.horizontalAlignment='right';s.getRange('C6:F7').format.font={name:'Arial',size:11,color:'#452333'};s.getRange('C6:F7').setNumberFormat('#,##0');}if(name==='Kategori')s.freezePanes.freezeRows(5);
}
wb.recalculate();console.log((await wb.inspect({kind:'table',range:'Kategori!A5:F8',include:'values,formulas',tableMaxRows:4,tableMaxCols:6})).ndjson);
for(const name of ['Ringkasan','Kategori']){const im=await wb.render({sheetName:name,range:'A1:F10',scale:1.5});await fs.writeFile(outputDir+'/'+name+'.png',new Uint8Array(await im.arrayBuffer()));}
const output=await SpreadsheetFile.exportXlsx(wb);await output.save(outputDir+'/template.xlsx');
