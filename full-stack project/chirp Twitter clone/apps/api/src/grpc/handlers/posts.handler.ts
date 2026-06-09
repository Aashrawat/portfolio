import type { IPostsService, PostResponse } from "@chirp/proto";
import { requireAuth, resolveAuthContext } from "../../middleware/auth";
import {
	createPost,
	deletePost,
	getPost,
	getPosts,
	getUserPosts,
	updatePost,
} from "../../services/posts.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

function toPostResponse(post: any): PostResponse {
	return {
		id: post.id,
		content: post.content,
		createdAt: toProtoTimestamp(post.createdAt),
		updatedAt: toProtoTimestamp(post.updatedAt),
		author: post.author
			? {
					id: post.author.id || "",
					username: post.author.username || "",
					displayName: post.author.displayName || "",
					avatarUrl: post.author.avatarUrl || undefined,
				}
			: { id: "", username: "", displayName: "" },
		likeCount: post.likeCount || 0,
		commentCount: post.commentCount || 0,
		isLiked: post.isLiked || false,
	};
}

async function resolveOptionalUserId(sessionToken?: string): Promise<string | undefined> {
	if (!sessionToken) return undefined;
	try {
		const auth = await resolveAuthContext(sessionToken);
		return auth.userId;
	} catch {
		return undefined;
	}
}

export const postsHandler: IPostsService = {
	async createPost(request) {
		return runGrpcMutation(
			{ service: "PostsService", method: "createPost", errorDefaults: { postId: "" } },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await createPost({
					content: request.content,
					authorId: auth.userId,
				});
				return { success: true, postId: result.postId };
			},
		);
	},

	async getPost(request) {
		return runGrpcHandler({ service: "PostsService", method: "getPost" }, async () => {
			const userId = await resolveOptionalUserId(request.sessionToken);
			const post = await getPost(request.postId, userId);
			return toPostResponse(post);
		});
	},

	async updatePost(request) {
		return runGrpcMutation({ service: "PostsService", method: "updatePost" }, async () => {
			const auth = await requireAuth(request.sessionToken);
			await updatePost({
				postId: request.postId,
				content: request.content,
				userId: auth.userId,
			});
			return { success: true };
		});
	},

	async deletePost(request) {
		return runGrpcMutation({ service: "PostsService", method: "deletePost" }, async () => {
			const auth = await requireAuth(request.sessionToken);
			await deletePost(request.postId, auth.userId);
			return { success: true };
		});
	},

	async getPosts(request) {
		return runGrpcHandler({ service: "PostsService", method: "getPosts" }, async () => {
			const userId = await resolveOptionalUserId(request.sessionToken);
			const posts = await getPosts({
				limit: request.pagination?.limit || 20,
				offset: request.pagination?.offset || 0,
				userId,
			});
			return { posts: posts.map(toPostResponse) };
		});
	},

	async getUserPosts(request) {
		return runGrpcHandler({ service: "PostsService", method: "getUserPosts" }, async () => {
			const userId = await resolveOptionalUserId(request.sessionToken);
			const posts = await getUserPosts(request.username, userId);
			return { posts: posts.map(toPostResponse) };
		});
	},
};
