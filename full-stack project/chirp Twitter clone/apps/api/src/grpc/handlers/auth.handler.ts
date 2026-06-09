import type { IAuthService } from "@chirp/proto";
import { resolveAuthContext, validateSessionToken } from "../../middleware/auth";
import { getCurrentUser, loginUser, registerUser } from "../../services/auth.service";
import { toProtoTimestamp } from "../../services/utils";
import { runGrpcHandler, runGrpcMutation } from "../handler-utils";

export const authHandler: IAuthService = {
	async register(request) {
		return runGrpcMutation(
			{
				service: "AuthService",
				method: "register",
				errorDefaults: { userId: "", sessionToken: "" },
				unknownErrorMessage: "Registration failed",
			},
			async () => {
				const result = await registerUser({
					email: request.email,
					username: request.username,
					displayName: request.displayName,
					password: request.password,
				});

				return {
					success: true,
					userId: result.userId,
					sessionToken: result.sessionToken,
				};
			},
		);
	},

	async login(request) {
		return runGrpcMutation(
			{
				service: "AuthService",
				method: "login",
				errorDefaults: { userId: "", sessionToken: "" },
				unknownErrorMessage: "Login failed",
			},
			async () => {
				const result = await loginUser({
					email: request.email,
					password: request.password,
				});

				return {
					success: true,
					userId: result.userId,
					sessionToken: result.sessionToken,
				};
			},
		);
	},

	async logout(_request) {
		return runGrpcMutation({ service: "AuthService", method: "logout" }, async () => ({
			success: true,
		}));
	},

	async getCurrentUser(request) {
		return runGrpcHandler({ service: "AuthService", method: "getCurrentUser" }, async () => {
			const auth = await resolveAuthContext(request.sessionToken);
			const user = await getCurrentUser(auth.userId);

			return {
				id: user.id,
				email: user.email,
				username: user.username,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl || undefined,
				bio: user.bio || undefined,
				role: user.role,
				createdAt: toProtoTimestamp(user.createdAt),
			};
		});
	},

	async validateSession(request) {
		return runGrpcHandler({ service: "AuthService", method: "validateSession" }, async () => {
			try {
				const auth = await resolveAuthContext(request.sessionToken);
				return {
					valid: true,
					userId: auth.userId,
					username: auth.username,
					role: auth.role,
				};
			} catch {
				return {
					valid: false,
					userId: "",
					username: "",
					role: "",
				};
			}
		});
	},
};

/** @internal For tests documenting JWT trust boundary */
export { validateSessionToken };
