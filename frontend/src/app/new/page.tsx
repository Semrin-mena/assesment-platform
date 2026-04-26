"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyNewPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/assessments/new"); }, [router]);
  return null;
}
