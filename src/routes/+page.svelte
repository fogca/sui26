<script>
import { fade, fly } from 'svelte/transition';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import Logo from "../components/Logo.svelte"
import Symbol from "../components/Symbol.svelte"
import Tagline from "../components/Tagline.svelte"
import { works, contactHref } from "$lib/works.js"

let originalItems = works;

let items = [];
let currentIndex = 0;
let show = true;

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

onMount(() => {
  items = shuffle(originalItems);
  loop();
});

function loop() {
  setTimeout(() => {
    show = false;
    setTimeout(() => {
      currentIndex += 1;

      if (currentIndex >= items.length) {
        items = shuffle(originalItems);
        currentIndex = 0;
      }

      show = true;
      loop();
    }, 1800); // fade out time
  }, 5300); // time image is shown
}


//ここまで画像トランジションのスクリプト 
//下からオープニングアニメーション

let showLogo = false;
let showHeadline = false;
let showImage = false;

onMount(async () => {
  showLogo = true;
  await wait(0);
  showHeadline = true;
  await wait(0);
  showImage = true;
});

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}



let triggered = false;
let showOverlay = false;
let overlayPhase = 'fade'; // 'fade' → 'color' phase

  function handleScrollIntent() {
    if (triggered) return;
    triggered = true;

    showOverlay = true;

    // Phase 1: Colour
    setTimeout(() => {
      overlayPhase = 'color'; // change overlay background
    }, 1000); // after fade-in completes

    // Phase 2: Navigate to /about
    setTimeout(() => {
      goto('/about');
    }, 2000);
  }


</script>

<section id="suiMain"
  class="scroll-listener"
  on:wheel={handleScrollIntent}
  on:touchmove={handleScrollIntent}
>
    
    {#if showLogo}
    <div class="symbol" in:fly={{ y: -10, duration: 2000 }}><Symbol /></div>
    {/if}
    {#if showLogo}
    <div class="logo" in:fly={{ y: 10, duration: 2000 }}><Logo /></div>
    {/if}
    {#if showLogo}
    <a href="/about">
    <div class="tagline" in:fly={{ y: 10, duration: 2000 }}><Tagline /></div></a>
    {/if}
    <a href={contactHref} target="_blank" class="contact">
        Get in touch
    </a>
    

    {#if showImage}
    <div class="center wrapper" in:fade={{ duration: 2500 }}>
        <img
          src="{items[currentIndex].image}"
          alt=""
          class="fade-image {show ? 'visible' : ''}"
        />
        <div class="fade-text {show ? 'visible' : ''}">
          {items[currentIndex].text}
        </div>
    </div>
    {/if}


    {#if showOverlay}
    <div class="overlay {overlayPhase}"></div>
    {/if}
    

</section>


<style>

#suiMain {
    width: 100vw;
    height: 100vh;
    height: 100svh;
    position: relative;
    padding: 1.8rem;
    padding-left: var(--padding);
    padding-right: var(--padding);
}

.symbol {
    position: absolute;
    top: auto;
}
.logo {
    position: absolute;
    top: auto;
    bottom: 2rem;
    transform: translateY(0%);
}
.tagline {
    position: absolute;
    left: auto;
    right: var(--padding);
    top: auto;
    bottom: 2rem;
}
.contact {
    position: absolute;
    left: auto;
    right: var(--padding);
    top: auto;
}

.center.wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
}
img {
  width:73.5vw;/*78*/
  height: 84vw;/*78*/
  width:72vw;/*67*/
  height: 84vw;/*67*/
  opacity: 0;
  transition: opacity 1.8s ease-in-out;
  object-fit: cover;
}

  .fade-text {
      text-align: right;
    font-size: 9.5px;
    font-weight: 500;
    opacity: 0;
    transition: opacity 1.8s .1s ease-in-out;
    color: #999;
  }

  .visible {
    opacity: 1;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #B5b5b6;
    background: #AEA388;
    opacity: 0;
    animation: fadeIn 0.8s forwards;
    z-index: 100;
  }
  .overlay.color {
  background: #FFF; /* ← your about page's bg color */
  transition: all 1s ease-in-out;
  }
    

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }




@media screen and (min-width:720px) {

    #suiMain {
        height: 100vh;
        padding: 4rem;
        padding-left: var(--pcPadding);
        padding-right: var(--pcPadding);
    }
    .logo {bottom: 3.5rem;}

    .center.wrapper {margin-top: 1.5rem;}
    .tagline,.contact {right: var(--pcPadding);}

    img {
        width:60vh;
        height: 70vh;
        transition: opacity 1.5s ease-in-out;
    }

}


  </style>