import type { IBookmarksService } from "@chirp/proto";
import { logger } from "../../lib/logger";
import { requireAuth } from "../../middleware/auth";
import {
	getBookmarkedPosts,
	getBookmarkStatus,
	toggleBookmark,
} from "../../services/bookmarks.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const bookmarksHandler: IBookmarksService = {
	async toggleBookmark(request) {
		return runGrpcMutation(
			{
				service: "BookmarksService",
				method: "toggleBookmark",
				errorDefaults: { bookmarked: false },
			},
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await toggleBookmark(request.postId, auth.userId);
				return { success: true, bookmarked: result.bookmarked };
			},
		);
	},

	async getBookmarkStatus(request) {
		try {
			return await runGrpcHandler(
				{ service: "BookmarksService", method: "getBookmarkStatus" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const result = await getBookmarkStatus(request.postId, auth.userId);
					return { bookmarked: result.bookmarked };
				},
			);
		} catch {
			return { bookmarked: false };
		}
	},

	async getBookmarkedPosts(request) {
		try {
			return await runGrpcHandler(
				{ service: "BookmarksService", method: "getBookmarkedPosts" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const posts = await getBookmarkedPosts(
						auth.userId,
						auth.userId,
						request.limit || 20,
						request.offset || 0,
					);
					return {
						posts: posts.map((post) => ({
							id: post.id,
							content: post.content,
							createdAt: toProtoTimestamp(post.createdAt),
							updatedAt: toProtoTimestamp(post.updatedAt),
							author: post.author
								? {
										id: post.author.id,
										username: post.author.username,
										displayName: post.author.displayName,
										avatarUrl: post.author.avatarUrl || undefined,
									}
								: undefined,
							likeCount: post.likeCount,
							commentCount: post.commentCount,
							isLiked: post.isLiked,
						})),
					};
				},
			);
		} catch (error) {
			logger.warn("getBookmarkedPosts auth failure", {
				error: error instanceof Error ? error.message : "unknown",
			});
			return { posts: [] };
		}
	},
};
