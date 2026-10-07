<script>
	// Shared product form for create / edit.
	//
	// Images upload to R2 the moment they are picked; the form only submits
	// their URLs as JSON in a hidden field. Everything else is plain form data
	// so the screen still works with JavaScript off — `use:enhance` only adds
	// the saving state and keeps typed values on a rejected submit.
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { downscaleImage } from '$lib/log/image.js';
	import { yen } from '$lib/shop/money.js';
	import { FIELD, ITEM_STATUS, NOUN } from '$lib/shop/vocab.js';
	import Section from '$lib/admin/Section.svelte';
	import Field from '$lib/admin/Field.svelte';

	export let product = null; // null = 新規
	export let form = null; // action result: { error, errors, values } or { ok, at }
	export let action = ''; // '' = default action, '?/save' on the edit screen
	export let categories = []; // existing categories, offered as a datalist
	export let onSaved = null; // called after a save the server accepted

	const DEFAULT_MAX_PER_ORDER = 9;
	const MAX_IMAGES = 12;
	// Mirrors the limits enforced in validate.js (STORES' own item limits), so
	// the browser stops a bad value before it costs a round trip.
	const MAX_NAME = 100;
	const MAX_PRICE = 2000000;
	const MAX_STOCK = 9999;
	const STATUS_OPTIONS = Object.entries(ITEM_STATUS).map(([key, s]) => ({ key, label: s.label }));
	// JST, matching how every other date in the shop is rendered
	const stamp = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	// Initial values: a rejected submit (no JS) wins over the stored product.
	const v = form?.values ?? null;
	// 0 is how "not recorded" is stored for cost / weight — show the field empty
	// rather than a zero the owner never typed.
	const blankZero = (n) => (n === 0 || n === '0' ? '' : (n ?? ''));

	let name = v?.name ?? product?.name ?? '';
	let slug = v?.slug ?? product?.slug ?? '';
	let spec = v?.spec ?? product?.spec ?? '';
	let sku = v?.sku ?? product?.sku ?? '';
	let barcode = v?.barcode ?? product?.barcode ?? '';
	let category = v?.category ?? product?.category ?? '';
	let tagsText = (v?.tags ?? product?.tags ?? []).join(', ');
	let price = v?.price ?? product?.price ?? '';
	let cost = blankZero(v?.cost ?? product?.cost);
	let stock = v?.stock ?? product?.stock ?? 0;
	let maxPerOrder = v?.max_per_order ?? product?.max_per_order ?? DEFAULT_MAX_PER_ORDER;
	let description = v?.description ?? product?.description ?? '';
	let weightG = blankZero(v?.weight_g ?? product?.weight_g);
	let seoTitle = v?.seo_title ?? product?.seo_title ?? '';
	let seoDescription = v?.seo_description ?? product?.seo_description ?? '';
	let status = v?.status ?? product?.status ?? 'draft';
	let sortOrder = v?.sort_order ?? product?.sort_order ?? 0;
	let images = [...(v?.images ?? product?.images ?? [])];

	let uploading = false;
	let uploadError = '';
	let slugNotice = '';
	let saving = false;
	let savedAt = form?.ok ? (form.at ?? null) : null;
	let formEl = null;

	$: errors = form?.errors ?? {};
	$: errorCount = Object.keys(errors).length;
	// The banner points at the red fields rather than repeating one of them.
	$: topError = errorCount
		? `入力内容をご確認ください（${errorCount}件）。赤字の項目を直すと保存できます。`
		: (form?.error ?? '');

	// Gross profit is only meaningful once a cost is on file.
	$: priceNum = Number(price);
	$: costNum = Number(cost);
	$: hasCost = Number.isFinite(costNum) && costNum > 0 && Number.isFinite(priceNum) && priceNum > 0;
	$: marginYen = Math.round(priceNum - costNum);
	$: marginRate = hasCost ? Math.round((marginYen / priceNum) * 1000) / 10 : 0;

	$: publishedLabel = product?.published_at ? stamp.format(new Date(product.published_at)) : '';

	function toSlug(text) {
		return String(text)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function generateSlug() {
		const next = toSlug(name);
		if (!next) {
			slugNotice = `${FIELD.itemName}から自動生成できませんでした。半角英数字を含めて入力してください。`;
			return;
		}
		slug = next;
		slugNotice = '';
		touch();
	}

	// Any edit invalidates the "保存しました" line — it must never describe stale state.
	function touch() {
		savedAt = null;
	}

	async function onPick(event) {
		const files = [...(event.target.files ?? [])];
		event.target.value = '';
		if (!files.length) return;
		uploadError = '';
		touch();
		const room = MAX_IMAGES - images.length;
		if (room <= 0) {
			uploadError = `画像は${MAX_IMAGES}枚までです。`;
			return;
		}
		const queue = files.slice(0, room);
		if (files.length > room) uploadError = `画像は${MAX_IMAGES}枚まで。${room}枚だけ追加します。`;

		uploading = true;
		for (const f of queue) {
			try {
				const blob = await downscaleImage(f);
				const fd = new FormData();
				fd.append('file', blob, 'p.' + (blob.type.split('/')[1] || 'jpg'));
				fd.append('slug', slug || 'misc');
				const res = await fetch('/shop/api/admin/upload', { method: 'POST', body: fd });
				if (!res.ok) throw new Error(String(res.status));
				const { src } = await res.json();
				images = [...images, src];
			} catch {
				uploadError = `「${f.name}」をアップロードできませんでした。もう一度お試しください。`;
			}
		}
		uploading = false;
	}

	function removeImage(i) {
		if (!confirm(`この画像をこの${NOUN.item}から外します。よろしいですか？`)) return;
		images = images.filter((_, idx) => idx !== i);
		uploadError = '';
		touch();
	}

	function moveImage(i, dir) {
		const j = i + dir;
		if (j < 0 || j >= images.length) return;
		const next = [...images];
		[next[i], next[j]] = [next[j], next[i]];
		images = next;
		touch();
	}

	function submit() {
		saving = true;
		return async ({ result, update }) => {
			// reset:false — the bound values are the truth; a native form reset
			// would put stale attribute values back into the DOM.
			await update({ reset: false });
			saving = false;
			if (result?.type === 'success') {
				savedAt = result.data?.at ?? new Date().toISOString();
				if (onSaved) onSaved();
			} else {
				savedAt = null;
			}
			if (result?.type === 'failure') {
				// the offending field may be far above the button that was clicked
				await tick();
				formEl?.querySelector('.field.invalid')?.scrollIntoView({ block: 'center' });
			}
		};
	}
</script>

<form
	method="POST"
	{action}
	use:enhance={submit}
	on:input={touch}
	class="pform"
	bind:this={formEl}
>
	<input type="hidden" name="images" value={JSON.stringify(images)} />

	<Section title="基本情報">
		<div class="pf-grid">
			<div class="pf-full">
				<Field
					label={FIELD.itemName}
					required
					hint="{MAX_NAME}文字以内。お客さまに見える名前です。"
					error={errors.name ?? ''}
				>
					<input
						class="a-input"
						name="name"
						bind:value={name}
						required
						maxlength={MAX_NAME}
						placeholder="蕊 SUI Eau de Parfum"
					/>
				</Field>
			</div>

			<div class="pf-full">
				<Field
					label="slug（URL）"
					required
					error={errors.slug ?? ''}
					hint="公開ページは /shop/{slug || '…'} になります。公開後に変えると、これまでのURLは開けなくなります。"
				>
					<span class="row">
						<input
							class="a-input"
							name="slug"
							bind:value={slug}
							required
							maxlength="80"
							placeholder="sui-eau-de-parfum"
						/>
						<button class="a-btn small" type="button" on:click|preventDefault={generateSlug}>
							{FIELD.itemName}から生成
						</button>
					</span>
					{#if slugNotice}<span class="notice">{slugNotice}</span>{/if}
				</Field>
			</div>

			<Field label="仕様（容量など）" error={errors.spec ?? ''}>
				<input class="a-input" name="spec" bind:value={spec} maxlength="60" placeholder="50ml" />
			</Field>

			<Field
				label={FIELD.sku}
				hint="管理用の番号です。他のアイテムと重複しないようにしてください。空欄でも構いません。"
				error={errors.sku ?? ''}
			>
				<input class="a-input" name="sku" bind:value={sku} maxlength="64" placeholder="SUI-EDP-50" />
			</Field>

			<Field
				label={FIELD.barcode}
				hint="JANコードなどをお持ちの場合に入力します。空欄で構いません。"
				error={errors.barcode ?? ''}
			>
				<input
					class="a-input"
					name="barcode"
					bind:value={barcode}
					maxlength="32"
					inputmode="numeric"
					placeholder="4901234567894"
				/>
			</Field>

			<Field label="カテゴリ" hint="既存のカテゴリから選ぶか、新しく入力できます。" error={errors.category ?? ''}>
				<input
					class="a-input"
					name="category"
					list="pf-categories"
					bind:value={category}
					maxlength="40"
					placeholder="fragrance"
				/>
			</Field>

			<Field
				label={FIELD.adminTags}
				hint="購入者には表示されません。ご自身の整理用です。カンマ区切りで最大10個・全体で100文字以内。"
				error={errors.tags ?? ''}
			>
				<input class="a-input" name="tags" bind:value={tagsText} placeholder="木質, 春, ギフト" />
			</Field>

			<datalist id="pf-categories">
				{#each categories as c (c)}<option value={c}></option>{/each}
			</datalist>
		</div>
	</Section>

	<Section title="価格と在庫">
		<div class="pf-grid">
			<Field
				label="{FIELD.price}（税込・円）"
				required
				hint="0 〜 2,000,000 円"
				error={errors.price ?? ''}
			>
				<input
					class="a-input"
					name="price"
					type="number"
					inputmode="numeric"
					min="0"
					max={MAX_PRICE}
					step="1"
					bind:value={price}
					required
				/>
			</Field>

			<Field
				label="{FIELD.cost}（円）"
				hint="任意。入力すると粗利を計算します。"
				error={errors.cost ?? ''}
			>
				<input
					class="a-input"
					name="cost"
					type="number"
					inputmode="numeric"
					min="0"
					step="1"
					bind:value={cost}
					placeholder="0"
				/>
			</Field>

			<div class="pf-full">
				{#if hasCost}
					<p class="margin" class:negative={marginYen < 0}>
						粗利 <b>{marginYen < 0 ? '-' + yen(-marginYen) : yen(marginYen)}</b><span class="sep"
						>/</span
						>粗利率 <b>{marginRate}%</b>
						{#if marginYen < 0}<span class="warn">原価が価格を上回っています</span>{/if}
					</p>
				{:else}
					<p class="margin muted">原価を入力すると、粗利と粗利率をここに表示します。</p>
				{/if}
			</div>

			<Field label={FIELD.stock} required hint="9,999 個まで" error={errors.stock ?? ''}>
				<input
					class="a-input"
					name="stock"
					type="number"
					inputmode="numeric"
					min="0"
					max={MAX_STOCK}
					step="1"
					bind:value={stock}
					required
				/>
			</Field>

			<Field
				label="1注文あたり上限"
				hint="1回の注文で買える最大数（1〜99）。既定は9です。"
				error={errors.max_per_order ?? ''}
			>
				<input
					class="a-input"
					name="max_per_order"
					type="number"
					inputmode="numeric"
					min="1"
					max="99"
					step="1"
					bind:value={maxPerOrder}
				/>
			</Field>
		</div>
	</Section>

	<Section title={FIELD.itemDesc}>
		<Field
			label={FIELD.itemDesc}
			required
			hint="公開ページでは改行が保持されます。"
			error={errors.description ?? ''}
		>
			<textarea class="a-textarea" name="description" rows="10" bind:value={description} required
			></textarea>
		</Field>
	</Section>

	<Section title="アイテム画像" desc="1枚目がメイン画像です。一覧・バッグ・OGP に使われます。">
		<div class="imgs">
			{#each images as img, i}
				<div class="img">
					<div class="frame">
						<img src={img} alt="" />
						{#if i === 0}<span class="main-tag">メイン</span>{/if}
					</div>
					<div class="img-ops">
						<button
							class="a-btn ghost small"
							type="button"
							title="左へ"
							on:click={() => moveImage(i, -1)}
							disabled={i === 0}>←</button
						>
						<button
							class="a-btn ghost small"
							type="button"
							title="右へ"
							on:click={() => moveImage(i, 1)}
							disabled={i === images.length - 1}>→</button
						>
						<button class="a-btn ghost small rm" type="button" on:click={() => removeImage(i)}>
							外す
						</button>
					</div>
				</div>
			{/each}

			<label class="add-img" class:busy={uploading}>
				<span>{uploading ? 'アップロード中…' : '＋ 画像を追加'}</span>
				<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading} on:change={onPick} />
			</label>
		</div>

		{#if errors.images}
			<p class="notice" role="alert">{errors.images}</p>
		{:else if images.length === 0}
			<p class="a-muted note">まだ画像がありません。1枚目に登録したものがメイン画像になります。</p>
		{/if}
		{#if uploadError}<p class="notice">{uploadError}</p>{/if}
	</Section>

	<Section title="配送情報">
		<div class="pf-grid">
			<Field label="重量（g）" hint="送料計算の参考値です。" error={errors.weight_g ?? ''}>
				<input
					class="a-input"
					name="weight_g"
					type="number"
					inputmode="numeric"
					min="0"
					step="1"
					bind:value={weightG}
					placeholder="0"
				/>
			</Field>
		</div>
	</Section>

	<Section title="SEO" desc="未入力の場合は、{FIELD.itemName}と{FIELD.itemDesc}が自動で使われます。">
		<div class="pf-grid">
			<div class="pf-full">
				<Field
					label="SEO タイトル"
					hint="未入力なら{FIELD.itemName}を使います。"
					error={errors.seo_title ?? ''}
				>
					<input class="a-input" name="seo_title" bind:value={seoTitle} maxlength="120" />
				</Field>
			</div>
			<div class="pf-full">
				<Field
					label="SEO ディスクリプション"
					hint="未入力なら{FIELD.itemDesc}の冒頭を使います。120文字前後が目安です。"
					error={errors.seo_description ?? ''}
				>
					<textarea class="a-textarea short" name="seo_description" rows="3" bind:value={seoDescription}
					></textarea>
				</Field>
			</div>
		</div>
	</Section>

	<Section title="公開設定">
		<div class="pf-grid">
			<Field
				label="公開状態"
				hint={status === 'published' ? '保存すると店頭に並びます。' : '下書きは店頭に出ません。'}
				error={errors.status ?? ''}
			>
				<select class="a-select" name="status" bind:value={status}>
					{#each STATUS_OPTIONS as s (s.key)}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</Field>

			<Field label="並び順" hint="小さいほど先に表示されます。既定は 0。" error={errors.sort_order ?? ''}>
				<input
					class="a-input"
					name="sort_order"
					type="number"
					inputmode="numeric"
					step="1"
					bind:value={sortOrder}
				/>
			</Field>

			{#if product}
				<Field label="公開日時" hint="はじめて公開したときに記録されます（変更できません）。">
					<input class="a-input" type="text" value={publishedLabel || 'まだ公開していません'} disabled />
				</Field>
			{/if}
		</div>
	</Section>

	{#if topError}
		<p class="banner err" role="alert">{topError}</p>
	{:else if savedAt}
		<p class="banner ok" role="status">保存しました（{stamp.format(new Date(savedAt))}）</p>
	{/if}

	<div class="actions">
		<a class="a-btn ghost" href="/shop/edit/products">← 一覧へ</a>
		<button class="a-btn primary" type="submit" disabled={saving || uploading}>
			{saving ? '保存中…' : uploading ? 'アップロード中…' : '保存'}
		</button>
	</div>
</form>

<style>
	.pform {
		display: block;
	}
	.pf-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem 2.4rem;
	}
	.pf-full {
		grid-column: 1 / -1;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.row :global(.a-input) {
		flex: 1 1 auto;
		min-width: 0;
	}
	.row .a-btn {
		flex: none;
	}

	.short {
		min-height: 7rem;
	}

	.notice {
		display: block;
		margin-top: 0.6rem;
		font-size: 1rem;
		line-height: 1.6;
		color: #a3453a;
	}

	/* --------------------------------------------------------- 粗利表示 --- */
	.margin {
		margin: -0.4rem 0 0;
		padding: 0.9rem 1.2rem;
		border: 1px solid var(--a-line, #eee);
		border-radius: 3px;
		background-color: #fff;
		font-size: 1.1rem;
		line-height: 1.6;
		text-align: left;
		color: var(--textColor);
	}
	.margin b {
		font-weight: 400;
		color: var(--blackColor);
		font-variant-numeric: tabular-nums;
	}
	.margin .sep {
		margin: 0 0.8rem;
		color: #ddd;
	}
	.margin.muted {
		color: var(--subColor);
		background-color: transparent;
		border-style: dashed;
		border-color: #eae7e4;
	}
	.margin.negative {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
	}
	.margin .warn {
		margin-left: 1rem;
		color: #a3453a;
	}

	/* ------------------------------------------------------------ 画像 --- */
	.imgs {
		display: flex;
		flex-wrap: wrap;
		gap: 1.6rem;
	}
	.img {
		width: 12rem;
	}
	.frame {
		position: relative;
		background-color: #f1efec;
	}
	.frame img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}
	.main-tag {
		position: absolute;
		left: 0;
		bottom: 0;
		padding: 0.35rem 0.6rem;
		font-size: 0.9rem;
		line-height: 1;
		letter-spacing: 0.06em;
		background-color: rgba(18, 18, 18, 0.82);
		color: var(--backgroundColor);
	}
	.img-ops {
		display: flex;
		justify-content: center;
		gap: 0.2rem;
		margin-top: 0.5rem;
	}
	.img-ops .rm:hover {
		color: #a3453a;
	}
	.add-img {
		width: 12rem;
		aspect-ratio: 4 / 5;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		border: 1px dashed #d8d3ce;
		border-radius: 3px;
		font-size: 1.05rem;
		line-height: 1.6;
		text-align: center;
		color: var(--subColor);
		cursor: pointer;
		transition:
			border-color 0.18s ease,
			color 0.18s ease;
	}
	.add-img:hover {
		border-color: #b9b3ad;
		color: var(--blackColor);
	}
	.add-img.busy {
		cursor: progress;
		color: var(--subColor);
	}
	.note {
		margin-top: 1.2rem;
		font-size: 1.05rem;
		line-height: 1.7;
		text-align: left;
	}

	/* -------------------------------------------------------- 保存操作 --- */
	.banner {
		margin: 0 0 1.6rem;
		padding: 1rem 1.4rem;
		border: 1px solid;
		border-radius: 3px;
		font-size: 1.1rem;
		line-height: 1.6;
		text-align: left;
	}
	.banner.err {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
		color: #a3453a;
	}
	.banner.ok {
		border-color: #d5e0d7;
		background-color: #f7faf7;
		color: #4d6b57;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		padding-top: 2.4rem;
		border-top: 1px solid var(--a-line, #eee);
	}

	@media screen and (min-width: 720px) {
		.pf-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
