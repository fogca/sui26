<script>
	// Shell for every /shop/edit screen: fixed sidebar on desktop, drawer on
	// phones. Owns the admin stylesheet so pages only import components.
	import { afterNavigate } from '$app/navigation';
	import EditorHead from '$lib/log/EditorHead.svelte';

	export let title = '';
	export let section = 'dashboard';
	export let subtitle = '';
	/** Optional counters keyed by section, e.g. { orders: 3 }. */
	export let badges = null;

	// Labels follow STORES' own menu wording (オーダー / アイテム / お客さま) so
	// the client reads this shop the same way they read the one they run today.
	const NAV = [
		{ key: 'dashboard', label: 'ホーム', href: '/shop/edit' },
		{ key: 'orders', label: 'オーダー', href: '/shop/edit/orders' },
		{ key: 'products', label: 'アイテム', href: '/shop/edit/products' },
		{ key: 'inventory', label: '在庫', href: '/shop/edit/inventory' },
		{ key: 'customers', label: 'お客さま', href: '/shop/edit/customers' },
		{ key: 'analytics', label: '分析', href: '/shop/edit/analytics' },
		{ key: 'settings', label: '設定', href: '/shop/edit/settings' }
	];

	let menuOpen = false;
	let loggingOut = false;

	// Close the drawer whenever a nav link lands.
	afterNavigate(() => {
		menuOpen = false;
	});

	function countFor(key) {
		if (!badges) return 0;
		const n = Number(badges[key]);
		return Number.isFinite(n) && n > 0 ? n : 0;
	}

	async function logout() {
		if (loggingOut) return;
		if (!confirm('ログアウトします。よろしいですか？')) return;
		loggingOut = true;
		try {
			await fetch('/log/api/logout', { method: 'POST' });
		} catch (e) {
			// Cookie clearing may fail offline; still send the user to the gate.
		}
		window.location.href = '/log/login';
	}
</script>

<EditorHead />
<svelte:head>
	<link rel="stylesheet" href="/css/admin.css?v=2" />
	<title>{title} — SUI shop</title>
</svelte:head>

