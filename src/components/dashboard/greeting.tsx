"use client";

import { useEffect, useState } from "react";

import { formatDate, greeting } from "@/lib/utils";

const USER_NAME = "Bruno";

export function Greeting() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const salutation = now ? greeting(now) : "Olá";
  const today = now ? formatDate(now, "EEEE, dd 'de' MMMM") : "";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {today || " "}
      </p>
      <h1 className="text-display text-3xl font-semibold md:text-4xl">
        {salutation}, <span className="shimmer-text">{USER_NAME}</span>.
      </h1>
      <p className="text-sm text-muted-foreground">
        Veja o que merece sua atenção hoje.
      </p>
    </div>
  );
}
