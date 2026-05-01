import { getBalls } from "@/lib/balls";
import HomeClient from "./HomeClient";

export default function HomePage() {
  const balls = getBalls();
  return <HomeClient balls={balls} />;
}
