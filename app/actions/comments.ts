"use server"
import { db } from "@/db";
import { comments, users} from "@/db/schema";
import {currentUser} from "@clerk/nextjs/server";
import {eq} from "drizzle-orm";
import {revalidatePath} from "next/cache";

export async function  createComment(formData: FormData, postId: string, orgSlug: string) {
    const content = formData.get("content") as string;
    if(!content || !content.trim) return;

    const clerkUse = await currentUser();
    if(!clerkUse) throw new Error("You must be signed in to comment");

    let dbUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUse.id)
    });
    if(!dbUser) {
        const primaryEmail = clerkUse.emailAddresses[0]?.emailAddress ?? "";
        const fullName = `${clerkUse.firstName ?? ""} ${clerkUse.lastName ?? ""}`.trim() || "User";

        const [newUser] = await db.insert(users).values({
            clerkUserId: clerkUse.id,
            email: primaryEmail,
            name: fullName
        }).returning();
        dbUser = newUser;
    }

    await db.insert(comments).values({
        content,
        postId,
        authorId: dbUser.id,
        
    });
    revalidatePath(`/board/${orgSlug}/post/${postId}`);
}
