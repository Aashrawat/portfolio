import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../tests/helpers";
import { db, schema } from "../db";
import { enrichPostsWithCounts } from "./post-enrichment";
import { generateId } from "./utils";

const { posts, likes } = schema;

describe("post-enrichment batch queries", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("loads engagement for 10 posts in a constant number of query rounds", async () => {
		const author = await createTestUser({ username: "feedauthor" });
		const viewer = await createTestUser({ username: "feedviewer" });

		const postRows = [];
		for (let i = 0; i < 10; i++) {
			const postId = generateId();
			await db.insert(posts).values({
				id: postId,
				content: `Post ${i}`,
				authorId: author.id,
			});
			postRows.push({
				id: postId,
				content: `Post ${i}`,
				createdAt: new Date(),
				updatedAt: new Date(),
				author: {
					id: author.id,
					username: author.username,
					displayName: author.displayName,
					avatarUrl: null,
				},
			});
		}

		await db.insert(likes).values({
			id: generateId(),
			postId: postRows[0].id,
			userId: viewer.id,
		});

		let queryCount = 0;
		const originalSelect = db.select.bind(db);
		vi.spyOn(db, "select").mockImplementation((...args) => {
			queryCount++;
			return originalSelect(...args);
		});

		const enriched = await enrichPostsWithCounts(postRows, viewer.id);

		expect(enriched).toHaveLength(10);
		expect(enriched[0].likeCount).toBe(1);
		expect(enriched[0].isLiked).toBe(true);
		// 3 batch queries (like counts, comment counts, liked status) — not 30
		expect(queryCount).toBeLessThanOrEqual(3);
	});
});
