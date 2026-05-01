"use client";

import { useSearchParams } from "next/navigation";
import { getBalls, getBallsByIds } from "@/lib/balls";
import CompareLayout from "./CompareLayout";
import Link from "next/link";
import { Suspense } from "react";

function ComparePageInner() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("balls")?.split(",").filter(Boolean) ?? [];
  const balls = getBallsByIds(ids);
  const allBalls = getBalls();

  if (balls.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">No balls selected.</p>
        <Link href="/" className="text-red-400 hover:text-red-300">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Comparing {balls.length} balls</h1>
      </div>

      <CompareLayout balls={balls} allBalls={allBalls} />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  );
}
