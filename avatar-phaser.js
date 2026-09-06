/* Phaser is a presentation adapter, not a second avatar designer or state store.
 * The exact SVG used in DOM previews supplies its texture. Offline fallback stays usable.
 */
(function () {
  'use strict';
  const WIDTH=360,HEIGHT=460;
  function mount(options={}){
    const host=options.mount;
    if(!host||!window.Phaser||!window.HeatherAvatarArt)return null;
    let avatar={...(options.avatar||{})},parts=options.parts||[],scene=null,alive=true,serial=0;
    let signature='',texture='',image=null,visible=true,restore=null,observer=null;
    const urls=new Set();
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('s2-reduced-motion')||document.documentElement.classList.contains('hw9-reduced-motion');
    const clearTexture=()=>{if(image){scene.tweens.killTweensOf(image);image.destroy();image=null;}if(texture&&scene?.textures.exists(texture))scene.textures.remove(texture);texture='';};
    const draw=async(mood='idle')=>{
      if(!scene||!alive)return;
      const token=++serial;
      const svg=window.HeatherAvatarArt.renderAvatarSvg(avatar,parts,{mood}).replace('<svg ','<svg width="720" height="960" ');
      const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));urls.add(url);
      try{
        const source=new Image();source.src=url;await source.decode();
        if(!alive||token!==serial||!scene.sys.isActive())return;
        clearTexture();texture=`hw-avatar-${token}`;scene.textures.addImage(texture,source);
        image=scene.add.image(WIDTH/2,HEIGHT/2,texture).setDisplaySize(345,460);
        if(!reduced()&&mood==='idle')scene.tweens.add({targets:image,y:HEIGHT/2-2,scaleY:image.scaleY*1.012,duration:2100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        host.classList.remove('failed');host.classList.add('ready');
      }catch(error){
        if(alive){host.classList.add('failed');host.classList.remove('ready');console.info('Shared SVG dress-room fallback',error);}
      }finally{URL.revokeObjectURL(url);urls.delete(url);}
    };
    class AvatarScene extends Phaser.Scene {
      constructor(){super('HeatherSharedAvatar');}
      create(){
        scene=this;draw();
        this.time.addEvent({delay:6700,loop:true,callback:()=>{if(!reduced()&&visible){draw('blink');this.time.delayedCall(130,()=>draw());}}});
        this.events.once('shutdown',()=>{++serial;clearTimeout(restore);for(const url of urls)URL.revokeObjectURL(url);urls.clear();});
      }
    }
    host.innerHTML='';
    const game=new Phaser.Game({type:Phaser.CANVAS,parent:host,width:WIDTH,height:HEIGHT,backgroundColor:'#f7f4ea',transparent:false,
      scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:WIDTH,height:HEIGHT},
      render:{preserveDrawingBuffer:true,antialias:true},scene:AvatarScene});
    const syncVisibility=()=>{if(!alive)return;if(visible&&!document.hidden)game.loop.wake();else game.loop.sleep();};
    if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;syncVisibility();});observer.observe(host);}
    document.addEventListener('visibilitychange',syncVisibility);
    const onPageHide=event=>{if(event.persisted){visible=false;syncVisibility();}else controller.destroy();};
    const onPageShow=()=>{visible=host.getClientRects().length>0;syncVisibility();};
    window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);
    const media=matchMedia('(prefers-reduced-motion: reduce)');const onMotion=()=>{draw();};media.addEventListener('change',onMotion);
    const motionObserver=new MutationObserver(onMotion);motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    const controller={game,
      update(next,nextParts){
        if(!alive)return;const nextSignature=JSON.stringify(next||{});avatar={...(next||{})};parts=nextParts||parts;
        if(signature!==nextSignature){signature=nextSignature;clearTimeout(restore);draw();}
      },
      celebrateSave(){if(!alive)return;clearTimeout(restore);draw('happy');restore=setTimeout(()=>draw(),reduced()?150:700);},
      download(filename){return window.HeatherAvatarArt.downloadAvatarPng(avatar,parts,filename);},
      destroy(){if(!alive)return;alive=false;++serial;clearTimeout(restore);observer?.disconnect();motionObserver.disconnect();media.removeEventListener('change',onMotion);document.removeEventListener('visibilitychange',syncVisibility);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('pageshow',onPageShow);for(const url of urls)URL.revokeObjectURL(url);urls.clear();game.destroy(true);scene=null;}
    };
    return controller;
  }
  window.HeatherAvatarPhaser=Object.freeze({mount});
}());
