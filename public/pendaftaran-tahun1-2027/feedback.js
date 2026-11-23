// A native dialog stays above edit forms and transfer dialogs on mobile.
window.showChangeResult = function (title, message, state='success') {
  let dialog=document.getElementById('changeResult');
  if (!dialog) {
    dialog=document.createElement('dialog');
    dialog.id='changeResult';
    dialog.setAttribute('aria-labelledby','changeResultTitle');
    dialog.setAttribute('aria-describedby','changeResultText');
    dialog.style.cssText='width:min(88vw,420px);box-sizing:border-box;padding:24px;border:1px solid #d9c8b4;border-radius:16px;color:#452237;background:#fffaf4;box-shadow:0 12px 60px #24102155;margin:auto';
    dialog.innerHTML='<h2 id="changeResultTitle" style="font-size:20px;margin:0 0 12px"></h2><p id="changeResultText" style="line-height:1.55;white-space:pre-line"></p><form method="dialog" style="text-align:right"><button autofocus class="btn btn-primary" style="padding:10px 22px;border-radius:10px;background:#792451;color:white;border:0">Tutup</button></form>';
    document.body.append(dialog);
  }
  const heading=dialog.querySelector('h2');
  heading.style.color=state==='error'?'#9c243d':state==='info'?'#67412c':'#17634e';
  heading.textContent=title;
  dialog.querySelector('p').textContent=message;
  if(!dialog.open)dialog.showModal();
};
