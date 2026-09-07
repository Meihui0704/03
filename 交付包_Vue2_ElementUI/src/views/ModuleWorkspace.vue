<template>
  <section class="workspace">
    <header><div><h1 class="page-title">{{ title }}</h1><p class="page-description">{{ description }}</p></div></header>
    <div class="migration-note">
      <strong>{{ title }}尚未迁入本期演示</strong>
      <p>{{ description }}</p>
    </div>
  </section>
</template>

<script>
export default { props: { moduleKey: String, title: String, description: String } }
</script>

<style scoped>
.workspace{max-width:1440px;margin:0 auto}.workspace header{display:flex;align-items:flex-end;justify-content:space-between}.migration-note{margin-top:24px;padding:22px;border:1px solid var(--line);border-radius:10px;background:#fff}.migration-note strong{font-size:16px}.migration-note p{margin:7px 0 0;color:var(--muted)}
</style>
