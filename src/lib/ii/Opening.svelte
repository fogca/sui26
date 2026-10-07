<script>
	// The opening, in three movements:
	//
	//   mark    the symbol alone on white, swaying — this is the loading state
	//   text    the mark leaves; the page's headline arrives word by word, in ink
	//   field   the water rises behind it and the words turn white with it
	//
	// Nothing here draws the headline. This component owns the mark and the
	// clock; it dispatches each phase and the page's own CSS carries every
	// visual change. That is why there is no animation library in this project —
	// the sequence is four transitions and a stagger, which CSS does on its own.
	//
	// Whether it plays at all is settled before this ever runs: app.html sets
	// html[data-op-seen] pre-paint for anyone who has already seen it, and the
	// page's CSS only hides anything while that flag is absent. So a repeat
	// visitor is never shown a frame of the opening, even though this component
	// still mounts.
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** Play only the first time in a tab, or on every load.
	 *
	 *  BEFORE LAUNCH: set this to true, and OP_ONCE in src/app.html with it.
	 *  While the site is still on the workers.dev preview it plays every time so
	 *  it can be watched by reloading. Reduced motion still skips it either way. */
	const ONCE_PER_SESSION = false;

	/** The mark alone, swaying. Long enough to read as a held breath. */
	const MARK_MS = 2200;
	/** The line cascades in over this, still dark on the white ground. The
	 *  cascade itself runs 1.75s (1.1s a letter, 38ms apart, the two lines
	 *  overlapping so the last starts at 17 rather than 26), so this has to be
	 *  longer than that — otherwise the water starts rising
	 *  before the line has finished arriving and the dark-on-white beat never
	 *  reads. */
	const TEXT_MS = 2600;
	/** The water rises and the letters turn with it. Long enough to cover the
	 *  turn itself: the last letter starts 0.65s in and takes 2.0s, so the line
	 *  is white at about 2.6s — and only then does 'done' bring in the chrome,
	 *  the services line and the signature. */
	const FIELD_MS = 2400;

	let phase = 'pre';
	let timers = [];

	function go(next) {
		phase = next;
		dispatch('phase', next);
	}

	/** Cut the opening short — any touch of the page takes the reader straight
	 *  to the end of it. The event itself is never cancelled. */
	function skip() {
		if (phase === 'done') return;
		timers.forEach(clearTimeout);
		timers = [];
		unlock();
		go('done');
	}

	function lock() {
		document.body.style.overflow = 'hidden';
	}
	function unlock() {
		document.body.style.overflow = '';
	}

	const INPUT = ['wheel', 'touchmove', 'keydown', 'pointerdown'];

	onMount(() => {
		let seen = false;
		try {
			if (ONCE_PER_SESSION) {
				seen = sessionStorage.getItem('sui-op') === '1';
				sessionStorage.setItem('sui-op', '1');
				// NOT data-op-seen: that flag is app.html's, set before first paint
				// on a LATER load. Setting it here would hide the opening playing
				// now.
			}
		} catch (e) {
			// private mode — the opening simply plays every time
		}
		if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			go('done');
			return;
		}

		lock();
		go('mark');
		timers.push(setTimeout(() => go('text'), MARK_MS));
		timers.push(setTimeout(() => go('field'), MARK_MS + TEXT_MS));
		timers.push(
			setTimeout(() => {
				unlock();
				go('done');
			}, MARK_MS + TEXT_MS + FIELD_MS)
		);

		for (const e of INPUT) window.addEventListener(e, skip, { passive: true, once: true });
	});

	onDestroy(() => {
		timers.forEach(clearTimeout);
		if (typeof document !== 'undefined') {
			unlock();
			for (const e of INPUT) window.removeEventListener(e, skip);
		}
	});
</script>

<!-- The mark sits on the page's own white ground; it does not carry one of its
     own, so there is nothing to fade out from under it. -->
<div class="op" data-phase={phase} aria-hidden="true">
	<img class="mark" src="/ii/symbol-ink.svg" alt="" width="151" height="126" />
</div>

<style>
	.op {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		opacity: 0;
	}
	/* never shown to someone who has already seen it */
	:global(html[data-op-seen]) .op {
		display: none;
	}

	.mark {
		/* 149 / 393 */
		width: 37.9vw;
		max-width: 260px;
		height: auto;
		opacity: 0;
	}

	.op[data-phase='mark'] {
		opacity: 1;
	}
	.op[data-phase='mark'] .mark {
		/* arrives, then keeps swaying until it is asked to leave */
		animation:
			rise 1100ms ease both,
			sway 6s ease-in-out 1100ms infinite;
	}

	/* the mark leaves on its own, a touch slower than it arrived */
	.op[data-phase='text'],
	.op[data-phase='field'],
	.op[data-phase='done'] {
		opacity: 0;
		transition: opacity 700ms ease;
	}
	.op[data-phase='text'] .mark,
	.op[data-phase='field'] .mark,
	.op[data-phase='done'] .mark {
		opacity: 1;
		animation: none;
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
	/* A breath rather than a bounce: it drifts up and settles, and leans by
	   half a degree on the way. Nothing in it should be catchable. */
	@keyframes sway {
		0% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		25% {
			transform: translate3d(2px, -5px, 0) rotate(0.45deg);
		}
		50% {
			transform: translate3d(0, -7px, 0) rotate(0deg);
		}
		75% {
			transform: translate3d(-2px, -4px, 0) rotate(-0.45deg);
		}
		100% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mark {
			animation: none !important;
		}
	}
</style>
