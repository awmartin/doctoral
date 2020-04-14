<template>
  <div class="loading">
    <svg>
      <g class="spin">
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(0)" fill="#e7e7e7" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(30)" fill="#d2d2d2" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(60)" fill="#bdbdbd" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(90)" fill="#a8a8a8" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(120)" fill="#939393" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(150)" fill="#7e7e7e" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(180)" fill="#696969" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(210)" fill="#545454" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(240)" fill="#3f3f3f" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(270)" fill="#2a2a2a" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(300)" fill="#151515" />
        <rect x="-1" :y="y" :width="width" :height="height" transform="translate(40, 40) rotate(330)" fill="#000000" />
      </g>
    </svg>

    <div class="message" v-if="message">
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.4);

  svg {
    position: absolute;
    width: 80px;
    height: 80px;
    left: calc(50% - 40px);
    top: calc(50% - 40px);
    background-color: rgb(184, 226, 252, 0.6);
    border-radius: 5px;
  }

  .message {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 2;

    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 0.8rem;
    span {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
}

@keyframes rotate_animation {
  0% {
    transform: rotate(0deg);
  }
  8% {
    transform: rotate(30deg);
  }
  17% {
    transform: rotate(60deg);
  }
  25% {
    transform: rotate(90deg);
  }
  33% {
    transform: rotate(120deg);
  }
  42% {
    transform: rotate(150deg);
  }
  50% {
    transform: rotate(180deg);
  }
  58% {
    transform: rotate(210deg);
  }
  67% {
    transform: rotate(240deg);
  }
  75% {
    transform: rotate(270deg);
  }
  83% {
    transform: rotate(300deg);
  }
  92% {
    transform: rotate(330deg);
  }
}
.spin {
  animation-name: rotate_animation;
  animation-duration: 1000ms;
  transform-origin: 50% 50%;
  animation-iteration-count: infinite;
  animation-timing-function: step-start;
}
</style>

<script>
export default {
  name: 'Loading',

  props: ['message'],

  data () {
    return {
      y: 9,
      height: 11,
      width: 2
    }
  }
}
</script>
