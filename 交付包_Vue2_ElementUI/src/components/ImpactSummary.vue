<template>
  <section :class="['impact-summary', tone]" aria-live="polite">
    <div class="summary-icon"><i :class="icon" aria-hidden="true" /></div>
    <div class="summary-copy">
      <div class="summary-title"><strong>影响范围校验</strong><el-tag v-if="ready" size="mini" :type="impact.mismatched.length ? 'warning' : 'success'">{{ impact.mismatched.length ? '有不适用项' : '校验通过' }}</el-tag></div>
      <p v-if="!ready">请完成商品与专业选择，这里会自动计算真正生效的“商品 × 专业”组合。</p>
      <template v-else>
        <p>已选 <strong>{{ selectedProductCount }}</strong> 个商品和 <strong>{{ selectedProfessionCount }}</strong> 个专业，{{ actionText }}将作用于 <strong>{{ impact.combinationCount }}</strong> 个有效组合。</p>
        <p v-if="detail">{{ detail }}</p>
        <p v-if="impact.mismatched.length" class="warning-copy">以下 {{ impact.mismatched.length }} 个专业不在所选商品覆盖范围内，将被跳过：{{ impact.mismatched.map(item => item.name).join('、') }}</p>
      </template>
    </div>
    <el-button v-if="impact.mismatched.length" size="small" @click="$emit('clear-mismatch')">清除不适用项</el-button>
  </section>
</template>

<script>
export default {
  name: 'ImpactSummary',
  props: {
    impact: { type: Object, required: true },
    selectedProductCount: { type: Number, default: 0 },
    selectedProfessionCount: { type: Number, default: 0 },
    actionText: { type: String, default: '本次操作' },
    detail: { type: String, default: '' }
  },
  computed: {
    ready () { return this.selectedProductCount > 0 && this.selectedProfessionCount > 0 },
    tone () { return !this.ready ? 'neutral' : this.impact.combinationCount === 0 || this.impact.mismatched.length ? 'warning' : 'success' },
    icon () { return this.tone === 'success' ? 'el-icon-circle-check' : this.tone === 'warning' ? 'el-icon-warning-outline' : 'el-icon-data-analysis' }
  }
}
</script>

<style scoped>
.impact-summary{display:flex;align-items:flex-start;gap:12px;padding:16px 18px;border-radius:9px;background:#f7f8fa;color:#3d4653}.impact-summary.success{background:#eef8f4}.impact-summary.warning{background:#fff7e8}.summary-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#fff;color:#667085;font-size:17px}.success .summary-icon{color:#147a62}.warning .summary-icon{color:#a75b00}.summary-copy{flex:1}.summary-title{display:flex;align-items:center;gap:8px}.summary-copy p{margin:5px 0 0;line-height:1.65}.warning-copy{color:#8a4b05}.summary-copy strong{color:var(--ink)}
</style>
