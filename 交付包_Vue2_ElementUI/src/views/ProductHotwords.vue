<template>
  <section class="hotword-list">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />商品管理<i class="el-icon-arrow-right" />售卖热词</div>
        <h1 class="page-title">售卖热词</h1>
        <p class="page-description">商品编辑里不再挂热词。在这里反向匹配商品：一句热词对上哪些商品，保存后才生效。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索热词、商品名称或商品 ID" />
      <el-button type="primary" @click="openEditor()">新增热词</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column prop="id" label="热词 ID" width="96" />
        <el-table-column label="热词名称" min-width="220">
          <template slot-scope="s"><strong>{{ s.row.name }}</strong></template>
        </el-table-column>
        <el-table-column label="反向匹配商品" min-width="280">
          <template slot-scope="s">
            <span v-if="!productRows(s.row).length" class="muted">未匹配商品</span>
            <span v-else>{{ productSummary(s.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="s">
            <el-button type="text" @click="openEditor(s.row)">编辑</el-button>
            <el-button type="text" class="danger-text" @click="askDelete(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog :title="editingId ? '编辑热词' : '新增热词'" :visible.sync="editorVisible" width="800px" append-to-body :close-on-click-modal="false" custom-class="product-dialog">
      <p class="dialog-meta">{{ editingId ? `热词 ID ${editingId}。改文案，并反向勾选用这句标签的商品。` : '写一句短标签，再反向勾选商品。最多 30 字。' }}</p>
      <el-form label-width="88px">
        <el-form-item label="热词名称" required>
          <el-input v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：精准提升" />
        </el-form-item>
      </el-form>
      <section class="field-block last">
        <h3>反向匹配商品</h3>
        <p class="field-hint">商品侧不再选热词。这里勾上的商品才会带这句标签。</p>
        <div class="picker-bar">
          <el-input v-model.trim="pickerKeyword" clearable placeholder="商品名称 / ID" />
          <el-select v-model="pickerProject" @change="onPickerProjectChange">
            <el-option label="全部项目" value="all" />
            <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="pickerProfession">
            <el-option label="全部专业" value="all" />
            <el-option v-for="item in pickerProfessionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        <p class="field-note picker-count">已勾 {{ form.productIds.length }} 个</p>
        <el-table :data="pickerRows" row-key="id" class="inner-table">
          <el-table-column label="" width="52">
            <template slot-scope="s">
              <el-checkbox
                :value="form.productIds.includes(s.row.id)"
                :aria-label="`选择${s.row.name}`"
                @change="togglePick(s.row.id, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="id" label="商品 ID" width="96" />
          <el-table-column prop="name" label="商品名称" min-width="200" />
          <el-table-column prop="profession" label="专业" min-width="120" />
          <el-table-column label="价格" width="88"><template slot-scope="s">{{ priceText(s.row.price) }}</template></el-table-column>
        </el-table>
        <p v-if="!pickerRows.length" class="empty inner">没有匹配商品。可换项目或清空名称。</p>
      </section>
      <template slot="footer">
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="确认删除？" :visible.sync="confirmVisible" width="480px" append-to-body>
      <p v-if="pending" class="dialog-meta">热词 ID {{ pending.id }} · {{ pending.name }}。删除后已匹配的商品不再带这句标签，可立即撤回。</p>
      <el-alert title="真实后台删除可能影响已引用该热词的商品；当前演示不会提交后台。" type="warning" :closable="false" show-icon />
      <template slot="footer">
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="removeRow">确认删除</el-button>
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
import { backendHotwords } from '../data/hotwords.js'
import { backendProducts, PROJECTS, PROFESSIONS } from '../data/productList.js'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'hotword-list-demo-v2'
const PRODUCT_STORAGE = 'product-list-demo-v4'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function loadProducts () {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_STORAGE) || localStorage.getItem('product-list-demo-v3'))
    if (saved && saved.rows && saved.rows.length) return saved.rows
  } catch (error) {}
  return copy(backendProducts)
}

function normalizeHotword (item) {
  return {
    ...item,
    productIds: Array.isArray(item.productIds) ? item.productIds.slice() : []
  }
}

