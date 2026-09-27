"use server";

import { db } from "@/db";
import { upvotes, users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleUpvote(postId: string, orgSlug: string) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("You must be logged in to vote.");
  }

  // 1. Fetch local user record
  let user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUser.id),
  });

  //   if (!user) {
  //     throw new Error("User record not found.");
  //   }

  if (!user) {
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      "User";

    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId: clerkUser.id,
        email: primaryEmail,
        name: fullName,
      })
      .returning();

    user = newUser;
  }

  // 2. Check if vote already exists
  const existingVote = await db.query.upvotes.findFirst({
    where: and(eq(upvotes.postId, postId), eq(upvotes.userId, user.id)),
  });

  if (existingVote) {
    // Remove vote (toggle off)
    await db
      .delete(upvotes)
      .where(and(eq(upvotes.postId, postId), eq(upvotes.userId, user.id)));
  } else {
    // Add vote
    await db.insert(upvotes).values({
      postId,
      userId: user.id,
    });
  }

  revalidatePath(`/board/${orgSlug}`);
}
