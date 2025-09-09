export default defineNuxtConfig({
  css: ['~/assets/scss/main.scss'],
  ssr: false, // yoki false qilsa ham bo‘ladi, lekin SEO kamayadi
  nitro: {
    preset: 'static' // agar Render, Vercel, Railway’ga qo‘yayotgan bo‘lsang
  },
  vite: {
    plugins: [require('vite-svg-loader')()],
  },
})