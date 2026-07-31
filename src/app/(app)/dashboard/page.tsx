import { BrainInsights } from "@/components/dashboard/brain-insights";
import { Greeting } from "@/components/dashboard/greeting";
import { PrioritiesToday } from "@/components/dashboard/priorities-today";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { StatCards } from "@/components/dashboard/stat-cards";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <Greeting />
      <StatCards />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PrioritiesToday />
          <RecentProjects />
        </div>
        <div className="space-y-4">
          <BrainInsights />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
