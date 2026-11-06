/* ── AUDIO ── */
const AC = new (window.AudioContext||window.webkitAudioContext)();
function tone(f,t,d,v){
    try{
        if(AC.state==='suspended') AC.resume();
        const o=AC.createOscillator(),g=AC.createGain();
        o.type=t; o.frequency.value=f;
        g.gain.setValueAtTime(v,AC.currentTime);
        g.gain.exponentialRampToValueAtTime(0.00001,AC.currentTime+d);
        o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+d);
    }catch(e){}
}
const sfx={
    click:()=>tone(700,'sine',0.07,0.07),
    place:()=>{tone(440,'triangle',0.12,0.1);setTimeout(()=>tone(880,'sine',0.18,0.07),60);},
    remove:()=>{tone(280,'sawtooth',0.1,0.09);},
    warn:()=>{tone(200,'sawtooth',0.2,0.16);setTimeout(()=>tone(200,'sawtooth',0.3,0.16),250);},
    fanfare:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.25,0.1),i*80));},
    levelClear:()=>{[523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,'triangle',0.35,0.15),i*100));}
};
function handleClick(fn){sfx.click();if(fn)fn();}

