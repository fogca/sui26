// Log content store.
// For now the posts live here as static seed data so the blog structure can
// render. In the CMS phase this module is replaced by a D1-backed store that
// returns the same shape, so the renderer and routes stay untouched.
//
// Block model (shared with the future inline CMS):
//   { id, type: 'title', text }
//   { id, type: 'text',  text }              // plain text, line breaks preserved
//   { id, type: 'image', src, alt, caption } // caption optional

/** @typedef {{ id: string, type: 'title'|'text'|'image', text?: string, src?: string, alt?: string, caption?: string }} Block */
/** @typedef {{ slug: string, title: string, date: string, cover?: string, status: 'draft'|'published', blocks: Block[] }} Post */

/** @type {Post[]} */
const posts = [
	{
		slug: 'hello-log',
		title: 'log をはじめます',
		date: '2026-07-14',
		cover: '/images/sari.jpg',
		status: 'published',
		blocks: [
			{ id: 'b1', type: 'title', text: 'log をはじめます' },
			{
				id: 'b2',
				type: 'text',
				text: 'SUI scent studio の記録として、香会や制作のあしあとを少しずつ残していきます。\nここは、その最初のページです。'
			},
			{ id: 'b3', type: 'image', src: '/images/sari.jpg', alt: '', caption: 'SUI scent by Sari' },
			{
				id: 'b4',
				type: 'text',
				text: '文章と画像を、任意の順番で積み重ねていく。飾らない、静かな記録の場所にしたいと思います。'
			}
		]
	},
	{
		slug: 'morioka-shoten',
		title: '森岡書店にて',
		date: '2026-06-30',
		cover: '/images/moriokasyoten2023.jpg',
		status: 'published',
		blocks: [
			{ id: 'b1', type: 'title', text: '森岡書店にて' },
			{
				id: 'b2',
				type: 'text',
				text: '一冊の本と一つの香り。小さな空間に立ちのぼる気配についての覚え書き。'
			},
			{ id: 'b3', type: 'image', src: '/images/moriokasyoten2023.jpg', alt: '', caption: '森岡書店 2023' },
			{ id: 'b4', type: 'image', src: '/images/hanaori_1.jpg', alt: '', caption: '' }
		]
	}
];

/** Return all published posts, newest first. */
export function getAllPosts() {
	return posts
		.filter((p) => p.status === 'published')
		.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Return a single post by slug, or undefined. */
export function getPost(slug) {
	return posts.find((p) => p.slug === slug);
}
