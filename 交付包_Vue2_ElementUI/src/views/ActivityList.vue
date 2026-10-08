<template>
  <section class="activity-list">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />活动管理<i class="el-icon-arrow-right" />配置活动</div>
        <h1 class="page-title">配置活动</h1>
        <p class="page-description">运营只选小类（估分、模考、冲刺专区、学科专区、资料、早鸟）。大类自动带出。落地页顶部分类（考试大纲／笔试）不是小类。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-radio-group v-model="statusFilter">
        <el-radio-button label="on">启用 {{ onCount }}</el-radio-button>
        <el-radio-button label="off">禁用 {{ offCount }}</el-radio-button>
        <el-radio-button label="all">全部 {{ rows.length }}</el-radio-button>
      </el-radio-group>
      <el-select v-model="groupFilter" placeholder="大类">
        <el-option label="全部大类" value="all" />
        <el-option label="待归类" value="none" />
        <el-option v-for="item in groups" :key="item.id" :label="item.name" :value="String(item.id)" />
      </el-select>
      <el-select v-model="appFilter" placeholder="显示应用">
        <el-option label="全部应用" value="all" />
        <el-option v-for="item in apps" :key="item" :label="item" :value="item" />
      </el-select>
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索活动名称或 ID" />
      <el-button type="primary" @click="openEditor()">新增活动</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column prop="id" label="活动 ID" width="92" />
        <el-table-column label="活动名称" min-width="180">
          <template slot-scope="s"><strong>{{ s.row.name }}</strong></template>
        </el-table-column>
        <el-table-column prop="app" label="显示应用" min-width="120" />
        <el-table-column label="大类 / 小类" min-width="140">
          <template slot-scope="s">
            <span v-if="taxonomyLabel(s.row.groupId, s.row.childId)">{{ taxonomyLabel(s.row.groupId, s.row.childId) }}</span>
            <span v-else class="missing">待归类</span>
          </template>
        </el-table-column>
        <el-table-column label="落地页" width="108">
          <template slot-scope="s">{{ s.row.layout === 'tabs' ? '有分类落地' : '无分类落地' }}</template>
        </el-table-column>
        <el-table-column label="内容" min-width="140">
          <template slot-scope="s">{{ contentSummary(s.row) }}</template>
        </el-table-column>
        <el-table-column label="有效期" min-width="168">
          <template slot-scope="s">
            <div>{{ dateRange(s.row.validStart, s.row.validEnd) }}</div>
            <small v-if="hasSplitTime(s.row)">显示时间不同</small>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '启用' : '禁用' }}</span></template>
        </el-table-column>
        <el-table-column label="修改" min-width="150">
          <template slot-scope="s"><div>{{ s.row.updatedBy }}</div><small>{{ s.row.updatedAt }}</small></template>
        </el-table-column>
        <el-table-column label="操作" width="232" fixed="right">
          <template slot-scope="s">
            <el-button type="text" @click="openEditor(s.row)">{{ s.row.layout === 'tabs' ? '配置分类内容' : '配置商品' }}</el-button>
            <el-button type="text" @click="toggleStatus(s.row)">{{ s.row.status === 'on' ? '禁用' : '启用' }}</el-button>
            <el-button type="text" class="danger-text" @click="askDelete(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog :title="editorTitle" :visible.sync="editorVisible" width="920px" append-to-body :close-on-click-modal="false" custom-class="activity-editor">
      <p class="dialog-meta">{{ editingId ? `活动 ID ${editingId} · 原始 ID 不会被修改` : '新增活动将生成演示 ID，接入后改走原活动接口' }}</p>

      <section class="field-block">
        <h3>活动壳</h3>
        <p class="field-hint">先选小类。估分、模考→激活；资料、节日活动→留存；冲刺/学科/早鸟/大促→变现；裂变大礼包→传播。</p>
        <el-form label-width="108px">
          <el-form-item label="显示应用" required>
            <el-select v-model="form.app" placeholder="请选择应用">
              <el-option v-for="item in apps" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="活动名称" required>
            <el-input v-model.trim="form.name" maxlength="15" show-word-limit placeholder="例如：二试临床助理考前冲刺" />
          </el-form-item>
          <el-form-item label="小类" :required="!editingId">
            <el-select v-model="form.childId" filterable clearable placeholder="按活动名称选，例如考后估分" @change="onChildChange">
              <el-option v-for="item in allChildOptions" :key="item.id" :label="`${item.groupName} / ${item.name}`" :value="item.id" />
            </el-select>
            <p class="field-note">对不上现有小类时，去活动类目管理新建，不要硬套。云课堂节点活动可暂不选。</p>
          </el-form-item>
          <el-form-item label="大类">
            <el-input :value="autoGroupName" disabled />
          </el-form-item>
          <el-form-item label="活动轮播图">
            <div class="banner-row">
              <span v-for="(item, index) in form.banners" :key="`${item.name}-${index}`" class="banner-chip">{{ item.name }}<button type="button" aria-label="移除轮播图" @click="form.banners.splice(index, 1)">×</button></span>
              <button v-if="form.banners.length < 5" type="button" class="banner-add" @click="$refs.bannerFile.click()">+</button>
            </div>
            <input ref="bannerFile" type="file" accept="image/*" hidden @change="addBanner">
            <p class="field-note">最多 5 张，单张不超过 3MB。演示只记下文件名，不上传后台。</p>
          </el-form-item>
          <el-form-item label="有效期" required>
            <el-date-picker
              v-model="form.validRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              @change="onValidChange"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="form.splitDisplay" @change="onSplitToggle">显示时间与有效期不同</el-checkbox>
            <p class="field-note">多数活动两套时间相同。只有少数投放和有效期错开时才勾选。</p>
          </el-form-item>
          <el-form-item v-if="form.splitDisplay" label="显示时间">
            <el-date-picker
              v-model="form.displayRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
            />
          </el-form-item>
        </el-form>
      </section>

      <section class="field-block last">
        <h3>落地页内容</h3>
        <p class="layout-line">当前：<strong>{{ form.layout === 'tabs' ? '有分类落地' : '无分类落地' }}</strong>。开屏或广告点进去通常是无分类；磁片区点进去带考试大纲／笔试的是有分类。</p>
        <p class="field-note">切换落地结构会清空已配内容，本期不提供切换，避免误删。</p>

        <template v-if="form.layout === 'flat'">
          <div class="product-toolbar">
            <span>已挂 <strong>{{ form.products.length }}</strong> 个商品，顺序即 App 展示顺序。</span>
          </div>
          <ProductIdSearch placeholder="搜索班型名称或商品 ID，添加到活动里" @select="addPickedProduct" />
          <el-table v-if="form.products.length" :data="form.products" class="inner-table">
            <el-table-column label="排序" width="130">
              <template slot-scope="s">
                <el-button type="text" :disabled="s.$index === 0" @click="moveProduct(s.$index, -1)">上移</el-button>
                <span class="sort-no">{{ s.$index + 1 }}</span>
                <el-button type="text" :disabled="s.$index === form.products.length - 1" @click="moveProduct(s.$index, 1)">下移</el-button>
              </template>
            </el-table-column>
            <el-table-column label="商品 ID" width="110"><template slot-scope="s">{{ s.row.id }}</template></el-table-column>
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column label="金额" width="100"><template slot-scope="s">{{ s.row.price === 0 ? '0' : s.row.price }}</template></el-table-column>
            <el-table-column label="" width="72">
              <template slot-scope="s"><el-button type="text" class="danger-text" @click="form.products.splice(s.$index, 1)">删除</el-button></template>
            </el-table-column>
          </el-table>
          <p v-else class="empty inner">还没有挂商品。活动壳可以先保存，商品用 ID 继续补。</p>
        </template>

        <div v-else class="tabs-note">
          <p>有分类落地需要维护页内标签（如考试大纲、笔试）和每个标签下的资料，不是商品清单。</p>
          <ul>
            <li v-for="group in form.tabGroups" :key="group.name">{{ group.name }} · {{ group.itemCount }} 条</li>
          </ul>
          <p>资料编辑还没有现网配置截图，这里只标明结构，不假装已经能改文件。</p>
        </div>
      </section>

      <template slot="footer">
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存活动</el-button>
      </template>
    </el-dialog>

    <el-dialog title="确认删除？" :visible.sync="confirmVisible" width="480px" append-to-body>
      <p v-if="pending" class="confirm-line">活动 ID {{ pending.id }} · {{ pending.name }}。删除后从当前演示移除，可立即撤回。</p>
      <el-alert title="真实后台删除可能影响 App 开屏、金刚区和磁片跳转；当前演示不会提交后台。" type="warning" :closable="false" show-icon />
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
import { backendActivityGroups, TAXONOMY_KEY, findChild, taxonomyLabel as labelOf } from '../data/activityCategories.js'
import { APP_OPTIONS, backendActivities } from '../data/activities.js'
import { allOperationProducts } from '../data/phase1Business'
import ProductIdSearch from '../components/ProductIdSearch.vue'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'activity-list-demo-v7'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function blankForm () {
  return {
    name: '',
    app: '昭昭医考APP',
    groupId: null,
    childId: null,
    layout: 'flat',
    banners: [],
    validRange: [],
    displayRange: [],
    splitDisplay: false,
    products: [],
    tabGroups: []
  }
}

