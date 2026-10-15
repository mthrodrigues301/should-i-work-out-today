// Web Audio is unlocked only after a user gesture. No background playback promise.
const RestSound=(()=>{
 let context;
 async function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!context||context.state==='closed')context=new Audio();if(context.state!=='running')await context.resume();return context.state==='running'}catch{return false}}
 function play(){if(!context||context.state!=='running')return false;try{const now=context.currentTime;[660,880].forEach((frequency,i)=>{const oscillator=context.createOscillator(),gain=context.createGain(),start=now+i*.24;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.18,start+.025);gain.gain.exponentialRampToValueAtTime(.001,start+.19);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+.2);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}});return true}catch{return false}}
 return {unlock,play,test:async()=>await unlock()&&play()};
})();
