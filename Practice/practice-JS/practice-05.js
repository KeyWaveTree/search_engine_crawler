// if (undefined == null) {
//   console.log("성공");
// }
// if (undefined === null) {
//   console.log("성공");
// }

// const a=null;
// const b=a||10;
// console.log(b);

// const a = 1;
// const b = a || 10;
// console.log(b);

// const a = [10, 20, 30, 40, 50];
// const b = a.reduce((value, plus) => {
//   return value + plus;
// }, 0);
// console.log(b);

const obj = {
  회장: "홍길동",
  부회장: "김철수",
  서기: "김영희",
};

Object.entries(obj).forEach((ent) => console.log(ent[0] + " : " + ent[1]));