export default {
  name: 'ProductHotwords',
  data () {
    return {
      rows: [],
      products: [],
      projects: PROJECTS,
      keyword: '',
      editorVisible: false,
      editingId: null,
      form: { name: '', productIds: [] },
      pickerKeyword: '',
      pickerProject: 'all',
      pickerProfession: 'all',
      confirmVisible: false,
      pending: null,
      undoAction: null,
      toast: { visible: false, text: '' },
      toastTimer: null
    }
  },
  computed: {
    pickerProfessionOptions () {
      if (this.pickerProject === 'all') return this.projects.reduce((list, project) => list.concat(PROFESSIONS[project] || []), [])
      return PROFESSIONS[this.pickerProject] || []
    },
    pickerRows () {
      const query = this.pickerKeyword.toLowerCase()
      return this.products.filter(item => {
        if (this.pickerProject !== 'all' && item.project !== this.pickerProject) return false
        if (this.pickerProfession !== 'all' && item.profession !== this.pickerProfession) return false
        if (query && !`${item.name} ${item.id}`.toLowerCase().includes(query)) return false
        return true
      })
    },
    visible () {
      const query = this.keyword.toLowerCase()
      return this.rows.filter(item => {
        if (!query) return true
        if (`${item.name} ${item.id}`.toLowerCase().includes(query)) return true
        return this.productRows(item).some(product => `${product.name} ${product.id}`.toLowerCase().includes(query))
      }).sort((a, b) => b.id - a.id)
    },
    emptyText () {
      if (this.keyword) return '没有匹配的热词或商品，换个名称或 ID 试试。'
      return '还没有售卖热词。可新增一句，再反向匹配商品。'
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      this.products = loadProducts()
      try {
        const rawV2 = localStorage.getItem(STORAGE_KEY)
        const rawLegacy = localStorage.getItem('hotword-list-demo-v1')
        const saved = JSON.parse(rawV2 || rawLegacy)
        const fromLegacy = !rawV2 && !!rawLegacy
        this.rows = saved && saved.rows && saved.rows.length
          ? saved.rows.map(item => {
            const next = normalizeHotword(item)
            if (fromLegacy && !next.productIds.length) {
              const seed = backendHotwords.find(row => row.id === next.id)
              if (seed) next.productIds = seed.productIds.slice()
            }
            return next
          })
          : copy(backendHotwords).map(normalizeHotword)
      } catch (error) {
        this.rows = copy(backendHotwords).map(normalizeHotword)
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    nextId () { return Math.max(...this.rows.map(row => Number(row.id) || 0), 400) + 1 },
    priceText (value) { return value == null ? '—' : value },
    productRows (item) {
      return (item.productIds || []).map(id => this.products.find(product => product.id === id)).filter(Boolean)
    },
    productSummary (item) {
      const rows = this.productRows(item)
      const names = rows.slice(0, 2).map(product => product.name)
      const extra = rows.length > 2 ? ` 等 ${rows.length} 个` : ` · ${rows.length} 个`
      return names.join('、') + extra
    },
    onPickerProjectChange () { this.pickerProfession = 'all' },
    togglePick (id, checked) {
      if (checked) {
        if (!this.form.productIds.includes(id)) this.form.productIds = this.form.productIds.concat(id)
        return
      }
      this.form.productIds = this.form.productIds.filter(item => item !== id)
    },
    openEditor (item) {
      this.products = loadProducts()
      this.editingId = item ? item.id : null
      this.form = {
        name: item ? item.name : '',
        productIds: item ? copy(item.productIds || []) : []
      }
      this.pickerKeyword = ''
      this.pickerProject = 'all'
      this.pickerProfession = 'all'
      this.editorVisible = true
    },
    save () {
      if (!this.form.name) return this.$message.warning('请填写热词名称')
      const duplicate = this.rows.find(row => row.id !== this.editingId && row.name === this.form.name)
      if (duplicate) return this.$message.warning('已经有这一句热词了')
      let item = this.rows.find(row => row.id === this.editingId)
      const stamp = nowStamp()
      if (!item) {
        item = { id: this.nextId(), createdAt: stamp, productIds: [] }
        this.rows.unshift(item)
      }
      item.name = this.form.name
      item.productIds = Array.from(new Set(this.form.productIds))
      item.updatedBy = OPERATOR
      item.updatedAt = stamp
      this.persist()
      this.editorVisible = false
      const count = item.productIds.length
      this.showToast(count ? `已保存「${item.name}」，匹配 ${count} 个商品` : `已保存「${item.name}」，尚未匹配商品`)
    },
    askDelete (item) { this.pending = item; this.confirmVisible = true },
    removeRow () {
      if (!this.pending) return
      const index = this.rows.findIndex(row => row.id === this.pending.id)
      const removed = copy(this.pending)
      if (index >= 0) this.rows.splice(index, 1)
      this.persist()
      this.confirmVisible = false
      this.undoAction = () => { this.rows.splice(index, 0, removed); this.persist() }
      this.showToast(`「${removed.name}」已删除`, true)
      this.pending = null
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
.hotword-list{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(320px,100%)}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.danger-text,.data-table ::v-deep .danger-text{color:#c9232d}
.muted{color:#8a919e}
.empty{padding:40px 20px;color:#667085;text-align:center}
.empty.inner{padding:18px 0}
.dialog-meta{margin:-5px 0 16px;color:#667085}
.field-block.last{margin:8px 0 0}
.field-block h3{margin:0 0 6px;font-size:15px}
.field-hint,.field-note{margin:0 0 12px;color:#667085;line-height:1.6}
.field-note{margin:6px 0 0}
.picker-bar{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px}
.picker-bar .el-input{width:220px}
.picker-count{margin:0 0 10px}
.inner-table{margin-top:4px}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
