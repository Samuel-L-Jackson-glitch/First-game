export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'cyan' | 'pink';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Point {
  x: number;
  y: number;
}

export interface Dot {
  pos: Point;
  color: Color;
}

export interface Level {
  id: number;
  size: number;
  dots: Dot[];
  difficulty: Difficulty;
}

export interface GameState {
  currentLevel: number;
  paths: Record<Color, Point[]>;
  activeColor: Color | null;
  isDragging: boolean;
}
