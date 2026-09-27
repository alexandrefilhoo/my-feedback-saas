// components/UpVoteButton.tsx
"use client";

import { useTransition } from "react";
import { toggleUpvote } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";

interface UpVoteButtonProps {
  postId: string;
  slug: string;
  upvoteCount: number;
  hasUpvoted: boolean;
}

export function UpVoteButton({
  postId,
  slug,
  upvoteCount,
  hasUpvoted,
}: UpVoteButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={hasUpvoted ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleUpvote(postId, slug);
        });
      }}
      className="flex items-center gap-1.5"
    >
      <span>▲</span>
      <span>{upvoteCount}</span>
    </Button>
  );
}
