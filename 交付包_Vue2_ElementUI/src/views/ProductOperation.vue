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

    <el-alert
      v-if="transfer.source"
      class="transfer-alert"
      type="success"
      show-icon
      :closable="false"
      :title="`已从${transfer.source}带入 ${selectedProductIds.length} 个商品、${professionIds.length} 个专业`"
    />

    <aside class="intro-banner">
      <p>同一班型给一批专业执行同一操作。规则填一次，专业按科室一键勾选，系统按「商品 × 专业」生成实际记录，不必每个专业再走一遍。</p>
    </aside>

    <div class="workspace-grid">
      <div class="config-panel">
        <section class="field-block">
          <div class="field-label">{{ mode === 'shelf' ? '本次操作' : '调价规则' }}</div>
          <p class="field-hint">一次任务只执行一种操作，避免同批次规则互相覆盖。</p>
          <template v-if="mode === 'shelf'">
            <el-radio-group v-model="shelfAction" class="choice-grid">
              <el-radio-button label="ON"><strong>批量上架</strong><small>生效起可售，截止后停售</small></el-radio-button>
              <el-radio-button label="OFF"><strong>批量下架</strong><small>生效起停售，截止结束本次下架窗口</small></el-radio-button>
            </el-radio-group>
          </template>
          <template v-else>
            <el-radio-group v-model="priceMode" class="choice-grid price-choice">
              <el-radio-button label="REDUCE"><strong>减免固定金额</strong><small>在当前售价上统一减</small></el-radio-button>
              <el-radio-button label="PERCENT"><strong>按比例下调</strong><small>按百分比统一下调</small></el-radio-button>
              <el-radio-button label="FIXED"><strong>设置统一价格</strong><small>有效组合改为同一价</small></el-radio-button>
            </el-radio-group>
            <div class="number-setting">
              <span v-if="priceMode === 'REDUCE'">每个组合减免</span>
              <span v-else-if="priceMode === 'PERCENT'">当前价格下调</span>
              <span v-else>统一设置为</span>
              <el-input-number
                v-model="priceValue"
                :min="priceMode === 'PERCENT' ? 1 : 0"
                :max="priceMode === 'PERCENT' ? 99 : 99999"
                :precision="priceMode === 'PERCENT' ? 0 : 2"
                controls-position="right"
              />
              <span>{{ priceMode === 'PERCENT' ? '%' : '元' }}</span>
            </div>
          </template>
        </section>

        <section class="field-block">
          <div class="field-label">班型商品</div>
          <p class="field-hint">先选定班型。中级职称各专业往往是同一班型、内容不同，不必按专业重复挑课。</p>
          <ProductPicker ref="productPicker" v-model="selectedProductIds" @change="onProductChange" />
        </section>

        <section class="field-block">
          <div class="field-label">专业范围</div>
          <p class="field-hint">展开项目后可按科室整组勾选。班型覆盖不到的专业会标出，执行时自动跳过。</p>
          <ProfessionTree v-model="professionIds" :selected-products="selectedProductObjects" />
        </section>

        <section class="field-block">
          <div class="field-label">{{ mode === 'shelf' ? '生效与截止时间' : '生效时间' }}</div>
          <p class="field-hint">{{ timeHint }}</p>
          <div :class="['time-fields', { split: mode === 'shelf' }]">
            <el-date-picker
              v-model="effectiveAt"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="选择生效时间"
              :picker-options="dateOptions"
            />
            <el-date-picker
              v-if="mode === 'shelf'"
              v-model="endAt"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="选择截止时间"
              :picker-options="dateOptions"
            />
          </div>
          <p v-if="mode === 'shelf' && dateInvalid" class="date-warning">截止时间不能早于生效时间</p>
        </section>

        <el-button type="primary" class="save-btn" :loading="submitting" @click="submit">确认{{ mode === 'shelf' ? '执行' : '调价' }}</el-button>
        <p class="save-note">已选 <b>{{ selectedProductIds.length }}</b> 个班型、<b>{{ professionIds.length }}</b> 个专业，实际将生效 <b>{{ impact.combinationCount }}</b> 个「商品 × 专业」组合。</p>
      </div>

      <aside class="side-column">
        <p class="side-label">本次将生效</p>
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
          <div><span>班型</span><strong>{{ selectedProductIds.length }} 个</strong></div>
          <div><span>专业</span><strong>{{ professionIds.length }} 个</strong></div>
          <div><span>实际组合</span><strong>{{ impact.combinationCount }}</strong></div>
          <template v-if="mode === 'shelf'">
            <div><span>生效时间</span><strong>{{ effectiveAt || '未选' }}</strong></div>
            <div><span>截止时间</span><strong>{{ endAt || '未选' }}</strong></div>
          </template>
        </div>
        <p class="side-label">变更记录</p>
        <OperationLog :logs="logs" />
      </aside>
    </div>
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
      shelfAction: 'OFF',
      priceMode: 'REDUCE',
      priceValue: 980,
      selectedProductIds: Array.isArray(transfer.products) ? transfer.products : [],
      professionIds: Array.isArray(transfer.professions) ? transfer.professions : [],
      productCache: allOperationProducts.map(item => ({ ...item })),
      effectiveAt: '',
      endAt: '',
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
    description () {
      return this.mode === 'shelf'
        ? '规则和班型填一次，专业按科室一键勾选，并填写生效与截止时间，按实际覆盖组合批量上架或下架。'
        : '规则和班型填一次，专业按科室一键勾选，按实际覆盖组合统一调价。'
    },
    selectedProductObjects () { return this.productCache.filter(item => this.selectedProductIds.includes(item.id)) },
    impact () { return getImpact(this.selectedProductIds, this.professionIds, this.productCache) },
    actionLabel () {
      if (this.mode === 'shelf') return this.shelfAction === 'ON' ? '批量上架' : '批量下架'
      if (this.priceMode === 'PERCENT') return `按比例下调 ${this.priceValue}%`
      if (this.priceMode === 'FIXED') return `统一设置为 ¥${this.priceValue}`
      return `每个组合减免 ¥${this.priceValue}`
    },
    actionText () { return `“${this.actionLabel}”` },
    timeHint () {
      if (this.mode !== 'shelf') return '调价在指定时间生效。'
      return this.shelfAction === 'ON'
        ? '上架从生效时间开始可售，到截止时间停售。'
        : '下架从生效时间开始停售，到截止时间结束本次下架窗口。是否自动恢复上架以后台为准。'
    },
    dateInvalid () {
      if (this.mode !== 'shelf' || !this.effectiveAt || !this.endAt) return false
      return new Date(this.endAt).getTime() <= new Date(this.effectiveAt).getTime()
    },
    timeWindowText () {
      if (this.mode !== 'shelf') return `生效时间为 ${this.effectiveAt}`
      return `生效时间为 ${this.effectiveAt}，截止时间为 ${this.endAt}`
    },
    priceDetail () {
      if (this.mode !== 'price' || !this.selectedProductObjects.length) return ''
      const known = this.selectedProductObjects.filter(item => typeof item.price === 'number')
      if (!known.length) return '所选课程未返回当前售价，提交前需由商品接口完成价格校验。测算仅供参考。'
      const prices = known.map(item => this.previewPrice(item.price))
      const range = Math.min(...prices) === Math.max(...prices) ? `¥${Math.min(...prices)}` : `¥${Math.min(...prices)}–¥${Math.max(...prices)}`
      const missing = this.selectedProductObjects.length - known.length
      return `已维护售价的 ${known.length} 个商品，调整后价格区间为 ${range}（仅供参考）${missing ? `；另有 ${missing} 个商品未维护售价，本次只校验覆盖范围` : ''}。`
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
    submit () {
      if (this.mode === 'price' && this.priceValue <= 0) return this.$message.warning('请填写大于 0 的调价数值')
      if (!this.selectedProductIds.length) return this.$message.warning('请先选择至少一个班型商品')
      if (!this.professionIds.length) return this.$message.warning('请先勾选至少一个专业')
      if (!this.impact.combinationCount) return this.$message.error('已选专业均不在商品覆盖范围内，请调整后再保存')
      if (!this.effectiveAt) return this.$message.warning('请选择生效时间')
      if (this.mode === 'shelf' && !this.endAt) return this.$message.warning('请选择截止时间')
      if (this.dateInvalid) return this.$message.error('截止时间不能早于生效时间，请检查日期')
      const mismatchText = this.impact.mismatched.length ? `；${this.impact.mismatched.length} 个不适用专业将被跳过` : ''
      this.$confirm(
        `将对 ${this.impact.combinationCount} 个「商品 × 专业」组合执行${this.actionLabel}，${this.timeWindowText}${mismatchText}。`,
        `确认${this.mode === 'shelf' ? '批量操作' : '批量调价'}`,
        { confirmButtonText: '确认执行', cancelButtonText: '返回检查', type: 'warning' }
      ).then(() => {
        this.submitting = true
        window.setTimeout(() => {
          if (this.$refs.productPicker) {
            if (this.mode === 'shelf') this.$refs.productPicker.applyStatus(this.selectedProductIds, this.shelfAction)
            else this.$refs.productPicker.applyPrice(this.selectedProductIds, price => this.previewPrice(price))
          }
          this.logs.unshift({
            time: '刚刚',
            user: '运营-美惠',
            content: `${this.actionLabel}，${this.timeWindowText}，实际影响 ${this.impact.combinationCount} 个组合；专业：${this.impact.valid.map(item => professionName(item.professionId)).join('、')}`
          })
          this.submitting = false
          this.$message.success(`${this.actionLabel}任务已提交`)
        }, 450)
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.operation-page{max-width:1280px;margin:0 auto}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.transfer-alert{margin-top:16px}
.intro-banner{margin:16px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#166350;line-height:1.7}
.workspace-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px;align-items:start}
.config-panel,.side-column .impact-summary{border:1px solid var(--line);border-radius:10px;background:#fff}
.config-panel{padding:22px 24px}
.field-block{margin-bottom:28px;padding-bottom:22px;border-bottom:1px dashed var(--line)}
.field-block:last-of-type{border-bottom:0;margin-bottom:12px;padding-bottom:0}
.field-label{margin-bottom:6px;font-weight:700}
.field-hint{margin:0 0 14px;color:var(--muted);font-size:12px;line-height:1.6}
.choice-grid{display:flex;width:100%;gap:12px}
.choice-grid ::v-deep .el-radio-button{flex:1}
.choice-grid ::v-deep .el-radio-button__inner{display:flex;align-items:flex-start;flex-direction:column;width:100%;padding:14px 16px;text-align:left;border:1px solid #dfe3e8;border-radius:9px;box-shadow:none}
.choice-grid ::v-deep .el-radio-button:first-child .el-radio-button__inner,
.choice-grid ::v-deep .el-radio-button:last-child .el-radio-button__inner{border-radius:9px}
.choice-grid ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner{border-color:#c91420;background:#fff3f4;color:#8f1018;box-shadow:none}
.choice-grid strong{font-size:15px}
.choice-grid small{margin-top:5px;color:#667085;white-space:normal}
.number-setting{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:14px;padding:14px 16px;background:#f7f8fa;border-radius:8px}
.config-panel ::v-deep .product-list{max-height:240px}
.config-panel ::v-deep .category-list{max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:8px}
.time-fields{display:grid;gap:10px}
.time-fields.split{grid-template-columns:1fr 1fr}
.config-panel .el-date-editor{width:100%}
.date-warning{margin:8px 0 0;color:#8f1018;font-size:12px}
.save-btn{width:100%;margin-top:6px}
.save-note{margin:8px 0 0;color:var(--muted);font-size:12px;text-align:center}
.side-label{margin:0 0 10px;color:var(--muted);font-size:12px;font-weight:700}
.side-column .impact-summary{margin-bottom:12px}
.confirmation-list{display:grid;grid-template-columns:1fr 1fr;margin-bottom:18px;border:1px solid var(--line);border-radius:10px;background:#fff}
.confirmation-list>div{display:flex;flex-direction:column;gap:4px;padding:12px 14px}
.confirmation-list>div:nth-child(odd){border-right:1px solid var(--line)}
.confirmation-list>div:nth-child(n+3){border-top:1px solid var(--line)}
.confirmation-list span{color:var(--muted);font-size:12px}
.operation-page ::v-deep .product-picker,.operation-page ::v-deep .profession-picker{background:transparent}
@media(max-width:980px){
  .page-head{align-items:flex-start;flex-direction:column}
  .workspace-grid{grid-template-columns:1fr}
  .choice-grid{flex-direction:column}
  .time-fields.split{grid-template-columns:1fr}
}
</style>
