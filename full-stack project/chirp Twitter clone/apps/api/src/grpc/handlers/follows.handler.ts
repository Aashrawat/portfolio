import type { IFollowsService } from "@chirp/proto";
import { requireAuth } from "../../middleware/auth";
import {
	getFollowerCount,
	getFollowingCount,
	getFollowStatus,
	toggleFollow,
} from "../../services/follows.service";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const followsHandler: IFollowsService = {
	async toggleFollow(request) {
		return runGrpcMutation(
			{ service: "FollowsService", method: "toggleFollow", errorDefaults: { following: false } },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				const result = await toggleFollow(request.username, auth.userId);
				return { success: true, following: result.following };
			},
		);
	},

	async getFollowStatus(request) {
		try {
			return await runGrpcHandler(
				{ service: "FollowsService", method: "getFollowStatus" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const result = await getFollowStatus(request.username, auth.userId);
					return { following: result.following };
				},
			);
		} catch {
			return { following: false };
		}
	},

	async getFollowerCount(request) {
		return runGrpcHandler({ service: "FollowsService", method: "getFollowerCount" }, async () => {
			const result = await getFollowerCount(request.username);
			return { count: result.count };
		});
	},

	async getFollowingCount(request) {
		return runGrpcHandler({ service: "FollowsService", method: "getFollowingCount" }, async () => {
			const result = await getFollowingCount(request.username);
			return { count: result.count };
		});
	},
};
