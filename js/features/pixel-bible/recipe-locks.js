export const RECIPE_KEY='pixel-bible-recipe-discoveries:v1';
export function loadRecipeUnlocks(storage){try{const x=JSON.parse(storage.getItem(RECIPE_KEY)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[]);}catch(_){return new Set();}}
export const recipeKey=scene=>JSON.stringify([scene.code||'',scene.chapter||0,scene.ref||'',scene.object||'',[...scene.actors].sort(),scene.title||scene.id,...(scene.requiresObjects?.length?[[...scene.requiresObjects].sort()]:[])]);
export const recipeLocked=(scene,{discovered,dailyDone,hide=true})=>!discovered.has(recipeKey(scene))&&!(dailyDone&&!hide);
export const requiredObjectsNearby=(scene,object,objects=[])=>!!object&&(scene.requiresObjects||[]).every(kind=>objects.some(o=>o.kind===kind&&Math.hypot(o.x-object.x,o.y-object.y)<=3.5));
export const recipeAssembled=(scene,npcs,object,objects=[])=>!!object&&requiredObjectsNearby(scene,object,objects)&&scene.actors.every(name=>npcs.some(n=>n.name===name&&!n.waterEscape&&Math.hypot(n.x-object.x,n.y-object.y)<=1.8));
