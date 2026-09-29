import { db } from "@/db";
import { posts, organizations, upvotes, users } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { createPost } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UpVoteButton } from "@/components/UpVoteButton";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

type PostItem = typeof posts.$inferSelect & {
  upvoteCount: number;
  hasVoted: boolean;
};

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { slug } = await params;
  const { sort = "top", status = "all" } = await searchParams;
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

      //Filter posts based on status if not "all"
      if (status !== "all") {
        boardPosts = boardPosts.filter((post) => post.status === status);
      }

      //Sort posts based on the selected sort option
      if (sort === "top") {
        boardPosts.sort((a, b) => b.upvoteCount - a.upvoteCount);
      } else if (sort === "new") {
        boardPosts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
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
        {/* Sorting & Status Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 text-sm">
            {[
              { label: "All", value: "all" },
              { label: "Under Review", value: "under_review" },
              { label: "Planned", value: "planned" },
              { label: "In Progress", value: "in_progress" },
              { label: "Completed", value: "completed" },
            ].map((tab) => (
              <Link
                key={tab.value}
                href={`/board/${slug}?sort=${sort}&status=${tab.value}`}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  status === tab.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Sort:</span>
            <Link
              href={`/board/${slug}?sort=top&status=${status}`}
              className={`px-2.5 py-1 rounded ${
                sort === "top"
                  ? "font-bold text-slate-900 underline"
                  : "text-slate-500"
              }`}
            >
              Top Voted
            </Link>
            <Link
              href={`/board/${slug}?sort=newest&status=${status}`}
              className={`px-2.5 py-1 rounded ${
                sort === "newest"
                  ? "font-bold text-slate-900 underline"
                  : "text-slate-500"
              }`}
            >
              Newest
            </Link>
          </div>
        </div>

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
                  orgSlug={slug}
                  initialVoteCount={post.upvoteCount}
                  hasVoted={post.hasVoted}
                />
                <div className="flex-1">
                  <Link
                    href={`/board/${slug}/post/${post.id}`}
                    className="font-semibold text-base hover:underline"
                  >
                    {post.title}
                  </Link>{" "}
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
