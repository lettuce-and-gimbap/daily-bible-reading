// TV 부스 참가자는 이전 이동 방향과 무관하게 항상 카메라 정면을 본다.
export function faceBoothFront(people){
 for(const person of people){person.direction='down';person.idle=6;}
 return people;
}
