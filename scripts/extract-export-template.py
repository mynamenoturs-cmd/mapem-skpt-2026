"""Extract static layout/styles from the Artifact Tool-authored XLSX template."""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as E
import json,sys
source=Path(sys.argv[1])
target=Path(sys.argv[2])
n={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with ZipFile(source) as z:
    template={'files':{k:z.read(k).decode('utf-8-sig') for k in ['xl/styles.xml','xl/theme/theme1.xml','_rels/.rels']},'sheets':[]}
    for i in [1,2]:
        xml=z.read(f'xl/worksheets/sheet{i}.xml').decode('utf-8-sig')
        tree=E.fromstring(xml)
        styles={c.attrib['r']:int(c.attrib.get('s',0)) for c in tree.findall('.//x:c',n)}
        template['sheets'].append({'prefix':xml.split('<x:sheetData>')[0],'styles':styles})
target.write_text(json.dumps(template,separators=(',',':')))
