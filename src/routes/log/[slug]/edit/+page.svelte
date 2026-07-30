<script>
	import { downscaleImage } from '$lib/log/image.js';
	import EditorHead from '$lib/log/EditorHead.svelte';
	export let data;

	let slug = data.post.slug;
	let pageTitle = data.post.title;
	let pageDate = data.post.date;
	let status = data.post.status;
	let publishedCurrent = data.post.publishedMatchesDraft;
	let blocks = data.post.blocks.map((b) => ({ ...b }));

	let saveState = 'saved'; // 'saved' | 'dirty' | 'saving'
	let openInsert = -1; // index of the insert bar whose menu is open
	let saveTimer;

	// drag reorder state
	let rowsEl;
	let dragIndex = -1;
	let dropIndex = -1;
	let pointerY = 0;
	let scrollLoop = 0;

	// delete undo (stack survives rapid multi-delete)
	let trash = [];
	let showToast = false;
	let toastTimer;

	function uid() {
		return 'b' + crypto.randomUUID().slice(0, 8);
	}

	function markDirty() {
		saveState = 'dirty';
		if (status === 'published') publishedCurrent = false;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, 1200);
	}

	// ---- block operations -------------------------------------------------

	function newBlock(type) {
		if (type === 'image') return { id: uid(), type: 'image', src: '', alt: '', caption: '' };
		return { id: uid(), type, text: '' };
	}

	function addBlock(index, type) {
		blocks = [...blocks.slice(0, index), newBlock(type), ...blocks.slice(index)];
		openInsert = -1;
		markDirty();
	}

	function duplicateBlock(i) {
		const copy = { ...blocks[i], id: uid() };
		blocks = [...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)];
		markDirty();
	}

	function removeBlock(i) {
		trash = [...trash, { block: blocks[i], index: i }];
		blocks = blocks.filter((_, idx) => idx !== i);
		showToast = true;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			showToast = false;
			trash = [];
		}, 6000);
		markDirty();
	}

	function undoRemove() {
		const last = trash[trash.length - 1];
		if (!last) return;
		trash = trash.slice(0, -1);
		const i = Math.min(last.index, blocks.length);
		blocks = [...blocks.slice(0, i), last.block, ...blocks.slice(i)];
		if (!trash.length) showToast = false;
		markDirty();
	}

	function moveBlock(i, dir) {
		const j = i + dir;
		if (j < 0 || j >= blocks.length) return;
		const next = blocks.slice();
		[next[i], next[j]] = [next[j], next[i]];
		blocks = next;
		markDirty();
	}

	// ---- drag reorder (pointer events; works for touch via touch-action) --

	function startDrag(i, e) {
		if (e.button !== undefined && e.button !== 0) return;
		e.preventDefault();
		openInsert = -1;
		dragIndex = i;
		dropIndex = i;
		pointerY = e.clientY;
		document.body.classList.add('drag-select-lock');
		window.addEventListener('pointermove', onDragMove);
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', cancelDrag);
		scrollTick();
	}

	function onDragMove(e) {
		pointerY = e.clientY;
		updateDrop();
	}

	function updateDrop() {
		if (!rowsEl) return;
		const rows = [...rowsEl.querySelectorAll('.row')];
		let idx = rows.length;
		for (let j = 0; j < rows.length; j++) {
			const r = rows[j].getBoundingClientRect();
			if (pointerY < r.top + r.height / 2) {
				idx = j;
				break;
			}
		}
		dropIndex = idx;
	}

	function scrollTick() {
		if (dragIndex === -1) return;
		const MARGIN = 110;
		const STEP = 14;
		if (pointerY < MARGIN) window.scrollBy(0, -STEP);
		else if (pointerY > window.innerHeight - MARGIN) window.scrollBy(0, STEP);
		updateDrop();
		scrollLoop = requestAnimationFrame(scrollTick);
	}

	function endDrag() {
		const from = dragIndex;
		let to = dropIndex;
		cleanupDrag();
		if (from === -1 || to === -1) return;
		if (to === from || to === from + 1) return; // dropped onto itself
		const next = blocks.slice();
		const [item] = next.splice(from, 1);
		if (to > from) to -= 1;
		next.splice(to, 0, item);
		blocks = next;
		markDirty();
	}

	function cancelDrag() {
		cleanupDrag();
	}

	function cleanupDrag() {
		cancelAnimationFrame(scrollLoop);
		window.removeEventListener('pointermove', onDragMove);
		window.removeEventListener('pointerup', endDrag);
		window.removeEventListener('pointercancel', cancelDrag);
		document.body.classList.remove('drag-select-lock');
		dragIndex = -1;
		dropIndex = -1;
	}

	// ---- images ------------------------------------------------------------

	function setUploading(id, val) {
		blocks = blocks.map((b) => (b.id === id ? { ...b, _uploading: val } : b));
	}

	async function uploadOne(file) {
		const blob = await downscaleImage(file);
		const fd = new FormData();
		fd.append('file', blob, 'upload.' + (blob.type.split('/')[1] || 'jpg'));
		fd.append('slug', slug);
		const res = await fetch('/log/api/upload', { method: 'POST', body: fd });
		if (!res.ok) throw new Error('upload failed');
		return (await res.json()).src;
	}

	// Multiple selection: first file fills this block, the rest become new
	// image blocks inserted right after it.
	async function onImagePick(i, event) {
		const files = [...(event.target.files ?? [])];
		event.target.value = '';
		if (!files.length) return;
		const id = blocks[i].id;
		const srcs = [];
		let done = 0;
		setUploading(id, `0/${files.length}`);
		for (const f of files) {
			try {
				srcs.push(await uploadOne(f));
			} catch {
				// counted below via srcs.length
			}
			done += 1;
			setUploading(id, `${done}/${files.length}`);
		}
		setUploading(id, null);

		const at = blocks.findIndex((b) => b.id === id);
		if (at === -1) return; // block was deleted while uploading
		if (!srcs.length) {
			alert('画像のアップロードに失敗しました');
			return;
		}
		if (srcs.length < files.length) {
			alert(`${files.length - srcs.length}枚のアップロードに失敗しました`);
		}
		const next = blocks.slice();
		next[at] = { ...next[at], src: srcs[0] };
		const extra = srcs.slice(1).map((src) => ({ id: uid(), type: 'image', src, alt: '', caption: '' }));
		next.splice(at + 1, 0, ...extra);
		blocks = next;
		markDirty();
	}

	// ---- persistence -------------------------------------------------------

	function sanitize() {
		return blocks.map((b) => {
			if (b.type === 'image')
				return { id: b.id, type: 'image', src: b.src, alt: b.alt ?? '', caption: b.caption ?? '' };
			return { id: b.id, type: b.type, text: b.text ?? '' };
		});
	}

	async function save() {
		clearTimeout(saveTimer);
		saveState = 'saving';
		const res = await fetch('/log/api/save', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ slug, title: pageTitle, date: pageDate, blocks: sanitize() })
		});
		saveState = res.ok ? 'saved' : 'dirty';
	}

	async function publish() {
		clearTimeout(saveTimer);
		saveState = 'saving';
		const res = await fetch('/log/api/publish', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ slug, title: pageTitle, date: pageDate, blocks: sanitize() })
		});
		if (res.ok) {
			status = 'published';
			publishedCurrent = true;
			saveState = 'saved';
		} else {
			saveState = 'dirty';
		}
	}

	function closeMore() {
		document.querySelector('details.more')?.removeAttribute('open');
	}

	async function unpublishPage() {
		closeMore();
		if (!confirm('公開を停止して下書きに戻しますか？')) return;
		const res = await fetch('/log/api/unpublish', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ slug })
		});
		if (res.ok) {
			status = 'draft';
			publishedCurrent = false;
		}
	}

	async function deletePage() {
		closeMore();
		if (!confirm('このページを完全に削除しますか？（アップロードした画像も削除されます）')) return;
		const res = await fetch('/log/api/delete', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ slug })
		});
		if (res.ok) location.href = '/log/edit';
	}

	// ---- misc UX -----------------------------------------------------------

	// textarea auto-grow (measure after layout settles to avoid overshoot)
	function autogrow(node) {
		const fit = () => {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		};
		requestAnimationFrame(fit);
		node.addEventListener('input', fit);
		window.addEventListener('resize', fit);
		return {
			destroy() {
				node.removeEventListener('input', fit);
				window.removeEventListener('resize', fit);
			}
		};
	}

	function onKeydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			save();
		}
	}

	function onBeforeUnload(e) {
		if (saveState !== 'saved') {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	const saveLabel = { saved: '保存済み', dirty: '未保存', saving: '保存中…' };
</script>

<EditorHead />
<svelte:head><title>{pageTitle || 'untitled'} — 編集</title></svelte:head>
<svelte:window on:keydown={onKeydown} on:beforeunload={onBeforeUnload} />

<div class="bar">
	<a class="back" href="/log/edit">← 一覧</a>
	<input class="bar-title" bind:value={pageTitle} on:input={markDirty} placeholder="ページタイトル" />
	<details class="more">
		<summary aria-label="その他の操作">⋯</summary>
		<div class="pop">
			{#if status === 'published'}
				<button on:click={unpublishPage}>下書きに戻す</button>
			{/if}
			<button class="danger" on:click={deletePage}>ページを削除</button>
		</div>
	</details>
	<span class="bar-break"></span>
	<input class="bar-date" type="date" bind:value={pageDate} on:input={markDirty} />
	<span class="state {saveState}">{saveLabel[saveState]}</span>
	<span class="badge {status === 'published' ? (publishedCurrent ? 'published' : 'pending') : 'draft'}">
		{status === 'published' ? (publishedCurrent ? '公開中' : '未反映あり') : '下書き'}
	</span>
	<span class="spacer"></span>
	<button class="ghost" on:click={save}>保存</button>
	<button class="primary" on:click={publish}>公開</button>
	<a class="view" href="/log/{slug}" target="_blank">見る ↗</a>
</div>

<section class="canvas">
	<div class="wrapper" bind:this={rowsEl}>
		{@render insertBar(0)}

		{#each blocks as block, i (block.id)}
			<div class="row" class:dragging={dragIndex === i}>
				<div class="controls">
					<button
						class="handle"
						title="ドラッグで移動"
						aria-label="ドラッグで移動"
						on:pointerdown={(e) => startDrag(i, e)}>⠿</button>
					<button title="上へ" aria-label="上へ" on:click={() => moveBlock(i, -1)} disabled={i === 0}>↑</button>
					<button
						title="下へ"
						aria-label="下へ"
						on:click={() => moveBlock(i, 1)}
						disabled={i === blocks.length - 1}>↓</button>
					<button title="複製" aria-label="複製" on:click={() => duplicateBlock(i)}>⧉</button>
					<button title="削除" aria-label="削除" class="del" on:click={() => removeBlock(i)}>✕</button>
				</div>

				<div class="field">
					{#if block.type === 'title'}
						<input class="f-title serif" bind:value={block.text} on:input={markDirty} placeholder="タイトル" />
					{:else if block.type === 'text'}
						<textarea
							class="f-text"
							bind:value={block.text}
							on:input={markDirty}
							use:autogrow
							placeholder="本文を入力"></textarea>
					{:else if block.type === 'image'}
						<div class="f-image">
							{#if block.src}
								<img src={block.src} alt={block.alt ?? ''} />
							{:else}
								<div class="ph">{block._uploading ? `アップロード中… ${block._uploading}` : '画像なし'}</div>
							{/if}
							<div class="img-actions">
								<label class="upload">
									{block.src ? '差し替え / 追加' : '画像を選ぶ'}
									<input
										type="file"
										accept="image/*"
										multiple
										on:change={(e) => onImagePick(i, e)}
										hidden />
								</label>
								{#if block.src && block._uploading}
									<span class="up-note">アップロード中 {block._uploading}</span>
								{/if}
							</div>
							{#if block.src}
								<input
									class="f-caption"
									bind:value={block.caption}
									on:input={markDirty}
									placeholder="キャプション（任意）" />
								<input
									class="f-alt"
									bind:value={block.alt}
									on:input={markDirty}
									placeholder="代替テキスト（任意）" />
							{/if}
						</div>
					{/if}
				</div>
			</div>

			{@render insertBar(i + 1)}
		{/each}
	</div>
</section>

{#if showToast}
	<div class="toast">
		<span>ブロックを削除しました</span>
		<button on:click={undoRemove}>元に戻す</button>
	</div>
{/if}

{#snippet insertBar(index)}
	<div class="insert" class:drop-hint={dragIndex !== -1 && dropIndex === index}>
		{#if dragIndex !== -1}
			<!-- drop indicator line rendered via CSS -->
		{:else if openInsert === index}
			<div class="menu">
				<button on:click={() => addBlock(index, 'title')}>タイトル</button>
				<button on:click={() => addBlock(index, 'text')}>文章</button>
				<button on:click={() => addBlock(index, 'image')}>画像</button>
				<button class="x" on:click={() => (openInsert = -1)}>×</button>
			</div>
		{:else}
			<button class="plus" on:click={() => (openInsert = index)} aria-label="ブロックを追加">＋</button>
		{/if}
	</div>
{/snippet}

<style>
	/* dynamic class toggled from JS — keep :global so Svelte doesn't drop it */
	:global(body.drag-select-lock) {
		user-select: none;
		-webkit-user-select: none;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: calc(0.9rem + env(safe-area-inset-top)) calc(var(--padding) + env(safe-area-inset-right))
			0.9rem calc(var(--padding) + env(safe-area-inset-left));
		background: rgba(251, 251, 250, 0.92);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid #eee;
		flex-wrap: wrap;
	}
	.bar .back,
	.bar .view {
		font-size: 1.05rem;
		color: var(--subColor);
		white-space: nowrap;
	}
	.bar-title {
		flex: 1 1 auto;
		min-width: 6rem;
		font-size: 1.3rem;
		border-bottom: 1px solid transparent;
	}
	.bar-title:focus {
		border-bottom-color: #ddd;
	}
	.bar-date {
		font-size: 1rem;
		color: var(--subColor);
	}
	.state {
		font-size: 0.9rem;
		color: var(--subColor);
		white-space: nowrap;
	}
	.state.dirty {
		color: #b58a3a;
	}
	.badge {
		font-size: 0.85rem;
		padding: 0.15rem 0.5rem;
		border-radius: 2px;
		white-space: nowrap;
	}
	.badge.published {
		background: #edf2ee;
		color: #4a6b52;
	}
	.badge.draft {
		background: #f2efe9;
		color: #8a7a5a;
	}
	.badge.pending {
		background: #f6ead9;
		color: #9a6b2f;
	}
	.bar button {
		font-size: 1.05rem;
		padding: 0.35rem 0.9rem;
		border-radius: 3px;
		cursor: pointer;
		white-space: nowrap;
	}
	.bar .ghost {
		border: 1px solid #ddd;
		color: var(--textColor);
	}
	.bar .primary {
		background: var(--blackColor);
		color: #fff;
	}
	.spacer {
		display: none;
	}

	/* overflow menu */
	.more {
		position: relative;
		order: 10;
	}
	.more summary {
		list-style: none;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
		padding: 0.2rem 0.6rem;
		color: var(--subColor);
	}
	.more summary::-webkit-details-marker {
		display: none;
	}
	.more .pop {
		position: absolute;
		right: 0;
		top: calc(100% + 0.4rem);
		background: #fff;
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 0.4rem;
		display: flex;
		flex-direction: column;
		min-width: 15rem;
		z-index: 60;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	}
	.more .pop button {
		text-align: left;
		padding: 0.8rem 1rem;
		font-size: 1.15rem;
		cursor: pointer;
		border-radius: 3px;
	}
	.more .pop button:hover {
		background: #f6f5f3;
	}
	.more .pop .danger {
		color: #c0392b;
	}
	.bar-break {
		display: none;
	}

	.canvas {
		max-width: 46rem;
		margin: 0 auto;
		padding-top: 4rem;
		padding-bottom: calc(12rem + env(safe-area-inset-bottom));
	}

	.row {
		position: relative;
	}
	.row.dragging {
		opacity: 0.35;
	}

	/* overlay controls, so the body layout is never disturbed (desktop) */
	.controls {
		position: absolute;
		left: -3.2rem;
		top: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.row:hover .controls,
	.row:focus-within .controls {
		opacity: 1;
	}
	.controls button {
		width: 2.4rem;
		height: 2rem;
		font-size: 1rem;
		color: var(--subColor);
		cursor: pointer;
	}
	.controls .del:hover {
		color: #c0392b;
	}
	.handle {
		cursor: grab;
		touch-action: none;
		-webkit-touch-callout: none;
	}
	.handle:active {
		cursor: grabbing;
	}

	.field {
		width: 100%;
	}
	/* editable fields visually mirror the public BlockRenderer output:
	   transparent + borderless so typing feels in-place, with a faint
	   focus wash to signal editability */
	.f-title,
	.f-text,
	.f-caption,
	.f-alt {
		background: transparent;
		border: none;
		border-radius: 3px;
		transition: background 0.15s;
	}
	.f-title:hover,
	.f-text:hover,
	.f-caption:hover,
	.f-alt:hover {
		background: rgba(0, 0, 0, 0.02);
	}
	.f-title:focus,
	.f-text:focus,
	.f-caption:focus,
	.f-alt:focus {
		background: rgba(0, 0, 0, 0.03);
	}
	.f-title {
		width: 100%;
		font-size: 1.8rem;
		line-height: 1.4;
		letter-spacing: 0.05em;
	}
	.f-text {
		display: block;
		width: 100%;
		resize: none;
		overflow: hidden;
		min-height: 1.7em;
		line-height: 1.7;
		font-size: 1.3rem;
		color: var(--textColor);
	}
	.f-image img {
		width: 100%;
		height: auto;
		display: block;
	}
	.f-image .ph {
		width: 100%;
		aspect-ratio: 4 / 3;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f1efec;
		color: var(--subColor);
		font-size: 1.1rem;
	}
	.img-actions {
		margin-top: 0.5rem;
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}
	.upload {
		font-size: 1rem;
		color: var(--blackColor);
		cursor: pointer;
		border-bottom: 1px solid #ccc;
		padding-bottom: 1px;
	}
	.up-note {
		font-size: 1rem;
		color: var(--subColor);
	}
	.f-caption {
		display: block;
		width: 100%;
		margin-top: 0.6rem;
		font-size: 1rem;
		color: var(--subColor);
		text-align: right;
	}
	.f-alt {
		display: block;
		width: 100%;
		margin-top: 0.2rem;
		font-size: 0.95rem;
		color: var(--subColor);
	}

	.insert {
		position: relative;
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
		min-height: 2.4rem;
	}
	.insert.drop-hint::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		background: var(--blackColor);
	}
	.plus {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		color: var(--subColor);
		font-size: 1.1rem;
		cursor: pointer;
		opacity: 0.35;
		transition: opacity 0.2s;
	}
	.insert:hover .plus {
		opacity: 1;
	}
	.menu {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}
	.menu button {
		font-size: 1.05rem;
		padding: 0.3rem 0.9rem;
		border: 1px solid #e2e0dc;
		border-radius: 3px;
		cursor: pointer;
	}
	.menu .x {
		border: none;
		color: var(--subColor);
	}

	.toast {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: calc(1.6rem + env(safe-area-inset-bottom));
		background: var(--blackColor);
		color: #fff;
		display: flex;
		gap: 1.2rem;
		align-items: center;
		padding: 0.9rem 1.4rem;
		border-radius: 4px;
		z-index: 80;
	}
	.toast span {
		color: #fff;
		font-size: 1.1rem;
	}
	.toast button {
		color: #fff;
		text-decoration: underline;
		font-size: 1.1rem;
		cursor: pointer;
	}

	/* touch devices: no hover — keep controls visible, in-flow above the block */
	@media (hover: none) {
		.controls {
			position: static;
			flex-direction: row;
			justify-content: flex-end;
			gap: 0.4rem;
			opacity: 0.55;
			margin-bottom: 0.3rem;
		}
		.controls button {
			width: 3.6rem;
			height: 3rem;
			font-size: 1.2rem;
		}
		.plus {
			width: 3.2rem;
			height: 3.2rem;
			opacity: 0.5;
		}
		.insert {
			min-height: 3.6rem;
		}
	}

	/* narrow screens: bar wraps into two rows */
	@media (max-width: 719px) {
		.bar-break {
			display: block;
			flex-basis: 100%;
			height: 0;
		}
		.spacer {
			display: block;
			flex: 1;
		}
		.more {
			order: 0;
		}
		.canvas {
			padding-left: var(--padding);
			padding-right: var(--padding);
		}
	}
</style>
