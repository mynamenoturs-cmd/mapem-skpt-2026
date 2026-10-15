// Build MaPeM's brand art from the existing SK Pekan Telipok emblem.
// The emblem pixels are taken from public/mapem-logo-mini.jpg; its date plaque is never used.
// Generates reproducible PNG PWA icons and self-contained SVG banner/logo for Cloudflare.
import sharp from "sharp";
import {readFile, writeFile} from "node:fs/promises";
const src="public/mapem-logo-mini.jpg";
const original=await sharp(src).metadata();
if(!original.width||!original.height)throw new Error("Missing source school crest image");
const scale=original.width/760;
// Crop the upper emblem portion to retain the real school crest; lower text and date excluded.
const crest=await sharp(src).extract({left:Math.round(175*scale),top:Math.round(40*scale),width:Math.round(420*scale),height:Math.round(385*scale)}).resize(360,330,{fit:"contain"}).png().toBuffer();
const crestData="data:image/png;base64,"+crest.toString("base64");
const frame='<rect x="10" y="10" width="492" height="492" rx="104" fill="url(#red)" stroke="url(#gold)" stroke-width="16"/><rect x="30" y="30" width="452" height="452" rx="90" fill="none" stroke="#f9d88d" stroke-opacity=".62" stroke-width="3"/>';
const defs='<defs><linearGradient id="red" x2=".7" y2="1"><stop stop-color="#330512"/><stop offset=".48" stop-color="#8b1230"/><stop offset="1" stop-color="#4a071d"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8bf"/><stop offset=".2" stop-color="#c18a2e"/><stop offset=".45" stop-color="#fce6a0"/><stop offset=".73" stop-color="#b7781d"/><stop offset="1" stop-color="#ffeeb2"/></linearGradient><radialGradient id="light"><stop stop-color="#fff0ae" stop-opacity=".38"/><stop offset="1" stop-color="#f0b763" stop-opacity="0"/></radialGradient><pattern id="songket" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M17 3 L30 17 L17 31 L4 17 Z M17 10 L24 17 L17 24 L10 17 Z" stroke="#fbdc83" stroke-opacity=".23" stroke-width="1.2" fill="none"/><circle cx="17" cy="17" r="2" fill="#fff0a5" opacity=".38"/></pattern><clipPath id="crestClip"><ellipse cx="318" cy="185" rx="110" ry="106"/></clipPath></defs>';
const trophy='<g stroke="#7e420d" stroke-width="3" fill="url(#gold)"><path d="M106 118 H222 V145 C222 202 199 238 167 249 C133 235 106 202 106 145 Z"/><path d="M112 143 C61 116 52 166 81 203 L111 226 L120 205 C92 190 77 156 112 167 Z"/><path d="M215 143 C263 113 278 166 245 204 L220 226 L207 207 C236 185 244 157 215 168 Z"/><rect x="152" y="247" width="30" height="35" rx="3"/><path d="M116 285 H219 L233 311 H103 Z"/><rect x="98" y="308" width="140" height="24" rx="8" /></g><g opacity=".75" stroke="#fff1ad" stroke-width="4" stroke-linecap="round"><path d="M163 128 L163 224 M137 138 Q135 189 162 214 M192 138 Q189 188 171 213"/></g><path d="M164 79 L174 100 L197 104 L180 120 L182 141 L164 132 L144 141 L147 120 L132 104 L154 100 Z" fill="#ffe19d" stroke="#8c4a13" stroke-width="3"/>';
const leaves=Array.from({length:6},(_,i)=>{
  const a=i*16;return '<g opacity=".9" transform="translate('+ (60+i*10)+' '+(275-i*19)+') rotate('+(-52+i*9)+')"><path d="M0 0 Q-10 -14 3 -39 Q18 -17 0 0" fill="url(#gold)"/></g>';
}).join("");
const twinkle=Array.from({length:14},(_,i)=>{
  const x=54+(i*53)%398,y=49+(i*31)%389,s=i%3===0?8:4;
  return '<path d="M'+x+' '+(y-s)+' V'+(y+s)+' M'+(x-s)+' '+y+' H'+(x+s)+'" stroke="#fff0b4" stroke-width="'+(i%3===0?2:1)+'" opacity=".65"/>';
}).join("");
const logo='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">'+defs+frame+'<rect x="35" y="35" width="442" height="442" rx="82" fill="url(#songket)"/><circle cx="312" cy="178" r="150" fill="url(#light)"/>'+leaves+trophy+'<ellipse cx="318" cy="185" rx="117" ry="112" fill="#5c0921" stroke="url(#gold)" stroke-width="9"/><image x="202" y="78" width="232" height="213" preserveAspectRatio="xMidYMid meet" xlink:href="'+crestData+'" clip-path="url(#crestClip)"/><path d="M58 353 Q256 317 453 353 L446 416 Q256 446 67 416 Z" fill="#4d0820" stroke="url(#gold)" stroke-width="7"/><text x="256" y="395" fill="#fff0b9" stroke="#7a3e13" stroke-width="1.3" font-family="Georgia,serif" font-size="69" font-weight="bold" text-anchor="middle">MaPeM</text><rect x="131" y="418" width="252" height="48" rx="18" fill="#6d0b26" stroke="url(#gold)" stroke-width="4"/><text x="256" y="451" fill="#ffe29e" text-anchor="middle" font-family="Georgia,serif" font-size="35" font-weight="bold">SKPT 2026</text>'+twinkle+'</svg>';
await writeFile("public/brand.svg",logo);
await writeFile("public/icon.svg",logo);
await Promise.all([
  sharp(Buffer.from(logo)).resize(192,192).png().toFile("public/icon-192.png"),
  sharp(Buffer.from(logo)).resize(512,512).png().toFile("public/icon-512.png")
]);
// Rich, high-resolution vector banner: crest/photo + trophy are composed from the same official source.
const patterns=Array.from({length:26},(_,i)=>'<path d="M'+(48+i*64)+' 40 l16 20 -16 20 -16 -20 Z" fill="none" stroke="#f5c36a" stroke-width="1" opacity=".18"/>').join("");
const particles=Array.from({length:36},(_,i)=>{
  const x=(i*197+57)%1600,y=(i*83+67)%520;
  return '<circle cx="'+x+'" cy="'+y+'" r="'+(1+i%3)+'" fill="#ffe4a7" opacity="'+(.14+(i%5)*.1)+'"/>';
}).join("");
const banner='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="520" viewBox="0 0 1600 520"><defs><linearGradient id="bg" x2="1" y2=".6"><stop stop-color="#360616"/><stop offset=".4" stop-color="#661027"/><stop offset=".75" stop-color="#a22d37"/><stop offset="1" stop-color="#4a0719"/></linearGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#ffefa7"/><stop offset=".25" stop-color="#ac641b"/><stop offset=".5" stop-color="#fff4bd"/><stop offset=".75" stop-color="#ad6a1b"/><stop offset="1" stop-color="#ffe3a2"/></linearGradient><radialGradient id="ray"><stop stop-color="#f9dc8a" stop-opacity=".55"/><stop offset="1" stop-color="#f9dc8a" stop-opacity="0"/></radialGradient><pattern id="diamonds" width="55" height="55" patternUnits="userSpaceOnUse"><path d="M27 4 51 27 27 51 3 27Z M27 15 39 27 27 39 15 27Z" stroke="#f5be68" stroke-opacity=".18" fill="none"/></pattern></defs><rect width="1600" height="520" fill="url(#bg)"/><rect width="1600" height="520" fill="url(#diamonds)"/><circle cx="1310" cy="225" r="420" fill="url(#ray)"/><path d="M0 0H1600L1520 54 Q1200 110 920 12 Q540 100 0 30 Z" fill="#460416" stroke="url(#metal)" stroke-width="6"/><path d="M0 520H1600V483Q1200 425 850 485Q330 423 0 465Z" fill="#360313" stroke="#d99c49" stroke-width="7"/>'+patterns+particles+'<g transform="translate(890 38) scale(1.27)">'+trophy+'</g><circle cx="1435" cy="200" r="143" fill="#560620" stroke="url(#metal)" stroke-width="10"/><image x="1312" y="75" width="246" height="225" preserveAspectRatio="xMidYMid meet" xlink:href="'+crestData+'"/><text x="1185" y="430" text-anchor="middle" fill="#fff2bc" font-family="Georgia,serif" font-size="76" font-weight="bold">MaPeM</text><text x="1185" y="479" text-anchor="middle" fill="#ffdf89" font-family="Georgia,serif" font-size="44" letter-spacing="3">SKPT 2026</text></svg>';
await writeFile("public/banner.svg",banner);
console.log("MaPeM branding generated: exact source school emblem, trophy, banner and PNG app icons.");
