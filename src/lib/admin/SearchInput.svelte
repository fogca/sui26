<script>
	// Plain text field, styled to match .a-input. Bindable with bind:value.
	export let value = '';
	export let name = 'q';
	export let placeholder = '検索';
</script>

<label class="search">
	<span class="sr">{placeholder}</span>
	<input
		class="a-input"
		type="search"
		{name}
		{placeholder}
		bind:value
		on:input
		on:change
		on:keydown
	/>
</label>

<style>
	.search {
		display: block;
		flex: 1 1 18rem;
		min-width: 0;
		max-width: 32rem;
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
	/* iOS renders a native clear affordance that fights the hairline frame */
	input::-webkit-search-decoration,
	input::-webkit-search-cancel-button {
		-webkit-appearance: none;
	}
</style>
