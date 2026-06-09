import type { CommentResponse, ICommentsService } from "@chirp/proto";
import { requireAuth, resolveAuthContext } from "../../middleware/auth";
import { createComment, deleteComment, getPostComments } from "../../services/comments.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

function toCommentResponse(comment: any): CommentResponse {
	return {
		id: comment.id,
		content: comment.content,
		createdAt: toProtoTimestamp(comment.createdAt),
		parentId: comment.parentId || undefined,
		author: comment.author
			? {
					id: comment.author.id || "",
					username: comment.author.username || "",
					displayName: comment.author.displayName || "",
					avatarUrl: comment.author.avatarUrl || undefined,
				}
			: { id: "", username: "", displayName: "" },
		likeCount: comment.likeCount || 0,
		isLiked: comment.isLiked || false,
		replies: (comment.replies || []).map(toCommentResponse),
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

export const commentsHandler: ICommentsService = {
	async createComment(request) {
		return runGrpcMutation(
			{ service: "CommentsService", method: "createComment", errorDefaults: { commentId: "" } },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await createComment({
					postId: request.postId,
					content: request.content,
					authorId: auth.userId,
					parentId: request.parentId || undefined,
				});
				return { success: true, commentId: result.commentId };
			},
		);
	},

	async getPostComments(request) {
		return runGrpcHandler({ service: "CommentsService", method: "getPostComments" }, async () => {
			const userId = await resolveOptionalUserId(request.sessionToken);
			const comments = await getPostComments(request.postId, userId);
			return { comments: comments.map(toCommentResponse) };
		});
	},

	async deleteComment(request) {
		return runGrpcMutation({ service: "CommentsService", method: "deleteComment" }, async () => {
			const auth = await requireAuth(request.sessionToken);
			await deleteComment(request.commentId, auth.userId);
			return { success: true };
		});
	},
};
