// components/UpVoteButton.tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { toggleUpvote } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";

interface UpVoteButtonProps {
  postId: string;
  orgSlug: string;
  initialVoteCount: number;
  hasVoted: boolean;
}

type OptimisticState = {
  voteCount: number;
  hasVoted: boolean;
};

export function UpVoteButton({
  postId,
  orgSlug,
  initialVoteCount,
  hasVoted,
}: UpVoteButtonProps) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [isPending, startTransition] = useTransition();

  // Optimistic state setup
  const [optimisticState, setOptimisticState] = useOptimistic<
    OptimisticState,
    void
  >({ voteCount: initialVoteCount, hasVoted }, (currentState) => ({
    voteCount: currentState.hasVoted
      ? currentState.voteCount - 1
      : currentState.voteCount + 1,
    hasVoted: !currentState.hasVoted,
  }));

  const handleVote = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    startTransition(async () => {
      // 1. Immediately trigger the optimistic UI update
      setOptimisticState();

      // 2. Perform the actual Server Action in the background
      try {
        await toggleUpvote(postId, orgSlug);
      } catch (error) {
        console.error("Failed to toggle upvote:", error);
      }
    });
  };

  return (
    <Button
      variant={optimisticState.hasVoted ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleVote}
      className="flex flex-col items-center justify-center min-w-[50px] h-14 p-2 transition-all duration-150"
    >
      <span className="text-xs">▲</span>
      <span className="font-semibold text-sm">{optimisticState.voteCount}</span>
    </Button>
  );
}
