<template>
  <section class="agreement-list">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />商品管理<i class="el-icon-arrow-right" />协议管理</div>
        <h1 class="page-title">协议管理</h1>
        <p class="page-description">给商品准备学员要签的那份协议。启用停用在表里改。编辑改名称、有效期、正文摘要，以及甲方要填哪几项。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-radio-group v-model="statusFilter">
        <el-radio-button label="on">启用 {{ onCount }}</el-radio-button>
        <el-radio-button label="off">停用 {{ offCount }}</el-radio-button>
        <el-radio-button label="all">全部 {{ rows.length }}</el-radio-button>
      </el-radio-group>
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索协议名称或协议 ID" />
      <el-button type="primary" @click="openEditor()">新增协议</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column prop="id" label="协议 ID" width="88" />
        <el-table-column label="协议名称" min-width="220">
          <template slot-scope="s"><strong>{{ s.row.name }}</strong></template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template slot-scope="s">{{ s.row.startAt }} 至 {{ s.row.endAt }}</template>
        </el-table-column>
        <el-table-column label="甲方要填" min-width="220">
          <template slot-scope="s">
            <span v-for="key in (s.row.signKeys || [])" :key="key" class="sign-chip">{{ signLabel(key) }}</span>
            <span v-if="!(s.row.signKeys && s.row.signKeys.length)" class="sign-chip muted">未勾签署项</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '启用' : '停用' }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="168" fixed="right">
          <template slot-scope="s">
            <el-button type="text" @click="toggleStatus(s.row)">{{ s.row.status === 'on' ? '停用' : '启用' }}</el-button>
            <el-button type="text" @click="openEditor(s.row)">编辑</el-button>
            <el-dropdown trigger="click" @command="cmd => onMore(cmd, s.row)">
              <el-button type="text">更多<i class="el-icon-arrow-down el-icon--right" /></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="copy">复制</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog :title="editingId ? '编辑协议' : '新增协议'" :visible.sync="editorVisible" width="760px" append-to-body :close-on-click-modal="false" custom-class="product-dialog">
      <p class="dialog-meta">{{ editingId ? `协议 ID ${editingId} · 启用停用请回列表` : '先定名称、有效期和要填的项。保存后默认停用。' }}</p>
      <el-form label-width="108px">
        <el-form-item label="协议名称" required>
          <el-input v-model.trim="form.name" maxlength="40" show-word-limit placeholder="例如：2026二试九天七夜密训面授营协议" />
        </el-form-item>
        <el-form-item label="签署说明">
          <el-input v-model.trim="form.notice" type="textarea" :rows="2" maxlength="120" show-word-limit placeholder="给学员看的签署须知，可空" />
        </el-form-item>
        <el-form-item label="协议内容" required>
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="演示用摘要。接入后仍走原富文本。" />
          <p class="field-note">不在这里重做现网那套排版工具。</p>
        </el-form-item>
        <el-form-item label="甲方签署信息" required>
          <el-checkbox-group v-model="form.signKeys">
            <el-checkbox v-for="item in signFields" :key="item.key" :label="item.key">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
          <p class="field-note">按班型勾学员要填的项。至少勾一项。</p>
        </el-form-item>
        <el-form-item label="协议有效期" required>
          <el-date-picker
            v-model="form.range"
            type="datetimerange"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd HH:mm:ss"
            format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
      </el-form>
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
import { backendAgreements, SIGN_FIELDS } from '../data/agreements.js'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'agreement-list-demo-v1'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function blankForm () {
  return {
    name: '',
    notice: '',
    content: '演示只保留摘要。完整协议正文接入后走原富文本，不在助手里重录。',
    signKeys: ['name', 'phone'],
    range: []
  }
}

