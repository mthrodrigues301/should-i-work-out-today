(()=>{
 const system=matchMedia('(prefers-color-scheme: dark)');
 function preference(){try{return localStorage.getItem('workout-theme')}catch{return null}}
 function apply(value){const dark=value==='dark';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';document.querySelector('meta[name="theme-color"]').content=dark?'#0c0d0b':'#f1efe8';document.querySelectorAll('[data-workout-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workoutTheme===value)))}
 function current(){return preference()||(system.matches?'dark':'light')}
 apply(current());
 document.addEventListener('DOMContentLoaded',()=>{apply(current());document.querySelectorAll('[data-workout-theme]').forEach(button=>button.onclick=()=>{try{localStorage.setItem('workout-theme',button.dataset.workoutTheme)}catch{}apply(button.dataset.workoutTheme)})});
 system.addEventListener('change',()=>{if(!preference())apply(current())});window.addEventListener('storage',event=>{if(event.key==='workout-theme'||event.key===null)apply(current())});window.addEventListener('pageshow',()=>apply(current()));
})();
