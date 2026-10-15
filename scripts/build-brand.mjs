// Produce app icons from the approved unified MaPeM artwork, without re-pasting a crest.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const emblem='public/assets/mapem-emblem-v2.webp',banner='public/assets/mapem-banner-v2.webp';
await Promise.all([
 sharp(emblem).resize(192,192).png().toFile('public/icon-192.png'),
 sharp(emblem).resize(512,512).png().toFile('public/icon-512.png'),
 sharp(emblem).resize(410,410).extend({top:51,bottom:51,left:51,right:51,background:'#4b091b'}).png().toFile('public/icon-maskable.png')
]);
// Preserve legacy asset paths for installed apps upgrading from earlier versions.
const wrap=(data,w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="data:image/webp;base64,${data.toString('base64')}"/></svg>`;
const e=await readFile(emblem),b=await readFile(banner),size=await sharp(banner).metadata();
await Promise.all([writeFile('public/icon.svg',wrap(e,1024,1024)),writeFile('public/brand.svg',wrap(e,1024,1024)),writeFile('public/banner.svg',wrap(b,size.width,size.height))]);
console.log('Unified MaPeM banner and app icons prepared.');
