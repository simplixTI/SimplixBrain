"use client";

import { use } from "react";

import { NoteEditor } from "@/components/notes/note-editor";

interface Params {
  params: Promise<{ id: string }>;
}

export default function NoteEditorPage({ params }: Params) {
  const { id } = use(params);
  return <NoteEditor noteId={id} />;
}
