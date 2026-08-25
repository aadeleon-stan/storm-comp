import ballsData from "@/data/balls.json";

export interface Metric {
  name: string;
  segmentStart: number;
  segmentEnd: number;
}

export interface Ball {
  id: string;
  name: string;
  shortName: string | null;
  brand: string | null;
  url: string;
  imageUrl: string | null;
  color: string | null;
  fragrance: string | null;
  coreType: string | null;
  coreName: string | null;
  coreImageUrl: string | null;
  coverstockType: string | null;
  coverstockName: string | null;
  zvlCategory: string | null;
  archived?: boolean;
  releaseDate?: string | null;
  isNew?: boolean;
  metrics: Metric[];
}

export function isBallNew(ball: Ball, withinDays = 60): boolean {
  if (ball.isNew === true) return true;
  if (ball.isNew === false) return false;
  if (!ball.releaseDate) return false;
  const release = new Date(ball.releaseDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  return release >= cutoff;
}

export function getBalls(): Ball[] {
  return ballsData as Ball[];
}

export function getBallsByIds(ids: string[]): Ball[] {
  const all = getBalls();
  return ids.map((id) => all.find((b) => b.id === id)).filter(Boolean) as Ball[];
}
