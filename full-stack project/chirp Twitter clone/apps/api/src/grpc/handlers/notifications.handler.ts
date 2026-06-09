import type { INotificationsService } from "@chirp/proto";
import { logger } from "../../lib/logger";
import { requireAuth } from "../../middleware/auth";
import {
	deleteNotification,
	getUnreadCount,
	getUserNotifications,
	markAllAsRead,
	markAsRead,
} from "../../services/notifications.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const notificationsHandler: INotificationsService = {
	async getNotifications(request) {
		try {
			return await runGrpcHandler(
				{ service: "NotificationsService", method: "getNotifications" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const notifications = await getUserNotifications(
						auth.userId,
						request.limit || 20,
						request.offset || 0,
					);
					return {
						notifications: notifications.map((n) => ({
							id: n.id,
							type: n.type,
							read: n.read,
							actor: n.actor
								? {
										id: n.actor.id,
										username: n.actor.username,
										displayName: n.actor.displayName,
										avatarUrl: n.actor.avatarUrl || undefined,
									}
								: undefined,
							postId: n.postId || undefined,
							commentId: n.commentId || undefined,
							postContent: n.postContent || undefined,
							commentContent: n.commentContent || undefined,
							createdAt: toProtoTimestamp(n.createdAt),
						})),
					};
				},
			);
		} catch (error) {
			logger.warn("getNotifications auth failure", {
				error: error instanceof Error ? error.message : "unknown",
			});
			return { notifications: [] };
		}
	},

	async getUnreadCount(request) {
		try {
			return await runGrpcHandler(
				{ service: "NotificationsService", method: "getUnreadCount" },
				async () => {
					const auth = await requireAuth(request.sessionToken);
					const result = await getUnreadCount(auth.userId);
					return { count: result.count };
				},
			);
		} catch {
			return { count: 0 };
		}
	},

	async markAsRead(request) {
		return runGrpcMutation({ service: "NotificationsService", method: "markAsRead" }, async () => {
			const auth = await requireAuth(request.sessionToken);
			await markAsRead(request.notificationId, auth.userId);
			return { success: true };
		});
	},

	async markAllAsRead(request) {
		return runGrpcMutation(
			{ service: "NotificationsService", method: "markAllAsRead" },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				await markAllAsRead(auth.userId);
				return { success: true };
			},
		);
	},

	async deleteNotification(request) {
		return runGrpcMutation(
			{ service: "NotificationsService", method: "deleteNotification" },
			async () => {
				const auth = await requireAuth(request.sessionToken);
				await deleteNotification(request.notificationId, auth.userId);
				return { success: true };
			},
		);
	},
};
