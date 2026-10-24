// Explicit UTC+9, independent of the device timezone. Fixed art periods, not an
// astronomical sunrise calculation.
(function(global){
 if(global.KstLight)return;
 const periods={dawn:{label:'새벽',sky:'#b8a5c7',light:'#f1c6a8',shade:'#746f98',alpha:.12,sun:'☀'},day:{label:'낮',sky:'#cbe4e1',light:'#fff0c4',shade:'#e7d3a2',alpha:0,sun:'☀'},dusk:{label:'저녁',sky:'#b99ba8',light:'#efc29e',shade:'#895f80',alpha:.13,sun:'☀'},night:{label:'밤',sky:'#293b60',light:'#b6c9dd',shade:'#22335d',alpha:.29,sun:'☾'}};
 function at(date=new Date()){const hour=(date.getUTCHours()+9)%24,key=hour>=5&&hour<8?'dawn':hour>=8&&hour<18?'day':hour>=18&&hour<20?'dusk':'night';return {key,hour,...periods[key]};}
 function sync(){const p=at();document.documentElement.dataset.kstLight=p.key;document.documentElement.style.setProperty('--kst-sky',p.sky);document.documentElement.style.setProperty('--kst-light',p.light);document.querySelectorAll('[data-kst-celestial]').forEach(e=>e.textContent=p.sun);}
 function enter(){sync();const entrance=document.createElement('div');entrance.className='app-entrance';entrance.setAttribute('aria-label','경건생활 시작');entrance.innerHTML='<span class="entrance-celestial" data-kst-celestial></span><img src="icons/icon-192.png" width="112" height="112" alt="경건생활 십자가 로고"><b>경건생활</b>';document.body.append(entrance);sync();setTimeout(()=>entrance.remove(),1100);}
 global.KstLight={at,sync,enter};if(typeof document!=='undefined'){sync();setInterval(sync,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});}
})(globalThis);
