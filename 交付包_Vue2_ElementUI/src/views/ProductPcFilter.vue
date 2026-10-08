<template>
  <section class="pc-filter">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />商品管理<i class="el-icon-arrow-right" />PC筛选配置</div>
        <h1 class="page-title">PC筛选配置</h1>
        <p class="page-description">给 PC 商城配「打开这个项目和专业时，先看哪一年」。一行是年份 × 项目 × 专业。默认在表里改，同一项目专业只能有一个默认。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-select v-model="yearFilter" placeholder="年份">
        <el-option label="全部年份" value="all" />
        <el-option v-for="item in years" :key="item" :label="String(item)" :value="item" />
      </el-select>
      <el-select v-model="projectFilter" placeholder="项目" @change="onListProjectChange">
        <el-option label="全部项目" value="all" />
        <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="professionFilter" placeholder="专业">
        <el-option label="全部专业" value="all" />
        <el-option v-for="item in listProfessionOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="defaultFilter" placeholder="默认">
        <el-option label="全部" value="all" />
        <el-option label="仅默认" value="yes" />
        <el-option label="非默认" value="no" />
      </el-select>
      <el-button type="primary" @click="openEditor()">新增筛选</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column prop="year" label="年份" width="88" />
        <el-table-column prop="project" label="项目" min-width="120" />
        <el-table-column prop="profession" label="专业" min-width="180" />
        <el-table-column label="PC 默认" width="100">
          <template slot-scope="s">
            <el-switch
              :value="s.row.isDefault"
              :aria-label="s.row.isDefault ? '取消默认' : '设为默认'"
              @change="value => toggleDefault(s.row, value)"
            />
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

    <el-dialog :title="editingId ? '编辑筛选' : '新增筛选'" :visible.sync="editorVisible" width="520px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">{{ editingId ? `只改这一年挂在哪个项目专业。默认请回列表拨开关。` : '先定年份和项目专业。保存后可在列表设为默认。' }}</p>
      <el-form label-width="88px">
        <el-form-item label="年份" required>
          <el-select v-model="form.year">
            <el-option v-for="item in years" :key="item" :label="String(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目" required>
          <el-select v-model="form.project" @change="onFormProjectChange">
            <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" required>
          <el-select v-model="form.profession" :disabled="!form.project" placeholder="先选项目">
            <el-option v-for="item in professionOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <p v-if="form.project && !professionOptions.length" class="field-note">这个项目没有专业，不能保存。</p>
        </el-form-item>
      </el-form>
      <template slot="footer">
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="确认删除？" :visible.sync="confirmVisible" width="480px" append-to-body>
      <p v-if="pending" class="dialog-meta">{{ pending.year }} · {{ pending.project }} · {{ pending.profession }}。删除后 PC 这一年不再出现在筛选里，可立即撤回。</p>
      <el-alert title="真实后台删除会影响 PC 商城筛选；当前演示不会提交后台。" type="warning" :closable="false" show-icon />
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
import { backendPcFilters, FILTER_YEARS, FILTER_PROJECTS, FILTER_PROFESSIONS } from '../data/pcFilters.js'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'pc-filter-demo-v1'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function blankForm () {
  return { year: 2027, project: '临床', profession: '临床助理医师' }
}

