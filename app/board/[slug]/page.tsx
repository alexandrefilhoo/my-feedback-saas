import { db } from "@/db";
import { posts, organizations, upvotes, users } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UpVoteButton } from "@/components/UpVoteButton";
import { currentUser } from "@clerk/nextjs/server";

type PostItem = typeof posts.$inferSelect & {
  upvoteCount: number;
  hasVoted: boolean;
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clerkUser = await currentUser();

  // 1. Get current user ID
  let currentDbUser = null;
  if (clerkUser) {
    currentDbUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUser.id),
    });
  }

  // 2. Get organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  // 3. Get posts along with vote counts
  let boardPosts: PostItem[] = [];

  if (org) {
    const rawPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.organizationId, org.id))
      .orderBy(desc(posts.createdAt));

    if (rawPosts.length > 0) {
      const postIds = rawPosts.map((p) => p.id);

      // Fetch all upvotes for these posts in a single query
      const allUpvotes = await db
        .select()
        .from(upvotes)
        .where(inArray(upvotes.postId, postIds));

      boardPosts = rawPosts.map((post) => {
        const postVotes = allUpvotes.filter((v) => v.postId === post.id);
        const hasVoted = currentDbUser
          ? postVotes.some((v) => v.userId === currentDbUser.id)
          : false;

        return {
          ...post,
          upvoteCount: postVotes.length,
          hasVoted,
        };
      });
    }
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    await createPost(formData, slug);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold capitalize">
              {slug} Feedback Board
            </h1>
            <p className="text-muted-foreground">
              Submit and vote on feature requests for {slug}.
            </p>
          </div>
        </header>

        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create a Feature Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <Input
                name="title"
                placeholder="Title (e.g., Add Dark Mode)"
                required
              />
              <textarea
                name="description"
                placeholder="Describe your feature request..."
                className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                required
              />
              <Button type="submit">Submit Request</Button>
            </form>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Requests ({boardPosts.length})
          </h2>
          {boardPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No requests submitted yet. Be the first!
            </p>
          ) : (
            boardPosts.map((post) => (
              <Card
                key={post.id}
                className="flex flex-row items-center p-4 space-x-4"
              >
                <UpVoteButton
                  postId={post.id}
                  slug={slug}
                  upvoteCount={post.upvoteCount}
                  hasUpvoted={post.hasVoted}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{post.title}</h3>
                  <p className="text-sm text-slate-600">{post.description}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
