<template>
  <section class="operation-page">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />{{ title }}</div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-description">{{ description }}</p>
      </div>
      <el-button @click="$router.push('/business-lines')">从全部项目清单选择</el-button>
    </header>

    <el-alert v-if="transfer.source" class="transfer-alert" type="success" show-icon :closable="false" :title="`已从${transfer.source}带入 ${selectedProductIds.length} 个商品、${professionIds.length} 个专业`" />

    <div class="step-shell">
      <el-steps :active="step" finish-status="success" simple>
        <el-step :title="mode === 'shelf' ? '选择操作' : '调价方式'" />
        <el-step title="选择商品" />
        <el-step title="选择范围" />
        <el-step title="确认生效" />
      </el-steps>
    </div>

    <div class="form-surface">
      <section v-show="step === 0" class="step-content compact-step">
        <div class="step-heading"><span>1</span><div><h2>{{ mode === 'shelf' ? '选择上架或下架' : '设置统一调价规则' }}</h2><p>一次任务只能执行一种操作，避免同批次规则互相覆盖。</p></div></div>
        <template v-if="mode === 'shelf'">
          <el-radio-group v-model="shelfAction" class="choice-grid">
            <el-radio-button label="ON"><strong>批量上架</strong><small>使有效组合在指定时间可售</small></el-radio-button>
            <el-radio-button label="OFF"><strong>批量下架</strong><small>使有效组合在指定时间停止销售</small></el-radio-button>
          </el-radio-group>
        </template>
        <template v-else>
          <el-radio-group v-model="priceMode" class="choice-grid price-choice">
            <el-radio-button label="REDUCE"><strong>减免固定金额</strong><small>在当前价格基础上统一减免</small></el-radio-button>
            <el-radio-button label="PERCENT"><strong>按比例下调</strong><small>按照百分比统一下调</small></el-radio-button>
            <el-radio-button label="FIXED"><strong>设置统一价格</strong><small>所有有效组合改为同一价格</small></el-radio-button>
          </el-radio-group>
          <div class="number-setting">
            <span v-if="priceMode === 'REDUCE'">每个组合减免</span><span v-else-if="priceMode === 'PERCENT'">当前价格下调</span><span v-else>统一设置为</span>
            <el-input-number v-model="priceValue" :min="priceMode === 'PERCENT' ? 1 : 0" :max="priceMode === 'PERCENT' ? 99 : 99999" :precision="priceMode === 'PERCENT' ? 0 : 2" controls-position="right" />
            <span>{{ priceMode === 'PERCENT' ? '%' : '元' }}</span>
          </div>
        </template>
      </section>

      <section v-show="step === 1" class="step-content">
        <div class="step-heading"><span>2</span><div><h2>选择商品课程</h2><p>可以整组选择、搜索，也可以新增课程库中尚未录入的商品。</p></div></div>
        <ProductPicker ref="productPicker" v-model="selectedProductIds" @change="onProductChange" />
      </section>

      <section v-show="step === 2" class="step-content">
        <div class="step-heading"><span>3</span><div><h2>选择项目与专业</h2><p>商品覆盖不到的专业会即时标出，并在执行时自动跳过。</p></div></div>
        <ProfessionTree v-model="professionIds" :selected-products="selectedProductObjects" />
      </section>

      <section v-show="step === 3" class="step-content final-step">
        <div class="step-heading"><span>4</span><div><h2>确认生效</h2><p>核对时间和实际影响范围后再提交。</p></div></div>
        <el-form label-position="top" class="effective-form">
          <el-form-item label="生效时间" required>
            <el-date-picker v-model="effectiveAt" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择生效时间" :picker-options="dateOptions" />
          </el-form-item>
        </el-form>
        <ImpactSummary
          :impact="impact"
          :selected-product-count="selectedProductIds.length"
          :selected-profession-count="professionIds.length"
          :action-text="actionText"
          :detail="priceDetail"
          @clear-mismatch="clearMismatch"
        />
        <div class="confirmation-list">
          <div><span>操作</span><strong>{{ actionLabel }}</strong></div>
          <div><span>商品</span><strong>{{ selectedProductIds.length }} 个</strong></div>
          <div><span>专业</span><strong>{{ professionIds.length }} 个</strong></div>
          <div><span>实际生效</span><strong>{{ impact.combinationCount }} 个商品 × 专业组合</strong></div>
        </div>
        <OperationLog :logs="logs" />
      </section>
    </div>

    <footer class="page-actions">
      <el-button v-if="step > 0" @click="step--">上一步</el-button>
      <el-button v-if="step < 3" type="primary" @click="next">下一步</el-button>
      <el-button v-else type="primary" :loading="submitting" @click="submit">确认{{ mode === 'shelf' ? '执行' : '调价' }}</el-button>
    </footer>
  </section>
