const VALIDATION_MARK = 48;   // total of 48 or above = course validated
const MAX_CA = 30;
const MAX_EXAM = 70;
const SCALE = [
  { min: 80, letter: "A",  points: 4.0 },
  { min: 70, letter: "B+", points: 3.5 },
  { min: 60, letter: "B",  points: 3.0 },
  { min: 55, letter: "C+", points: 2.5 },
  { min: 50, letter: "C",  points: 2.0 },
  { min: 45, letter: "D+", points: 1.5 },
  { min: 40, letter: "D",  points: 1.0 },
  { min: 0,  letter: "F",  points: 0.0 }
];