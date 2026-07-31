"use client";

import { use } from "react";

import { ProjectDetail } from "@/components/projects/project-detail";

interface Params {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: Params) {
  const { slug } = use(params);
  return <ProjectDetail slug={slug} />;
}
