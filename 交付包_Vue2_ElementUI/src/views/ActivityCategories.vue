<template>
  <section class="activity-categories">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />活动管理<i class="el-icon-arrow-right" />活动类目管理</div>
        <h1 class="page-title">活动类目管理</h1>
        <p class="page-description">这里维护小类。配置活动时只选小类，大类自动带出。裂变大礼包归「阶段拉新」。口令、小红书、云课堂节点先不套。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-input
        v-model.trim="keyword"
        clearable
        prefix-icon="el-icon-search"
        placeholder="搜索大类、小类名称或 ID"
      />
      <span class="result-count">{{ resultCount }}</span>
    </div>

    <div class="workspace">
      <aside class="group-pane">
        <div class="pane-head">
          <strong>大类</strong>
          <el-button type="text" @click="openGroupEditor()">新建大类</el-button>
        </div>
        <button
          v-for="item in visibleGroups"
          :key="item.id"
          type="button"
          :class="['group-card', { active: currentId === item.id, off: item.status === 'off' }]"
          @click="currentId = item.id"
        >
          <span>
            <strong>{{ item.name }}</strong>
            <small>ID {{ item.id }} · {{ (item.children || []).length }} 个小类</small>
          </span>
          <span class="status" :class="item.status">{{ item.status === 'on' ? '启用' : '禁用' }}</span>
        </button>
        <p v-if="!visibleGroups.length" class="pane-empty">没有匹配的大类或小类。</p>
      </aside>

      <div class="child-pane">
        <div class="pane-head">
          <div>
            <strong>{{ current ? current.name : '请选择大类' }}</strong>
            <p v-if="current">挂在「{{ current.name }}」下。配置活动里选这个小类，就会自动归到本大类。</p>
          </div>
          <div v-if="current" class="pane-actions">
            <el-button @click="openGroupEditor(current)">编辑大类</el-button>
            <el-button @click="toggleStatus(current)">{{ current.status === 'on' ? '禁用大类' : '启用大类' }}</el-button>
            <el-button type="primary" @click="openChildEditor()">新建小类</el-button>
          </div>
        </div>

        <div v-if="current" class="data-table">
          <el-table :data="visibleChildren" row-key="id" empty-text=" ">
            <el-table-column prop="id" label="小类 ID" width="110" />
            <el-table-column prop="name" label="小类名称" min-width="160"><template slot-scope="s"><strong>{{ s.row.name }}</strong></template></el-table-column>
            <el-table-column label="状态" width="100"><template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '启用' : '禁用' }}</span></template></el-table-column>
            <el-table-column label="修改" min-width="160"><template slot-scope="s"><div>{{ s.row.updatedBy }}</div><small>{{ s.row.updatedAt }}</small></template></el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template slot-scope="s">
                <el-button type="text" @click="openChildEditor(s.row)">编辑</el-button>
                <el-button type="text" @click="toggleStatus(s.row)">{{ s.row.status === 'on' ? '禁用' : '启用' }}</el-button>
                <el-button type="text" class="danger-text" @click="askDelete(s.row, 'child')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <p v-if="!visibleChildren.length" class="empty">{{ childEmptyText }}</p>
        </div>
      </div>
    </div>

    <el-dialog :title="groupForm.id ? '编辑大类' : '新建大类'" :visible.sync="groupVisible" width="480px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">这里只改架构名称和状态。不会出现具体活动。</p>
      <el-form label-width="88px">
        <el-form-item label="大类名称" required><el-input v-model.trim="groupForm.name" placeholder="例如：拉新" /></el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="groupForm.status">
            <el-radio label="on">启用</el-radio>
            <el-radio label="off">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template slot="footer"><el-button @click="groupVisible = false">取消</el-button><el-button type="primary" @click="saveGroup">保存</el-button></template>
    </el-dialog>

    <el-dialog :title="childForm.id ? '编辑小类' : '新建小类'" :visible.sync="childVisible" width="480px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">{{ current ? `挂在「${current.name}」下` : '' }}</p>
      <el-form label-width="88px">
        <el-form-item label="小类名称" required><el-input v-model.trim="childForm.name" placeholder="例如：阶段拉新" /></el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="childForm.status">
            <el-radio label="on">启用</el-radio>
            <el-radio label="off">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template slot="footer"><el-button @click="childVisible = false">取消</el-button><el-button type="primary" @click="saveChild">保存</el-button></template>
    </el-dialog>

    <el-dialog title="确认删除？" :visible.sync="confirmVisible" width="480px" append-to-body>
      <p v-if="pending" class="confirm-line">{{ pending.locked ? '五大类是线上运营骨架，不能删除，只能禁用。' : `将删除「${pending.name}」。演示可撤回，不会提交后台。` }}</p>
      <template slot="footer">
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button v-if="pending && !pending.locked" type="primary" @click="removePending">确认删除</el-button>
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
import { backendActivityGroups, TAXONOMY_KEY } from '../data/activityCategories.js'

