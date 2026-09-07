<template>
  <section class="operation-log">
    <div class="log-head"><h3>变更记录</h3><span>最近操作优先</span></div>
    <div class="log-list">
      <div v-for="(item, index) in logs" :key="`${item.time}-${index}`" class="log-item">
        <span class="log-time">{{ item.time }}</span>
        <span class="log-user">{{ item.user }}</span>
        <span class="log-content">{{ item.content }}</span>
      </div>
    </div>
  </section>
</template>

<script>
export default { name: 'OperationLog', props: { logs: { type: Array, default: () => [] } } }
</script>

<style scoped>
.operation-log{margin-top:22px}.log-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.log-head h3{margin:0;font-size:16px}.log-head span{color:var(--muted);font-size:12px}.log-list{border-top:1px solid var(--line)}.log-item{display:grid;grid-template-columns:130px 90px 1fr;gap:12px;padding:11px 4px;border-bottom:1px solid var(--line)}.log-time,.log-user{color:var(--muted);font-size:12px}.log-content{color:#3d4653}@media(max-width:760px){.log-item{grid-template-columns:1fr}.log-time,.log-user{display:inline}}
</style>
