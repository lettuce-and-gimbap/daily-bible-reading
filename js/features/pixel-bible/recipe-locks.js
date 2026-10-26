export const RECIPE_KEY='pixel-bible-recipe-discoveries:v1';
export function loadRecipeUnlocks(storage){try{const x=JSON.parse(storage.getItem(RECIPE_KEY)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[]);}catch(_){return new Set();}}
export const recipeKey=scene=>JSON.stringify([scene.code||'',scene.chapter||0,scene.ref||'',scene.object||'',[...scene.actors].sort(),scene.title||scene.id,...(scene.requiresObjects?.length?[[...scene.requiresObjects].sort()]:[])]);
export const recipeLocked=(scene,{discovered,dailyDone,hide=true})=>!discovered.has(recipeKey(scene))&&!(dailyDone&&!hide);
export function recipeHint(scene,step,{objectNames={}}={}){
 const actors=scene.actors||[],objects=[scene.object,...(scene.requiresObjects||[])].filter(Boolean);
 if(step===1)return `${scene.ref||'오늘 본문'}에서 찾을 장면이에요. 인물 ${actors.length}명과 물건 ${objects.length}개가 필요해요.`;
 if(step===2){const names=objects.map(kind=>objectNames[kind]||kind);return `중심 물건은 ${names[0]||'하나'}이고${names.length>1?` 보조 물건은 ${names.slice(1).join(' · ')}예요.`:' 보조 물건은 필요하지 않아요.'}`;}
 if(step>=3)return `함께 모을 인물은 ${actors.join(' · ')}예요.`;
 return '';
}
export const requiredObjectsNearby=(scene,object,objects=[])=>!!object&&(scene.requiresObjects||[]).every(kind=>objects.some(o=>o.kind===kind&&Math.hypot(o.x-object.x,o.y-object.y)<=3.5));
export const recipeAssembled=(scene,npcs,object,objects=[])=>scene.actors.length>0&&!!object&&requiredObjectsNearby(scene,object,objects)&&scene.actors.every(name=>npcs.some(n=>n.name===name&&!n.waterEscape&&Math.hypot(n.x-object.x,n.y-object.y)<=1.8));
