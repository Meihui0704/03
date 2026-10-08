<template>
  <section class="freight-list">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />商品管理<i class="el-icon-arrow-right" />运费管理</div>
        <h1 class="page-title">运费管理</h1>
        <p class="page-description">给要邮寄的商品套运费模板。启用停用在表里改。编辑只改名称、按重量还是按件数，以及每一组省份的首费和续费。关联商品数只读，不在这里绑 SKU。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-radio-group v-model="statusFilter">
        <el-radio-button label="on">启用 {{ onCount }}</el-radio-button>
        <el-radio-button label="off">停用 {{ offCount }}</el-radio-button>
        <el-radio-button label="all">全部 {{ rows.length }}</el-radio-button>
      </el-radio-group>
      <el-select v-model="billingFilter" placeholder="计费方式">
        <el-option label="全部计费" value="all" />
        <el-option v-for="item in billingModes" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索模板名称" />
      <el-button type="primary" @click="openEditor()">新增模板</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column label="模板名称" min-width="200">
          <template slot-scope="s"><strong>{{ s.row.name }}</strong></template>
        </el-table-column>
        <el-table-column label="计费方式" width="100">
          <template slot-scope="s">{{ billingLabel(s.row.billing) }}</template>
        </el-table-column>
        <el-table-column label="配送区域" width="88">
          <template slot-scope="s">{{ (s.row.zones || []).length }} 组</template>
        </el-table-column>
        <el-table-column label="关联商品" width="96">
          <template slot-scope="s">{{ s.row.productCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '启用' : '停用' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="s">
            <el-button type="text" @click="toggleStatus(s.row)">{{ s.row.status === 'on' ? '停用' : '启用' }}</el-button>
            <el-button type="text" @click="openEditor(s.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog :title="editingId ? '编辑运费' : '新增运费'" :visible.sync="editorVisible" width="920px" append-to-body :close-on-click-modal="false" custom-class="product-dialog">
      <p class="dialog-meta">{{ editingId ? '改这一套怎么计费。启用请回列表。' : '先定名称和计费方式，再按省份分组填首费、续费。' }}</p>
      <el-form label-width="108px">
        <el-form-item label="模板名称" required>
          <el-input v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：考编" />
        </el-form-item>
        <el-form-item label="计费方式" required>
          <el-radio-group v-model="form.billing">
            <el-radio v-for="item in billingModes" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="zone-head">
        <h3>配送区域</h3>
        <el-button type="primary" size="small" @click="addZone">添加一组</el-button>
      </div>
      <el-table :data="form.zones" class="inner-table" empty-text="还没有区域。至少加一组省份。">
        <el-table-column label="可配送区域" min-width="220">
          <template slot-scope="s">
            <el-select v-model="s.row.regions" multiple filterable collapse-tags placeholder="选择省份">
              <el-option v-for="item in provinces" :key="item" :label="item" :value="item" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column :label="form.billing === 'weight' ? '首重' : '首件'" width="110">
          <template slot-scope="s"><el-input-number v-model="s.row.firstQty" :min="0" :precision="0" controls-position="right" size="small" /></template>
        </el-table-column>
        <el-table-column label="运费(元)" width="120">
          <template slot-scope="s"><el-input-number v-model="s.row.firstFee" :min="0" :precision="2" controls-position="right" size="small" /></template>
        </el-table-column>
        <el-table-column :label="form.billing === 'weight' ? '续重' : '续件'" width="110">
          <template slot-scope="s"><el-input-number v-model="s.row.extraQty" :min="0" :precision="0" controls-position="right" size="small" /></template>
        </el-table-column>
        <el-table-column label="续费(元)" width="120">
          <template slot-scope="s"><el-input-number v-model="s.row.extraFee" :min="0" :precision="2" controls-position="right" size="small" /></template>
        </el-table-column>
        <el-table-column label="" width="72">
          <template slot-scope="s">
            <el-button type="text" class="danger-text" @click="removeZone(s.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template slot="footer">
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <transition name="toast">
      <div v-if="toast.visible" class="undo-toast" role="status">
        <span>{{ toast.text }}</span>
        <button v-if="undoAction" type="button" @click="undoLast">撤回</button>
        <button type="button" @click="toast.visible = false">关闭</button>
      </div>
    </transition>
  </section>
</template>

<script>
import { backendFreight, BILLING_MODES, PROVINCES } from '../data/freight.js'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'freight-list-demo-v1'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function blankZone () {
  return { regions: [], firstQty: 1, firstFee: 0, extraQty: 1, extraFee: 0 }
}

function blankForm () {
  return { name: '', billing: 'weight', zones: [blankZone()] }
}

export default {
  name: 'ProductFreight',
  data () {
    return {
      rows: [],
      billingModes: BILLING_MODES,
      provinces: PROVINCES,
      keyword: '',
      statusFilter: 'on',
      billingFilter: 'all',
      editorVisible: false,
      editingId: null,
      form: blankForm(),
      undoAction: null,
      toast: { visible: false, text: '' },
      toastTimer: null
    }
  },
  computed: {
    onCount () { return this.rows.filter(item => item.status === 'on').length },
    offCount () { return this.rows.filter(item => item.status === 'off').length },
    visible () {
      const query = this.keyword.toLowerCase()
      return this.rows.filter(item => {
        if (this.statusFilter !== 'all' && item.status !== this.statusFilter) return false
        if (this.billingFilter !== 'all' && item.billing !== this.billingFilter) return false
        if (query && !item.name.toLowerCase().includes(query)) return false
        return true
      }).sort((a, b) => a.id - b.id)
    },
    emptyText () {
      if (this.keyword || this.billingFilter !== 'all') return '没有匹配的运费模板，换个名称或计费方式试试。'
      if (this.statusFilter === 'on') return '当前没有启用中的模板。可切换到「停用」查看。'
      if (this.statusFilter === 'off') return '当前没有停用模板。'
      return '还没有运费模板。'
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        this.rows = saved.rows && saved.rows.length ? saved.rows : copy(backendFreight)
      } catch (error) {
        this.rows = copy(backendFreight)
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    nextId () { return Math.max(...this.rows.map(row => Number(row.id) || 0), 0) + 1 },
    billingLabel (value) { return (BILLING_MODES.find(item => item.value === value) || {}).label || value },
    openEditor (item) {
      this.editingId = item ? item.id : null
      this.form = item
        ? { name: item.name, billing: item.billing, zones: copy(item.zones || []) }
        : blankForm()
      if (!this.form.zones.length) this.form.zones.push(blankZone())
      this.editorVisible = true
    },
    addZone () { this.form.zones.push(blankZone()) },
    removeZone (index) {
      if (this.form.zones.length === 1) return this.$message.warning('至少留一组配送区域')
      this.form.zones.splice(index, 1)
    },
    save () {
      if (!this.form.name) return this.$message.warning('请填写模板名称')
      if (!this.form.zones.length) return this.$message.warning('请添加配送区域')
      if (this.form.zones.some(zone => !zone.regions || !zone.regions.length)) {
        return this.$message.warning('每一组都要选省份')
      }
      let item = this.rows.find(row => row.id === this.editingId)
      const stamp = nowStamp()
      if (!item) {
        item = { id: this.nextId(), status: 'off', productCount: 0, createdAt: stamp }
        this.rows.unshift(item)
      }
      Object.assign(item, {
        name: this.form.name,
        billing: this.form.billing,
        zones: copy(this.form.zones),
        updatedBy: OPERATOR,
        updatedAt: stamp
      })
      this.persist()
      this.editorVisible = false
      this.statusFilter = item.status
      this.showToast(item.status === 'off' ? '模板已保存，已在「停用」里' : '模板已保存（仅当前演示）')
    },
    toggleStatus (item) {
      const previous = item.status
      item.status = item.status === 'on' ? 'off' : 'on'
      item.updatedBy = OPERATOR
      item.updatedAt = nowStamp()
      this.persist()
      this.statusFilter = item.status
      this.undoAction = () => {
        item.status = previous
        this.persist()
        this.statusFilter = previous
      }
      this.showToast(item.status === 'on' ? `「${item.name}」已启用` : `「${item.name}」已停用`, true)
    },
    undoLast () {
      if (!this.undoAction) return
      this.undoAction()
      this.undoAction = null
      this.toast.visible = false
      this.$message.success('已撤回刚才的操作')
    },
    showToast (text, undo = false) {
      this.toast = { visible: true, text }
      if (!undo) this.undoAction = null
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.toast.visible = false; if (!undo) this.undoAction = null }, undo ? 12000 : 4000)
    }
  }
}
</script>

<style scoped>
.freight-list{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(240px,100%)}
.toolbar .el-select{width:140px}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}
.status.on{background:#eaf6f1;color:#147a62}
.status.off{background:#e8ebee;color:#69717c}
.empty{padding:40px 20px;color:#667085;text-align:center}
.dialog-meta{margin:-5px 0 16px;color:#667085}
.zone-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0 10px}
.zone-head h3{margin:0;font-size:15px}
.inner-table ::v-deep .el-select{width:100%}
.inner-table ::v-deep .el-input-number{width:96px}
.danger-text,.inner-table ::v-deep .danger-text{color:#c9232d}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.toolbar .el-select,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