const copy = value => JSON.parse(JSON.stringify(value))
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function nextId (items, start) {
  const ids = items.map(item => item.id)
  return ids.length ? Math.max(start, ...ids) + 1 : start
}

export default {
  name: 'ActivityCategories',
  data () {
    return {
      groups: [],
      currentId: 101,
      keyword: '',
      groupVisible: false,
      childVisible: false,
      groupForm: { id: null, name: '', status: 'on' },
      childForm: { id: null, name: '', status: 'on' },
      confirmVisible: false,
      pending: null,
      pendingKind: '',
      undoAction: null,
      toast: { visible: false, text: '' },
      toastTimer: null
    }
  },
  computed: {
    query () { return (this.keyword || '').trim().toLowerCase() },
    visibleGroups () {
      if (!this.query) return this.groups
      return this.groups.filter(item => this.groupHit(item))
    },
    current () { return this.visibleGroups.find(item => item.id === this.currentId) || null },
    visibleChildren () {
      if (!this.current) return []
      const children = this.current.children || []
      if (!this.query) return children
      if (this.hit(this.current)) return children
      return children.filter(item => this.hit(item))
    },
    resultCount () {
      if (!this.query) return `共 ${this.groups.length} 个大类`
      return `命中 ${this.visibleGroups.length} 个大类`
    },
    childEmptyText () {
      if (!this.current) return ''
      if (this.query && !this.hit(this.current) && !(this.current.children || []).length) return '这个大类还没有小类。'
      if (this.query && !this.hit(this.current)) return `「${this.current.name}」下没有名称或 ID 匹配「${this.keyword}」的小类。`
      return '这个大类还没有小类。可以先只挂大类，小类以后再补。'
    }
  },
  watch: {
    visibleGroups (list) {
      if (!list.length) return
      if (!list.some(item => item.id === this.currentId)) this.currentId = list[0].id
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      try {
        const saved = JSON.parse(localStorage.getItem(TAXONOMY_KEY))
        this.groups = saved.groups && saved.groups.length ? saved.groups : copy(backendActivityGroups)
      } catch (error) {
        this.groups = copy(backendActivityGroups)
      }
      this.groups.sort((a, b) => a.sort - b.sort)
      if (!this.current) this.currentId = this.groups[0] ? this.groups[0].id : null
    },
    persist () { localStorage.setItem(TAXONOMY_KEY, JSON.stringify({ groups: this.groups })) },
    hit (item) {
      if (!this.query || !item) return false
      return String(item.id).includes(this.query) || String(item.name || '').toLowerCase().includes(this.query)
    },
    groupHit (group) {
      return this.hit(group) || (group.children || []).some(item => this.hit(item))
    },
    touch (item) { item.updatedBy = OPERATOR; item.updatedAt = nowStamp() },
    openGroupEditor (item) {
      this.groupForm = item ? { id: item.id, name: item.name, status: item.status } : { id: null, name: '', status: 'on' }
      this.groupVisible = true
    },
    saveGroup () {
      if (!this.groupForm.name) return this.$message.warning('请填写大类名称')
      let item = this.groups.find(row => row.id === this.groupForm.id)
      const stamp = nowStamp()
      if (!item) {
        item = {
          id: nextId(this.groups, 200),
          sort: this.groups.length + 1,
          locked: false,
          children: [],
          createdBy: OPERATOR,
          createdAt: stamp
        }
        this.groups.push(item)
        this.currentId = item.id
      }
      item.name = this.groupForm.name
      item.status = this.groupForm.status
      this.touch(item)
      this.persist()
      this.groupVisible = false
      this.showToast('大类已保存（仅当前演示）')
    },
    openChildEditor (item) {
      if (!this.current) return
      this.childForm = item ? { id: item.id, name: item.name, status: item.status } : { id: null, name: '', status: 'on' }
      this.childVisible = true
    },
    saveChild () {
      if (!this.current) return
      if (!this.childForm.name) return this.$message.warning('请填写小类名称')
      const list = this.current.children || []
      let item = list.find(row => row.id === this.childForm.id)
      const stamp = nowStamp()
      if (!item) {
        item = {
          id: nextId(this.groups.reduce((all, group) => all.concat(group.children || []), []), 2000),
          parentId: this.current.id,
          sort: list.length + 1,
          createdBy: OPERATOR,
          createdAt: stamp
        }
        list.push(item)
        this.$set(this.current, 'children', list)
      }
      item.name = this.childForm.name
      item.status = this.childForm.status
      this.touch(item)
      this.touch(this.current)
      this.persist()
      this.childVisible = false
      this.showToast('小类已保存（仅当前演示）')
    },
    toggleStatus (item) {
      item.status = item.status === 'on' ? 'off' : 'on'
      this.touch(item)
      this.persist()
      this.showToast(item.status === 'on' ? `“${item.name}”已启用` : `“${item.name}”已禁用`)
    },
    askDelete (item, kind) {
      this.pending = item
      this.pendingKind = kind
      this.confirmVisible = true
    },
    removePending () {
      if (!this.pending || this.pending.locked) return
      const removed = copy(this.pending)
      const kind = this.pendingKind
      if (kind === 'child' && this.current) {
        const index = this.current.children.findIndex(item => item.id === this.pending.id)
        if (index >= 0) this.current.children.splice(index, 1)
        this.undoAction = () => {
          this.current.children.splice(index, 0, removed)
          this.persist()
        }
      }
      this.persist()
      this.confirmVisible = false
      this.showToast(`“${removed.name}”已删除`, true)
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
.activity-categories{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(320px,100%)}
.result-count{margin-left:auto;color:#667085;font-size:13px}
.workspace{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;align-items:start}
.group-pane,.child-pane{border:1px solid var(--line);border-radius:10px;background:#fff}
.pane-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line)}
.pane-head p{margin:4px 0 0;color:#667085;font-size:12px;line-height:1.5}
.pane-actions{display:flex;flex-wrap:wrap;gap:8px}
.group-card{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:12px 16px;border:0;border-bottom:1px solid #f0f2f4;background:#fff;text-align:left;cursor:pointer}
.group-card:last-child{border-bottom:0}
.group-card:hover,.group-card.active{background:var(--brand-soft)}
.group-card.off{opacity:.7}
.group-card strong{display:block}
.group-card small{color:#8a919e}
.pane-empty,.empty{margin:0;padding:18px;color:#667085;font-size:13px;line-height:1.6}
.data-table{padding:0 0 8px}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.data-table ::v-deep .danger-text{color:#c9232d}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}
.status.on{background:#eaf6f1;color:#147a62}
.status.off{background:#e8ebee;color:#69717c}
small{color:#8a919e}
.dialog-meta,.confirm-line{margin:-5px 0 16px;color:#667085;line-height:1.6}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:960px){.workspace{grid-template-columns:1fr}.page-head,.pane-head,.toolbar{align-items:flex-start;flex-direction:column}.toolbar .el-input,.result-count{width:100%;margin-left:0}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
