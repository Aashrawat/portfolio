import type { IUsersService } from "@chirp/proto";
import { requireAuth, resolveAuthContext } from "../../middleware/auth";
import { getUser, updateProfile } from "../../services/users.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const usersHandler: IUsersService = {
	async getUser(request) {
		return runGrpcHandler({ service: "UsersService", method: "getUser" }, async () => {
			let userId: string | undefined;
			if (request.sessionToken) {
				try {
					const auth = await resolveAuthContext(request.sessionToken);
					userId = auth.userId;
				} catch {
					// Ignore invalid token for public access
				}
			}

			const user = await getUser(request.username, userId);
			return {
				id: user.id,
				email: user.email,
				username: user.username,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl || undefined,
				bio: user.bio || undefined,
				role: user.role,
				createdAt: toProtoTimestamp(user.createdAt),
				followerCount: user.followerCount,
				followingCount: user.followingCount,
				postCount: user.postCount,
				isFollowing: user.isFollowing,
			};
		});
	},

	async updateProfile(request) {
		return runGrpcMutation({ service: "UsersService", method: "updateProfile" }, async () => {
			const auth = await requireAuth(request.sessionToken);
			await updateProfile({
				userId: auth.userId,
				displayName: request.displayName || undefined,
				bio: request.bio || undefined,
				avatarUrl: request.avatarUrl || undefined,
			});
			return { success: true };
		});
	},
};
