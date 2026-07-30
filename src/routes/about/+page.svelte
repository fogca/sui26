<script>
    import Header from "../../components/Header.svelte"
</script>

<Header />
<section>

    <div class="wrapper">
        <h2 class="serif">
            沙里 SARI
        </h2>
        <p class="serif">
            日本の伝統的な香道と世界の香文化や素材との対話を背景に、「匂い」という現象の神秘を核に据えて、未来へ織り継ぐ香の道を探求。<br>
従来の香水の枠を超え、建築空間やメゾン、化粧品、菓子や飲料など、多様な領域で調香や香会をひらいている。<br>
<br>
植物や鉱物の抽出を手がかりに、<br>
森羅万象に香る響きを紡いでいきたい。<br>
<br>
<br>
フレグランスコンテスト環境大臣賞受賞<br>
<br>
調香：KIGI / La Cime / La Nuit Parfum / R.alagan / SENN / SONY / The Tea Company / MARIUO HOTEL / MiM / エスパシオ箱根迎賓館 / 直島旅館 ろ霞 ほか<br>
<br>
展示・香会：Bottega Veneta / gallery crossing /HERMES skill academy / LEXUS /組む東京 / 小石川植物園 / 東京大学 / 森岡書店 / 八雲茶寮 ほか（abc,五十音順）<br>
<br>
海外 : CRES in USA / Expo 2015 Milano / MARIA VAN RENSWN Switzerland / Milan Design Week / public record NZ / SIGMA Shanghai / Tour Japan in Franceほか
        </p>
    </div>

</section>

<style>

.wrapper {
    margin-top: 28vh;
    margin-left: 30%;
    margin-bottom: 10rem;
}

.wrapper h2 {
    font-size: 2rem;
    line-height: 1.4;
    margin-bottom: 4rem;
    letter-spacing: .075em;
}
.wrapper p {
    width: 95%;
    font-size: 1.35rem;
    letter-spacing: .075em;
    line-height: 2.1;
    text-align: left;
    color: var(--blackColor);
}

.wrapper p span {
    font-size: 1rem;
}


@media screen and (min-width:720px) {

    
    .wrapper {
        margin-top: 50vh;
        margin-left: 52.5%;
        margin-bottom: 1rem;
    }
    .wrapper h2 {
        font-size: 2.2rem;
        margin-bottom: 2.5rem;
    }
    .wrapper p {width: 100%;}

}

</style>