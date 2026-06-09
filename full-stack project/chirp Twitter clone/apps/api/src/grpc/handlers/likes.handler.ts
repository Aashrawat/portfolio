import type { ILikesService } from "@chirp/proto";
import { requireAuth } from "../../middleware/auth";
import {
	getCommentLikeStatus,
	getPostLikeStatus,
	toggleCommentLike,
	togglePostLike,
} from "../../services/likes.service";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const likesHandler: ILikesService = {
	async togglePostLike(request) {
		return runGrpcMutation(
			{ service: "LikesService", method: "togglePostLike", errorDefaults: { liked: false } },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await togglePostLike(request.postId, auth.userId);
				return { success: true, liked: result.liked };
			},
		);
	},

	async toggleCommentLike(request) {
		return runGrpcMutation(
			{ service: "LikesService", method: "toggleCommentLike", errorDefaults: { liked: false } },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await toggleCommentLike(request.commentId, auth.userId);
				return { success: true, liked: result.liked };
			},
		);
	},

	async getPostLikeStatus(request) {
		try {
			return await runGrpcHandler(
				{ service: "LikesService", method: "getPostLikeStatus" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const result = await getPostLikeStatus(request.postId, auth.userId);
					return { liked: result.liked };
				},
			);
		} catch {
			return { liked: false };
		}
	},

	async getCommentLikeStatus(request) {
		try {
			return await runGrpcHandler(
				{ service: "LikesService", method: "getCommentLikeStatus" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const result = await getCommentLikeStatus(request.commentId, auth.userId);
					return { liked: result.liked };
				},
			);
		} catch {
			return { liked: false };
		}
	},
};