</template>

<script>
import ProductPicker from '../components/ProductPicker.vue'
import ProfessionTree from '../components/ProfessionTree.vue'
import ImpactSummary from '../components/ImpactSummary.vue'
import OperationLog from '../components/OperationLog.vue'
import { allOperationProducts, getImpact, professionName, readTransfer } from '../data/phase1Business'

export default {
  name: 'ProductOperation',
  components: { ProductPicker, ProfessionTree, ImpactSummary, OperationLog },
  props: { mode: { type: String, required: true } },
  data () {
    const transfer = readTransfer()
    return {
      transfer,
      step: 0,
      shelfAction: 'OFF',
      priceMode: 'REDUCE',
      priceValue: 980,
      selectedProductIds: Array.isArray(transfer.products) ? transfer.products : [],
      professionIds: Array.isArray(transfer.professions) ? transfer.professions : [],
      productCache: allOperationProducts.map(item => ({ ...item })),
      effectiveAt: '',
      submitting: false,
      dateOptions: { disabledDate: date => date.getTime() < Date.now() - 86400000 },
      logs: this.mode === 'shelf'
        ? [
            { time: '07-14 11:20', user: '运营-陈昊', content: '“共用商品 · 正版书籍”全部下架，因 2025 版内容过期' },
            { time: '07-12 09:40', user: '运营-王倩', content: '临床执业医师专属商品批量上架，覆盖 4 个商品' }
          ]
        : [
            { time: '07-14 11:20', user: '运营-陈昊', content: '中级职称高分密训班每个组合减免 ¥980' },
            { time: '07-12 09:40', user: '运营-王倩', content: '临床执业医师专属商品统一下调 10%' }
          ]
    }
  },
  computed: {
    title () { return this.mode === 'shelf' ? '商品课程上下架' : '商品批量调价' },
    description () { return this.mode === 'shelf' ? '选择商品和专业后，按实际覆盖组合执行批量上架或下架。' : '选择商品和专业后，按实际覆盖组合统一调整价格。' },
    selectedProductObjects () { return this.productCache.filter(item => this.selectedProductIds.includes(item.id)) },
    impact () { return getImpact(this.selectedProductIds, this.professionIds, this.productCache) },
    actionLabel () {
      if (this.mode === 'shelf') return this.shelfAction === 'ON' ? '批量上架' : '批量下架'
      if (this.priceMode === 'PERCENT') return `按比例下调 ${this.priceValue}%`
      if (this.priceMode === 'FIXED') return `统一设置为 ¥${this.priceValue}`
      return `每个组合减免 ¥${this.priceValue}`
    },
    actionText () { return `“${this.actionLabel}”` },
    priceDetail () {
      if (this.mode !== 'price' || !this.selectedProductObjects.length) return ''
      const known = this.selectedProductObjects.filter(item => typeof item.price === 'number')
      if (!known.length) return '所选课程未返回当前售价，提交前需由商品接口完成价格校验。'
      const prices = known.map(item => this.previewPrice(item.price))
      const range = Math.min(...prices) === Math.max(...prices) ? `¥${Math.min(...prices)}` : `¥${Math.min(...prices)}–¥${Math.max(...prices)}`
      const missing = this.selectedProductObjects.length - known.length
      return `已维护售价的 ${known.length} 个商品，调整后价格区间为 ${range}${missing ? `；另有 ${missing} 个商品未维护售价，本次只校验覆盖范围` : ''}。`
    }
  },
  methods: {
    previewPrice (price) {
      if (this.priceMode === 'PERCENT') return Math.max(0, Math.round(price * (1 - this.priceValue / 100) * 100) / 100)
      if (this.priceMode === 'FIXED') return this.priceValue
      return Math.max(0, Math.round((price - this.priceValue) * 100) / 100)
    },
    onProductChange (ids, products) {
      const updated = products.map(product => ({ ...this.productCache.find(item => item.id === product.id), ...product }))
      this.productCache = this.productCache.filter(item => !ids.includes(item.id)).concat(updated)
    },
    clearMismatch () {
      const ids = this.impact.mismatched.map(item => item.professionId)
      this.professionIds = this.professionIds.filter(item => !ids.includes(item))
    },
    next () {
      if (this.step === 0 && this.mode === 'price' && this.priceValue <= 0) return this.$message.warning('请填写大于 0 的调价数值')
      if (this.step === 1 && !this.selectedProductIds.length) return this.$message.warning('请先选择至少一个商品课程')
      if (this.step === 2 && !this.professionIds.length) return this.$message.warning('请先选择至少一个专业')
      if (this.step === 2 && !this.impact.combinationCount) return this.$message.error('已选专业均不在商品覆盖范围内，请调整后再继续')
      this.step++
    },
    submit () {
      if (!this.effectiveAt) return this.$message.warning('请选择生效时间')
      if (!this.impact.combinationCount) return this.$message.error('没有可生效的商品与专业组合')
      const mismatchText = this.impact.mismatched.length ? `；${this.impact.mismatched.length} 个不适用专业将被跳过` : ''
      this.$confirm(`将对 ${this.impact.combinationCount} 个“商品 × 专业”组合执行${this.actionLabel}，生效时间为 ${this.effectiveAt}${mismatchText}。`, `确认${this.mode === 'shelf' ? '批量操作' : '批量调价'}`, { confirmButtonText: '确认执行', cancelButtonText: '返回检查', type: 'warning' }).then(() => {
        this.submitting = true
        window.setTimeout(() => {
          if (this.$refs.productPicker) {
            if (this.mode === 'shelf') this.$refs.productPicker.applyStatus(this.selectedProductIds, this.shelfAction)
            else this.$refs.productPicker.applyPrice(this.selectedProductIds, price => this.previewPrice(price))
          }
          this.logs.unshift({ time: '刚刚', user: '运营-美惠', content: `${this.actionLabel}，实际影响 ${this.impact.combinationCount} 个组合；专业：${this.impact.valid.map(item => professionName(item.professionId)).join('、')}` })
          this.submitting = false
          this.$message.success(`${this.actionLabel}任务已提交`)
        }, 450)
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.operation-page{max-width:1280px;margin:0 auto}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}.breadcrumb span{color:#5f6876}.breadcrumb i{margin:0 7px}.transfer-alert{margin-top:18px}.step-shell{margin:20px 0 14px}.form-surface{min-height:590px;background:#fff;border-radius:10px}.step-content{padding:26px}.compact-step{max-width:860px;margin:0 auto;padding-top:54px}.step-heading{display:flex;align-items:flex-start;gap:12px;margin-bottom:24px}.step-heading>span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--brand-soft);color:#a90a13;font-weight:700}.step-heading h2{margin:1px 0 3px;font-size:19px}.step-heading p{margin:0;color:var(--muted)}.choice-grid{display:flex;width:100%;gap:12px}.choice-grid ::v-deep .el-radio-button{flex:1}.choice-grid ::v-deep .el-radio-button__inner{display:flex;align-items:flex-start;flex-direction:column;width:100%;padding:18px;text-align:left;border:1px solid #dfe3e8;border-radius:9px;box-shadow:none}.choice-grid ::v-deep .el-radio-button:first-child .el-radio-button__inner,.choice-grid ::v-deep .el-radio-button:last-child .el-radio-button__inner{border-radius:9px}.choice-grid ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner{border-color:#c91420;background:#fff3f4;color:#8f1018;box-shadow:none}.choice-grid strong{font-size:15px}.choice-grid small{margin-top:5px;color:#667085;white-space:normal}.price-choice{align-items:stretch}.number-setting{display:flex;align-items:center;gap:10px;margin-top:24px;padding:18px;background:#f7f8fa;border-radius:8px}.effective-form{max-width:420px}.effective-form .el-date-editor{width:100%}.confirmation-list{display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.confirmation-list>div{display:flex;flex-direction:column;gap:4px;padding:16px}.confirmation-list>div+div{border-left:1px solid var(--line)}.confirmation-list span{color:var(--muted);font-size:12px}.page-actions{display:flex;justify-content:flex-end;gap:8px;padding:18px 0 40px}@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.choice-grid{flex-direction:column}.confirmation-list{grid-template-columns:1fr 1fr}.confirmation-list>div:nth-child(3){border-left:0;border-top:1px solid var(--line)}.confirmation-list>div:nth-child(4){border-top:1px solid var(--line)}}
</style>