export default {
  name: 'ProductAgreements',
  data () {
    return {
      rows: [],
      signFields: SIGN_FIELDS,
      keyword: '',
      statusFilter: 'on',
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
        if (query && !`${item.name} ${item.id}`.toLowerCase().includes(query)) return false
        return true
      }).sort((a, b) => b.id - a.id)
    },
    emptyText () {
      if (this.keyword) return '没有匹配的协议，换个名称或 ID 试试。'
      if (this.statusFilter === 'on') return '当前没有启用中的协议。可切换到「停用」查看。'
      if (this.statusFilter === 'off') return '当前没有停用协议。'
      return '暂时没有协议。'
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        this.rows = saved.rows && saved.rows.length ? saved.rows : copy(backendAgreements)
      } catch (error) {
        this.rows = copy(backendAgreements)
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    nextId () { return Math.max(...this.rows.map(row => Number(row.id) || 0), 200) + 1 },
    signLabel (key) { return (SIGN_FIELDS.find(item => item.key === key) || {}).label || key },
    openEditor (item) {
      this.editingId = item ? item.id : null
      if (!item) {
        this.form = blankForm()
        this.editorVisible = true
        return
      }
      this.form = {
        name: item.name,
        notice: item.notice || '',
        content: item.content || '',
        signKeys: copy(item.signKeys || []),
        range: [item.startAt, item.endAt]
      }
      this.editorVisible = true
    },
    save () {
      if (!this.form.name) return this.$message.warning('请填写协议名称')
      if (!this.form.content) return this.$message.warning('请填写协议内容')
      if (!this.form.range || this.form.range.length !== 2) return this.$message.warning('请设置协议有效期')
      if (!this.form.signKeys || !this.form.signKeys.length) return this.$message.warning('请至少勾一项甲方签署信息')
      const signKeys = Array.from(new Set(this.form.signKeys))
      let item = this.rows.find(row => row.id === this.editingId)
      const stamp = nowStamp()
      if (!item) {
        item = {
          id: this.nextId(),
          status: 'off',
          createdBy: OPERATOR,
          createdAt: stamp
        }
        this.rows.unshift(item)
        this.editingId = item.id
      }
      Object.assign(item, {
        name: this.form.name,
        notice: this.form.notice,
        content: this.form.content,
        signKeys,
        startAt: this.form.range[0],
        endAt: this.form.range[1],
        updatedBy: OPERATOR,
        updatedAt: stamp
      })
      this.persist()
      this.editorVisible = false
      this.statusFilter = item.status
      this.showToast(item.status === 'off' ? '协议已保存，已在「停用」里' : '协议已保存（仅当前演示）')
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
        item.updatedBy = OPERATOR
        item.updatedAt = nowStamp()
        this.persist()
        this.statusFilter = previous
      }
      this.showToast(item.status === 'on' ? `“${item.name}”已启用` : `“${item.name}”已停用`, true)
    },
    onMore (command, item) {
      if (command === 'copy') this.copyRow(item)
    },
    copyRow (item) {
      const cloned = copy(item)
      cloned.id = this.nextId()
      cloned.name = item.name.includes('（复制）') ? item.name : `${item.name}（复制）`
      cloned.status = 'off'
      cloned.createdBy = OPERATOR
      cloned.updatedBy = OPERATOR
      cloned.createdAt = nowStamp()
      cloned.updatedAt = cloned.createdAt
      this.rows.unshift(cloned)
      this.persist()
      this.statusFilter = 'off'
      this.undoAction = () => {
        this.rows = this.rows.filter(row => row.id !== cloned.id)
        this.persist()
      }
      this.showToast(`已复制为协议 ID ${cloned.id}，已在「停用」里`, true)
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
.agreement-list{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(280px,100%)}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.sign-chip{display:inline-flex;margin:0 6px 4px 0;padding:3px 8px;border-radius:999px;background:#f3f4f6;color:#3d4654;font-size:12px;font-weight:650}
.sign-chip.muted{background:#eef0f2;color:#8a919e;font-weight:500}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}
.status.on{background:#eaf6f1;color:#147a62}
.status.off{background:#e8ebee;color:#69717c}
.empty{padding:40px 20px;color:#667085;text-align:center}
.dialog-meta{margin:-5px 0 16px;color:#667085}
.field-note{margin:6px 0 0;color:#667085;line-height:1.6}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
