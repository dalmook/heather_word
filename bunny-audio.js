/** Original, opt-in Web Audio soundtrack. No samples, downloads, or autoplay. */
export class BunnySoundtrack {
  constructor() { this.context=null;this.bus=null;this.timer=0;this.unlocked=false;this.enabled=false;this.visible=true;this.allowed=true;this.volume=.24;this.energy=0;this.step=0;this.next=0;this.nodes=new Set(); }
  async unlock() {
    if(!this.enabled || !this.allowed) return;
    try {
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio) return;
      if(!this.context || this.context.state==='closed') {
        this.context=new Audio();this.bus=this.context.createGain();this.bus.gain.value=0;this.bus.connect(this.context.destination);
      }
      await this.context.resume();this.unlocked=this.context.state==='running';this.sync();
    } catch { this.unlocked=false; }
  }
  configure({enabled=this.enabled,volume=this.volume,energy=this.energy,visible=this.visible,allowed=this.allowed}={}) {
    Object.assign(this,{enabled,volume,energy,visible,allowed});this.sync();
  }
  note(freq,time,length,gain=.1,type='sine') {
    if(!this.context || !this.bus) return;
    const osc=this.context.createOscillator(),amp=this.context.createGain();
    osc.type=type;osc.frequency.value=freq;amp.gain.setValueAtTime(0,time);amp.gain.linearRampToValueAtTime(gain,time+.012);amp.gain.exponentialRampToValueAtTime(.0001,time+length);
    osc.connect(amp);amp.connect(this.bus);this.nodes.add(osc);
    osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();amp.disconnect();};osc.start(time);osc.stop(time+length+.02);
  }
  tick() {
    if(!this.context) return;
    const speech=globalThis.speechSynthesis;
    const duck=speech?.speaking||speech?.pending;
    const level=this.enabled&&this.allowed&&this.visible?this.volume*.48*(duck ? .07 : 1):0;
    this.bus.gain.setTargetAtTime(level,this.context.currentTime,.06);
    const melody=[523.25,0,659.25,783.99,0,659.25,587.33,0,523.25,659.25,0,880,783.99,0,659.25,0];
    const bass=[130.81,164.81,174.61,146.83], beat=60/108/2;
    while(this.next<this.context.currentTime+.12) {
      const i=this.step%16,f=melody[i],bar=Math.floor(this.step/16)%4;
      if(f) this.note(f,this.next,.19,.11,'sine');
      if(i%4===0) this.note(bass[bar],this.next,.42,.08,'triangle');
      if(this.energy>=3&&i%4===2) this.note(1046.5,this.next,.05,.025,'triangle');
      if(this.energy>=6&&i%2===0) {this.note(bass[bar]*2,this.next,.1,.035,'triangle');this.note(78,this.next,.07,.11,'sine');}
      if(this.energy>=9&&i%2===1) this.note((f||659.25)*2,this.next,.08,.025,'sine');
      this.step++;this.next+=beat;
    }
  }
  sync() {
    const playing=this.enabled&&this.allowed&&this.visible&&this.unlocked&&this.context?.state==='running';
    if(playing&&!this.timer) {this.next=this.context.currentTime+.035;this.tick();this.timer=setInterval(()=>this.tick(),60);}
    else if(!playing) {
      clearInterval(this.timer);this.timer=0;
      if(this.context&&this.bus) this.bus.gain.setTargetAtTime(0,this.context.currentTime,.035);
    }
  }
  stop() {
    clearInterval(this.timer);this.timer=0;
    for(const node of this.nodes) {try{node.stop();}catch{}}
    this.nodes.clear();this.context?.close().catch(()=>{});this.context=null;this.bus=null;this.unlocked=false;
  }
}
