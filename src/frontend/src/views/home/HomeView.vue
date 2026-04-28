<template>
  <Layout />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/layout/Layout.vue'

const router = useRouter()

onMounted(() => {
  router.replace('/chat')
})
</script>
