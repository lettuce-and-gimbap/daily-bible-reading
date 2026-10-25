// Source-pixel silhouettes for event-specific props. All coordinates are integer pixels.
export function drawEventProp(r,id,O){
 const clay='#b97d58',light='#e2b58a',shade='#815940',ivory='#f0e6c9',ink='#574b45';
 if(id==='palanquin'){r(-20,-1,40,3,O);r(-19,0,38,1,'#c4a16b');r(-12,-18,24,18,O);r(-10,-16,20,15,'#b79768');r(-13,-21,26,4,O);r(-11,-20,22,2,'#dec38c');r(-8,-14,16,11,'#704f59');r(-7,-13,3,10,'#c6a1a0');r(5,-13,2,10,'#c6a1a0');r(-13,1,4,4,O);r(9,1,4,4,O);return true;}
 if(id==='jawbone'){r(-13,-4,9,6,O);r(-11,-3,8,4,ivory);r(-5,-4,19,4,O);r(-4,-3,16,2,ivory);for(let i=0;i<6;i++){r(-4+i*3,-8,2,5,O);r(-4+i*3,-7,1,3,ivory);}r(10,-8,5,5,O);r(11,-7,3,4,ivory);return true;}
 const bowl=(fill)=>{r(-12,-8,24,3,O);r(-11,-5,22,7,clay);r(-8,2,16,3,O);r(-8,-5,16,3,fill);r(-10,-3,3,4,light);};
 if(id==='salt-bowl'||id==='flour-bowl'){bowl(id==='salt-bowl'?'#ecf3ec':'#ead7ac');for(const x of [-6,-1,4])r(x,-10+(x%2),3,3,id==='salt-bowl'?'#ffffff':'#f6e8c3');if(id==='flour-bowl'){r(7,-17,3,14,shade);r(6,-18,5,3,light);}return true;}
 if(id==='fig-poultice'){r(-13,-4,26,7,O);r(-11,-3,22,4,ivory);r(-7,-8,14,7,'#82664d');for(const x of [-5,0,4]){r(x,-9,4,3,'#b19c60');r(x,-7,2,2,'#dbc080');}r(-13,2,5,4,'#c8bea0');r(8,2,5,4,'#c8bea0');return true;}
 if(id==='alabaster-jar'){r(-4,-25,8,4,O);r(-3,-21,6,6,'#e0d6c6');r(-7,-15,14,4,O);r(-10,-11,20,15,O);r(-8,-10,16,13,'#c6b5c9');r(-6,-10,4,12,'#eee4e5');r(5,-8,2,9,'#9986a8');r(-5,4,10,2,O);r(-2,-25,4,3,'#cfb179');return true;}
 if(id==='reed-basket'){r(-13,-7,26,10,O);r(-11,-9,22,11,'#a88b55');r(-9,-11,18,3,'#d2b577');for(let x=-8;x<=8;x+=4)r(x,-8,1,10,'#6a6541');for(let y=-6;y<=0;y+=3)r(-11,y,22,1,'#dbc28c');r(-6,-9,12,3,'#f0e5c5');r(-11,-10,3,3,'#597d62');r(8,-10,3,3,'#597d62');return true;}
 if(id==='writing-tablet'){r(-11,-24,22,29,O);r(-9,-22,18,25,'#b98d6c');r(-7,-20,14,21,'#cda77f');for(let y=-17;y<-2;y+=4){r(-5,y,10,1,ink);r(-4,y+1,3,1,ink);}r(10,-20,2,22,'#e2ceb1');r(11,-22,2,3,ink);return true;}
 if(id==='oil-vessel'){r(-5,-24,10,3,O);r(-4,-21,8,4,light);r(-8,-17,16,3,O);r(-11,-14,22,15,O);r(-9,-13,18,13,clay);r(-6,-12,4,10,light);r(6,-11,2,10,shade);r(-6,1,12,3,O);r(10,-12,4,10,O);r(11,-10,1,6,light);r(-2,-25,4,2,'#d9bd77');return true;}
 return false;
}
