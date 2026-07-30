import { fail, redirect } from '@sveltejs/kit';
import { editorPassword, makeToken, SESSION_COOKIE } from '$lib/log/auth.js';

export const actions = {
	default: async ({ request, cookies, url, platform }) => {
		const secret = editorPassword(platform);
		if (!secret) {
			// fail closed: never allow login when the password is unconfigured
			return fail(500, { error: 'EDITOR_PASSWORD が未設定です（デプロイ設定を確認してください）' });
		}
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		if (password !== secret) {
			return fail(401, { error: 'パスワードが違います' });
		}
		const token = await makeToken(secret);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 30
		});
		// same-origin relative paths only — no open redirect
		const raw = url.searchParams.get('next') || '/log/edit';
		const next = raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\') ? raw : '/log/edit';
		throw redirect(303, next);
	}
};
