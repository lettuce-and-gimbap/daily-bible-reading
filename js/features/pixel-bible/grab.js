// 모든 값은 월드 셀 좌표. 화면 배율/DPR/카메라 이동과 독립적이다.
export const grabOffset=(pointer,origin)=>({x:origin.x-pointer.x,y:origin.y-pointer.y});
export const grabbedOrigin=held=>({x:held.p.x+(held.grab?.x||0),y:held.p.y+(held.grab?.y||0)});
