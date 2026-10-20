import { json } from '@sveltejs/kit';

// The enquiry form's backend.
//
// Until RESEND_API_KEY is set as a Worker secret this answers 503 with
// `unconfigured`, and the page falls back to opening the mail draft it has
// always opened — so the form keeps working from the first deploy and becomes
// a real send the moment the key is in place, with nothing else to change.
//
//   npx wrangler secret put RESEND_API_KEY
//
// FROM has to be on a domain verified in the Resend account; Resend rejects
// anything else. The reader's own address goes in reply_to rather than in
// from, because sending as them would fail that check and, where it did not,
// would fail SPF at the far end.

const TO = 'hello@sari-scent.jp';
const FROM = 'SUI scent studio <noreply@sui-sari.jp>';

/** Enough to refuse the obviously malformed; the real check is the reply. */
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const LIMITS = { name: 120, email: 160, subject: 80, message: 4000 };

export async function POST({ request, platform }) {
	const key = platform?.env?.RESEND_API_KEY;
	if (!key) return json({ ok: false, reason: 'unconfigured' }, { status: 503 });

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, reason: 'malformed' }, { status: 400 });
	}

	// A field no person can see and no person fills in. Answer as though it
	// had been sent: a bot that is told it failed simply tries again.
	if (body.website) return json({ ok: true });

	const name = String(body.name ?? '').trim();
	const email = String(body.email ?? '').trim();
	const subject = String(body.subject ?? '').trim();
	const message = String(body.message ?? '').trim();

	if (!name || !email || !message) return json({ ok: false, reason: 'missing' }, { status: 400 });
	if (!looksLikeEmail(email)) return json({ ok: false, reason: 'email' }, { status: 400 });
	for (const [field, max] of Object.entries(LIMITS)) {
		if (({ name, email, subject, message })[field].length > max) {
			return json({ ok: false, reason: 'length', field }, { status: 400 });
		}
	}

	// The studio reads Japanese, so the labels are Japanese whatever the
	// reader was shown.
	const text = [
		`お名前：${name}`,
		`メールアドレス：${email}`,
		`ご用件：${subject || '—'}`,
		'',
		message
	].join('\n');

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			from: FROM,
			to: [TO],
			reply_to: email,
			subject: `SUI scent studio｜${subject || 'お問い合わせ'}`,
			text
		})
	});

	if (!res.ok) {
		// the reason is for the log, never for the reader
		console.error('resend', res.status, await res.text().catch(() => ''));
		return json({ ok: false, reason: 'send' }, { status: 502 });
	}

	return json({ ok: true });
}
