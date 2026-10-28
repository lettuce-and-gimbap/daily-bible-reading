// Explicit UTC+9, independent of the device timezone. Fixed art periods, not an
// astronomical sunrise calculation.
(function(global){
 if(global.KstLight)return;
 const periods={dawn:{label:'새벽',sky:'#b8a5c7',light:'#f1c6a8',shade:'#746f98',alpha:.12,sun:'☀'},day:{label:'낮',sky:'#cbe4e1',light:'#fff0c4',shade:'#e7d3a2',alpha:0,sun:'☀'},dusk:{label:'저녁',sky:'#b99ba8',light:'#efc29e',shade:'#895f80',alpha:.13,sun:'☀'},night:{label:'밤',sky:'#293b60',light:'#b6c9dd',shade:'#22335d',alpha:.29,sun:'☾'}};
 function at(date=new Date()){const hour=(date.getUTCHours()+9)%24,key=hour>=5&&hour<8?'dawn':hour>=8&&hour<18?'day':hour>=18&&hour<20?'dusk':'night';return {key,hour,...periods[key]};}
 let weather=null,loading=false;
 const cacheKey='app-hourly-weather:v1',placeKey='app-weather-place:v1';
 function stored(key){try{return JSON.parse(localStorage.getItem(key));}catch(_){return null;}}
 async function refresh(){
  if(loading)return;const place=stored(placeKey)||{latitude:37.5665,longitude:126.978,label:'서울'};
  const cached=stored(cacheKey);if(cached&&cached.place===JSON.stringify(place)&&Date.now()-cached.saved<3600000){weather=cached;sync();return;}
  loading=true;
  try{const q=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,hourly:'weather_code,cloud_cover,is_day',daily:'sunrise,sunset',timezone:'Asia/Seoul',forecast_days:'2'});const res=await fetch('https://api.open-meteo.com/v1/forecast?'+q,{signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error();const data=await res.json();if(!Array.isArray(data.hourly?.time))throw Error();weather={data,saved:Date.now(),place:JSON.stringify(place),label:place.label};try{localStorage.setItem(cacheKey,JSON.stringify(weather));}catch(_){} }
  catch(_){weather=cached&&cached.place===JSON.stringify(place)&&Date.now()-cached.saved<10800000?cached:null;}
  finally{loading=false;sync();}
 }
 function conditions(){
  if(!weather)return null;const stamp=new Date(Date.now()+9*3600000).toISOString().slice(0,13);const i=weather.data.hourly.time.findIndex(t=>t.slice(0,13)===stamp);if(i<0)return null;const h=weather.data.hourly,code=h.weather_code[i],cloud=h.cloud_cover[i];return {cloud,day:!!h.is_day[i],kind:code>=95?'storm':code>=71&&code<=77||code===85||code===86?'snow':code>=51?'rain':code===45||code===48?'fog':cloud>=75?'overcast':cloud>=30?'cloudy':'clear'};
 }
 function useLocation(){if(!navigator.geolocation)return;const button=document.querySelector('[data-weather-status]');if(button)button.textContent='위치 확인 중…';navigator.geolocation.getCurrentPosition(pos=>{try{localStorage.setItem(placeKey,JSON.stringify({latitude:Math.round(pos.coords.latitude*100)/100,longitude:Math.round(pos.coords.longitude*100)/100,label:'내 지역'}));localStorage.removeItem(cacheKey);}catch(_){}refresh();},()=>{if(button)button.textContent='위치 사용 불가 · 서울 날씨';},{timeout:10000,maximumAge:3600000});}
 async function reminderTimeZone(){
  const place=stored(placeKey);if(!place)return 'Asia/Seoul';
  try{
   const cached=stored('app-reminder-timezone:v1');
   if(cached?.place===JSON.stringify(place)&&typeof cached.zone==='string')return cached.zone;
   const q=new URLSearchParams({latitude:place.latitude,longitude:place.longitude,current:'temperature_2m',timezone:'auto',forecast_days:'1'});
   const res=await fetch('https://api.open-meteo.com/v1/forecast?'+q,{signal:AbortSignal.timeout(8000)});
   if(!res.ok)throw Error();const data=await res.json();
   if(typeof data.timezone!=='string'||!data.timezone)throw Error();
   try{localStorage.setItem('app-reminder-timezone:v1',JSON.stringify({place:JSON.stringify(place),zone:data.timezone}));}catch(_){}
   return data.timezone;
  }catch(_){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Seoul';}catch(__){return 'Asia/Seoul';}}
 }
 function sync(){const p=at();document.documentElement.dataset.kstLight=p.key;document.documentElement.style.setProperty('--kst-sky',p.sky);document.documentElement.style.setProperty('--kst-light',p.light);const c=conditions(),root=document.documentElement;root.dataset.weather=c?.kind||'unknown';const hour=p.hour,altitude=Math.max(0,Math.sin((hour-6)/12*Math.PI));root.style.setProperty('--hour-glow',String(.88+altitude*.12));root.style.setProperty('--sun-height',(32-altitude*20)+'%');root.style.setProperty('--weather-cloud',c?String(c.cloud/100):'0');document.querySelectorAll('[data-kst-celestial]').forEach(e=>e.textContent=c?({storm:'⛈',snow:'❄',rain:'☂',fog:'☁',overcast:'☁',cloudy:c.day?'☀ ☁':'☾ ☁',clear:c.day?'☀':'☾'}[c.kind]):p.sun);
  document.querySelectorAll('[data-weather-status]').forEach(e=>e.textContent=c?`${weather.label} · ${({clear:'맑음',cloudy:'구름',overcast:'흐림',fog:'안개',rain:'비',snow:'눈',storm:'뇌우'})[c.kind]} · 시간별 예보 반영`: '시간대 색상 적용 · 날씨 연결 대기');}
 function permissionsHtml(){return `<section class="card"><h2>권한</h2><h3>위치 · 지역 날씨</h3><p>선택 사항이에요. 허용하지 않으면 서울 날씨를 사용해요. 위치 좌표는 이 기기에 저장하고 Open-Meteo 날씨 조회에만 보내요.</p><p data-weather-status></p><button type="button" class="btn" data-weather-allow>내 위치 사용 허용</button> <button type="button" class="btn ghost" data-weather-default>서울 기준 사용</button><p class="muted small">차단했다면 기기 설정의 Safari·브라우저·사이트 위치 권한에서 다시 허용해 주세요. 앱이 열려 있을 때 1시간마다 조회해요. 예보를 받지 못하면 시간대 색상을 사용해요.</p><small>날씨: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></small></section>`;}
 function bindPermissions(root){root.querySelector('[data-weather-allow]')?.addEventListener('click',useLocation);root.querySelector('[data-weather-default]')?.addEventListener('click',()=>{try{localStorage.removeItem(placeKey);localStorage.removeItem(cacheKey);}catch(_){}weather=null;refresh();});sync();}

 function enter(){sync();const entrance=document.createElement('div');entrance.className='app-entrance';entrance.setAttribute('aria-label','경건생활 시작');entrance.innerHTML='<span class="entrance-celestial" data-kst-celestial></span><img src="icons/icon-192.png" width="112" height="112" alt="경건생활 십자가 로고"><b>경건생활</b>';document.body.append(entrance);sync();setTimeout(()=>entrance.remove(),1100);}
 global.KstLight={at,sync,enter,permissionsHtml,bindPermissions,reminderTimeZone};if(typeof document!=='undefined'){weather=stored(cacheKey);if(weather&&Date.now()-weather.saved>10800000)weather=null;sync();refresh();setInterval(()=>{sync();refresh();},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync();refresh();}});}
})(globalThis);
