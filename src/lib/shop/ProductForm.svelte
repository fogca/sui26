<script>
	// Shared product form for create/edit. Images upload immediately to R2;
	// the form submits their URLs as JSON in a hidden field.
	import { enhance } from '$app/forms';
	import { downscaleImage } from '$lib/log/image.js';

	export let product = null; // null = new
	export let form = null; // action result (validation errors)

	let name = form?.values?.name ?? product?.name ?? '';
	let slug = form?.values?.slug ?? product?.slug ?? '';
	let spec = form?.values?.spec ?? product?.spec ?? '';
	let price = form?.values?.price ?? product?.price ?? '';
	let stock = form?.values?.stock ?? product?.stock ?? 0;
	let status = form?.values?.status ?? product?.status ?? 'draft';
	let description = form?.values?.description ?? product?.description ?? '';
	let images = product?.images ? [...product.images] : [];
	let uploading = false;

	function slugify() {
		if (!slug && name) {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
		}
	}

	async function onPick(event) {
		const files = [...(event.target.files ?? [])];
		event.target.value = '';
		if (!files.length) return;
		uploading = true;
		for (const f of files) {
			try {
				const blob = await downscaleImage(f);
				const fd = new FormData();
				fd.append('file', blob, 'p.' + (blob.type.split('/')[1] || 'jpg'));
				fd.append('slug', slug || 'misc');
				const res = await fetch('/shop/api/admin/upload', { method: 'POST', body: fd });
				if (res.ok) {
					const { src } = await res.json();
					images = [...images, src];
				}
			} catch {
				alert('アップロードに失敗しました');
			}
		}
		uploading = false;
	}

	function removeImage(i) {
		images = images.filter((_, idx) => idx !== i);
	}

	function moveImage(i, dir) {
		const j = i + dir;
		if (j < 0 || j >= images.length) return;
		const next = [...images];
		[next[i], next[j]] = [next[j], next[i]];
		images = next;
	}
</script>

<form method="POST" use:enhance class="pform">
	<input type="hidden" name="images" value={JSON.stringify(images)} />

	<div class="grid">
		<label class="span2">
			<span>商品名</span>
			<input name="name" bind:value={name} on:blur={slugify} required placeholder="蕊 SUI Eau de Parfum" />
		</label>

		<label>
			<span>slug（URL）</span>
			<input name="slug" bind:value={slug} required placeholder="sui-eau-de-parfum" />
		</label>

		<label>
			<span>仕様（容量など）</span>
			<input name="spec" bind:value={spec} placeholder="50ml" />
		</label>

		<label>
			<span>価格（税込・円）</span>
			<input name="price" type="number" min="0" step="1" bind:value={price} required />
		</label>

		<label>
			<span>在庫数</span>
			<input name="stock" type="number" min="0" step="1" bind:value={stock} required />
		</label>

		<label class="span2">
			<span>商品説明</span>
			<textarea name="description" rows="6" bind:value={description}></textarea>
		</label>

		<div class="span2">
			<span class="lbl">画像（1枚目がメイン）</span>
			<div class="imgs">
				{#each images as img, i}
					<div class="img">
						<img src={img} alt="" />
						<div class="img-ops">
							<button type="button" on:click={() => moveImage(i, -1)} disabled={i === 0}>←</button>
							<button type="button" on:click={() => moveImage(i, 1)} disabled={i === images.length - 1}>→</button>
							<button type="button" class="rm" on:click={() => removeImage(i)}>✕</button>
						</div>
					</div>
				{/each}
				<label class="add-img">
					{uploading ? '…' : '＋'}
					<input type="file" accept="image/*" multiple hidden on:change={onPick} />
				</label>
			</div>
		</div>

		<label>
			<span>公開状態</span>
			<select name="status" bind:value={status}>
				<option value="draft">下書き</option>
				<option value="published">公開</option>
			</select>
		</label>
	</div>

	{#if form?.error}<p class="err">{form.error}</p>{/if}

	<div class="actions">
		<a href="/shop/edit/products" class="cancel">← 一覧へ</a>
		<button type="submit" class="save" disabled={uploading}>保存</button>
	</div>
</form>

<style>
	.pform {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.8rem;
	}
	label,
	.span2 {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	label span,
	.lbl {
		font-size: 1rem;
		color: var(--subColor);
	}
	input,
	textarea,
	select {
		border: 1px solid #ddd;
		padding: 0.8rem;
		font-size: 1.25rem;
		background: #fff;
		border-radius: 2px;
	}
	textarea {
		resize: vertical;
		line-height: 1.8;
	}
	.imgs {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.5rem;
	}
	.img {
		position: relative;
		width: 10rem;
	}
	.img img {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}
	.img-ops {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		margin-top: 0.4rem;
	}
	.img-ops button {
		font-size: 1rem;
		color: var(--subColor);
		cursor: pointer;
		padding: 0.2rem 0.5rem;
	}
	.img-ops .rm:hover {
		color: #c0392b;
	}
	.add-img {
		width: 10rem;
		aspect-ratio: 4 / 5;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed #ccc;
		font-size: 2rem;
		color: var(--subColor);
		cursor: pointer;
	}
	.err {
		color: #c0392b;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.cancel {
		color: var(--subColor);
		font-size: 1.1rem;
	}
	.save {
		background: var(--blackColor);
		color: #fff;
		padding: 0.9rem 2.8rem;
		font-size: 1.2rem;
		cursor: pointer;
		border-radius: 3px;
	}
	.save:disabled {
		opacity: 0.5;
	}

	@media screen and (min-width: 720px) {
		.grid {
			grid-template-columns: 1fr 1fr;
		}
		.span2 {
			grid-column: span 2;
		}
	}
</style>
