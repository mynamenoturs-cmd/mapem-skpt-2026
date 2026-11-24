// Import offline: workbook and CSV are parsed inside the user's browser, without a third-party service.
export const HEADERS=['Kelas','ID Murid','Nama Murid','PRA','Nama Ibu Bapa/Penjaga','No IC Penjaga','No Telefon','Alamat Terkini','E-mel Penjaga','Agensi PAKK','Jantina','Status Agama','Kewarganegaraan','Bangsa'];
export const CLASSES=['Emerald','Ruby','Sapphire','Diamond','Jade','Crystal','Topaz','Amber','Pearl'];
const decoder=new TextDecoder('utf-8',{fatal:false}),encoder=new TextEncoder();
function cleanHeader(s){return String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
const ALIASES={
 jantina:['Jantina'],agama:['Status Agama','Agama'],warga:['Kewarganegaraan','Taraf Warganegara'],bangsa:['Bangsa','Kaum','Etnik'],
 emailPenjaga:['E-mel Penjaga','Email Ibu Bapa','Email Penjaga'],
 agensiPra:['Agensi PAKK','Agensi Prasekolah'],
 kelas:['Kelas','Nama Kelas','Class'],
 idMurid:['ID Murid','ID','No ID Murid','IDME'],
 namaMurid:['Nama Murid','Nama','Nama Penuh Murid'],
 pra:['PRA','Prasekolah','Status PRA'],
 namaPenjaga:['Nama Ibu Bapa/Penjaga','Nama Ibu Bapa','Nama Ibubapa','Nama Penjaga','Ibu Bapa','Penjaga','Nama Ibubapa Penjaga'],
 noIc:['No IC Penjaga','No IC','No. IC','No IC Ibu Bapa','No KP','No KP Penjaga','MyKad Penjaga','No Kad Pengenalan'],
 noTelefon:['No Telefon','No. Telefon','No Phone','Nombor Telefon','Telefon','No HP','Handphone'],
 alamat:['Alamat Terkini','Alamat','Alamat Murid','Alamat Semasa']
};
function delimiterOf(text){
 const first=String(text).replace(/^\uFEFF/,'').split(/\r?\n/,1)[0]||'';
 const totals={',':0,';':0,'\t':0};let q=false;
 for(let i=0;i<first.length;i++){const c=first[i];if(c==='"'){if(q&&first[i+1]==='"'){i++;continue;}q=!q;}else if(!q&&Object.hasOwn(totals,c))totals[c]++;}
 return Object.entries(totals).sort((a,b)=>b[1]-a[1])[0][0];
}
export function parseCsv(text){
 const src=String(text).replace(/^\uFEFF/,'');const delimiter=delimiterOf(src);
 let quoted=false,field='',row=[],rows=[];
 for(let i=0;i<src.length;i++){
  const c=src[i];
  if(quoted){if(c==='"'){if(src[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=c;}
  else if(c==='"'){if(field!=='')throw Error('Tanda petikan CSV tidak sah pada baris '+(rows.length+1));quoted=true;}
  else if(c===delimiter){row.push(field);field='';}
  else if(c==='\r'||c==='\n'){if(c==='\r'&&src[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
  else field+=c;
 }
 if(quoted)throw Error('Fail CSV mempunyai tanda petikan yang belum ditutup.');
 if(field!==''||row.length){row.push(field);rows.push(row);}
 return rows;
}
function rowsFromSheet(xml,shared){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw Error('Helaian Excel tidak dapat dibaca.');
 const cells=[];
 for(const row of doc.getElementsByTagNameNS('*','row')){
  const values=[];
  for(const cell of row.getElementsByTagNameNS('*','c')){
   const pos=cell.getAttribute('r')||'';
   const letters=(pos.match(/^[A-Z]+/i)||[])[0];
   if(!letters)continue;
   let index=0;for(const letter of letters.toUpperCase())index=index*26+letter.charCodeAt(0)-64;index--;
   if(index>255)continue;
   const kind=cell.getAttribute('t');
   const v=cell.getElementsByTagNameNS('*','v')[0]?.textContent??'';
   const inline=cell.getElementsByTagNameNS('*','is')[0];
   let value=kind==='s'?shared[Number(v)]??'':kind==='inlineStr'?inline?.textContent??'':v;
   values[index]=String(value);
  }
  cells.push(values);
  if(cells.length>3000)throw Error('Fail Excel melebihi had 3,000 baris.');
 }
 return cells;
}
async function unzipContent(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 let eocd=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}
 if(eocd<0)throw Error('Fail Excel bukan arkib XLSX yang sah.');
 const count=view.getUint16(eocd+10,true),base=view.getUint32(eocd+16,true);
 if(count>2000)throw Error('Terlalu banyak fail dalam buku kerja.');
 let offset=base;const entries=new Map();
 for(let i=0;i<count;i++){
  if(view.getUint32(offset,true)!==0x02014b50)throw Error('Struktur fail XLSX rosak.');
  const method=view.getUint16(offset+10,true),size=view.getUint32(offset+20,true),expanded=view.getUint32(offset+24,true),
   length=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),
   local=view.getUint32(offset+42,true);
  const name=decoder.decode(bytes.subarray(offset+46,offset+46+length));
  offset+=46+length+extra+comment;
  if(!name.startsWith('xl/')||!(name.endsWith('.xml')||name.endsWith('.rels')))continue;
  if(size>5000000||expanded>12000000)throw Error('Fail Excel terlalu besar.');
  if(view.getUint32(local,true)!==0x04034b50)throw Error('Struktur fail Excel tidak sah.');
  const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
  const payload=bytes.subarray(start,start+size);
  let data;
  if(method===0)data=payload;
  else if(method===8){
   if(typeof DecompressionStream==='undefined')throw Error('Pelayar ini tidak menyokong fail XLSX. Simpan sebagai CSV UTF-8.');
   const inflated=new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
   data=new Uint8Array(await new Response(inflated).arrayBuffer());
  }else throw Error('Kaedah mampatan XLSX tidak disokong.');
  if(data.length>12000000)throw Error('Kandungan Excel terlalu besar.');
  entries.set(name,decoder.decode(data));
 }
 return entries;
}
export async function readTable(file){
 if(!file||file.size>5000000)throw Error('Pilih fail CSV/XLSX berukuran 5 MB atau kurang.');
 if(/\.csv$/i.test(file.name))return parseCsv(await file.text());
 if(!/\.xlsx$/i.test(file.name))throw Error('Hanya fail .xlsx atau .csv diterima. Simpan XLS lama sebagai XLSX atau CSV UTF-8.');
 const entries=await unzipContent(await file.arrayBuffer());
 let workbookPath=[...entries.keys()].find(k=>k==='xl/workbook.xml');
 if(!workbookPath)throw Error('Fail tidak mengandungi buku kerja Excel.');
 const workbook=new DOMParser().parseFromString(entries.get(workbookPath),'application/xml');
 const sheet=workbook.getElementsByTagNameNS('*','sheet')[0];let sheetFile;
 if(sheet){
  const id=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  const rel=entries.get('xl/_rels/workbook.xml.rels');
  if(rel&&id){
   const rels=new DOMParser().parseFromString(rel,'application/xml');
   const match=[...rels.getElementsByTagNameNS('*','Relationship')].find(n=>n.getAttribute('Id')===id);
   if(match){
    const target=match.getAttribute('Target')||'';
    sheetFile=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');
   }
  }
 }
 if(!sheetFile||!entries.has(sheetFile))sheetFile=[...entries.keys()].filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0];
 if(!sheetFile)throw Error('Fail tiada helaian murid yang boleh dibaca.');
 const strings=entries.get('xl/sharedStrings.xml');
 let shared=[];
 if(strings){const doc=new DOMParser().parseFromString(strings,'application/xml');shared=[...doc.getElementsByTagNameNS('*','si')].map(n=>n.textContent??'');}
 return rowsFromSheet(entries.get(sheetFile),shared);
}
export function mapImportRows(table,{defaultClass='Semua',allowedClass=null}={}){
 if(!Array.isArray(table)||!table.length)throw Error('Fail tidak mengandungi tajuk lajur.');
 const head=table[0].map(cleanHeader);
 const index={};
 for(const [key,aliases] of Object.entries(ALIASES))index[key]=head.findIndex(h=>aliases.some(a=>cleanHeader(a)===h));
 const required=['idMurid','namaMurid'];
 const missing=required.filter(k=>index[k]<0);
 if(missing.length)throw Error('Lajur tidak dijumpai: '+missing.map(k=>ALIASES[k][0]).join(', '));
 if(index.kelas<0&&defaultClass==='Semua')throw Error('Lajur Kelas wajib ada apabila memilih Semua Kelas.');
 const records=[],errors=[],seen=new Set();
 if(table.length>3000)throw Error('Had maksimum 2,999 baris bagi satu fail.');
 for(let n=1;n<table.length;n++){
  const line=table[n]||[];
  if(!line.some(v=>String(v??'').trim()))continue;
  const get=k=>index[k]===-1?'':String(line[index[k]]??'').trim();
  const item={};
  const rawClass=get('kelas')||defaultClass;
  item.kelas=CLASSES.find(c=>c.toLowerCase()===rawClass.toLowerCase())||rawClass;
  for(const key of Object.keys(ALIASES))if(key!=='kelas')item[key]=get(key);
  const pra=item.pra.toLowerCase().replace(/\s+/g,' ');
  item.pra=['y','yes','ya'].includes(pra)?'Ya':['n','no','tidak'].includes(pra)?'Tidak':['','belum pasti','belumpasti','bp'].includes(pra)?'Belum Pasti':item.pra;
  const problems=[];
  for(const [field,options] of Object.entries({jantina:{lelaki:'Lelaki',l:'Lelaki',perempuan:'Perempuan',p:'Perempuan'},agama:{muslim:'Muslim',islam:'Muslim',bukanmuslim:'Bukan Muslim',bukanislam:'Bukan Muslim',nonmuslim:'Bukan Muslim'},warga:{warga:'Warganegara',warganegara:'Warganegara',bukanwarga:'Bukan Warganegara',bukanwarganegara:'Bukan Warganegara'}})){
   if(item[field]){const value=options[cleanHeader(item[field])];if(typeof value==='string')item[field]=value;else problems.push(field);}
  }
  if(item.bangsa.length>80)problems.push('bangsa');
  item.agensiPra=item.agensiPra.toUpperCase();
  if(!['','KEMAS','PASTI','PERPADUAN','PRASEKOLAH KPM','SWASTA','LAIN-LAIN'].includes(item.agensiPra) || (item.agensiPra && item.pra==='Tidak'))problems.push('agensi prasekolah');
  if(item.agensiPra && item.pra==='Belum Pasti')item.pra='Ya';
  if(item.emailPenjaga && (item.emailPenjaga.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.emailPenjaga)))problems.push('e-mel penjaga');
  if(!CLASSES.includes(item.kelas))problems.push('kelas tidak sah');
  if(allowedClass&&item.kelas!==allowedClass)problems.push('bukan kelas '+allowedClass);
  if(!/^[\p{L}\p{N} _./-]{2,45}$/u.test(item.idMurid))problems.push('ID murid tidak sah');
  if(item.namaMurid.length<2||item.namaMurid.length>150)problems.push('nama murid');
  if(!['Ya','Tidak','Belum Pasti'].includes(item.pra))problems.push('PRA');
  if(item.namaPenjaga && (item.namaPenjaga.length<2||item.namaPenjaga.length>150))problems.push('nama penjaga');
  if(item.noIc && (item.noIc.length<4||item.noIc.length>30))problems.push('No IC Penjaga');
  if(item.noTelefon && (item.noTelefon.length<7||item.noTelefon.length>25||!/^[+\d ()-]+$/.test(item.noTelefon)))problems.push('telefon');
  if(item.alamat && (item.alamat.length<5||item.alamat.length>500))problems.push('alamat');
  if(seen.has(item.idMurid.toLocaleLowerCase('ms')))problems.push('ID berulang dalam fail');
  if(problems.length){errors.push({row:n+1,message:problems.join(', ')});continue;}
  seen.add(item.idMurid.toLocaleLowerCase('ms'));records.push(item);
 }
 return {records,errors,nonEmpty:records.length+errors.length};
}
function escapeXml(v){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function crc32(bytes){
 let crc=0xFFFFFFFF;
 for(const c of bytes){crc^=c;for(let i=0;i<8;i++)crc=(crc>>>1)^(-(crc&1)&0xEDB88320);}
 return (crc^0xFFFFFFFF)>>>0;
}
function makeZip(content){
 const chunks=[],central=[];let offset=0;
 function u16(x){return [x&255,(x>>>8)&255];}function u32(x){return [x&255,(x>>>8)&255,(x>>>16)&255,(x>>>24)&255];}
 for(const [path,data] of Object.entries(content)){
  const filename=encoder.encode(path),body=encoder.encode(data),checksum=crc32(body);
  const header=new Uint8Array([80,75,3,4,...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(checksum),...u32(body.length),...u32(body.length),...u16(filename.length),...u16(0)]);
  chunks.push(header,filename,body);
  const dir=new Uint8Array([80,75,1,2,...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(checksum),...u32(body.length),...u32(body.length),...u16(filename.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
  central.push(dir,filename);offset+=header.length+filename.length+body.length;
 }
 const size=central.reduce((n,c)=>n+c.length,0),count=Object.keys(content).length;
 const tail=new Uint8Array([80,75,5,6,...u16(0),...u16(0),...u16(count),...u16(count),...u32(size),...u32(offset),...u16(0)]);
 return new Blob([...chunks,...central,tail],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
export function createExcelTemplate(kelas=''){
 const fill=CLASSES.includes(kelas)?kelas:'';
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pendaftaran 2027" sheetId="1" r:id="rId1"/></sheets></workbook>';
 const cols='ABCDEFGHIJKLMN',widths=[18,23,38,18,37,24,22,55,32,25,18,22,24,24];
 const colxml=widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('');
 const first='<row r="1">'+HEADERS.map((h,i)=>'<c r="'+cols[i]+'1" s="1" t="inlineStr"><is><t>'+escapeXml(h)+'</t></is></c>').join('')+'</row>';
 const empty=Array.from({length:100},(_,k)=>{
  const row=k+2;return '<row r="'+row+'">'+cols.split('').map((letter,i)=>'<c r="'+letter+row+'" s="2"'+(i===0&&fill?' t="inlineStr"><is><t>'+escapeXml(fill)+'</t></is></c>':'/>')).join('')+'</row>';
 }).join('');
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+colxml+'</cols><sheetData>'+first+empty+'</sheetData><autoFilter ref="A1:N101"/><dataValidations count="2"><dataValidation type="list" allowBlank="1" sqref="D2:D101"><formula1>&quot;Ya,Tidak,Belum Pasti&quot;</formula1></dataValidation><dataValidation type="list" allowBlank="1" sqref="J2:J101"><formula1>&quot;KEMAS,PASTI,PERPADUAN,PRASEKOLAH KPM,SWASTA,LAIN-LAIN&quot;</formula1></dataValidation></dataValidations></worksheet>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>';
 return makeZip({
  '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
  '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  'xl/workbook.xml':workbook,
  'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
  'xl/worksheets/sheet1.xml':sheet,
  'xl/styles.xml':styles
 });
}
