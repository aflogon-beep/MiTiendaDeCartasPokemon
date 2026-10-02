// Sonido (efectos sintetizados), vibración y música.
import { G } from "../core/state.js";
import { rnd } from "../core/rng.js";
export let AC=null;
export function ac(){if(!G.SOUND)return null;if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==="suspended")AC.resume();return AC}
export function tone(f,d,dur,type,vol){const a=ac();if(!a)return;const t=a.currentTime+d,o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.15,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.05)}
export function nz(dur,f0,f1,vol,type,q){const a=ac();if(!a)return;const t=a.currentTime,n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),dd=b.getChannelData(0);for(let i=0;i<n;i++)dd[i]=Math.random()*2-1;const sN=a.createBufferSource();sN.buffer=b;const f=a.createBiquadFilter();f.type=type||"bandpass";f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);sN.connect(f);f.connect(g);g.connect(a.destination);sN.start(t)}
export const sfx={
  alarm(){for(let i=0;i<3;i++){tone(880,i*.34,.15,"square",.022);tone(660,i*.34+.17,.15,"square",.022)}},
  tick:()=>nz(.05,2600,1800,.22,"bandpass",2),
  rip:()=>{nz(.35,900,4200,.5,"bandpass",.8);nz(.22,3000,6500,.2,"highpass")},
  swish:()=>nz(.22,1800,500,.16,"bandpass",1.2),
  flip:()=>{nz(.04,4000,3000,.14,"highpass");tone(1200,0,.04,"square",.03)},
  charge:lv=>{for(let i=0;i<(lv>=3?5:3);i++)tone(260+i*70,i*.1,.35,"sine",.06)},
  hit:lv=>{const N=[523.25,659.25,783.99,1046.5,1318.51,1567.98,2093];const k=lv>=3?7:lv===2?5:3;
    for(let i=0;i<k;i++){tone(N[i],i*.07,.6,"triangle",.14);if(lv>=2)tone(N[i]*2,i*.07+.02,.4,"sine",.04)}
    if(lv>=3){[523.25,659.25,783.99].forEach(f=>tone(f,.55,1.7,"sine",.08));nz(1.2,6000,9000,.05,"highpass")}},
  bell:()=>{tone(1318.5,0,.45,"sine",.05);tone(1046.5,.18,.6,"sine",.05)},
  coin:()=>{tone(2300+rnd(500),0,.08,"triangle",.07);tone(3400,.03,.07,"sine",.03)},
  bill:()=>nz(.13,1600,700,.12,"bandpass",1),
  drawer:()=>{nz(.2,320,120,.25,"lowpass",1);tone(2637,.14,.55,"sine",.07)},
  key:()=>tone(1000,0,.05,"square",.035),
  ok:()=>{tone(1400,0,.1,"square",.05);tone(1400,.16,.12,"square",.05);nz(.6,2600,2400,.04,"bandpass",8)},
  err:()=>{tone(220,0,.22,"sawtooth",.05);tone(180,.12,.25,"sawtooth",.05)},
  chaching:()=>{tone(1568,0,.12,"triangle",.1);tone(2093,.1,.45,"triangle",.1);nz(.12,5000,6500,.06,"highpass")},
  ach:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,i*.08,.4,"triangle",.08))},
  sad:()=>{tone(392,0,.28,"triangle",.08);tone(370,.28,.28,"triangle",.08);tone(349,.56,.6,"triangle",.08)},
  page:()=>nz(.28,900,3200,.14,"bandpass",.7),
  shutter:()=>{for(let i=0;i<9;i++)setTimeout(()=>nz(.07,700+rnd(300),500,.12,"bandpass",3),i*110)},
  print:()=>{for(let i=0;i<10;i++)setTimeout(()=>nz(.08,2600,2300,.05,"bandpass",6),i*120)}
};
export const vibe=pt=>{try{navigator.vibrate&&navigator.vibrate(pt)}catch(e){}};
export let MUSIC=(()=>{try{return localStorage.getItem("pcs-music")==="1"}catch(e){return false}})();
export let musT=null;
export let musN=0;
export let musAt=0;
export function musicTick(){
  if(!MUSIC||G.paused||document.hidden)return;const a=ac();if(!a||a.state!=="running")return;
  const now=a.currentTime;if(musAt<now)musAt=now+.05;
  const f=n=>261.63*Math.pow(2,n/12),CH=[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]];
  while(musAt<now+.6){const st=musN%16,ch=CH[Math.floor(musN/16)%4],t=musAt-now;
    if(st%8===0)tone(f(ch[0]-12),t,1,"sine",.045);
    if(st%2===0)tone(f(ch[(st/2)%4]+12),t,.35,"triangle",.016);
    musAt+=.25;musN++}
}
export function setMusic(v){MUSIC=v;try{localStorage.setItem("pcs-music",v?"1":"0")}catch(e){}clearInterval(musT);if(v)musT=setInterval(musicTick,200)}
