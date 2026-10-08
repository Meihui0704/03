<template>
  <section class="ad-legacy">
    <header class="page-head">
      <div>
        <h1>广告素材管理</h1>
        <p>统一管理轮播图、弹层、悬浮广告和开屏广告。</p>
      </div>
      <button class="btn primary" type="button" @click="openEditor()">＋ 新增广告素材</button>
    </header>

    <div class="control-bar">
      <button class="disclosure" :class="{ open: categoryOpen }" type="button" @click="togglePanel('category')">
        <strong>项目分类</strong><span>{{ categorySummary }}</span><b>{{ categoryOpen ? '收起' : '展开' }}</b>
      </button>
      <input v-model.trim="keyword" class="control quick-search" placeholder="搜索广告 ID、商品或专业" aria-label="搜索广告素材">
      <button class="btn filter-toggle" :class="{ active: hasAdvancedFilter }" type="button" @click="togglePanel('filters')">
        筛选与排序 · {{ filtersOpen ? '收起' : '展开' }}
      </button>
    </div>

    <section v-show="categoryOpen" class="taxonomy-panel">
      <div class="panel-head">
        <div><h2>项目分类</h2><p>{{ activeProject ? `已选择“${activeProject}” · 可继续选择专业与子级方向` : '13 个一级分类 · 按项目、专业和子级方向逐级定位' }}</p></div>
        <button class="text-btn" type="button" @click="categoryOpen = false">收起分类</button>
      </div>
      <div class="project-grid">
        <button class="category" :class="{ active: !activeProject }" type="button" @click="selectProject('')"><strong>全部项目</strong><span>{{ ads.length }} 条素材</span></button>
        <button v-for="project in taxonomy" :key="project.name" class="category" :class="{ active: activeProject === project.name }" type="button" @click="selectProject(project.name)">
          <strong>{{ project.name }}</strong><span>{{ projectCount(project.name) }} 条使用中</span>
        </button>
      </div>
      <div v-if="activeProject" class="profession-panel">
        <div v-for="group in activeProjectGroups" :key="group.name || 'default'" class="profession-row">
          <span v-if="group.name" class="group-name">{{ group.name }}</span>
          <button v-for="name in group.items" :key="name" class="chip" :class="{ active: activeProfession === name }" type="button" @click="selectProfession(name)">{{ name }}</button>
        </div>
      </div>
    </section>

    <section v-show="filtersOpen" class="filter-panel">
      <label><span>显示应用</span><select v-model="filters.app" class="control"><option value="">全部应用</option><option v-for="name in apps" :key="name">{{ name }}</option></select></label>
      <label><span>显示页面</span><select v-model="filters.page" class="control"><option value="">全部页面</option><option v-for="name in pages" :key="name">{{ name }}</option></select></label>
      <label><span>排序方式</span><select v-model="filters.sort" class="control"><option value="modifiedDesc">最近修改优先</option><option value="modifiedAsc">最早修改优先</option><option value="startDesc">开始时间从新到旧</option><option value="endDesc">结束时间从新到旧</option></select></label>
      <button class="btn" type="button" @click="resetFilters">清空筛选</button>
    </section>

    <div class="status-row">
      <div class="segmented" aria-label="查看状态">
        <button v-for="item in statusOptions" :key="item.value" :class="{ active: status === item.value }" type="button" @click="setStatus(item.value)">{{ item.label }}</button>
      </div>
      <div v-if="status === 'off'" class="segmented" aria-label="下架时间">
        <button v-for="item in offRangeOptions" :key="item.value" :class="{ active: offRange === item.value }" type="button" @click="offRange = item.value">{{ item.label }}</button>
      </div>
      <span class="count">{{ resultLabel }} · {{ filteredAds.length }} 条</span>
    </div>

    <div class="batch-tools">
      <button class="btn compact" type="button" @click="toggleAll">{{ allVisibleSelected ? '取消全选' : '全选当前结果' }}</button>
      <span>{{ selectedIds.length ? `已选择 ${selectedIds.length} 条` : '未选择' }}</span>
      <button v-if="selectedIds.length" class="btn compact danger" type="button" @click="confirmBulkDelete">删除已选</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th class="check-cell"><input type="checkbox" :checked="allVisibleSelected" :aria-label="allVisibleSelected ? '取消全选' : '全选当前结果'" @change="toggleAll"></th><th>广告素材</th><th>投放位置</th><th>展示对象</th><th>点击后去向</th><th>有效期</th><th>最后修改</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="row in filteredAds" :key="row.id" :class="{ archived: row.status === 'off', focused: focusedId === row.id }">
            <td class="check-cell"><input v-model="selectedIds" type="checkbox" :value="row.id" :aria-label="`选择 ${row.product}`"></td>
            <td><div class="material"><span class="thumb" :style="{ background: row.color }"><img v-if="row.image" :src="row.image" alt=""><template v-else><b>{{ row.product.slice(0, 8) }}</b><small>昭昭医考</small></template></span><span><strong>{{ row.product }}</strong><small>{{ adTypeOf(row) }} · 广告 ID {{ row.id }}</small></span></div></td>
            <td><strong>{{ row.app }}</strong><small>{{ adTypeOf(row) }} · {{ row.page }}<template v-if="adTypeOf(row) === '轮播图'"> · {{ row.position }}</template></small></td>
            <td><strong>{{ canonicalProject(row.project) }}</strong><small>{{ canonicalProfession(row.profession) }}</small></td>
            <td><strong>{{ targetLabel(row) }}</strong><small>{{ destinationDetail(row) }}</small></td>
            <td><span>{{ row.start }}</span><small>至 {{ row.end }}</small></td>
            <td><strong>{{ row.modifiedBy }}</strong><small>{{ row.modifiedAt }}</small><em v-if="row.status === 'off'">下架于 {{ row.offAt || row.modifiedAt }}</em></td>
            <td><span class="status" :class="row.status">{{ row.status === 'on' ? '上架' : '已下架' }}</span></td>
            <td><div class="actions"><button type="button" @click="openEditor(row)">编辑</button><button type="button" @click="openCopy(row)">复制</button><button type="button" @click="confirmToggle(row)">{{ row.status === 'on' ? '下架' : '上架' }}</button><button class="danger-text" type="button" @click="confirmDelete(row)">删除</button></div></td>
          </tr>
          <tr v-if="!filteredAds.length"><td class="empty" colspan="9">{{ status === 'off' && offRange !== 'all' ? '这个时间范围内没有下架记录，可切换“一周内／一个月内／全部”。' : '该分类暂时没有匹配的广告素材，可调整筛选条件。' }}</td></tr>
        </tbody>
      </table>
    </div>

    <el-dialog :title="editingId ? '编辑广告素材' : '新增广告素材'" :visible.sync="editorVisible" width="860px" top="4vh" append-to-body :close-on-click-modal="false">
      <p class="dialog-intro">只需说清“在哪里出现”和“点击后去哪里”。</p>
      <div class="form-section">
        <header><h3>1. 图片放在哪里</h3><span>决定哪些人在什么页面看到</span></header>
        <div class="form-grid">
          <label><span>显示应用</span><select v-model="form.app" class="control"><option v-for="name in apps" :key="name">{{ name }}</option></select></label>
          <label><span>广告形式</span><select v-model="form.adType" class="control"><option v-for="name in adTypes" :key="name">{{ name }}</option></select><small>{{ adTypeHelp }}</small></label>
          <label><span>显示页面</span><select v-model="form.page" class="control"><option v-for="name in editPages" :key="name">{{ name }}</option></select></label>
          <label v-if="form.adType === '轮播图'"><span>展示顺序</span><select v-model="form.position" class="control"><option v-for="name in positions" :key="name">{{ name }}</option></select></label>
          <label><span>显示项目</span><select v-model="form.project" class="control" @change="syncProfession"><option v-for="project in taxonomy" :key="project.name">{{ project.name }}</option></select></label>
          <label><span>显示专业</span><select v-model="form.profession" class="control"><option v-for="name in editorProfessions" :key="name">{{ name }}</option></select></label>
        </div>
      </div>
      <div class="form-section">
        <header><h3>2. 点击后去哪里</h3><span>先选去向，再选具体班型或页面</span></header>
        <div class="radio-row"><label v-for="name in targetTypes" :key="name" :class="{ active: form.targetType === name }"><input v-model="form.targetType" type="radio" :value="name">{{ name }}</label></div>
        <div class="form-grid destination-fields">
          <label v-if="form.targetType === '商品'"><span>商品类型</span><select v-model="form.productType" class="control"><option v-for="name in productTypes" :key="name">{{ name }}</option></select></label>
          <label v-if="form.targetType === '商品'"><span>选择班型／商品</span><input v-model.trim="form.product" class="control" :placeholder="`输入${form.productType}名称或商品 ID`"><small>原型未接商品库；正式版从后台商品接口搜索</small></label>
          <label v-if="form.targetType === '页面' || form.targetType === '外部链接'" class="wide"><span>{{ form.targetType === '页面' ? '页面名称' : '外部链接' }}</span><input v-model.trim="form.targetValue" class="control" :placeholder="form.targetType === '页面' ? '输入页面名称' : '输入 https:// 链接'"></label>
          <div class="destination-summary">点击图片后打开：{{ destinationSummary }}</div>
        </div>
      </div>
      <div class="form-section">
        <header><h3>3. 图片与投放时间</h3><span>上传图片并设置生效范围</span></header>
        <div class="form-grid">
          <label class="wide"><span>选择图片</span><button class="upload" type="button" @click="$refs.imageInput.click()"><img v-if="form.image" :src="form.image" alt="待上传广告图"><span>{{ form.image ? '点击更换图片' : '选择本地图片 · 支持 jpg / png / gif / jpeg' }}</span></button><input ref="imageInput" hidden type="file" accept=".jpg,.jpeg,.png,.gif" @change="readImage"></label>
          <label><span>开始时间</span><input v-model="form.start" class="control" type="date"></label>
          <label><span>结束时间</span><input v-model="form.end" class="control" type="date"></label>
          <label class="wide"><span>状态</span><span class="inline-radios"><label><input v-model="form.status" type="radio" value="on"> 上架</label><label><input v-model="form.status" type="radio" value="off"> 下架</label></span></label>
        </div>
      </div>
      <div class="notice">保存时会校验图片尺寸、投放时间和顺序冲突。新记录默认下架，确认无误后再上架。</div>
      <template slot="footer"><el-button @click="editorVisible = false">取消</el-button><el-button type="primary" @click="saveAd">保存</el-button></template>
    </el-dialog>

    <el-dialog title="复制广告素材" :visible.sync="copyVisible" width="500px" append-to-body>
      <p v-if="copySource">来源：{{ adTypeOf(copySource) }} · {{ copySource.product }} · 广告 ID {{ copySource.id }}</p>
      <strong class="copy-label">复制数量</strong>
      <div class="copy-options"><button v-for="count in [1, 5, 10]" :key="count" class="chip" :class="{ active: copyCount === count }" type="button" @click="copyCount = count">{{ count }} 条</button></div>
      <div class="notice">副本会完整保留当前配置、生成新 ID，并统一放入“今日下架”，确认后可整批撤回。</div>
      <template slot="footer"><el-button @click="copyVisible = false">取消</el-button><el-button type="primary" @click="copyAds">确认复制 {{ copyCount }} 条</el-button></template>
    </el-dialog>

    <transition name="toast"><div v-if="toast.visible" class="toast"><span>{{ toast.text }}</span><button v-if="toast.undo" type="button" @click="undoLast">撤回</button><button type="button" aria-label="关闭提示" @click="toast.visible = false">×</button></div></transition>
  </section>
