// Original instrumental miniatures: warm plucked hymn and bright pixel praise.
// Notes are synthesized locally; no audio download or external service is used.
export const TRACKS=[
 {name:'고요한 은혜',bpm:76,type:'triangle',melody:[64,67,69,67,64,62,60,62,64,67,72,71,69,67,64,62],chords:[[48,52,55],[43,47,50],[45,48,52],[41,45,48]]},
 {name:'기쁨의 발걸음',bpm:116,type:'square',melody:[72,76,79,76,74,71,67,71,69,72,76,79,77,76,74,72],chords:[[48,52,55],[43,47,50],[45,48,52],[41,45,48]]}
];
export function createBgm(){
 let context=null,gain=null,timer=null,next=0,step=0,track=0,enabled=false;
 const note=(midi,start,length,volume,type)=>{const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+.009);g.gain.exponentialRampToValueAtTime(.0001,start+length);o.connect(g);g.connect(gain);o.start(start);o.stop(start+length+.02);};
 function schedule(){if(!enabled||context.state!=='running')return;while(next<context.currentTime+.25){const t=TRACKS[track],beat=60/t.bpm,chord=t.chords[Math.floor(step/8)%4];
 note(t.melody[step%16],next,beat*.85,t.type==='square'?.035:.13,t.type);
 if(step%2===0)chord.forEach((n,i)=>note(n+12,next+i*.025,beat*1.8,.08,'triangle'));
 if(step%4===0)note(chord[0]-12,next,beat*2,.12,'sine');
 next+=beat;step++;if(step===64){step=0;track=(track+1)%TRACKS.length;next+=beat;}}
 }
 return {get enabled(){return enabled;},async setEnabled(value){
 if(!value){enabled=false;clearInterval(timer);timer=null;if(context)await context.suspend();return false;}
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw new Error('이 브라우저는 배경음악을 지원하지 않아요.');
 if(!context){context=new Audio();gain=context.createGain();gain.gain.value=.32;gain.connect(context.destination);}
 await context.resume();enabled=true;next=Math.max(next,context.currentTime+.04);clearInterval(timer);timer=setInterval(schedule,100);schedule();return true;
 },dispose(){enabled=false;clearInterval(timer);context?.close();}};
}
