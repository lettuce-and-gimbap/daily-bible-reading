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
 let context=null,gain=null,timer=null,next=0,step=0,track=0,enabled=false;
 const pick=createPlaylist();track=pick();
 const note=(midi,start,length,volume,type)=>{const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+.009);g.gain.exponentialRampToValueAtTime(.0001,start+length);o.connect(g);g.connect(gain);o.start(start);o.stop(start+length+.02);};
 function schedule(){if(!enabled||context.state!=='running')return;next=Math.max(next,context.currentTime+.02);while(next<context.currentTime+.25){const t=TRACKS[track],beat=60/t.bpm,chord=t.chords[Math.floor(step/8)%4];
 note(t.melody[step%t.melody.length],next,beat*.85,t.type==='square'||t.type==='sawtooth'?.025:.13,t.type);
 if(step%2===0)chord.forEach((n,i)=>note(n+12,next+i*(t.arpeggio?.045:0),beat*1.8,.08,'triangle'));
 if(step%4===0)note(chord[0]-12,next,beat*2,.12,'sine');
 next+=beat;step++;if(step===64){step=0;track=pick();next+=beat;}}
 }
 return {get enabled(){return enabled;},async setEnabled(value){
 if(!value){enabled=false;clearInterval(timer);timer=null;if(context)await context.suspend();return false;}
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw new Error('이 브라우저는 배경음악을 지원하지 않아요.');
 if(!context){try{if(globalThis.navigator?.audioSession)globalThis.navigator.audioSession.type='playback';}catch(_){}context=new Audio();gain=context.createGain();gain.gain.value=5;gain.connect(context.destination);}
 await context.resume();enabled=true;next=Math.max(next,context.currentTime+.04);clearInterval(timer);timer=setInterval(schedule,100);schedule();return true;
 },dispose(){enabled=false;clearInterval(timer);context?.close();}};
}