</template>

<script>
import { taxonomy } from './src/data/phase1Business'

const defaults = [
  { id: 1113, project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '2026二试体验班', link: '虚拟商品', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#7459e8', modifiedBy: '张旭', modifiedAt: '2026-08-31 10:29' },
  { id: 1112, project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图1', product: '考前冲刺课程', link: '虚拟商品', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#8271ee', modifiedBy: '张旭', modifiedAt: '2026-08-31 09:29' },
  { id: 1110, project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '实践技能冲刺班', link: '虚拟商品', start: '2026-08-31', end: '2026-10-31', status: 'on', color: '#a50b10', modifiedBy: '张旭', modifiedAt: '2026-08-31 08:29' },
  { id: 1109, project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图2', product: '临床刷题班', link: '虚拟商品', start: '2026-08-01', end: '2026-08-30', status: 'off', color: '#74a944', modifiedBy: '张旭', modifiedAt: '2026-08-31 07:29', offAt: '2026-08-31 07:29' },
  { id: 1108, project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图3', product: '技能带练班', link: '虚拟商品', start: '2026-07-01', end: '2026-08-15', status: 'off', color: '#9b1117', modifiedBy: '张旭', modifiedAt: '2026-08-31 06:29', offAt: '2026-08-31 06:29' },
  { id: 1103, project: '中医／中西医', profession: '中西医执业／助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '中西医冲刺课程', link: '虚拟商品', start: '2026-07-31', end: '2026-10-31', status: 'on', color: '#726ce6', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29' },
  { id: 1098, project: '护理', profession: '初级护师', app: '昭昭医考小程序', page: '全部题库', position: '图1', product: '护师题库会员', link: '虚拟商品', start: '2026-08-10', end: '2026-12-31', status: 'on', color: '#238a73', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29' },
  { id: 1086, project: '西医', profession: '西医考研', app: '昭昭网校PC端', page: '智学系统', position: '图2', product: '西医综合系统班', link: '课程', start: '2026-06-01', end: '2026-08-01', status: 'off', color: '#315c91', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29', offAt: '2026-08-31 05:29' }
]

const blankForm = () => ({ app: '昭昭医考App', adType: '轮播图', page: '首页', position: '图1', project: '临床', profession: '临床执业医师', targetType: '商品', productType: '课程', product: '', targetValue: '', start: '2026-08-31', end: '2026-11-30', status: 'off', image: '' })

export default {
  name: 'AdvertisingMaterial',
  data () {
    return {
      taxonomy,
      ads: [],
      keyword: '',
      categoryOpen: false,
      filtersOpen: false,
      activeProject: '',
      activeProfession: '',
      status: 'on',
      offRange: 'today',
      filters: { app: '', page: '', sort: 'modifiedDesc' },
      selectedIds: [],
      editorVisible: false,
      editingId: null,
      form: blankForm(),
      copyVisible: false,
      copySource: null,
      copyCount: 1,
      focusedId: null,
      undoState: null,
      toast: { visible: false, text: '', undo: false },
      apps: ['昭昭医考App', '昭昭医考小程序', '昭昭网校PC端'],
      pages: ['首页', '全部题库', '智学系统', '试题纠错页'],
      editPages: ['首页', '全部题库', '我的题库', '学习首页', '智学系统', '试题纠错页'],
      adTypes: ['轮播图', 'App弹层广告', 'App悬浮广告', 'App开屏广告'],
      positions: ['图1', '图2', '图3', '图4', '图5'],
      targetTypes: ['商品', '页面', '外部链接', '无跳转'],
      productTypes: ['课程', '题库', '音频', '面授', 'AI工具', '服务'],
      statusOptions: [{ label: '使用中', value: 'on' }, { label: '已下架', value: 'off' }, { label: '全部', value: 'all' }],
      offRangeOptions: [{ label: '今天', value: 'today' }, { label: '一周内', value: '7' }, { label: '一个月内', value: '30' }, { label: '全部', value: 'all' }]
    }
  },
  computed: {
    categorySummary () { return this.activeProject ? `${this.activeProject}${this.activeProfession ? ` / ${this.activeProfession}` : ''}` : '全部项目' },
    activeProjectGroups () { return this.taxonomy.find(item => item.name === this.activeProject)?.groups || [] },
    editorProfessions () { return (this.taxonomy.find(item => item.name === this.form.project)?.groups || []).reduce((all, group) => all.concat(group.items), []) },
    hasAdvancedFilter () { return Boolean(this.filters.app || this.filters.page || this.filters.sort !== 'modifiedDesc') },
    resultLabel () { return this.categorySummary + (this.status === 'off' ? ` · ${this.offRangeOptions.find(item => item.value === this.offRange)?.label}下架` : '') },
    filteredAds () {
      const query = this.keyword.toLowerCase()
      const now = Date.now()
      const startToday = new Date(new Date().toDateString()).getTime()
      const rows = this.ads.filter(row => {
        if (this.status !== 'all' && row.status !== this.status) return false
        if (this.activeProject && this.canonicalProject(row.project) !== this.activeProject) return false
        if (this.activeProfession && this.canonicalProfession(row.profession) !== this.activeProfession) return false
        if (this.filters.app && row.app !== this.filters.app) return false
        if (this.filters.page && row.page !== this.filters.page) return false
        if (query && !`${row.id} ${row.product} ${row.profession}`.toLowerCase().includes(query)) return false
        if (this.status === 'off' && this.offRange !== 'all') {
          const value = Date.parse(String(row.offAt || row.modifiedAt).replace(/-/g, '/'))
          if (this.offRange === 'today' && value < startToday) return false
          if (this.offRange !== 'today' && value < now - Number(this.offRange) * 86400000) return false
        }
        return true
      })
      const field = this.filters.sort.startsWith('start') ? 'start' : this.filters.sort.startsWith('end') ? 'end' : 'modifiedAt'
      const direction = this.filters.sort === 'modifiedAsc' ? 1 : -1
      return rows.slice().sort((a, b) => ((Date.parse(String(a[field]).replace(/-/g, '/')) || 0) - (Date.parse(String(b[field]).replace(/-/g, '/')) || 0)) * direction || b.id - a.id)
    },
    allVisibleSelected () { return this.filteredAds.length > 0 && this.filteredAds.every(row => this.selectedIds.includes(row.id)) },
    adTypeHelp () { return ({ '轮播图': '横图，可设置图1—图5顺序', 'App弹层广告': '弹窗图，每个页面同时只建议使用 1 条', 'App悬浮广告': '小尺寸悬浮图，保持主要操作区可见', 'App开屏广告': '竖图，用户打开 App 时展示' })[this.form.adType] },
    destinationSummary () {
      if (this.form.targetType === '商品') return `${this.form.project} ＞ ${this.form.profession || '未选专业'} ＞ ${this.form.productType} ＞ ${this.form.product || '请选择班型／商品'}`
      if (this.form.targetType === '无跳转') return '只展示图片，点击后不跳转'
      return this.form.targetValue || `请填写${this.form.targetType === '页面' ? '页面名称' : '外部链接'}`
    }
  },
  watch: {
    filteredAds () { this.selectedIds = this.selectedIds.filter(id => this.filteredAds.some(row => row.id === id)) }
  },
  created () { this.loadAds() },
  methods: {
    canonicalProject (name) { return name === '中医/中西医' ? '中医／中西医' : name },
    canonicalProfession (name) { return String(name || '').replace(/\//g, '／') },
    projectCount (name) { return this.ads.filter(row => this.canonicalProject(row.project) === name && row.status === 'on').length },
    adTypeOf (row) { return row.adType || '轮播图' },
    targetLabel (row) { const type = row.targetType || (row.link === '页面' ? '页面' : row.link === '外部链接' ? '外部链接' : '商品'); return type === '商品' ? `商品 · ${row.productType || row.link || '课程'}` : type },
    destinationDetail (row) { const type = row.targetType || '商品'; return type === '无跳转' ? '仅展示图片' : row.targetValue || row.product },
    loadAds () {
      try {
        const saved = JSON.parse(localStorage.getItem('carousel-demo-v1'))
        this.ads = Array.isArray(saved) && saved.length ? saved : defaults.map(item => ({ ...item }))
      } catch (error) { this.ads = defaults.map(item => ({ ...item })) }
    },
    persist () { localStorage.setItem('carousel-demo-v1', JSON.stringify(this.ads)) },
    togglePanel (name) { this.categoryOpen = name === 'category' ? !this.categoryOpen : false; this.filtersOpen = name === 'filters' ? !this.filtersOpen : false },
    selectProject (name) { this.activeProject = name; this.activeProfession = '' },
    selectProfession (name) { this.activeProfession = this.activeProfession === name ? '' : name },
    setStatus (value) { this.status = value; this.selectedIds = [] },
    resetFilters () { this.keyword = ''; this.activeProject = ''; this.activeProfession = ''; this.filters = { app: '', page: '', sort: 'modifiedDesc' } },
    toggleAll () { const ids = this.filteredAds.map(row => row.id); this.selectedIds = this.allVisibleSelected ? [] : ids },
    snapshotView () { return { keyword: this.keyword, activeProject: this.activeProject, activeProfession: this.activeProfession, status: this.status, offRange: this.offRange, filters: { ...this.filters }, scrollY: window.scrollY } },
    restoreView (view, id) {
      Object.assign(this, { keyword: view.keyword, activeProject: view.activeProject, activeProfession: view.activeProfession, status: view.status, offRange: view.offRange, filters: { ...view.filters }, focusedId: id })
      this.$nextTick(() => window.scrollTo({ top: view.scrollY, behavior: 'auto' }))
    },
    openEditor (row) {
      this.editingId = row ? row.id : null
      this.form = row ? { ...blankForm(), ...row, project: this.canonicalProject(row.project), profession: this.canonicalProfession(row.profession), targetType: row.targetType || '商品', targetValue: row.targetValue || '' } : blankForm()
      this.syncProfession(true)
      this.editorVisible = true
    },
    syncProfession (keep) { if (!keep || !this.editorProfessions.includes(this.form.profession)) this.form.profession = this.editorProfessions[0] || '' },
    readImage (event) { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { this.form.image = e.target.result }; reader.readAsDataURL(file) },
    validateForm () {
      if (!this.form.project || !this.form.profession || !this.form.start || !this.form.end) return '请填写完整的投放位置和时间'
      if (this.form.end < this.form.start) return '结束时间必须晚于开始时间'
      if (this.form.targetType === '商品' && !this.form.product) return '请填写班型或商品'
      if ((this.form.targetType === '页面' || this.form.targetType === '外部链接') && !this.form.targetValue) return `请填写${this.form.targetType}`
      if (this.form.targetType === '外部链接' && !/^https:\/\//i.test(this.form.targetValue)) return '外部链接必须以 https:// 开头'
      return ''
    },
    saveAd () {
      const error = this.validateForm(); if (error) { this.$message.warning(error); return }
      const now = this.nowText()
      const payload = { ...this.form, link: this.form.targetType === '商品' ? this.form.productType : this.form.targetType, modifiedBy: '美惠', modifiedAt: now, offAt: this.form.status === 'off' ? now : '', color: this.form.color || '#c91420' }
      if (this.editingId) Object.assign(this.ads.find(row => row.id === this.editingId), payload)
      else this.ads.unshift({ ...payload, id: Math.max(1200, ...this.ads.map(row => row.id + 1)) })
      const id = this.editingId || this.ads[0].id
      this.persist(); this.editorVisible = false; this.focusRecord(id); this.showToast('广告素材已保存')
    },
    openCopy (row) { this.copySource = row; this.copyCount = 1; this.copyVisible = true },
    copyAds () {
      const view = this.snapshotView(); const ids = []
      for (let index = 0; index < this.copyCount; index++) {
        const id = Math.max(1200, ...this.ads.map(row => row.id + 1)); ids.push(id)
        this.ads.unshift({ ...this.copySource, id, product: `${this.copySource.product}（副本${index + 1}）`, status: 'off', offAt: this.nowText(), modifiedBy: '美惠', modifiedAt: this.nowText() })
      }
      this.undoState = { type: 'copy', ids, view }; this.persist(); this.copyVisible = false
      this.status = 'off'; this.offRange = 'today'; this.activeProject = this.canonicalProject(this.copySource.project); this.activeProfession = this.canonicalProfession(this.copySource.profession)
      this.focusRecord(ids[0]); this.showToast(`已复制 ${ids.length} 条，可在“今天下架”中查看。`, true)
    },
    confirmToggle (row) {
      const action = row.status === 'on' ? '下架' : '上架'
      this.$confirm(`${row.product} · 广告 ID ${row.id}`, `确认${action}`, { confirmButtonText: `确认${action}`, cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView(); const before = { ...row }; row.status = row.status === 'on' ? 'off' : 'on'; row.offAt = row.status === 'off' ? this.nowText() : ''; row.modifiedBy = '美惠'; row.modifiedAt = this.nowText()
        this.undoState = { type: 'replace', before, view }; this.persist(); this.showToast(`已${action}`, true)
      }).catch(() => {})
    },
    confirmDelete (row) {
      this.$confirm(`${row.product} · 广告 ID ${row.id}`, '确认删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView(); this.undoState = { type: 'delete', rows: [{ ...row }], view }; this.ads = this.ads.filter(item => item.id !== row.id); this.persist(); this.showToast('已删除 1 条。', true)
      }).catch(() => {})
    },
    confirmBulkDelete () {
      const rows = this.ads.filter(row => this.selectedIds.includes(row.id))
      this.$confirm(`即将删除当前勾选的 ${rows.length} 条记录。`, `确认删除 ${rows.length} 条记录`, { confirmButtonText: `确认删除 ${rows.length} 条`, cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView(); this.undoState = { type: 'delete', rows: rows.map(row => ({ ...row })), view }; this.ads = this.ads.filter(row => !this.selectedIds.includes(row.id)); this.selectedIds = []; this.persist(); this.showToast(`已删除 ${rows.length} 条。`, true)
      }).catch(() => {})
    },
    undoLast () {
      const action = this.undoState; if (!action) return
      if (action.type === 'copy') this.ads = this.ads.filter(row => !action.ids.includes(row.id))
      if (action.type === 'delete') this.ads.unshift(...action.rows)
      if (action.type === 'replace') { const target = this.ads.find(row => row.id === action.before.id); if (target) Object.assign(target, action.before) }
      this.persist(); this.toast.visible = false; this.restoreView(action.view, action.type === 'replace' ? action.before.id : null); this.undoState = null; this.$message.success('已撤回上一项操作')
    },
    nowText () { return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') },
    focusRecord (id) { this.focusedId = id; window.setTimeout(() => { if (this.focusedId === id) this.focusedId = null }, 3200) },
    showToast (text, undo = false) { this.toast = { visible: true, text, undo }; window.clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => { this.toast.visible = false }, undo ? 15000 : 5000) }
  }
}
</script>

<style scoped>
.ad-legacy{color:#20242c}.page-head,.control-bar,.panel-head,.status-row,.batch-tools,.actions,.form-section header{display:flex;align-items:center;gap:12px}.page-head{justify-content:space-between;align-items:flex-end;margin-bottom:26px}.page-head h1{margin:0;font-size:26px;line-height:1.25}.page-head p{margin:7px 0 0;color:#667085}.btn,.disclosure,.control,.chip{font:inherit}.btn{min-height:40px;padding:8px 14px;border:1px solid #d7dbe1;border-radius:7px;background:#fff;color:#303844;font-weight:600;cursor:pointer}.btn:hover{background:#f8fafc}.btn.primary{border-color:#c91420;background:#c91420;color:#fff}.btn.compact{min-height:34px;padding:6px 11px;font-size:13px}.btn.danger{border-color:#e6aeb2;color:#c9232d}.control-bar{flex-wrap:wrap;margin-bottom:12px}.disclosure{min-width:220px;height:40px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:0 12px;border:1px solid #cfd3d8;border-radius:9px;background:#fff;text-align:left;cursor:pointer}.disclosure span{overflow:hidden;color:#667085;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.disclosure b{color:#245f9e;font-size:12px}.disclosure.open{border-color:#e6aeb2;background:#fff1f2}.control{height:40px;padding:0 11px;border:1px solid #cfd3d8;border-radius:8px;background:#fff;color:#20242c}.quick-search{min-width:240px;max-width:420px;flex:1}.filter-toggle.active{border-color:#8fb2df;background:#edf4fb;color:#245f9e}.taxonomy-panel,.filter-panel{margin:12px 0 18px;padding:20px;border:1px solid #e6e8ec;border-radius:10px;background:#fff}.panel-head{justify-content:space-between}.panel-head h2{margin:0;font-size:17px}.panel-head p{margin:4px 0 0;color:#667085;font-size:13px}.text-btn,.actions button{border:0;background:transparent;color:#245f9e;font-weight:600;cursor:pointer}.project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px;margin-top:16px}.category{min-height:68px;padding:11px 13px;border:1px solid #d7dbe1;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.category strong,.category span{display:block}.category span{margin-top:3px;color:#667085;font-size:12px}.category.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13}.profession-panel{margin-top:18px;padding-top:16px;border-top:1px solid #e6e8ec}.profession-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.profession-row+.profession-row{margin-top:10px}.group-name{width:86px;color:#667085;font-size:12px;font-weight:700}.chip{padding:7px 11px;border:1px solid #d7dbe1;border-radius:999px;background:#fff;color:#39424d;cursor:pointer}.chip.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13;font-weight:700}.filter-panel{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px;padding:14px}.filter-panel label{display:grid;gap:6px;min-width:190px}.filter-panel label span{color:#667085;font-size:12px;font-weight:700}.status-row{flex-wrap:wrap;margin:22px 0 12px;padding-top:18px;border-top:1px solid #e6e8ec}.segmented{display:inline-flex;padding:2px;border:1px solid #dfe2e7;border-radius:8px;background:#fff}.segmented button{min-height:34px;padding:6px 13px;border:0;border-radius:6px;background:transparent;color:#515966;cursor:pointer}.segmented button.active{background:#fff1f2;color:#a90a13;font-weight:700}.count{margin-left:auto;color:#667085;font-size:13px}.batch-tools{min-height:44px;margin-bottom:8px}.batch-tools span{color:#667085;font-size:12px}.table-wrap{overflow:auto;border:1px solid #e6e8ec;border-radius:10px;background:#fff}table{width:100%;min-width:1280px;border-collapse:collapse;table-layout:fixed}th,td{padding:15px 14px;border-bottom:1px solid #e6e8ec;text-align:left;vertical-align:middle}th{height:48px;background:#fafafa;color:#5d6470;font-size:13px;white-space:nowrap}th:nth-child(2){width:260px}th:nth-child(3){width:205px}th:nth-child(4){width:175px}th:nth-child(5){width:205px}th:nth-child(6){width:170px}th:nth-child(7){width:175px}th:nth-child(8){width:95px}th:nth-child(9){width:210px}.check-cell{width:44px;padding-left:14px;padding-right:6px}tbody tr:hover{background:#fafbfd}tbody tr.archived{color:#7a818b;background:#f5f6f7}tbody tr.focused{background:#edf4fb;box-shadow:inset 0 0 0 2px #8fb2df}.material{display:flex;align-items:center;gap:12px}.thumb{width:112px;height:48px;display:flex;flex:none;flex-direction:column;justify-content:center;overflow:hidden;padding:7px 9px;border-radius:8px;color:#fff}.thumb img{width:100%;height:100%;object-fit:cover}.thumb b{overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.thumb small{margin-top:2px;color:rgba(255,255,255,.85);font-size:9px}td>strong,td>small,td>em,.material strong,.material small{display:block}.material strong{line-height:1.45}.material small,td>small{margin-top:4px;color:#69717c;font-size:12px;line-height:1.45}.archived small{color:#858b94}td>em{margin-top:4px;color:#858990;font-size:11px;font-style:normal}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}.status:before{width:7px;height:7px;border-radius:50%;background:currentColor;content:""}.status.on{background:#eaf6f1;color:#147a62}.status.off{background:#e8ebee;color:#69717c}.actions{gap:8px;white-space:nowrap}.actions button{padding:3px 2px;font-size:14px}.actions .danger-text{color:#c9232d}.empty{padding:60px 20px;color:#667085;text-align:center}.dialog-intro{margin:-4px 0 18px;color:#667085}.form-section{margin-top:14px;padding:16px;border:1px solid #e6e8ec;border-radius:10px;background:#fafbfc}.form-section header{align-items:baseline;margin-bottom:14px}.form-section h3{margin:0;font-size:15px}.form-section header span,.form-grid small{color:#667085;font-size:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid>label{display:grid;gap:6px;font-weight:700}.form-grid .wide{grid-column:1/-1}.radio-row{display:flex;flex-wrap:wrap;gap:8px}.radio-row>label{padding:8px 10px;border:1px solid #cfd3d8;border-radius:8px;background:#fff;color:#667085;font-weight:650}.radio-row>label.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13}.destination-fields{margin-top:14px}.destination-summary{grid-column:1/-1;padding:11px 12px;border-radius:8px;background:#edf4fb;color:#294f80;font-size:13px}.upload{min-height:82px;display:flex;align-items:center;justify-content:center;gap:12px;border:1px dashed #bfc7d0;border-radius:8px;background:#fff;color:#245f9e;cursor:pointer}.upload img{width:120px;height:64px;object-fit:cover}.inline-radios{display:flex;gap:20px;font-weight:400}.notice{margin-top:16px;padding:12px;border-radius:8px;background:#fff6dc;color:#8a5a00}.copy-label{display:block;margin-top:16px}.copy-options{display:flex;gap:8px;margin-top:9px}.toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:12px;max-width:520px;padding:13px 15px;border-radius:8px;background:#e8f6f0;color:#164f3e;box-shadow:0 4px 8px rgba(24,32,43,.12)}.toast button{border:0;background:transparent;color:#155f4a;font-weight:700;cursor:pointer}.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}@media(max-width:900px){.page-head,.control-bar{align-items:stretch;flex-direction:column}.quick-search,.disclosure{width:100%;max-width:none}.project-grid{grid-template-columns:1fr 1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide,.destination-summary{grid-column:auto}.count{margin-left:0}}@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
