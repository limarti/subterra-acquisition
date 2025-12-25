<template>
  <main class="h-full flex items-center justify-center custom-bg">
    <div class="flex flex-col items-center justify-center h-full w-full">
      <div class="w-[60%] max-w-96 h-auto mx-auto">
        <img src="@/assets/images/full_logo.png" alt="Full logo" class="h-auto mx-auto">
        <div class="shadow-logo w-full aspect-[20/1] mt-4" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted } from 'vue';

  const router = useRouter();

  onMounted(() =>
  {
    setTimeout(() =>
    {
      router.push({ name: 'dashboard' });
    }, 2000);
  });
</script>

<style scoped>
.custom-bg {
  background: linear-gradient(
    135deg,
    #142431 0%,
    #1E4767 30%,
    #1E4767 50%,
    #1E4767 70%,
    #142431 100%
  );
}

.shadow-logo {
  background: linear-gradient(
    135deg,
    #00000010 0%,
    #00000040 30%,
    #00000050 50%,
    #00000040 70%,
    #00000010 100%
  );
  border-radius: 50%;
  filter: blur(2px)
}
</style>
