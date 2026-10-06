<script>
	// Figma 128:260 — the opening. The field is already behind the whole site,
	// so the opening is not a curtain over it: it is the same surface with
	// nothing on it but the mark, and the page's own content arriving after.
	// That keeps the field unbroken from the first moment into the page.
	//
	// The mark is centred and full white, 149 of the frame's 393 points wide.
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// The mark's own fade-up is 1.2s in CSS below; HOLD must stay above it or
	// the opening starts leaving before the mark has finished arriving.
	const HOLD = 1900;
	const FADE = 1000;

	let gone = false;
	let fading = false;
	let timers = [];

	function release() {
		if (fading) return;
		fading = true;
		dispatch('done');
		unlock();
		timers.push(setTimeout(() => (gone = true), FADE));
	}

	function lock() {
		document.body.style.overflow = 'hidden';
	}
	function unlock() {
		document.body.style.overflow = '';
	}

	onMount(() => {
		let seen = false;
		try {
			seen = sessionStorage.getItem('sui-op') === '1';
			sessionStorage.setItem('sui-op', '1');
			// NOT data-op-seen: that flag is app.html's, set before first paint on
			// a LATER load. Setting it here would hide the opening that is
			// playing right now.
		} catch (e) {
			// private mode — the opening simply plays every time
		}
		if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			gone = true;
			dispatch('done');
			return;
		}
		lock();
		timers.push(setTimeout(release, HOLD));
		window.addEventListener('wheel', release, { passive: true, once: true });
		window.addEventListener('touchmove', release, { passive: true, once: true });
		window.addEventListener('keydown', release, { once: true });
	});

	onDestroy(() => {
		timers.forEach(clearTimeout);
		if (typeof document !== 'undefined') unlock();
	});
</script>

{#if !gone}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="opening" class:fading on:click={release}>
		<img class="mark" src="/ii/symbol-white.svg" alt="SUI" width="151" height="126" />
	</div>
{/if}

<style>
	.opening {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 1s ease;
	}
	.opening.fading {
		opacity: 0;
		pointer-events: none;
	}
	/* set before first paint by app.html for anyone who has already seen it */
	:global(html[data-op-seen]) .opening {
		display: none;
	}

	.mark {
		/* 149 / 393 */
		width: 37.9vw;
		max-width: 260px;
		height: auto;
		animation: rise 1.2s ease both;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mark {
			animation: none;
		}
	}
</style>
