import { Level } from './types';

export const LEVELS: Level[] = [
  // EASY (5x5, 6x6) - Levels 1-30
  {
    id: 1, size: 5, difficulty: 'Easy',
    dots: [
      { pos: { x: 0, y: 0 }, color: 'red' }, { pos: { x: 4, y: 0 }, color: 'red' },
      { pos: { x: 0, y: 4 }, color: 'blue' }, { pos: { x: 4, y: 4 }, color: 'blue' },
      { pos: { x: 2, y: 1 }, color: 'green' }, { pos: { x: 2, y: 3 }, color: 'green' },
    ],
  },
  {
    id: 2, size: 5, difficulty: 'Easy',
    dots: [
      { pos: { x: 0, y: 0 }, color: 'red' }, { pos: { x: 2, y: 2 }, color: 'red' },
      { pos: { x: 4, y: 0 }, color: 'blue' }, { pos: { x: 2, y: 4 }, color: 'blue' },
      { pos: { x: 0, y: 4 }, color: 'yellow' }, { pos: { x: 4, y: 4 }, color: 'yellow' },
    ],
  },
  {
    id: 3, size: 6, difficulty: 'Easy',
    dots: [
      { pos: { x: 0, y: 0 }, color: 'red' }, { pos: { x: 5, y: 5 }, color: 'red' },
      { pos: { x: 5, y: 0 }, color: 'blue' }, { pos: { x: 0, y: 5 }, color: 'blue' },
      { pos: { x: 2, y: 0 }, color: 'green' }, { pos: { x: 2, y: 5 }, color: 'green' },
      { pos: { x: 0, y: 2 }, color: 'orange' }, { pos: { x: 5, y: 2 }, color: 'orange' },
    ],
  },
  {
    id: 4, size: 6, difficulty: 'Easy',
    dots: [
      { pos: { x: 0, y: 0 }, color: 'red' }, { pos: { x: 2, y: 2 }, color: 'red' },
      { pos: { x: 1, y: 0 }, color: 'blue' }, { pos: { x: 3, y: 3 }, color: 'blue' },
      { pos: { x: 2, y: 0 }, color: 'green' }, { pos: { x: 4, y: 4 }, color: 'green' },
      { pos: { x: 3, y: 0 }, color: 'orange' }, { pos: { x: 5, y: 5 }, color: 'orange' },
      { pos: { x: 4, y: 0 }, color: 'purple' }, { pos: { x: 0, y: 5 }, color: 'purple' },
    ]
  },
  {
    id: 5, size: 6, difficulty: 'Easy',
    dots: [
      { pos: { x: 0, y: 0 }, color: 'red' }, { pos: { x: 5, y: 5 }, color: 'red' },
      { pos: { x: 0, y: 1 }, color: 'blue' }, { pos: { x: 4, y: 5 }, color: 'blue' },
      { pos: { x: 0, y: 2 }, color: 'green' }, { pos: { x: 3, y: 5 }, color: 'green' },
      { pos: { x: 0, y: 3 }, color: 'orange' }, { pos: { x: 2, y: 5 }, color: 'orange' },
      { pos: { x: 0, y: 4 }, color: 'purple' }, { pos: { x: 1, y: 5 }, color: 'purple' },
      { pos: { x: 5, y: 0 }, color: 'cyan' }, { pos: { x: 5, y: 4 }, color: 'cyan' },
    ]
  },
  // Generated Easy Levels 6-10
  ...Array.from({ length: 5 }, (_, i) => {
    const id = i + 6;
    const size = 6;
    const colors: ('red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'cyan' | 'pink')[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'pink'];
    const numColors = 5;
    const dots = [];
    for (let j = 0; j < numColors; j++) {
      dots.push({ pos: { x: j, y: 0 }, color: colors[j] });
      dots.push({ pos: { x: size - 1 - j, y: size - 1 }, color: colors[j] });
    }
    return { id, size, difficulty: 'Easy' as const, dots };
  }),

  // MEDIUM (7x7, 8x8) - Levels 11-15
  ...Array.from({ length: 5 }, (_, i) => {
    const id = i + 11;
    const size = id <= 13 ? 7 : 8;
    const colors: ('red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'cyan' | 'pink')[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'pink'];
    const numColors = size - 2;
    const dots = [];
    for (let j = 0; j < numColors; j++) {
      dots.push({ pos: { x: j, y: 0 }, color: colors[j] });
      dots.push({ pos: { x: size - 1 - j, y: size - 1 }, color: colors[j] });
    }
    return { id, size, difficulty: 'Medium' as const, dots };
  }),

  // HARD (9x9, 10x10) - Levels 16-20
  ...Array.from({ length: 5 }, (_, i) => {
    const id = i + 16;
    const size = id <= 18 ? 9 : 10;
    const colors: ('red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'cyan' | 'pink')[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'pink'];
    const numColors = 8;
    const dots = [];
    for (let j = 0; j < numColors; j++) {
      dots.push({ pos: { x: j, y: 0 }, color: colors[j] });
      dots.push({ pos: { x: size - 1 - j, y: size - 1 }, color: colors[j] });
    }
    return { id, size, difficulty: 'Hard' as const, dots };
  }),
];
