<template>
  <section class="coupon-page">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />App优惠券管理</div>
        <h1 class="page-title">App优惠券管理</h1>
        <p class="page-description">配置优惠规则，并明确优惠券实际覆盖的商品与专业组合。</p>
      </div>
      <el-button @click="$router.push('/business-lines')">从全部项目清单选择</el-button>
    </header>

    <el-alert v-if="transfer.source" class="transfer-alert" type="success" show-icon :closable="false" :title="`已从${transfer.source}带入 ${productIds.length} 个商品、${professionIds.length} 个专业`" />

    <div class="step-shell">
      <el-steps :active="step" finish-status="success" simple>
        <el-step title="优惠规则" />
        <el-step title="适用商品" />
        <el-step title="项目与专业" />
        <el-step title="有效期与确认" />
      </el-steps>
    </div>

    <div class="form-surface">
      <section v-show="step === 0" class="step-content rule-step">
        <div class="step-heading"><span>1</span><div><h2>设置优惠规则</h2><p>名称用于运营识别；同一张优惠券只能选择一种优惠方式。</p></div></div>
        <el-form ref="ruleForm" :model="form" :rules="rules" label-position="top" class="rule-form">
          <el-form-item label="优惠券名称" prop="name"><el-input v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：2027 中级职称新学员优惠券" /></el-form-item>
          <el-form-item label="优惠方式" prop="type">
            <el-radio-group v-model="form.type" class="coupon-type-grid">
              <el-radio-button label="FULL"><strong>满减</strong><small>达到指定金额后减免</small></el-radio-button>
              <el-radio-button label="DISCOUNT"><strong>按比例折扣</strong><small>按照商品金额打折</small></el-radio-button>
              <el-radio-button label="DIRECT"><strong>自定义直减</strong><small>不设使用门槛直接减免</small></el-radio-button>
            </el-radio-group>
          </el-form-item>
          <div class="rule-setting">
            <template v-if="form.type === 'FULL'">
              <span>商品金额满</span><el-input-number v-model="form.threshold" :min="1" :precision="2" controls-position="right" /><span>元，减</span><el-input-number v-model="form.amount" :min="1" :precision="2" controls-position="right" /><span>元</span>
            </template>
            <template v-else-if="form.type === 'DISCOUNT'">
              <span>商品金额按</span><el-input-number v-model="form.discount" :min="1" :max="9.9" :step="0.1" :precision="1" controls-position="right" /><span>折结算</span>
            </template>
            <template v-else>
              <span>每个有效组合直接减免</span><el-input-number v-model="form.amount" :min="1" :precision="2" controls-position="right" /><span>元</span>
            </template>
          </div>
        </el-form>
      </section>

      <section v-show="step === 1" class="step-content">
        <div class="step-heading"><span>2</span><div><h2>选择适用商品</h2><p>支持课程分组、整组选择、搜索、新增和移除。</p></div></div>
        <ProductPicker ref="productPicker" v-model="productIds" @change="onProductChange" />
      </section>

      <section v-show="step === 2" class="step-content">
        <div class="step-heading"><span>3</span><div><h2>选择项目与专业</h2><p>按 13 个项目定位专业；不在商品覆盖范围内的专业会明确标注。</p></div></div>
        <ProfessionTree v-model="professionIds" :selected-products="selectedProductObjects" />
      </section>

      <section v-show="step === 3" class="step-content final-step">
        <div class="step-heading"><span>4</span><div><h2>设置有效期并确认</h2><p>结束时间必须晚于开始时间，提交前会再次校验覆盖冲突。</p></div></div>
        <el-form label-position="top" class="period-form">
          <el-form-item label="优惠券有效期" required>
            <el-date-picker v-model="form.period" type="datetimerange" value-format="yyyy-MM-dd HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" :picker-options="dateOptions" />
          </el-form-item>
        </el-form>
        <ImpactSummary
          :impact="impact"
          :selected-product-count="productIds.length"
          :selected-profession-count="professionIds.length"
          action-text="优惠券"
          :detail="riskDetail"
          @clear-mismatch="clearMismatch"
        />
        <div class="confirmation-list">
          <div><span>优惠券名称</span><strong>{{ form.name }}</strong></div>
          <div><span>优惠方式</span><strong>{{ discountSummary }}</strong></div>
          <div><span>适用商品</span><strong>{{ productIds.length }} 个</strong></div>
          <div><span>实际生成范围</span><strong>{{ impact.combinationCount }} 个商品 × 专业组合</strong></div>
        </div>
        <OperationLog :logs="logs" />
      </section>
    </div>

    <footer class="page-actions">
      <el-button v-if="step > 0" @click="step--">上一步</el-button>
      <el-button v-if="step < 3" type="primary" @click="next">下一步</el-button>
      <el-button v-else type="primary" :loading="submitting" @click="submit">保存配置</el-button>
    </footer>
  </section>
