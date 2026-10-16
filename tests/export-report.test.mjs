import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
import {buildReport} from '../public/export-report.js';import {CATEGORIES} from '../functions/api/[[path]].js';
const template=JSON.parse(readFileSync(new URL('../public/export-template.json',import.meta.url),'utf8'));
test('XLSX report opens as a valid archive with 13 formatted sheets, filters and safe literal names',async()=>{
 const rows=[{categoryId:'pbd',year:1,className:'1 Amber',name:'=SUM(1,2)',status:'Draf',publication:'Belum diterbitkan'}];
 for(const records of [[],rows]){
  const data={source:'working',year:0,generatedAt:'2026-10-16T12:00:00Z',categories:CATEGORIES.map(c=>({id:c.id,name:c.name})),rows:records};const blob=buildReport(data,template);
  const result=spawnSync('python3',['-c',`import sys,io,zipfile,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));assert z.testzip() is None
n={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
for name in z.namelist(): E.fromstring(z.read(name))
assert len(E.fromstring(z.read('xl/workbook.xml')).find('x:sheets',n))==13
for i in range(2,14):
 s=E.fromstring(z.read(f'xl/worksheets/sheet{i}.xml'))
 assert s.find('x:sheetViews/x:sheetView/x:pane',n).get('ySplit')=='5'
 assert s.find('x:autoFilter',n) is not None
 for c in s.findall('.//x:c',n):
  if ''.join(c.itertext())=='=SUM(1,2)': assert c.get('t')=='inlineStr' and c.find('x:f',n) is None
print('ok')`],{input:Buffer.from(await blob.arrayBuffer()),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'ok');
 }
});
