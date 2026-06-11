import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TaskEmpty({ filtered }: { filtered?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {filtered ? "No tasks match your filters" : "No tasks yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {filtered
          ? "Try adjusting your search or filters."
          : "Create your first task to get started."}
      </p>
      {!filtered && (
        <Link href="/tasks/new">
          <Button size="md">Create task</Button>
        </Link>
      )}
    </div>
  );
}