</template>

<script>
import ProductPicker from '../components/ProductPicker.vue'
import ProfessionTree from '../components/ProfessionTree.vue'
import ImpactSummary from '../components/ImpactSummary.vue'
import OperationLog from '../components/OperationLog.vue'
import { allOperationProducts, getImpact, readTransfer } from '../data/phase1Business'

export default {
  name: 'CouponConfig',
  components: { ProductPicker, ProfessionTree, ImpactSummary, OperationLog },
  data () {
    const transfer = readTransfer()
    return {
      transfer,
      step: 0,
      productIds: Array.isArray(transfer.products) ? transfer.products : [],
      professionIds: Array.isArray(transfer.professions) ? transfer.professions : [],
      productCache: allOperationProducts.map(item => ({ ...item })),
      form: { name: '', type: 'FULL', threshold: 1000, amount: 200, discount: 8, period: [] },
      rules: { name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }] },
      submitting: false,
      dateOptions: { disabledDate: date => date.getTime() < Date.now() - 86400000 },
      logs: [
        { time: '07-15 15:40', user: '运营-张旭', content: '更新“精华体验课”适用专业范围' },
        { time: '07-12 10:10', user: '运营-王倩', content: '中级职称精英班配置满 1000 减 200 优惠券' }
      ]
    }
  },
  computed: {
    selectedProductObjects () { return this.productCache.filter(item => this.productIds.includes(item.id)) },
    impact () { return getImpact(this.productIds, this.professionIds, this.productCache) },
    discountSummary () {
      if (this.form.type === 'DISCOUNT') return `${this.form.discount} 折`
      if (this.form.type === 'DIRECT') return `直减 ¥${this.form.amount}`
      return `满 ¥${this.form.threshold} 减 ¥${this.form.amount}`
    },
    riskDetail () {
      const frequentlyChanged = this.professionIds.some(id => id.includes('内科主治(303)'))
      return frequentlyChanged ? '内科主治(303) 的优惠配置近 7 天内有过修改，提交前请确认不是重复操作。' : ''
    }
  },
  methods: {
    onProductChange (ids, products) {
      const updated = products.map(product => ({ ...this.productCache.find(item => item.id === product.id), ...product }))
      this.productCache = this.productCache.filter(item => !ids.includes(item.id)).concat(updated)
    },
    clearMismatch () {
      const ids = this.impact.mismatched.map(item => item.professionId)
      this.professionIds = this.professionIds.filter(item => !ids.includes(item))
    },
    next () {
      if (this.step === 0) {
        return this.$refs.ruleForm.validate(valid => {
          if (!valid) return
          if (this.form.type === 'FULL' && this.form.amount >= this.form.threshold) return this.$message.warning('满减金额应小于使用门槛')
          this.step++
        })
      }
      if (this.step === 1 && !this.productIds.length) return this.$message.warning('请先选择至少一个适用商品')
      if (this.step === 2 && !this.professionIds.length) return this.$message.warning('请先选择至少一个适用专业')
      if (this.step === 2 && !this.impact.combinationCount) return this.$message.error('已选专业均不在商品覆盖范围内，请调整后再继续')
      this.step++
    },
    submit () {
      if (!this.form.period || this.form.period.length !== 2) return this.$message.warning('请选择完整的优惠券有效期')
      if (new Date(this.form.period[1]).getTime() <= new Date(this.form.period[0]).getTime()) return this.$message.error('结束时间必须晚于开始时间')
      if (!this.impact.combinationCount) return this.$message.error('没有可生成优惠券的商品与专业组合')
      const skipped = this.impact.mismatched.length ? `；${this.impact.mismatched.length} 个不适用专业将被跳过` : ''
      this.$confirm(`“${this.form.name}”将按${this.discountSummary}配置到 ${this.impact.combinationCount} 个“商品 × 专业”组合${skipped}。`, '确认保存优惠券配置', { confirmButtonText: '确认保存', cancelButtonText: '返回检查', type: 'warning' }).then(() => {
        this.submitting = true
        window.setTimeout(() => {
          this.logs.unshift({ time: '刚刚', user: '运营-美惠', content: `保存“${this.form.name}”：${this.discountSummary}，覆盖 ${this.impact.combinationCount} 个有效组合` })
          this.submitting = false
          this.$message.success('优惠券配置已保存')
        }, 450)
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.coupon-page{max-width:1280px;margin:0 auto}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}.breadcrumb span{color:#5f6876}.breadcrumb i{margin:0 7px}.transfer-alert{margin-top:18px}.step-shell{margin:20px 0 14px}.form-surface{min-height:590px;background:#fff;border-radius:10px}.step-content{padding:26px}.rule-step{max-width:900px;margin:0 auto;padding-top:45px}.step-heading{display:flex;align-items:flex-start;gap:12px;margin-bottom:24px}.step-heading>span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--brand-soft);color:#a90a13;font-weight:700}.step-heading h2{margin:1px 0 3px;font-size:19px}.step-heading p{margin:0;color:var(--muted)}.rule-form{max-width:820px}.coupon-type-grid{display:flex;width:100%;gap:12px}.coupon-type-grid ::v-deep .el-radio-button{flex:1}.coupon-type-grid ::v-deep .el-radio-button__inner{display:flex;align-items:flex-start;flex-direction:column;width:100%;padding:17px;text-align:left;border:1px solid #dfe3e8;border-radius:9px;box-shadow:none}.coupon-type-grid ::v-deep .el-radio-button:first-child .el-radio-button__inner,.coupon-type-grid ::v-deep .el-radio-button:last-child .el-radio-button__inner{border-radius:9px}.coupon-type-grid ::v-deep .el-radio-button__orig-radio:checked+.el-radio-button__inner{border-color:#c91420;background:#fff3f4;color:#8f1018;box-shadow:none}.coupon-type-grid strong{font-size:15px}.coupon-type-grid small{margin-top:5px;color:#667085;white-space:normal}.rule-setting{display:flex;align-items:center;gap:9px;padding:18px;background:#f7f8fa;border-radius:8px}.period-form{max-width:620px}.period-form .el-date-editor{width:100%}.confirmation-list{display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.confirmation-list>div{display:flex;flex-direction:column;gap:4px;padding:16px}.confirmation-list>div+div{border-left:1px solid var(--line)}.confirmation-list span{color:var(--muted);font-size:12px}.page-actions{display:flex;justify-content:flex-end;gap:8px;padding:18px 0 40px}@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.coupon-type-grid{flex-direction:column}.rule-setting{align-items:flex-start;flex-wrap:wrap}.confirmation-list{grid-template-columns:1fr 1fr}.confirmation-list>div:nth-child(3){border-left:0;border-top:1px solid var(--line)}.confirmation-list>div:nth-child(4){border-top:1px solid var(--line)}}
</style>
