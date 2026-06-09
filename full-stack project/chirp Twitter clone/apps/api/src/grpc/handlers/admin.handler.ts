import type {
	AdminUserResponse,
	AuditLogResponse,
	IAdminService,
	ReportResponse,
} from "@chirp/proto";
import { requireAdmin } from "../../middleware/auth";
import {
	banUser,
	deleteCommentAdmin,
	deletePostAdmin,
	deleteUser,
	getAuditLogs,
	getDashboardStats,
	getReport,
	getUserDetails,
	listReports,
	listUsers,
	reviewReport,
	unbanUser,
	updateUserRole,
} from "../../services/admin.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

function toAdminUserResponse(user: any): AdminUserResponse {
	return {
		id: user.id,
		email: user.email,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl || undefined,
		bio: user.bio || undefined,
		role: user.role,
		createdAt: toProtoTimestamp(user.createdAt),
		updatedAt: toProtoTimestamp(user.updatedAt),
		bannedAt: user.bannedAt ? toProtoTimestamp(user.bannedAt) : undefined,
		bannedReason: user.bannedReason || undefined,
		postCount: user.postCount || 0,
		commentCount: user.commentCount || 0,
	};
}

function toReportResponse(report: any): ReportResponse {
	return {
		id: report.id,
		reporterId: report.reporterId,
		reporterUsername: report.reporterUsername,
		targetType: report.targetType,
		targetId: report.targetId,
		reason: report.reason,
		description: report.description || undefined,
		status: report.status,
		reviewedBy: report.reviewedBy || undefined,
		reviewedAt: report.reviewedAt ? toProtoTimestamp(report.reviewedAt) : undefined,
		createdAt: toProtoTimestamp(report.createdAt),
	};
}

function toAuditLogResponse(log: any): AuditLogResponse {
	return {
		id: log.id,
		adminId: log.adminId,
		adminUsername: log.adminUsername,
		action: log.action,
		targetType: log.targetType || undefined,
		targetId: log.targetId || undefined,
		details: log.details || undefined,
		ipAddress: log.ipAddress || undefined,
		createdAt: toProtoTimestamp(log.createdAt),
	};
}

export const adminHandler: IAdminService = {
	async listUsers(request) {
		return runGrpcHandler({ service: "AdminService", method: "listUsers" }, async () => {
			await requireAdmin(request.sessionToken);
			const result = await listUsers({
				limit: request.pagination?.limit || 20,
				offset: request.pagination?.offset || 0,
				searchQuery: request.searchQuery || undefined,
				roleFilter: request.roleFilter || undefined,
			});
			return {
				users: result.users.map(toAdminUserResponse),
				total: result.total,
			};
		});
	},

	async getUserDetails(request) {
		return runGrpcHandler({ service: "AdminService", method: "getUserDetails" }, async () => {
			await requireAdmin(request.sessionToken);
			const user = await getUserDetails(request.userId);
			return { user: toAdminUserResponse(user) };
		});
	},

	async banUser(request) {
		return runGrpcMutation({ service: "AdminService", method: "banUser" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await banUser(request.userId, request.reason, auth.userId);
			return { success: true };
		});
	},

	async unbanUser(request) {
		return runGrpcMutation({ service: "AdminService", method: "unbanUser" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await unbanUser(request.userId, auth.userId);
			return { success: true };
		});
	},

	async updateUserRole(request) {
		return runGrpcMutation({ service: "AdminService", method: "updateUserRole" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await updateUserRole(request.userId, request.role, auth.userId);
			return { success: true };
		});
	},

	async deleteUser(request) {
		return runGrpcMutation({ service: "AdminService", method: "deleteUser" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await deleteUser(request.userId, auth.userId);
			return { success: true };
		});
	},

	async deletePostAdmin(request) {
		return runGrpcMutation({ service: "AdminService", method: "deletePostAdmin" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await deletePostAdmin(request.postId, request.reason, auth.userId);
			return { success: true };
		});
	},

	async deleteCommentAdmin(request) {
		return runGrpcMutation({ service: "AdminService", method: "deleteCommentAdmin" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await deleteCommentAdmin(request.commentId, request.reason, auth.userId);
			return { success: true };
		});
	},

	async listReports(request) {
		return runGrpcHandler({ service: "AdminService", method: "listReports" }, async () => {
			await requireAdmin(request.sessionToken);
			const result = await listReports({
				limit: request.pagination?.limit || 20,
				offset: request.pagination?.offset || 0,
				statusFilter: request.statusFilter || undefined,
				typeFilter: request.typeFilter || undefined,
			});
			return {
				reports: result.reports.map(toReportResponse),
				total: result.total,
			};
		});
	},

	async getReport(request) {
		return runGrpcHandler({ service: "AdminService", method: "getReport" }, async () => {
			await requireAdmin(request.sessionToken);
			const report = await getReport(request.reportId);
			return toReportResponse(report);
		});
	},

	async reviewReport(request) {
		return runGrpcMutation({ service: "AdminService", method: "reviewReport" }, async () => {
			const auth = await requireAdmin(request.sessionToken);
			await reviewReport(request.reportId, request.action, auth.userId, request.notes || undefined);
			return { success: true };
		});
	},

	async getDashboardStats(request) {
		return runGrpcHandler({ service: "AdminService", method: "getDashboardStats" }, async () => {
			await requireAdmin(request.sessionToken);
			const stats = await getDashboardStats();
			return {
				totalUsers: stats.totalUsers,
				totalPosts: stats.totalPosts,
				totalComments: stats.totalComments,
				pendingReports: stats.pendingReports,
				newUsersToday: stats.newUsersToday,
				newPostsToday: stats.newPostsToday,
				bannedUsers: stats.bannedUsers,
			};
		});
	},

	async getAuditLogs(request) {
		return runGrpcHandler({ service: "AdminService", method: "getAuditLogs" }, async () => {
			await requireAdmin(request.sessionToken);
			const result = await getAuditLogs({
				limit: request.pagination?.limit || 50,
				offset: request.pagination?.offset || 0,
				adminIdFilter: request.adminIdFilter || undefined,
				actionFilter: request.actionFilter || undefined,
			});
			return {
				logs: result.logs.map(toAuditLogResponse),
				total: result.total,
			};
		});
	},
};