<div class="admin">
	<!-- phone: fixed bar with current location + drawer toggle -->
	<header class="topbar">
		<span class="tb-title">{title}</span>
		<button
			class="burger"
			type="button"
			aria-expanded={menuOpen}
			aria-controls="admin-nav"
			on:click={() => (menuOpen = !menuOpen)}
		>
			<span class="bars" class:open={menuOpen}><i></i><i></i></span>
			<span class="sr">メニュー</span>
		</button>
	</header>

	{#if menuOpen}
		<button class="scrim" type="button" aria-label="メニューを閉じる" on:click={() => (menuOpen = false)}
		></button>
	{/if}

	<aside class="side" class:open={menuOpen} id="admin-nav">
		<a class="brand serif" href="/shop/edit">SUI <span>shop</span></a>

		<nav class="nav">
			{#each NAV as item (item.key)}
				<a
					class="nav-item"
					class:current={section === item.key}
					href={item.href}
					aria-current={section === item.key ? 'page' : undefined}
				>
					<span class="nav-label">{item.label}</span>
					{#if countFor(item.key) > 0}
						<span class="nav-count">{countFor(item.key)}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="side-foot">
			<a class="nav-item quiet" href="/shop" target="_blank" rel="noopener">店を見る ↗</a>
			<a class="nav-item quiet" href="/log/edit">log editor</a>
			<button class="nav-item quiet as-button" type="button" on:click={logout} disabled={loggingOut}>
				{loggingOut ? 'ログアウト中…' : 'ログアウト'}
			</button>
		</div>
	</aside>

	<div class="main">
		<header class="head">
			<div class="titles">
				<h1 class="serif">{title}</h1>
				{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
			</div>
			<div class="actions"><slot name="actions" /></div>
		</header>

		<div class="content"><slot /></div>
	</div>
</div>

<style>
	.admin {
		--tb-h: calc(5.4rem + env(safe-area-inset-top));
		--side-w: 22rem;
		min-height: 100vh;
		min-height: 100dvh;
		background-color: var(--backgroundColor);
	}

	/* ---------------------------------------------------------- top bar --- */
	.topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		height: var(--tb-h);
		padding: env(safe-area-inset-top) max(1.8rem, env(safe-area-inset-right)) 0
			max(1.8rem, env(safe-area-inset-left));
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		background-color: var(--backgroundColor);
		border-bottom: 1px solid #efedeb;
	}
	.tb-title {
		font-size: 1.3rem;
		color: var(--blackColor);
		letter-spacing: 0.02em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.burger {
		flex: none;
		width: 3.4rem;
		height: 3.4rem;
		margin-right: -0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.bars {
		position: relative;
		display: block;
		width: 1.8rem;
		height: 1rem;
	}
	.bars i {
		position: absolute;
		left: 0;
		width: 100%;
		height: 1px;
		background-color: var(--blackColor);
		transition:
			transform 0.24s ease,
			top 0.24s ease;
	}
	.bars i:nth-child(1) {
		top: 0;
	}
	.bars i:nth-child(2) {
		top: 100%;
	}
	.bars.open i:nth-child(1) {
		top: 50%;
		transform: rotate(45deg);
	}
	.bars.open i:nth-child(2) {
		top: 50%;
		transform: rotate(-45deg);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 45;
		background-color: rgba(18, 18, 18, 0.18);
		cursor: pointer;
	}

	/* --------------------------------------------------------- sidebar --- */
	.side {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		z-index: 50;
		width: min(28rem, 82vw);
		display: flex;
		flex-direction: column;
		gap: 2.4rem;
		padding: calc(2.8rem + env(safe-area-inset-top)) 2rem
			calc(2.8rem + env(safe-area-inset-bottom)) max(2rem, env(safe-area-inset-left));
		background-color: #f7f6f4;
		border-right: 1px solid #efedeb;
		overflow-y: auto;
		overscroll-behavior: contain;
		transform: translateX(-101%);
		transition: transform 0.26s ease;
	}
	.side.open {
		transform: translateX(0);
	}

	.brand {
		font-size: 1.5rem;
		color: var(--blackColor);
		letter-spacing: 0.12em;
		transition: opacity 0.18s ease;
	}
	.brand span {
		color: var(--subColor);
		letter-spacing: 0.12em;
	}

	.nav {
		display: flex;
		flex-direction: column;
	}
	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.95rem 0 0.95rem 1.2rem;
		font-size: 1.25rem;
		line-height: 1.4;
		letter-spacing: 0.02em;
		color: var(--textColor);
		text-align: left;
		cursor: pointer;
		transition: color 0.18s ease;
	}
	.nav-item:hover {
		opacity: 1;
		color: var(--blackColor);
	}
	/* current location: a hairline rule at the left + ink-black label */
	.nav-item.current {
		color: var(--blackColor);
	}
	.nav-item.current::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.9rem;
		bottom: 0.9rem;
		width: 1px;
		background-color: var(--blackColor);
	}
	.nav-count {
		flex: none;
		min-width: 2rem;
		padding: 0.25rem 0.5rem;
		border-radius: 2px;
		background-color: #efe6d8;
		color: #8a6224;
		font-size: 1rem;
		line-height: 1.4;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.nav-item.quiet {
		font-size: 1.1rem;
		color: var(--subColor);
		padding-top: 0.7rem;
		padding-bottom: 0.7rem;
	}
	.nav-item.quiet:hover {
		color: var(--blackColor);
	}
	.as-button {
		font-family: inherit;
	}
	.as-button[disabled] {
		opacity: 0.5;
		cursor: default;
	}

	.side-foot {
		margin-top: auto;
		padding-top: 1.6rem;
		border-top: 1px solid #e8e5e2;
		display: flex;
		flex-direction: column;
	}

	/* ------------------------------------------------------------ main --- */
	.main {
		padding-top: var(--tb-h);
		min-height: 100vh;
		min-height: 100dvh;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.2rem 2rem;
		padding: 3.2rem max(1.8rem, env(safe-area-inset-right)) 2.4rem
			max(1.8rem, env(safe-area-inset-left));
	}
	.titles {
		min-width: 0;
	}
	h1 {
		font-size: 2.2rem;
		line-height: 1.3;
		color: var(--blackColor);
	}
	.subtitle {
		margin-top: 0.5rem;
		font-size: 1.1rem;
		line-height: 1.6;
		text-align: left;
		color: var(--subColor);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem;
	}
	.content {
		padding: 0 max(1.8rem, env(safe-area-inset-right))
			calc(8rem + env(safe-area-inset-bottom)) max(1.8rem, env(safe-area-inset-left));
	}
	.head,
	.content {
		max-width: 116rem;
	}

	/* ----------------------------------------------------------- ≥900px --- */
	@media screen and (min-width: 900px) {
		.topbar,
		.scrim {
			display: none;
		}
		.side {
			width: var(--side-w);
			transform: none;
			padding-left: 2.4rem;
			padding-right: 2.4rem;
			padding-top: calc(3.6rem + env(safe-area-inset-top));
		}
		.main {
			margin-left: var(--side-w);
			padding-top: 0;
		}
		.head {
			padding: 4.8rem 4rem 3.2rem;
			align-items: baseline;
		}
		.content {
			padding: 0 4rem calc(10rem + env(safe-area-inset-bottom));
		}
		h1 {
			font-size: 2.6rem;
		}
	}
</style>
