<template>
  <section class="workspace">
    <header><div><h1 class="page-title">{{ title }}</h1><p class="page-description">{{ description }}</p></div></header>
    <div class="migration-note">
      <strong>{{ title }}正在从一期 Demo 拆入统一 Vue 页面</strong>
      <p>路由与后台外壳已经建立；下一步迁移原有字段、校验、列表和操作，不再通过 iframe 加载。</p>
    </div>
  </section>
</template>

<script>
export default { props: { moduleKey: String, title: String, description: String } }
</script>

<style scoped>
.workspace{max-width:1440px;margin:0 auto}.workspace header{display:flex;align-items:flex-end;justify-content:space-between}.migration-note{margin-top:24px;padding:22px;border:1px solid var(--line);border-radius:10px;background:#fff}.migration-note strong{font-size:16px}.migration-note p{margin:7px 0 0;color:var(--muted)}
</style>
