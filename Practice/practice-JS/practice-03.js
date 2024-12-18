// const a = [5, 4, 3, 2, 1];
// for (const b of a) {
//   console.log(b);
// }

// const a = [1, 2, 3, 4, 5];
// a.forEach((value) => console.log(value));

// const a = [1, 2, 3, 4, 5];
// const b = a.map((value) => value * 2);

const a = [1, 2, 3, 4, 5];
const b = a.reduce((value, current) => {
  return value + current;
}, 0);
console.log(b);
