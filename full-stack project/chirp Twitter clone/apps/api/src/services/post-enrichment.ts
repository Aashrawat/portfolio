import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { likes, comments } = schema;

export interface PostEngagementCounts {
	likeCount: number;
	commentCount: number;
	isLiked: boolean;
}

export interface PostWithAuthor {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string | null;
		username: string | null;
		displayName: string | null;
		avatarUrl: string | null;
	} | null;
}

export type EnrichedPost = PostWithAuthor & PostEngagementCounts;

/**
 * Batch-fetch like/comment counts and liked status for many posts in O(1) query rounds.
 * Use this instead of per-post queries to avoid N+1 load at scale.
 */
export async function enrichPostsWithCounts<T extends { id: string }>(
	posts: T[],
	userId?: string,
): Promise<Array<T & PostEngagementCounts>> {
	if (posts.length === 0) {
		return [];
	}

	const postIds = posts.map((post) => post.id);

	const [likeCounts, commentCounts, likedRows] = await Promise.all([
		db
			.select({
				postId: likes.postId,
				count: sql<number>`count(*)`.as("count"),
			})
			.from(likes)
			.where(inArray(likes.postId, postIds))
			.groupBy(likes.postId),
		db
			.select({
				postId: comments.postId,
				count: sql<number>`count(*)`.as("count"),
			})
			.from(comments)
			.where(inArray(comments.postId, postIds))
			.groupBy(comments.postId),
		userId
			? db
					.select({ postId: likes.postId })
					.from(likes)
					.where(and(inArray(likes.postId, postIds), eq(likes.userId, userId)))
			: Promise.resolve([]),
	]);

	const likeCountByPostId = new Map(likeCounts.map((row) => [row.postId, row.count]));
	const commentCountByPostId = new Map(commentCounts.map((row) => [row.postId, row.count]));
	const likedPostIds = new Set(likedRows.map((row) => row.postId));

	return posts.map((post) => ({
		...post,
		likeCount: likeCountByPostId.get(post.id) ?? 0,
		commentCount: commentCountByPostId.get(post.id) ?? 0,
		isLiked: likedPostIds.has(post.id),
	}));
}
