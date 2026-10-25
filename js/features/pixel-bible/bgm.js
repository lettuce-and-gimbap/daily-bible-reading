// Original instrumental miniatures: warm plucked hymn and bright pixel praise.
// Notes are synthesized locally; no audio download or external service is used.
export const CATEGORIES=['잔잔함','밝음','신남','웅장함','기도와 묵상'];
const motifs=[
 [64,67,69,67,64,62,60,62,64,67,72,71,69,67,64,62],
 [72,76,79,76,74,71,67,71,69,72,76,79,77,76,74,72],
 [67,69,72,74,76,74,72,69,67,64,67,69,72,71,69,67],
 [60,64,67,72,71,67,64,62,65,69,72,74,72,69,67,60],
 [69,67,64,62,60,62,64,67,65,64,62,60,62,64,67,64]
];
const progressions=[[[48,52,55],[43,47,50],[45,48,52],[41,45,48]],[[48,52,55],[41,45,48],[48,52,55],[43,47,50]],[[45,48,52],[41,45,48],[48,52,55],[43,47,50]],[[41,45,48],[43,47,50],[45,48,52],[48,52,55]]];
const titles=[['고요한 은혜','푸른 초장','쉼의 샘','아침 이슬','평안의 길'],['햇살의 찬양','감사의 뜰','새로운 아침','소망의 빛'],['기쁨의 발걸음','춤추는 찬양','승리의 행진','기쁜 소식','함께 부르는 노래'],['영광의 빛','거룩한 산','왕의 행진','하늘의 문'],['골방의 기도','잠잠한 기다림','별빛 묵상','주 품의 안식']];
export const TRACKS=titles.flatMap((names,c)=>names.map((name,i)=>({
 name,category:CATEGORIES[c],bpm:[74,96,122,84,62][c]+i*2,type:['triangle','triangle','square','sawtooth','sine'][c],
 melody:Array.from({length:32},(_,n)=>motifs[(c+i)%5][(n+i*3)%16]+(n>=16&&n%4===0?2:0)+(i%2? -2:0)),
 chords:progressions[i%4].map(chord=>chord.map(n=>n+(i%2?-2:0))),arpeggio:c!==3,
})));
// Shuffle within each category without repeats, and visit every mood each cycle.
export function createPlaylist(random=Math.random){
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const bags=new Map();let categories=[],last='';
 return ()=>{if(!categories.length){categories=shuffle([...CATEGORIES]);if(categories[0]===last)categories.push(categories.shift());}
 const category=categories.shift();last=category;
 if(!bags.get(category)?.length)bags.set(category,shuffle(TRACKS.map((t,i)=>t.category===category?i:-1).filter(i=>i>=0)));
 return bags.get(category).pop();};
}
export function createBgm(){
 let context=null,gain=null,tone=null,echo=null,timer=null,next=0,step=0,track=0,enabled=false;
 const pick=createPlaylist();track=pick();
 // Gentle onset, a held middle, and a release: the instrument breathes between phrases.
 const note=(midi,start,length,volume,type='triangle',attack=.07)=>{
 const o=context.createOscillator(),g=context.createGain();o.type=type;
 o.frequency.value=440*2**((midi-69)/12);
 const end=start+length,peak=start+Math.min(attack,length*.2);
 g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,peak);
 g.gain.setTargetAtTime(volume*.55,peak,Math.max(.04,length*.22));
 g.gain.setTargetAtTime(.00001,end, .16);
 o.connect(g);g.connect(tone);g.connect(echo);o.start(start);o.stop(end+1.3);
 };
 function schedule(){
 if(!enabled||context.state!=='running')return;
 next=Math.max(next,context.currentTime+.02);
 while(next<context.currentTime+.25){
 const t=TRACKS[track],beat=60/t.bpm,chord=t.chords[Math.floor(step/16)%4];
 const calm=t.category==='잔잔함'||t.category==='기도와 묵상';
 const phrase=step%16,section=Math.floor(step/64);
 // Each bar has rests and a longer answer; later sections leave more room for harmony.
 if(phrase!==7&&phrase!==15&&!(calm&&phrase%4===3)&&!(section===2&&phrase%2)){
 const pitch=t.melody[Math.floor(step/2)%t.melody.length];
 note(pitch,next,beat*(phrase%4===2?1.45:.8),calm?.085:.10,'triangle',.08);
 if(section===1&&phrase%4===0)note(pitch-12,next+.025,beat*1.5,.025,'sine',.14);
 }
 // Sustained added-note voicings and a sparse plucked accompaniment.
 if(step%16===0){
 [...chord.map(n=>n+12),chord[0]+26].forEach((n,i)=>note(n,next+i*.06,beat*7,.028,'sine',.5));
 }
 if(step%4===0){
 const n=chord[(step/4)%3]+12;
 note(n,next,beat*1.6,.055,'triangle',.035);
 }
 if(step%8===0)note(chord[0]-12,next,beat*3.5,.09,'sine',.12);
 next+=beat*.5;step++;
 if(step===256){step=0;track=pick();next+=beat*2;}
 }
 }
 return {get enabled(){return enabled;},async setEnabled(value){
 if(!value){enabled=false;clearInterval(timer);timer=null;if(context)await context.suspend();return false;}
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Audio)throw new Error('이 브라우저는 배경음악을 지원하지 않아요.');
 if(!context){
 try{if(globalThis.navigator?.audioSession)globalThis.navigator.audioSession.type='playback';}catch(_){}
 context=new Audio();gain=context.createGain();gain.gain.value=5;
 tone=context.createBiquadFilter();tone.type='lowpass';tone.frequency.value=2800;tone.Q.value=.5;
 tone.connect(gain);
 // A quiet, filtered echo fills the space without repeating harsh transients.
 echo=context.createDelay(2);echo.delayTime.value=.32;
 const wet=context.createGain(),feedback=context.createGain(),filter=context.createBiquadFilter();
 wet.gain.value=.15;feedback.gain.value=.2;filter.type='lowpass';filter.frequency.value=1700;
 echo.connect(filter);filter.connect(wet);wet.connect(gain);filter.connect(feedback);feedback.connect(echo);
 const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=18;
 limiter.ratio.value=4;limiter.attack.value=.015;limiter.release.value=.3;
 gain.connect(limiter);limiter.connect(context.destination);
 }
 await context.resume();enabled=true;next=Math.max(next,context.currentTime+.04);
 clearInterval(timer);timer=setInterval(schedule,100);schedule();return true;
 },dispose(){enabled=false;clearInterval(timer);context?.close();}};
}