export default {
  name: 'ActivityList',
  components: { ProductIdSearch },
  data () {
    return {
      rows: [],
      groups: copy(backendActivityGroups),
      apps: APP_OPTIONS,
      keyword: '',
      statusFilter: 'on',
      groupFilter: 'all',
      appFilter: 'all',
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
    onCount () { return this.rows.filter(item => item.status === 'on').length },
    offCount () { return this.rows.filter(item => item.status === 'off').length },
    allChildOptions () {
      const list = []
      this.groups.forEach(group => {
        if (group.status !== 'on') return
        ;(group.children || []).forEach(item => {
          if (item.status === 'on') list.push({ id: item.id, name: item.name, groupName: group.name })
        })
      })
      return list
    },
    autoGroupName () {
      const found = findChild(this.groups, this.form.childId)
      return found ? found.group.name : '待归类'
    },
    editorTitle () { return this.editingId ? '配置活动内容' : '新增活动' },
    visible () {
      const query = this.keyword.toLowerCase()
      return this.rows.filter(item => {
        if (this.statusFilter !== 'all' && item.status !== this.statusFilter) return false
        if (this.appFilter !== 'all' && item.app !== this.appFilter) return false
        if (this.groupFilter === 'none' && item.groupId) return false
        if (this.groupFilter !== 'all' && this.groupFilter !== 'none' && String(item.groupId) !== this.groupFilter) return false
        if (query && !`${item.name} ${item.id}`.toLowerCase().includes(query)) return false
        return true
      }).sort((a, b) => b.id - a.id)
    },
    emptyText () {
      if (this.keyword || this.groupFilter !== 'all' || this.appFilter !== 'all') return '没有匹配的活动，换个名称、大类或应用试试。'
      if (this.statusFilter === 'on') return '当前没有启用中的活动。可切换到「禁用」查看停用记录。'
      if (this.statusFilter === 'off') return '当前没有已禁用的活动。启用中的记录在「启用」里。'
      return '暂时没有活动。'
    }
  },
  created () {
    this.loadGroups()
    this.loadState()
  },
  methods: {
    loadGroups () {
      try {
        const saved = JSON.parse(localStorage.getItem(TAXONOMY_KEY))
        if (saved && saved.groups && saved.groups.length) this.groups = saved.groups
      } catch (error) {
        this.groups = copy(backendActivityGroups)
      }
    },
    loadState () {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
        this.rows = saved.rows && saved.rows.length ? saved.rows : copy(backendActivities)
      } catch (error) {
        this.rows = copy(backendActivities)
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    taxonomyLabel (groupId, childId) { return labelOf(this.groups, groupId, childId) },
    contentSummary (row) {
      if (row.layout === 'tabs') {
        const count = (row.tabGroups || []).length
        return count ? `${count} 个页内标签` : '有分类落地，内容待配'
      }
      const count = (row.products || []).length
      return count ? `${count} 个商品` : '未挂商品'
    },
    dateRange (start, end) {
      if (!start || !end) return '未设置'
      return `${start.slice(0, 10)} 至 ${end.slice(0, 10)}`
    },
    hasSplitTime (row) {
      return row.displayStart !== row.validStart || row.displayEnd !== row.validEnd
    },
    touch (item) { item.updatedBy = OPERATOR; item.updatedAt = nowStamp() },
    onChildChange (id) {
      const found = findChild(this.groups, id)
      this.form.groupId = found ? found.group.id : null
    },
    openEditor (item) {
      this.editingId = item ? item.id : null
      if (!item) {
        this.form = blankForm()
        this.editorVisible = true
        return
      }
      const split = item.displayStart !== item.validStart || item.displayEnd !== item.validEnd
      this.form = {
        name: item.name,
        app: item.app,
        groupId: item.groupId,
        childId: item.childId,
        layout: item.layout,
        banners: copy(item.banners || []),
        validRange: [item.validStart, item.validEnd],
        displayRange: [item.displayStart, item.displayEnd],
        splitDisplay: split,
        products: copy(item.products || []),
        tabGroups: copy(item.tabGroups || [])
      }
      this.editorVisible = true
    },
    onValidChange (value) {
      if (!this.form.splitDisplay && value && value.length === 2) this.form.displayRange = value.slice()
    },
    onSplitToggle (checked) {
      if (!checked) this.form.displayRange = (this.form.validRange || []).slice()
    },
    addBanner (event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file) return
      if (file.size > 3 * 1024 * 1024) return this.$message.warning('单张轮播图需不超过 3MB')
      if (this.form.banners.length >= 5) return this.$message.warning('最多上传 5 张轮播图')
      this.form.banners.push({ name: file.name })
    },
    addPickedProduct (picked) {
      if (!picked || !picked.id) return
      const id = Number(picked.id) || picked.id
      if (this.form.products.some(item => String(item.id) === String(id))) return this.$message.warning(`商品 ID ${id} 已在活动中`)
      const found = allOperationProducts.find(item => String(item.id) === String(id))
      this.form.products.push({
        id,
        name: (found && found.name) || picked.name,
        price: found && found.price != null ? found.price : 0
      })
    },
    moveProduct (index, delta) {
      const target = index + delta
      if (target < 0 || target >= this.form.products.length) return
      const list = this.form.products
      const current = list[index]
      this.$set(list, index, list[target])
      this.$set(list, target, current)
    },
    save () {
      if (!this.form.app) return this.$message.warning('请选择显示应用')
      if (!this.form.name) return this.$message.warning('请填写活动名称')
      if (!this.editingId && !this.form.childId) return this.$message.warning('请选择小类，大类会自动带上')
      this.onChildChange(this.form.childId)
      if (!this.form.validRange || this.form.validRange.length !== 2) return this.$message.warning('请设置有效期')
      const displayRange = this.form.splitDisplay ? this.form.displayRange : this.form.validRange
      if (!displayRange || displayRange.length !== 2) return this.$message.warning('请设置显示时间')
      let item = this.rows.find(row => row.id === this.editingId)
      const stamp = nowStamp()
      if (!item) {
        item = {
          id: Math.max(1000, ...this.rows.map(row => row.id)) + 1,
          status: 'on',
          createdBy: OPERATOR,
          createdAt: stamp,
          layout: 'flat',
          tabGroups: []
        }
        this.rows.unshift(item)
      }
      Object.assign(item, {
        name: this.form.name,
        app: this.form.app,
        groupId: this.form.groupId || null,
        childId: this.form.childId || null,
        layout: this.form.layout,
        banners: copy(this.form.banners),
        validStart: this.form.validRange[0],
        validEnd: this.form.validRange[1],
        displayStart: displayRange[0],
        displayEnd: displayRange[1],
        products: copy(this.form.products),
        tabGroups: copy(this.form.tabGroups)
      })
      this.touch(item)
      this.persist()
      this.editorVisible = false
      this.statusFilter = item.status
      this.showToast(item.status === 'off' ? '活动已保存，已在「禁用」里' : '活动已保存（仅当前演示）')
    },
    toggleStatus (item) {
      const previous = item.status
      item.status = item.status === 'on' ? 'off' : 'on'
      this.touch(item)
      this.persist()
      this.statusFilter = item.status
      this.undoAction = () => {
        item.status = previous
        this.touch(item)
        this.persist()
        this.statusFilter = previous
      }
      this.showToast(item.status === 'on' ? `“${item.name}”已启用` : `“${item.name}”已禁用，已切到禁用列表`, true)
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
.activity-list{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(260px,100%)}
.toolbar .el-select{width:160px}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.data-table ::v-deep .danger-text,.inner-table ::v-deep .danger-text{color:#c9232d}
.missing,.type-hint{display:block;color:#8a919e;font-size:12px;font-weight:500}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}
.status.on{background:#eaf6f1;color:#147a62}
.status.off{background:#e8ebee;color:#69717c}
small{color:#8a919e}
.empty{padding:40px 20px;color:#667085;text-align:center}
.empty.inner{padding:18px 0}
.dialog-meta,.confirm-line{margin:-5px 0 16px;color:#667085}
.field-block{margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.field-block.last{margin-bottom:0;padding-bottom:0;border-bottom:0}
.field-block h3{margin:0 0 6px;font-size:15px}
.field-hint,.field-note,.layout-line{margin:0 0 12px;color:#667085;line-height:1.6}
.layout-line strong{color:var(--ink)}
.field-note{margin:6px 0 0}
.banner-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.banner-chip,.banner-add{min-height:72px;padding:10px 12px;border:1px dashed #d7dbe1;border-radius:8px;background:#fafbfc}
.banner-chip{display:inline-flex;align-items:center;gap:8px;max-width:160px}
.banner-chip button{border:0;background:transparent;color:#667085;cursor:pointer}
.banner-add{width:72px;color:#667085;font-size:22px;cursor:pointer}
.product-toolbar{margin:0 0 10px;color:#4d5665}
.inner-table{margin-top:12px}
.sort-no{display:inline-block;min-width:18px;text-align:center;font-variant-numeric:tabular-nums}
.tabs-note{padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:#fafbfc;color:#4d5665;line-height:1.6}
.tabs-note ul{margin:8px 0;padding-left:18px}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.toolbar .el-select,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
