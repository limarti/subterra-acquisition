<template>
  <transition :name="mode === 'HEIGHT' ? 'heightfade' : 'widthfade'" :style="'transition-duration: ' + (durationHeight) + 'ms; transition-delay: ' + (delayHeight) + 'ms; ' ">
    <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
    <div ref="wrapper" class="relative">
      <transition name="myfade"
                  :style="'transition-duration: ' + (durationTransparency) + 'ms; transition-delay: ' + (delayTransparency) + 'ms; ' "
                  :class="{ 'absolute top-0 left-0 right-0' : isTweening && mode === 'HEIGHT', 'absolute top-0 left-0 bottom-0' : isTweening && mode === 'WIDTH' }"
                  @leave="leave"
                  @beforeEnter="beforeEnter"
                  @enter="enter">
        <slot />
      </transition>
    </div>
  </transition>
</template>

<script>

  export default {
    props: {
      mode: {
        type: String,
        default: "HEIGHT",
      },
    },
    data()
    {
      return {
        isTweening: false,
        duration: 300,
      };
    },
    computed: {
      durationHeight()
      {
        return this.duration;
      },
      delayHeight()
      {
        return 0;
      },
      durationTransparency()
      {
        return this.duration;
      },
      delayTransparency()
      {
        //TODO find a way to implement different delays for in and out, so when transitioning we can first hide one element and then show the other
        return 0;
      }
    },
    mounted()
    {

    },
    methods: {
      // Set the initial height to current height
      beforeEnter: function (el)
      {
        let style = window.getComputedStyle(this.$refs.wrapper);

        if (this.mode === "HEIGHT")
        {
          let height = ['height', 'padding-top', 'padding-bottom']
            .map((key) => parseFloat(style.getPropertyValue(key), 10))
            .reduce((prev, cur) => prev + cur);
          this.$refs.wrapper.style.height = height + 'px';
        }
        else if (this.mode === "WIDTH")
        {
          let width = ['width', 'padding-left', 'padding-right']
            .map((key) => parseFloat(style.getPropertyValue(key), 10))
            .reduce((prev, cur) => prev + cur);
          this.$refs.wrapper.style.width = width + 'px';
        }
        else
        {
          throw new Error("Invalid mode");
        }

        this.isTweening = true;
      },

      //measure new height and apply it
      enter: function (el)
      {
        if (this.mode === "HEIGHT")
        {
          el.style.height = 'auto';
        }
        else if (this.mode === "WIDTH")
        {
          el.style.width = 'auto';
        }
        else
        {
          throw new Error("Invalid mode");
        }

        this.$refs.wrapper.style.overflow = 'hidden';

        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() =>
        {
          requestAnimationFrame(() =>
          {
            clearTimeout(this.idTimeout); //in case it was transitioning

            this.idTimeout = setTimeout(() =>
            {
              this.afterHeightTransition();
            }, this.delayHeight + this.durationHeight + 100);  //simulate afterEnter because we dont have hook, add safety margin

            if (this.mode === "HEIGHT")
            {
              // Use scrollHeight for more reliable measurement
              const height = el.scrollHeight;
              this.$refs.wrapper.style.height = height + 'px';
            }
            else if (this.mode === "WIDTH")
            {
              const width = el.scrollWidth;
              this.$refs.wrapper.style.width = width + 'px';
            }
            else
              throw new Error("Invalid mode");
          });
        });
      },

      // Leave only necessary eaving to nothinghing
      leave: function (el)
      {
        let style = window.getComputedStyle(this.$refs.wrapper);

        if (this.mode === "HEIGHT")
        {
          let height = ['height', 'padding-top', 'padding-bottom']
            .map((key) => parseFloat(style.getPropertyValue(key), 10))
            .reduce((prev, cur) => prev + cur);
          this.$refs.wrapper.style.height = height + 'px';
        }
        else if (this.mode === "WIDTH")
        {
          let width = ['width', 'padding-left', 'padding-right']
            .map((key) => parseFloat(style.getPropertyValue(key), 10))
            .reduce((prev, cur) => prev + cur);
          this.$refs.wrapper.style.width = width + 'px';
        }
        else
        {
          throw new Error("Invalid mode");
        }

        //set height to 0 in case there is no other element
        setTimeout(() =>
        {
          this.$refs.wrapper.style.overflow = 'hidden';

          if (this.mode === "HEIGHT")
            this.$refs.wrapper.style.height = '0px';
          else if (this.mode === "WIDTH")
            this.$refs.wrapper.style.width = '0px';
          else
            throw new Error("Invalid mode");

          this.isTweening = true;
        }, 0);
      },

      afterHeightTransition()
      {
        this.$refs.wrapper.style.overflow = 'visible';

        //reset state
        if (this.mode === "HEIGHT")
          this.$refs.wrapper.style.height = '';
        else if (this.mode === "WIDTH")
          this.$refs.wrapper.style.width = '';
        else
          throw new Error("Invalid mode");

        this.isTweening = false;
      }
    }
  };
</script>

<style scoped>

.heightfade {
  transition: height cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.widthfade {
  transition: width cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.myfade-enter-active, .myfade-leave-active {
  transition: opacity;
}

.myfade-enter-from, .myfade-leave-to {
  opacity: 0;
}
</style>