export default {
  name: 'ProductPcFilter',
  data () {
    return {
      rows: [],
      years: FILTER_YEARS,
      projects: FILTER_PROJECTS,
      yearFilter: 'all',
      projectFilter: 'all',
      professionFilter: 'all',
      defaultFilter: 'all',
      editorVisible: false,
      editingId: null,
      form: blankForm(),
      confirmVisible: false,
      pending: null,
      undoAction: null,
      toast: { visible: false, text: '' },
      toastTimer: null
    }
  },
  computed: {
    professionOptions () { return FILTER_PROFESSIONS[this.form.project] || [] },
    listProfessionOptions () {
      if (this.projectFilter === 'all') {
        return this.projects.reduce((list, project) => list.concat(FILTER_PROFESSIONS[project] || []), [])
      }
      return FILTER_PROFESSIONS[this.projectFilter] || []
    },
    visible () {
      return this.rows.filter(item => {
        if (this.yearFilter !== 'all' && item.year !== this.yearFilter) return false
        if (this.projectFilter !== 'all' && item.project !== this.projectFilter) return false
        if (this.professionFilter !== 'all' && item.profession !== this.professionFilter) return false
        if (this.defaultFilter === 'yes' && !item.isDefault) return false
        if (this.defaultFilter === 'no' && item.isDefault) return false
        return true
      }).sort((a, b) => b.year - a.year || a.project.localeCompare(b.project, 'zh') || a.profession.localeCompare(b.profession, 'zh') || a.id - b.id)
    },
    emptyText () {
      if (this.yearFilter !== 'all' || this.projectFilter !== 'all' || this.professionFilter !== 'all' || this.defaultFilter !== 'all') {
        return '没有匹配的筛选，换个年份、项目或专业试试。'
      }
      return '还没有 PC 年份筛选。可新增一条。'
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        this.rows = saved.rows && saved.rows.length ? saved.rows : copy(backendPcFilters)
      } catch (error) {
        this.rows = copy(backendPcFilters)
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    nextId () { return Math.max(...this.rows.map(row => Number(row.id) || 0), 0) + 1 },
    sameScope (a, b) { return a.project === b.project && a.profession === b.profession },
    onListProjectChange () { this.professionFilter = 'all' },
    onFormProjectChange () {
      const options = FILTER_PROFESSIONS[this.form.project] || []
      this.form.profession = options.includes(this.form.profession) ? this.form.profession : (options[0] || '')
    },
    openEditor (item) {
      this.editingId = item ? item.id : null
      this.form = item ? { year: item.year, project: item.project, profession: item.profession } : blankForm()
      this.editorVisible = true
    },
    save () {
      if (!this.form.year) return this.$message.warning('请选择年份')
      if (!this.form.project) return this.$message.warning('请选择项目')
      if (!this.form.profession) return this.$message.warning('请选择专业')
      if (!this.professionOptions.length) return this.$message.warning('这个项目没有专业，不能保存')
      const duplicate = this.rows.find(row => (
        row.id !== this.editingId &&
        row.year === this.form.year &&
        row.project === this.form.project &&
        row.profession === this.form.profession
      ))
      if (duplicate) return this.$message.warning('这一年在该项目专业下已经有了')
      let item = this.rows.find(row => row.id === this.editingId)
      if (!item) {
        item = { id: this.nextId(), isDefault: false, createdAt: nowStamp() }
        this.rows.unshift(item)
      }
      Object.assign(item, {
        year: this.form.year,
        project: this.form.project,
        profession: this.form.profession,
        updatedBy: OPERATOR,
        updatedAt: nowStamp()
      })
      this.persist()
      this.editorVisible = false
      this.showToast(`已保存 ${item.year} · ${item.project} · ${item.profession}`)
    },
    toggleDefault (item, value) {
      const next = !!value
      if (item.isDefault === next) return
      const snapshot = this.rows.map(row => ({ id: row.id, isDefault: row.isDefault }))
      if (next) {
        this.rows.forEach(row => {
          if (this.sameScope(row, item)) row.isDefault = row.id === item.id
        })
      } else {
        item.isDefault = false
      }
      item.updatedBy = OPERATOR
      item.updatedAt = nowStamp()
      this.persist()
      this.undoAction = () => {
        snapshot.forEach(prev => {
          const row = this.rows.find(item => item.id === prev.id)
          if (row) row.isDefault = prev.isDefault
        })
        this.persist()
      }
      this.showToast(next ? `${item.year} 已设为 ${item.project} ${item.profession} 的默认年份` : `${item.year} 已取消默认`, true)
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
      this.showToast(`${removed.year} · ${removed.profession} 已删除`, true)
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
.pc-filter{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-select{width:150px}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.data-table ::v-deep .el-switch{height:22px}
.danger-text,.data-table ::v-deep .danger-text{color:#c9232d}
.empty{padding:40px 20px;color:#667085;text-align:center}
.dialog-meta{margin:-5px 0 16px;color:#667085}
.field-note{margin:6px 0 0;color:#667085;line-height:1.6}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-select,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
