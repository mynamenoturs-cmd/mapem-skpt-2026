// Fill an Artifact Tool-authored workbook layout locally. No report data is cached.
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xml=v=>String(v??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const shortNames=['PBD','UASA','Mata Pelajaran','Ikon Cemara','Khas Kurikulum','Harapan Kokurikulum','Harapan HEM','NILAM Individu','Tokoh NILAM','Navigator DELIMa','Khas PLAN','Tokoh Mawar'];
const C='ABCDEF';
function cell(ref,value,style,formula){return `<x:c r="${ref}" s="${style}">${formula?`<x:f>${xml(formula)}</x:f><x:v>${Number(value)||0}</x:v>`:typeof value==='number'?`<x:v>${value}</x:v>`:value==null?'':`<x:is><x:t xml:space="preserve">${xml(value)}</x:t></x:is>`}</x:c>`.replace(`<x:c r="${ref}" s="${style}">`,`<x:c r="${ref}" s="${style}"${formula||typeof value==='number'||value==null?'':' t="inlineStr"'}>`);}
function row(n,values,styles,height=30,formulas={}){return `<x:row r="${n}" ht="${height}" customHeight="1">${values.map((v,i)=>cell(C[i]+n,v,styles[i]??styles[0],formulas[i])).join('')}</x:row>`;}
function format(s,n){return [...C].map(c=>s.styles[c+n]||0);}
function sheet(s,rows,last,{filter=false,summary=false}={}){const merges=['A2:F2','A3:F3','A4:F4',...(summary?['A21:F22']:[`A${last}:C${last}`])];return s.prefix.replace('</x:sheetPr>','<x:pageSetUpPr fitToPage="1"/></x:sheetPr>')+`<x:sheetData>${rows.join('')}</x:sheetData>${filter?`<x:autoFilter ref="A5:F${last-1}"/>`:''}<x:mergeCells count="${merges.length}">${merges.map(ref=>`<x:mergeCell ref="${ref}"/>`).join('')}</x:mergeCells><x:pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><x:pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></x:worksheet>`;}
export function buildReport(data,template){
 if(!Array.isArray(data.rows)||data.categories.length!==12)throw Error('Data laporan tidak lengkap. Cuba muat semula portal.');
 const files={...template.files},summary=template.sheets[0],detail=template.sheets[1],names=['Ringkasan',...data.categories.map((c,i)=>String(i+1).padStart(2,'0')+' '+shortNames[i])],endRows=[22];
 const date=new Date(data.generatedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuching'}),scope=(data.source==='published'?'Senarai diterbitkan':'Senarai kerja termasuk draf')+' — '+(data.year?'Tahun '+data.year:'Semua tahun');
 const head=(s,title)=>[row(1,[],[]),row(2,['MaPeM SKPT 2026',null,null,null,null,null],format(s,2),31),row(3,[title,null,null,null,null,null],format(s,3),37),row(4,[scope+' · Dieksport '+date+' (MYT)',null,null,null,null,null],format(s,4),30)];
 const sum=head(summary,'Ringkasan penerima mengikut kategori');sum.push(row(5,['Bil','Kategori anugerah','Tahun 1','Tahun 2','Tahun 3','Jumlah'],format(summary,5),31));const totals=[0,0,0];
 data.categories.forEach((cat,i)=>{
  const group=data.rows.filter(r=>r.categoryId===cat.id),end=5+Math.max(1,group.length),last=end+1;endRows.push(last);const body=head(detail,cat.name);body.push(row(5,['Bil','Tahun','Kelas','Nama penuh murid','Status pengisian','Penerbitan'],format(detail,5),31));
  if(!group.length)body.push(row(6,[null,null,null,'Belum ada penerima bagi pilihan ini.',null,null],format(detail,6),38));
  group.forEach((r,k)=>body.push(row(k+6,[k+1,r.year,r.className,r.name,r.status,r.publication],format(detail,k%2?7:6),Math.max(30,Math.ceil(r.name.length/46)*17+9))));
  body.push(row(last,['Jumlah penerima',null,null,group.length,null,null],format(detail,8),30,{3:`COUNT(B6:B${end})`}));files[`xl/worksheets/sheet${i+2}.xml`]=sheet(detail,body,last,{filter:true});
  const counts=[1,2,3].map(y=>group.filter(r=>r.year===y).length),n=i+6;counts.forEach((v,j)=>totals[j]+=v);
  const formula={2:`COUNTIFS('${names[i+1]}'!B6:B${end},1)`,3:`COUNTIFS('${names[i+1]}'!B6:B${end},2)`,4:`COUNTIFS('${names[i+1]}'!B6:B${end},3)`,5:`SUM(C${n}:E${n})`};
  sum.push(row(n,[i+1,cat.name,...counts,group.length],format(summary,i%2?7:6),40,formula));
 });
 sum.push(row(19,[null,'Jumlah rekod anugerah',...totals,data.rows.length],format(summary,8),32,{2:'SUM(C6:C17)',3:'SUM(D6:D17)',4:'SUM(E6:E17)',5:'SUM(F6:F17)'}));
 sum.push(row(21,['Sumber: Portal MaPeM SKPT 2026. Bilangan rekod anugerah; seorang murid boleh menerima lebih daripada satu anugerah. Pencalonan belum dipilih tidak termasuk.',null,null,null,null,null],format(summary,4),38));
 files['xl/worksheets/sheet1.xml']=sheet(summary,sum,22,{summary:true});
 files['xl/workbook.xml']=`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${NS}" xmlns:r="${RNS}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${names.map((name,i)=>`<sheet name="${xml(name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><definedNames>${names.map((name,i)=>`<definedName name="_xlnm.Print_Area" localSheetId="${i}">'${xml(name)}'!$A$1:$F$${endRows[i]}</definedName>${i?`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">'${xml(name)}'!$1:$5</definedName>`:''}`).join('')}</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`;
 files['xl/_rels/workbook.xml.rels']=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="style" Type="${RNS}/styles" Target="styles.xml"/><Relationship Id="theme" Type="${RNS}/theme" Target="theme/theme1.xml"/>${names.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${RNS}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`;
 files['[Content_Types].xml']=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${names.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
 return new Blob([zipStore(files)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
// ZIP STORE needs no external service, compression dependency or upload of names.
function zipStore(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0,size=0;const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 const u16=(v,o,n)=>v.setUint16(o,n,true),u32=(v,o,n)=>v.setUint32(o,n>>>0,true);
 for(const [path,text] of Object.entries(files)){const name=enc.encode(path),data=enc.encode(text);let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
  const h=new Uint8Array(30+name.length),v=new DataView(h.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,12,33);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,name.length);h.set(name,30);parts.push(h,data);
  const c=new Uint8Array(46+name.length),d=new DataView(c.buffer);u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u16(d,8,0x800);u16(d,14,33);u32(d,16,crc);u32(d,20,data.length);u32(d,24,data.length);u16(d,28,name.length);u32(d,42,offset);c.set(name,46);central.push(c);size+=c.length;offset+=h.length+data.length;
 }
 const e=new Uint8Array(22),v=new DataView(e.buffer);u32(v,0,0x06054b50);u16(v,8,central.length);u16(v,10,central.length);u32(v,12,size);u32(v,16,offset);const result=new Uint8Array(offset+size+22);let n=0;for(const p of [...parts,...central,e]){result.set(p,n);n+=p.length;}return result;}
