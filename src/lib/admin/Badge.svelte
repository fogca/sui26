<script>
	// State label. Always carries a word — color is a reinforcement, never the
	// only signal.
	export let tone = 'neutral';
	export let label = '';
</script>

<span class="badge {tone}">{label}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		font-size: 1rem;
		line-height: 1;
		letter-spacing: 0.04em;
		white-space: nowrap;
		padding: 0.45rem 0.7rem;
		border: 1px solid #eae7e4;
		border-radius: 2px;
		background-color: #fff;
		color: var(--subColor);
	}
	.good {
		border-color: #d5e0d7;
		background-color: #f7faf7;
		color: #4d6b57;
	}
	.warn {
		border-color: #e8d3ae;
		background-color: #fdf9f2;
		color: #8a6224;
	}
	.danger {
		border-color: #e5c8c2;
		background-color: #fdf5f3;
		color: #a3453a;
	}
	.info {
		border-color: #d3dae1;
		background-color: #f6f8fa;
		color: #4a5f74;
	}
</style>
