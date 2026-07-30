// D1-backed store for the log CMS. All functions take the D1 binding
// (`platform.env.DB`) so routes stay thin and the store stays swappable.
//
// Block arrays are stored as JSON text in `draft_blocks` / `published_blocks`
// and parsed/stringified at this boundary only. Publishing snapshots the
// working columns (title/date/cover/draft_blocks) into published_* columns,
// so draft edits never leak to the public site.

/** @param {any[]} blocks */
function coverFromBlocks(blocks) {
	const img = blocks.find((b) => b.type === 'image' && b.src);
	return img ? img.src : null;
}

/** Date in JST regardless of server timezone (CF edge runs UTC). */
function today() {
	return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function nowIso() {
	return new Date().toISOString();
}

/** Public index: published posts, newest first. */
export async function listPublished(db) {
	const { results } = await db
		.prepare(
			"SELECT slug, published_title AS title, published_date AS date, published_cover AS cover FROM pages WHERE status = 'published' ORDER BY published_date DESC"
		)
		.all();
	return results ?? [];
}

/** Public article by slug (published only). Returns null if missing. */
export async function getPublished(db, slug) {
	const row = await db
		.prepare("SELECT * FROM pages WHERE slug = ? AND status = 'published'")
		.bind(slug)
		.first();
	if (!row) return null;
	return {
		slug: row.slug,
		title: row.published_title ?? row.title,
		date: row.published_date ?? row.date,
		cover: row.published_cover ?? row.cover,
		blocks: JSON.parse(row.published_blocks)
	};
}

/** Editor index: every page (any status), newest first, with a
 *  needs_publish flag when the draft differs from the published snapshot. */
export async function listAll(db) {
	const { results } = await db
		.prepare(
			`SELECT slug, title, date, status,
			 CASE WHEN status = 'published' AND (
			   draft_blocks != published_blocks OR
			   title != IFNULL(published_title, title) OR
			   date != IFNULL(published_date, date) OR
			   IFNULL(cover, '') != IFNULL(published_cover, IFNULL(cover, ''))
			 ) THEN 1 ELSE 0 END AS needs_publish
			 FROM pages ORDER BY date DESC`
		)
		.all();
	return results ?? [];
}

/** Editor read: a page's DRAFT content. Returns null if missing. */
export async function getForEdit(db, slug) {
	const row = await db.prepare('SELECT * FROM pages WHERE slug = ?').bind(slug).first();
	if (!row) return null;
	const publishedMatchesDraft =
		row.status === 'published' &&
		row.draft_blocks === row.published_blocks &&
		row.title === (row.published_title ?? row.title) &&
		row.date === (row.published_date ?? row.date) &&
		(row.cover ?? '') === (row.published_cover ?? row.cover ?? '');
	return {
		slug: row.slug,
		title: row.title,
		date: row.date,
		status: row.status,
		blocks: JSON.parse(row.draft_blocks),
		publishedMatchesDraft
	};
}

/** True if a slug already exists. */
export async function slugExists(db, slug) {
	const row = await db.prepare('SELECT 1 FROM pages WHERE slug = ?').bind(slug).first();
	return !!row;
}

/** Create a new draft page. Throws if slug taken. */
export async function createPage(db, { slug, title }) {
	if (await slugExists(db, slug)) {
		throw new Error('slug already exists');
	}
	const id = 'p_' + crypto.randomUUID();
	const date = today();
	const starter = JSON.stringify([{ id: 'b1', type: 'title', text: title || '無題' }]);
	await db
		.prepare(
			"INSERT INTO pages (id, slug, title, date, status, draft_blocks, published_blocks, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, '[]', ?)"
		)
		.bind(id, slug, title || '無題', date, starter, nowIso())
		.run();
	return { slug, date };
}

/** Save the draft (title/date/blocks). Cover is derived from first image. */
export async function saveDraft(db, slug, { title, date, blocks }) {
	const cover = coverFromBlocks(blocks);
	await db
		.prepare(
			'UPDATE pages SET title = ?, date = ?, cover = ?, draft_blocks = ?, updated_at = ? WHERE slug = ?'
		)
		.bind(title, date, cover, JSON.stringify(blocks), nowIso(), slug)
		.run();
}

/** Publish: snapshot draft (blocks + title/date/cover) into published_*. */
export async function publish(db, slug) {
	await db
		.prepare(
			"UPDATE pages SET published_blocks = draft_blocks, published_title = title, published_date = date, published_cover = cover, status = 'published', published_at = ? WHERE slug = ?"
		)
		.bind(nowIso(), slug)
		.run();
}

/** Revert to draft (hide from public). */
export async function unpublish(db, slug) {
	await db.prepare("UPDATE pages SET status = 'draft' WHERE slug = ?").bind(slug).run();
}

/** Delete a page row entirely (media cleanup happens at the API layer). */
export async function deletePage(db, slug) {
	await db.prepare('DELETE FROM pages WHERE slug = ?').bind(slug).run();
}
