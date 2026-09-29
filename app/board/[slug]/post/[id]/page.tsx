// app/board/[slug]/post/[id]/page.tsx
import { db } from "@/db";
import { posts, upvotes, users, comments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createComment } from "@/app/actions/comments";
import { UpVoteButton } from "@/components/UpVoteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const clerkUser = await currentUser();

  let currentDbUser = null;
  if (clerkUser) {
    currentDbUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUser.id),
    });
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  if (!post) {
    notFound();
  }

  const postUpvotes = await db
    .select()
    .from(upvotes)
    .where(eq(upvotes.postId, id));

  const hasVoted = currentDbUser
    ? postUpvotes.some((v) => v.userId === currentDbUser.id)
    : false;

  const postComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, id))
    .orderBy(desc(comments.createdAt));

  async function handleCommentSubmit(formData: FormData) {
    "use server";
    await createComment(formData, id, slug);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={`/board/${slug}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          ← Back to {slug} board
        </Link>

        {/* Post Details Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <UpVoteButton
              postId={post.id}
              orgSlug={slug}
              initialVoteCount={postUpvotes.length}
              hasVoted={hasVoted}
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{post.title}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border text-slate-600 capitalize">
                  {post.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">
                {post.description}
              </p>
            </div>
          </div>
        </Card>

        {/* Add Comment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave a Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCommentSubmit} className="space-y-4">
              <textarea
                name="content"
                placeholder="Share your thoughts or additional context..."
                className="w-full min-h-[90px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                required
              />
              <Button type="submit">Post Comment</Button>
            </form>
          </CardContent>
        </Card>

        {/* Discussion List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Discussion ({postComments.length})
          </h2>
          {postComments.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No comments yet. Start the conversation!
            </p>
          ) : (
            postComments.map((comment) => (
              <Card key={comment.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {comment.authorName || "Anonymous"}
                  </span>
                  <span>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{comment.content}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
