<script>
	import Header from '../../../components/Header.svelte';
</script>

<svelte:head><title>特定商取引法に基づく表記 — SUI scent studio</title></svelte:head>

<Header />

<section class="legal">
	<div class="wrapper">
		<h1 class="serif">特定商取引法に基づく表記</h1>

		<!-- TODO: 沙里さん確定情報に差し替えてから公開すること -->
		<dl>
			<dt>販売事業者</dt>
			<dd>SUI scent studio（仮 — 要確定）</dd>
			<dt>運営責任者</dt>
			<dd>（要確定）</dd>
			<dt>所在地・電話番号</dt>
			<dd>ご請求があった場合、遅滞なく開示いたします。</dd>
			<dt>メールアドレス</dt>
			<dd>hello@sari-scent.jp</dd>
			<dt>販売価格</dt>
			<dd>各商品ページに税込価格で表示しています。</dd>
			<dt>商品代金以外の必要料金</dt>
			<dd>送料（全国一律。一定金額以上のご注文で無料。金額はカート画面に表示）</dd>
			<dt>お支払い方法</dt>
			<dd>クレジットカード / Apple Pay / コンビニ決済 / PayPay</dd>
			<dt>お支払い時期</dt>
			<dd>ご注文時にお支払いが確定します。コンビニ決済はお支払い期限内にお支払いください。</dd>
			<dt>商品の引き渡し時期</dt>
			<dd>ご注文確認後、5営業日以内に発送いたします。</dd>
			<dt>返品・交換</dt>
			<dd>
				香りの性質上、お客様都合による返品はお受けしておりません。<br />
				不良・破損の場合は商品到着後7日以内にご連絡ください。送料当方負担でお取り替えいたします。
			</dd>
		</dl>

		<a class="back" href="/shop">← Shopへ戻る</a>
	</div>
</section>

<style>
	.legal {
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: 22vh;
		padding-bottom: 10rem;
	}
	.wrapper {
		margin-left: 30%;
		max-width: 52rem;
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
		margin-bottom: 3.2rem;
	}
	dl {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.4rem 2rem;
	}
	dt {
		font-size: 1.1rem;
		color: var(--subColor);
		margin-top: 1.6rem;
	}
	dd {
		font-size: 1.2rem;
		line-height: 1.9;
	}
	.back {
		display: inline-block;
		margin-top: 5rem;
		font-size: 1.1rem;
		color: var(--subColor);
	}

	@media screen and (min-width: 720px) {
		.wrapper {
			margin-left: 52.5%;
		}
		dl {
			grid-template-columns: 16rem 1fr;
		}
		dt {
			margin-top: 0;
			padding: 0.6rem 0;
		}
		dd {
			padding: 0.6rem 0;
			border-bottom: 1px solid #eee;
		}
	}
</style>
