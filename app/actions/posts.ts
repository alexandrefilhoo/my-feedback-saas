


// app/actions/posts.ts
"use server";

import { db } from "@/db";
import { posts, organizations, users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData, orgSlug: string) {
  const clerkUser = await currentUser();

  // If testing locally without Clerk login, fallback to a mock user query
  let user = null;
  if (clerkUser) {
    user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUser.id),
    });
  }

  // Find or auto-create organization if missing
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: orgSlug,
        slug: orgSlug,
      })
      .returning();
    org = newOrg;
  }

  // Ensure fallback user exists for unauthenticated testing
  if (!user) {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkUserId: "anon_user",
          email: "guest@example.com",
          name: "Guest User",
        })
        .returning();
      user = newUser;
    }
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  await db.insert(posts).values({
    organizationId: org.id,
    authorId: user.id,
    title,
    description,
  });

  revalidatePath(`/board/${orgSlug}`);
}