const navigationMenu=document.getElementById('navigationMenu');
document.getElementById('menuOpen').onclick=()=>navigationMenu.showModal();
document.getElementById('menuClose').onclick=()=>navigationMenu.close();
navigationMenu.addEventListener('click',event=>{if(event.target!==navigationMenu)return;const r=navigationMenu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)navigationMenu.close()});
navigationMenu.addEventListener('close',()=>document.getElementById('menuOpen').focus());
