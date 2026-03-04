export interface LapTime {
  id: string;
  game: string;
  track: string;
  car: string;
  timeMs: number;
  userName: string;
  isPrivate?: boolean; 
}