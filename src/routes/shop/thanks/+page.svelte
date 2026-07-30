<script>
	import Header from '../../../components/Header.svelte';
	import { yen } from '$lib/shop/money.js';
	export let data;
</script>

<svelte:head><title>ご注文ありがとうございます — SUI scent studio</title></svelte:head>

<Header />

<section class="thanks">
	<div class="wrapper">
		{#if data.order}
			<h1 class="serif">ご注文ありがとうございます</h1>
			<p class="no">注文番号 <strong>{data.order.order_no}</strong></p>
			<ul class="items">
				{#each data.order.items as i}
					<li><span>{i.name} × {i.qty}</span></li>
				{/each}
			</ul>
			<p class="total">合計 {yen(data.order.total)}（税込）</p>
			<p class="note">
				確認メールを {data.order.email} 宛にお送りします。<br />
				発送が完了しましたら、追跡番号をあらためてご案内いたします。
			</p>
		{:else if data.pending}
			<h1 class="serif">お支払いを確認しました</h1>
			<p class="note">注文情報を処理しています。確認メールをお待ちください。</p>
		{:else}
			<h1 class="serif">ご注文情報が見つかりません</h1>
			<p class="note">お手数ですが、メールの注文確認をご覧いただくか、お問い合わせください。</p>
		{/if}
		<a class="back" href="/shop">← Shopへ戻る</a>
	</div>
</section>

<style>
	.thanks {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 26vh;
		padding-bottom: 10rem;
	}
	.wrapper {
		margin-left: 30%;
		max-width: 44rem;
	}
	h1 {
		font-size: 2rem;
		line-height: 1.5;
		letter-spacing: 0.05em;
		margin-bottom: 2.4rem;
	}
	.no {
		font-size: 1.3rem;
		margin-bottom: 2rem;
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1.2rem;
	}
	.items li {
		font-size: 1.2rem;
	}
	.total {
		font-size: 1.3rem;
		margin-bottom: 2.4rem;
	}
	.note {
		color: var(--subColor);
		line-height: 2;
	}
	.back {
		display: inline-block;
		margin-top: 4rem;
		font-size: 1.1rem;
		color: var(--subColor);
	}

	@media screen and (min-width: 720px) {
		.wrapper {
			margin-left: 52.5%;
		}
	}
</style>
