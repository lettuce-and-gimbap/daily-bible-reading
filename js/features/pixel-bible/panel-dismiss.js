// Pointerdown closes before a world gesture; click also covers keyboard/assistive activation.
// Neither event is cancelled, so the original target keeps its normal action.
export function bindOutsidePanelDismiss(shell,togglePanel,signal){
 const dismiss=event=>{
  const target=event.target;
  for(const side of ['left','right']){
   const panel=shell.querySelector(`#pb-${side}-panel`),button=shell.querySelector(`[data-action="toggle-${side}"]`);
   if(panel&&!panel.hidden&&!panel.contains(target)&&!button?.contains(target))togglePanel(side,false);
  }
 };
 const document=shell.ownerDocument;
 document.addEventListener('pointerdown',dismiss,{capture:true,signal});
 document.addEventListener('click',dismiss,{capture:true,signal});
}
