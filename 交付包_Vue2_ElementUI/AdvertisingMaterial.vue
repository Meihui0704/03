<template>
  <section class="ad-legacy">
    <header class="page-head">
      <div>
        <h1>广告素材管理</h1>
        <p>轮播图、弹层、悬浮、开屏放在同一张表里，公司内部也称 Banner。默认会像原后台一样混在一起；需要时再按广告形式分开看。</p>
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
      <div class="segmented" aria-label="广告形式">
        <button v-for="item in typeOptions" :key="item.value" :class="{ active: adTypeFilter === item.value }" type="button" @click="adTypeFilter = item.value">{{ item.label }}</button>
      </div>
      <div class="segmented" aria-label="查看状态">
        <button v-for="item in statusOptions" :key="item.value" :class="{ active: status === item.value }" type="button" @click="setStatus(item.value)">{{ item.label }}</button>
      </div>
      <div v-if="status === 'off'" class="segmented" aria-label="下架时间">
        <button v-for="item in offRangeOptions" :key="item.value" :class="{ active: offRange === item.value }" type="button" @click="setOffRange(item.value)">{{ item.label }}</button>
      </div>
      <label v-if="status === 'off' && offRange === 'custom'" class="custom-off-range">
        <span>从</span>
        <input v-model="customOffFrom" class="control" type="datetime-local" aria-label="下架开始时间">
        <span>到</span>
        <input v-model="customOffTo" class="control" type="datetime-local" aria-label="下架结束时间">
      </label>
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
            <td><div class="material"><button class="thumb" :class="thumbClass(row)" :style="{ background: row.color }" type="button" :aria-label="`放大查看 ${row.product}`" @click="viewAdAsset(row)"><img v-if="row.image" :src="row.image" alt=""><template v-else><b>{{ row.product.slice(0, 8) }}</b><small>昭昭医考</small></template></button><span><strong>{{ row.product }}</strong><small>{{ adTypeOf(row) }} · 广告 ID {{ row.id }}</small></span></div></td>
            <td><strong>{{ row.app }}</strong><small>{{ adTypeOf(row) }} · {{ row.page }}<template v-if="adTypeOf(row) === '轮播图'"> · {{ row.position }}</template></small></td>
            <td><strong>{{ canonicalProject(row.project) }}</strong><small>{{ canonicalProfession(row.profession) }}</small></td>
            <td><strong>{{ targetLabel(row) }}</strong><small>{{ destinationDetail(row) }}</small></td>
            <td><span>{{ row.start }}</span><small>至 {{ row.end }}</small></td>
            <td><strong>{{ row.modifiedBy }}</strong><small>{{ row.modifiedAt }}</small><em v-if="row.status === 'off'">下架于 {{ row.offAt || row.modifiedAt }}</em></td>
            <td><span class="status" :class="row.status">{{ row.status === 'on' ? '上架' : '已下架' }}</span></td>
            <td><div class="actions"><button type="button" @click="viewAdAsset(row)">放大查看</button><button type="button" @click="downloadAdAsset(row)">下载</button><button type="button" @click="openEditor(row)">编辑</button><button type="button" @click="openCopy(row)">复制</button><button type="button" @click="confirmToggle(row)">{{ row.status === 'on' ? '下架' : '上架' }}</button><button class="danger-text" type="button" @click="confirmDelete(row)">删除</button></div></td>
          </tr>
          <tr v-if="!filteredAds.length"><td class="empty" colspan="9">{{ status === 'off' && offRange !== 'all' ? '这个时间范围内没有下架记录，可切换“一周内／一个月内／自定义／全部”。' : '该分类暂时没有匹配的广告素材，可调整筛选条件。' }}</td></tr>
        </tbody>
      </table>
    </div>

    <el-dialog :title="editingId ? '编辑广告素材' : '新增广告素材'" :visible.sync="editorVisible" width="860px" top="4vh" append-to-body :close-on-click-modal="false">
      <p class="dialog-intro">只需说清“在哪里出现”和“点击后去哪里”。</p>
      <div class="form-section">
        <header><h3>1. 图片放在哪里</h3><span>决定哪些人在什么页面看到</span></header>
        <div class="form-grid">
          <label><span>显示应用</span><select v-model="form.app" class="control"><option v-for="name in apps" :key="name">{{ name }}</option></select></label>
          <label><span>广告形式</span><select v-model="form.adType" class="control" @change="onAdTypeChange"><option v-for="name in adTypes" :key="name">{{ name }}</option></select><small>{{ adTypeHelp }}</small></label>
          <label><span>显示页面</span><select v-model="form.page" class="control"><option v-for="name in editPages" :key="name">{{ name }}</option></select></label>
          <label v-if="form.adType === '轮播图'"><span>展示顺序</span><select v-model="form.position" class="control"><option v-for="name in positions" :key="name">{{ name }}</option></select></label>
          <label><span>显示项目</span><select v-model="form.project" class="control" @change="syncProfession"><option v-for="project in taxonomy" :key="project.name">{{ project.name }}</option></select><small v-if="form.projectId">项目 ID {{ form.projectId }}</small><small v-else>未匹配到项目 ID，接入后以后台字典为准</small></label>
          <label><span>显示专业</span><select v-model="form.profession" class="control"><option v-for="name in editorProfessions" :key="name">{{ name }}</option></select><small v-if="form.professionId">专业 ID {{ form.professionId }}</small><small v-else>未匹配到专业 ID，不编造 ID</small></label>
        </div>
      </div>
      <div class="form-section">
        <header><h3>2. 点击后去哪里</h3><span>先选去向，再选具体班型或页面</span></header>
        <div class="radio-row"><label v-for="name in targetTypes" :key="name" :class="{ active: form.targetType === name }"><input v-model="form.targetType" type="radio" :value="name">{{ name }}</label></div>
        <div class="form-grid destination-fields">
          <label v-if="form.targetType === '商品'"><span>商品类型</span><select v-model="form.productType" class="control"><option v-for="name in productTypes" :key="name">{{ name }}</option></select></label>
          <label v-if="form.targetType === '商品'" class="wide"><span>选择班型／商品</span>
            <product-id-search :product-id="form.productId" :product-name="form.product" @select="onPickProduct" />
            <small>按班型名搜索并点选，系统保存商品 ID。不要手填一个对不上库的名字。</small>
          </label>
          <label v-if="form.targetType === '页面' || form.targetType === '外部链接'" class="wide"><span>{{ form.targetType === '页面' ? '页面名称' : '外部链接' }}</span><input v-model.trim="form.targetValue" class="control" :placeholder="form.targetType === '页面' ? '输入页面名称' : '输入 https:// 链接'"></label>
          <div class="destination-summary">点击图片后打开：{{ destinationSummary }}</div>
        </div>
      </div>
      <div class="form-section">
        <header><h3>3. 图片与投放时间</h3><span>上传图片并设置生效范围</span></header>
        <div class="form-grid">
          <label class="wide"><span>选择图片</span>
            <button class="upload" :class="imagePreviewClass" type="button" @click="$refs.imageInput.click()">
              <img v-if="form.image" :src="form.image" alt="待上传广告图">
              <span>{{ form.image ? '点击更换图片' : '选择本地图片 · 支持 jpg / png / gif / jpeg' }}</span>
            </button>
            <div v-if="form.image" class="image-tools">
              <button class="text-btn" type="button" @click="openAssetViewer({ src: form.image, title: form.product || '广告图', filename: `${form.product || 'ad'}.png` })">放大完整查看</button>
              <button class="text-btn" type="button" @click="downloadAssetSrc(form.image, `${form.product || 'ad'}.png`)">下载</button>
            </div>
            <input ref="imageInput" hidden type="file" accept=".jpg,.jpeg,.png,.gif" @change="readImage">
            <small :class="{ fail: imageCheck && !imageCheck.ok }">{{ imageHint }}</small>
          </label>
          <label><span>开始时间</span><input v-model="form.start" class="control" type="datetime-local"></label>
          <label><span>结束时间</span><input v-model="form.end" class="control" type="datetime-local"></label>
          <label class="wide"><span>状态</span><span class="inline-radios"><label><input v-model="form.status" type="radio" value="on"> 上架</label><label><input v-model="form.status" type="radio" value="off"> 下架</label></span></label>
        </div>
      </div>
      <div class="notice">上架前会按当前广告形式核对图片方向、投放时间和轮播图位冲突。像素以正式上传接口为准；演示只拦明显横竖不符。新记录默认下架。</div>
      <template slot="footer"><el-button @click="editorVisible = false">取消</el-button><el-button type="primary" @click="saveAd">保存</el-button></template>
    </el-dialog>

    <el-dialog title="复制广告素材" :visible.sync="copyVisible" width="500px" append-to-body>
      <p v-if="copySource">来源：{{ adTypeOf(copySource) }} · {{ copySource.product }} · 广告 ID {{ copySource.id }}</p>
      <strong class="copy-label">复制数量</strong>
      <div class="copy-options"><button v-for="count in [1, 5, 10]" :key="count" class="chip" :class="{ active: copyCount === count }" type="button" @click="copyCount = count">{{ count }} 条</button></div>
      <div class="notice">副本保留当前配置、由后台生成新 ID，并放入“今日下架”。15 秒内撤回会回到复制前的列表和筛选，不会留在下架页。</div>
      <template slot="footer"><el-button @click="copyVisible = false">取消</el-button><el-button type="primary" @click="copyAds">确认复制 {{ copyCount }} 条</el-button></template>
    </el-dialog>

    <transition name="toast"><div v-if="toast.visible" class="toast"><span>{{ toast.text }}</span><button v-if="toast.undo" type="button" @click="undoLast">撤回</button><button type="button" aria-label="关闭提示" @click="toast.visible = false">×</button></div></transition>
    <asset-viewer :visible.sync="assetViewer.visible" :src="assetViewer.src" :title="assetViewer.title" @download="downloadFromViewer" />
  </section>
</template>

<script>
import { taxonomy } from './src/data/phase1Business'
import ProductIdSearch from './src/components/ProductIdSearch.vue'
import { AD_TYPE_OPTIONS } from './src/domain/adEnums'
import { inspectImageFile, checkImageAgainstType, validateAd, timeValue, matchesOffRange, toDatetimeLocal } from './src/domain/adValidation'
import { createAdsApi, canonicalProject, canonicalProfession, matchProject, matchProfession } from './src/api/adsApi'
import AssetViewer from './src/components/AssetViewer.vue'
import assetPreview from './src/mixins/assetPreview'

const defaults = [
  { id: 1119, adType: 'App弹层广告', project: '中医／中西医', profession: '中医执业／助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '中医执业活动页', targetType: '页面', targetValue: '活动管理页', link: '页面', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#c91420', modifiedBy: '张昶', modifiedAt: '2026-09-04 10:12' },
  { id: 1118, adType: 'App弹层广告', project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图1', product: '临床弹窗活动', targetType: '页面', targetValue: '活动管理页', link: '页面', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#a50b10', modifiedBy: '张昶', modifiedAt: '2026-09-04 09:40' },
  { id: 1117, adType: 'App开屏广告', project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图1', product: 'App开屏体验课', targetType: '商品', productType: '课程', link: '课程', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#315c91', modifiedBy: '张昶', modifiedAt: '2026-09-03 18:20' },
  { id: 1116, adType: 'App悬浮广告', project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '首页悬浮入口', targetType: '商品', productType: '课程', link: '课程', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#238a73', modifiedBy: '张昶', modifiedAt: '2026-09-03 16:08' },
  { id: 1113, adType: '轮播图', project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '2026二试体验班', link: '虚拟商品', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#7459e8', modifiedBy: '张旭', modifiedAt: '2026-08-31 10:29' },
  { id: 1112, adType: '轮播图', project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图1', product: '考前冲刺课程', link: '虚拟商品', start: '2026-08-31', end: '2026-11-30', status: 'on', color: '#8271ee', modifiedBy: '张旭', modifiedAt: '2026-08-31 09:29' },
  { id: 1110, project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '实践技能冲刺班', link: '虚拟商品', start: '2026-08-31', end: '2026-10-31', status: 'on', color: '#a50b10', modifiedBy: '张旭', modifiedAt: '2026-08-31 08:29' },
  { id: 1109, project: '临床', profession: '临床助理医师', app: '昭昭医考App', page: '首页', position: '图2', product: '临床刷题班', link: '虚拟商品', start: '2026-08-01', end: '2026-08-30', status: 'off', color: '#74a944', modifiedBy: '张旭', modifiedAt: '2026-08-31 07:29', offAt: '2026-08-31 07:29' },
  { id: 1108, project: '临床', profession: '临床执业医师', app: '昭昭医考App', page: '首页', position: '图3', product: '技能带练班', link: '虚拟商品', start: '2026-07-01', end: '2026-08-15', status: 'off', color: '#9b1117', modifiedBy: '张旭', modifiedAt: '2026-08-31 06:29', offAt: '2026-08-31 06:29' },
  { id: 1103, project: '中医／中西医', profession: '中西医执业／助理医师', app: '昭昭医考App', page: '首页', position: '图1', product: '中西医冲刺课程', link: '虚拟商品', start: '2026-07-31', end: '2026-10-31', status: 'on', color: '#726ce6', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29' },
  { id: 1098, project: '护理', profession: '初级护师', app: '昭昭医考小程序', page: '全部题库', position: '图1', product: '护师题库会员', link: '虚拟商品', start: '2026-08-10', end: '2026-12-31', status: 'on', color: '#238a73', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29' },
  { id: 1086, project: '西医', profession: '西医考研', app: '昭昭网校PC端', page: '智学系统', position: '图2', product: '西医综合系统班', link: '课程', start: '2026-06-01', end: '2026-08-01', status: 'off', color: '#315c91', modifiedBy: '杨美慧', modifiedAt: '2026-08-31 05:29', offAt: '2026-08-31 05:29' }
]

const toInputTime = (value, fallback) => {
  const raw = String(value || fallback || '')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16)
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return `${raw.slice(0, 10)}T00:00`
  return fallback
}

const blankForm = () => ({
  app: '昭昭医考App', adType: '轮播图', page: '首页', position: '图1',
  project: '临床', profession: '临床执业医师', projectId: 119, professionId: 24,
  targetType: '商品', productType: '课程', product: '', productId: '', targetValue: '',
  start: '2026-08-31T00:00', end: '2026-11-30T00:00', status: 'off',
  image: '', imageWidth: 0, imageHeight: 0, imageName: ''
})

export default {
  name: 'AdvertisingMaterial',
  components: { AssetViewer, ProductIdSearch },
  mixins: [assetPreview],
  data () {
    return {
      taxonomy,
      ads: [],
      adsApi: null,
      operationId: null,
      keyword: '',
      categoryOpen: false,
      filtersOpen: false,
      activeProject: '',
      activeProfession: '',
      status: 'on',
      adTypeFilter: 'all',
      offRange: 'today',
      customOffFrom: '',
      customOffTo: '',
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
      typeOptions: [
        { label: '全部形式', value: 'all' },
        { label: '轮播图', value: '轮播图' },
        { label: '弹层', value: 'App弹层广告' },
        { label: '悬浮', value: 'App悬浮广告' },
        { label: '开屏', value: 'App开屏广告' }
      ],
      positions: ['图1', '图2', '图3', '图4', '图5'],
      targetTypes: ['商品', '页面', '外部链接', '无跳转'],
      productTypes: ['课程', '题库', '音频', '面授', 'AI工具', '服务'],
      statusOptions: [{ label: '使用中', value: 'on' }, { label: '已下架', value: 'off' }, { label: '全部', value: 'all' }],
      offRangeOptions: [{ label: '今天', value: 'today' }, { label: '一周内', value: '7' }, { label: '一个月内', value: '30' }, { label: '自定义', value: 'custom' }, { label: '全部', value: 'all' }]
    }
  },
  computed: {
    categorySummary () { return this.activeProject ? `${this.activeProject}${this.activeProfession ? ` / ${this.activeProfession}` : ''}` : '全部项目' },
    activeProjectGroups () { return this.taxonomy.find(item => item.name === this.activeProject)?.groups || [] },
    editorProfessions () { return (this.taxonomy.find(item => item.name === this.form.project)?.groups || []).reduce((all, group) => all.concat(group.items), []) },
    hasAdvancedFilter () { return Boolean(this.filters.app || this.filters.page || this.filters.sort !== 'modifiedDesc') },
    resultLabel () {
      const type = this.typeOptions.find(item => item.value === this.adTypeFilter)
      return `${this.categorySummary} · ${type ? type.label : '全部形式'}` + (this.status === 'off' ? ` · ${this.offRangeOptions.find(item => item.value === this.offRange)?.label}下架` : '')
    },
    filteredAds () {
      const query = this.keyword.toLowerCase()
      const now = Date.now()
      const rows = this.ads.filter(row => {
        if (this.adTypeFilter !== 'all' && this.adTypeOf(row) !== this.adTypeFilter) return false
        if (this.status !== 'all' && row.status !== this.status) return false
        if (this.activeProject && this.canonicalProject(row.project) !== this.activeProject) return false
        if (this.activeProfession && this.canonicalProfession(row.profession) !== this.activeProfession) return false
        if (this.filters.app && row.app !== this.filters.app) return false
        if (this.filters.page && row.page !== this.filters.page) return false
        if (query && !`${row.id} ${row.product} ${row.profession}`.toLowerCase().includes(query)) return false
        if (this.status === 'off' && this.offRange !== 'all') {
          if (!matchesOffRange(row.offAt || row.modifiedAt, this.offRange, this.customOffFrom, this.customOffTo, now)) return false
        }
        return true
      })
      const field = this.filters.sort.startsWith('start') ? 'start' : this.filters.sort.startsWith('end') ? 'end' : 'modifiedAt'
      const direction = this.filters.sort === 'modifiedAsc' ? 1 : -1
      return rows.slice().sort((a, b) => ((timeValue(a[field]) - timeValue(b[field])) * direction || b.id - a.id))
    },
    allVisibleSelected () { return this.filteredAds.length > 0 && this.filteredAds.every(row => this.selectedIds.includes(row.id)) },
    adTypeHelp () { return (AD_TYPE_OPTIONS.find(item => item.value === this.form.adType) || {}).help },
    imageCheck () {
      if (!this.form.image) return null
      if (!this.form.imageWidth) return { ok: false, message: '已选图片但还没有宽高，请重新上传以便按广告形式核对' }
      return checkImageAgainstType(this.form.adType, this.form.imageWidth, this.form.imageHeight)
    },
    imageHint () {
      if (!this.form.image) return '上架前必传。演示按横图／竖图／方图核对，不编造未确认的像素标准。'
      return this.imageCheck ? this.imageCheck.message : ''
    },
    imagePreviewClass () { return ['preview', this.thumbClass({ adType: this.form.adType })] },
    destinationSummary () {
      if (this.form.targetType === '商品') return `${this.form.project} ＞ ${this.form.profession || '未选专业'} ＞ ${this.form.productType} ＞ ${this.form.productId ? `ID ${this.form.productId} ${this.form.product}` : '请搜索并选定商品'}`
      if (this.form.targetType === '无跳转') return '只展示图片，点击后不跳转'
      return this.form.targetValue || `请填写${this.form.targetType === '页面' ? '页面名称' : '外部链接'}`
    }
  },
  watch: {
    filteredAds () { this.selectedIds = this.selectedIds.filter(id => this.filteredAds.some(row => row.id === id)) },
    'form.project' () { this.bindScopeIds() },
    'form.profession' () { this.bindScopeIds() }
  },
  created () { this.adsApi = createAdsApi(defaults); this.ads = this.adsApi.list().list },
  methods: {
    canonicalProject,
    canonicalProfession,
    bindScopeIds () {
      const project = matchProject(this.form.project)
      const profession = matchProfession(this.form.project, this.form.profession)
      this.form.projectId = project ? project.id : null
      this.form.professionId = profession ? profession.id : null
    },
    thumbClass (row) {
      const type = this.adTypeOf(row)
      return { banner: type === '轮播图', popup: type === 'App弹层广告', float: type === 'App悬浮广告', splash: type === 'App开屏广告' }
    },
    onAdTypeChange () {
      if (this.form.adType !== '轮播图') this.form.position = '—'
      else if (!this.form.position || this.form.position === '—') this.form.position = '图1'
    },
    projectCount (name) { return this.ads.filter(row => this.canonicalProject(row.project) === name && row.status === 'on').length },
    adTypeOf (row) { return row.adType || '轮播图' },
    targetLabel (row) { const type = row.targetType || (row.link === '页面' ? '页面' : row.link === '外部链接' ? '外部链接' : '商品'); return type === '商品' ? `商品 · ${row.productType || row.link || '课程'}` : type },
    destinationDetail (row) { const type = row.targetType || '商品'; return type === '无跳转' ? '仅展示图片' : row.targetValue || row.product },
    persist () {},
    adAssetSrc (row) {
      if (row.image) return row.image
      const type = this.adTypeOf(row)
      const size = type === 'App弹层广告' || type === 'App开屏广告'
        ? { w: 360, h: 640 }
        : type === 'App悬浮广告'
          ? { w: 320, h: 320 }
          : { w: 720, h: 320 }
      const canvas = document.createElement('canvas')
      canvas.width = size.w
      canvas.height = size.h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = row.color || '#c91420'
      ctx.fillRect(0, 0, size.w, size.h)
      ctx.fillStyle = '#ffffff'
      ctx.font = `700 ${Math.round(size.h * 0.08)}px "PingFang SC","Helvetica Neue",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(row.product || '广告素材', size.w / 2, size.h / 2 - 12)
      ctx.font = '400 16px "PingFang SC","Helvetica Neue",sans-serif'
      ctx.fillText(`${type} · ID ${row.id}`, size.w / 2, size.h / 2 + 22)
      return canvas.toDataURL('image/png')
    },
    viewAdAsset (row) {
      this.openAssetViewer({ src: this.adAssetSrc(row), title: row.product, filename: `${row.product || 'ad'}-${row.id}.png` })
    },
    downloadAdAsset (row) {
      this.downloadAssetSrc(this.adAssetSrc(row), `${row.product || 'ad'}-${row.id}.png`)
    },
    rememberOperation (result, view) {
      this.operationId = result.operationId
      this.undoState = { view }
      this.ads = result.list
    },
    togglePanel (name) { this.categoryOpen = name === 'category' ? !this.categoryOpen : false; this.filtersOpen = name === 'filters' ? !this.filtersOpen : false },
    selectProject (name) { this.activeProject = name; this.activeProfession = '' },
    selectProfession (name) { this.activeProfession = this.activeProfession === name ? '' : name },
    setStatus (value) { this.status = value; this.selectedIds = [] },
    setOffRange (value) {
      this.offRange = value
      if (value === 'custom' && (!this.customOffFrom || !this.customOffTo)) {
        const now = Date.now()
        this.customOffFrom = toDatetimeLocal(now - 30 * 86400000)
        this.customOffTo = toDatetimeLocal(now)
      }
    },
    resetFilters () { this.keyword = ''; this.activeProject = ''; this.activeProfession = ''; this.adTypeFilter = 'all'; this.filters = { app: '', page: '', sort: 'modifiedDesc' } },
    toggleAll () { const ids = this.filteredAds.map(row => row.id); this.selectedIds = this.allVisibleSelected ? [] : ids },
    snapshotView () { return { keyword: this.keyword, activeProject: this.activeProject, activeProfession: this.activeProfession, status: this.status, adTypeFilter: this.adTypeFilter, offRange: this.offRange, customOffFrom: this.customOffFrom, customOffTo: this.customOffTo, filters: { ...this.filters }, scrollY: window.scrollY } },
    restoreView (view, id) {
      Object.assign(this, { keyword: view.keyword, activeProject: view.activeProject, activeProfession: view.activeProfession, status: view.status, adTypeFilter: view.adTypeFilter || 'all', offRange: view.offRange, customOffFrom: view.customOffFrom || this.customOffFrom, customOffTo: view.customOffTo || this.customOffTo, filters: { ...view.filters }, focusedId: id })
      this.$nextTick(() => window.scrollTo({ top: view.scrollY, behavior: 'auto' }))
    },
    openEditor (row) {
      this.editingId = row ? row.id : null
      this.form = row ? {
        ...blankForm(),
        ...row,
        project: this.canonicalProject(row.project),
        profession: this.canonicalProfession(row.profession),
        targetType: row.targetType || '商品',
        productId: row.productId || '',
        targetValue: row.targetValue || '',
        start: toInputTime(row.start, '2026-08-31T00:00'),
        end: toInputTime(row.end, '2026-11-30T00:00'),
        imageWidth: row.imageWidth || 0,
        imageHeight: row.imageHeight || 0
      } : blankForm()
      this.syncProfession(true)
      this.bindScopeIds()
      this.editorVisible = true
    },
    syncProfession (keep) { if (!keep || !this.editorProfessions.includes(this.form.profession)) this.form.profession = this.editorProfessions[0] || '' },
    async readImage (event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file) return
      const result = await inspectImageFile(file)
      if (!result.ok) { this.$message.error(result.message); return }
      this.form.image = result.url
      this.form.imageWidth = result.width
      this.form.imageHeight = result.height
      this.form.imageName = result.name
      const fit = checkImageAgainstType(this.form.adType, result.width, result.height)
      if (!fit.ok) this.$message.warning(fit.message)
      else this.$message.success(fit.message)
    },
    onPickProduct (item) {
      this.form.productId = item.id
      this.form.product = item.name
    },
    async saveAd () {
      const result = validateAd(this.form, this.ads, { ignoreId: this.editingId })
      if (!result.ok) { this.$message.warning(result.errors[0]); return }
      if (result.warns.length) {
        try {
          await this.$confirm(result.warns.map(item => item.reason).join('；'), '仍要保存？', { confirmButtonText: '仍要保存', cancelButtonText: '返回修改', type: 'warning' })
        } catch (error) { return }
      }
      const view = this.snapshotView()
      const saved = this.adsApi.save({ ...this.form, id: this.editingId }, view)
      this.rememberOperation(saved, view)
      this.editorVisible = false
      this.status = this.form.status
      if (this.form.status === 'off') this.offRange = 'today'
      this.activeProject = this.canonicalProject(this.form.project)
      this.activeProfession = this.canonicalProfession(this.form.profession)
      this.focusRecord(saved.id)
      this.showToast(this.editingId ? '广告素材已保存，15 秒内可撤回并回到保存前列表' : '已新增。15 秒内撤回会回到新增前的列表', true)
    },
    openCopy (row) { this.copySource = row; this.copyCount = 1; this.copyVisible = true },
    copyAds () {
      const view = this.snapshotView()
      const saved = this.adsApi.copy(this.copySource, this.copyCount, view)
      this.rememberOperation(saved, view)
      this.copyVisible = false
      this.status = 'off'
      this.offRange = 'today'
      this.activeProject = this.canonicalProject(this.copySource.project)
      this.activeProfession = this.canonicalProfession(this.copySource.profession)
      this.focusRecord(saved.ids[0])
      this.showToast(`已复制 ${saved.ids.length} 条，已放入“今日下架”。撤回会回到复制前的页面。`, true)
    },
    confirmToggle (row) {
      const action = row.status === 'on' ? '下架' : '上架'
      const nextStatus = row.status === 'on' ? 'off' : 'on'
      if (nextStatus === 'on') {
        const result = validateAd({ ...row, status: 'on' }, this.ads, { ignoreId: row.id })
        if (!result.ok) { this.$message.warning(result.errors[0]); return }
      }
      this.$confirm(`${row.product} · 广告 ID ${row.id}`, `确认${action}`, { confirmButtonText: `确认${action}`, cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView()
        const now = this.nowText()
        const saved = this.adsApi.replace(row.id, { status: nextStatus, statusCode: nextStatus === 'on' ? 'ON' : 'OFF', offAt: nextStatus === 'off' ? now : '', modifiedBy: '美惠', modifiedAt: now }, view)
        this.rememberOperation(saved, view)
        this.status = nextStatus
        if (nextStatus === 'off') this.offRange = 'today'
        this.focusRecord(row.id)
        this.showToast(`已${action}。撤回会回到操作前的列表。`, true)
      }).catch(() => {})
    },
    confirmDelete (row) {
      this.$confirm(`${row.product} · 广告 ID ${row.id}`, '确认删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView()
        const saved = this.adsApi.remove([row.id], view)
        this.rememberOperation(saved, view)
        this.showToast('已删除 1 条。撤回会回到删除前的页面。', true)
      }).catch(() => {})
    },
    confirmBulkDelete () {
      const rows = this.ads.filter(row => this.selectedIds.includes(row.id))
      this.$confirm(`即将删除当前勾选的 ${rows.length} 条记录。`, `确认删除 ${rows.length} 条记录`, { confirmButtonText: `确认删除 ${rows.length} 条`, cancelButtonText: '取消', type: 'warning' }).then(() => {
        const view = this.snapshotView()
        const saved = this.adsApi.remove(this.selectedIds.slice(), view)
        this.selectedIds = []
        this.rememberOperation(saved, view)
        this.showToast(`已删除 ${rows.length} 条。撤回会回到删除前的页面。`, true)
      }).catch(() => {})
    },
    undoLast () {
      const result = this.adsApi.undo(this.operationId)
      if (!result.ok) { this.$message.warning(result.message); this.toast.visible = false; return }
      this.ads = result.list
      this.operationId = null
      this.undoState = null
      this.toast.visible = false
      this.restoreView(result.view, result.focusId)
      this.$message.success('已撤回，并回到操作前的列表和筛选')
    },
    nowText () { return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') },
    focusRecord (id) { this.focusedId = id; window.setTimeout(() => { if (this.focusedId === id) this.focusedId = null }, 3200) },
    showToast (text, undo = false) {
      this.toast = { visible: true, text, undo }
      window.clearTimeout(this.toastTimer)
      this.toastTimer = window.setTimeout(() => {
        this.toast.visible = false
        if (undo) { this.adsApi.clearOperation(); this.operationId = null; this.undoState = null }
      }, undo ? 15000 : 5000)
    }
  }
}
</script>

<style scoped>
.ad-legacy{color:#20242c}.page-head,.control-bar,.panel-head,.status-row,.batch-tools,.actions,.form-section header{display:flex;align-items:center;gap:12px}.page-head{justify-content:space-between;align-items:flex-end;margin-bottom:26px}.page-head h1{margin:0;font-size:26px;line-height:1.25}.page-head p{margin:7px 0 0;color:#667085}.btn,.disclosure,.control,.chip{font:inherit}.btn{min-height:40px;padding:8px 14px;border:1px solid #d7dbe1;border-radius:7px;background:#fff;color:#303844;font-weight:600;cursor:pointer}.btn:hover{background:#f8fafc}.btn.primary{border-color:#c91420;background:#c91420;color:#fff}.btn.compact{min-height:34px;padding:6px 11px;font-size:13px}.btn.danger{border-color:#e6aeb2;color:#c9232d}.control-bar{flex-wrap:wrap;margin-bottom:12px}.disclosure{min-width:220px;height:40px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:0 12px;border:1px solid #cfd3d8;border-radius:9px;background:#fff;text-align:left;cursor:pointer}.disclosure span{overflow:hidden;color:#667085;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.disclosure b{color:#245f9e;font-size:12px}.disclosure.open{border-color:#e6aeb2;background:#fff1f2}.control{height:40px;padding:0 11px;border:1px solid #cfd3d8;border-radius:8px;background:#fff;color:#20242c}.quick-search{min-width:240px;max-width:420px;flex:1}.filter-toggle.active{border-color:#8fb2df;background:#edf4fb;color:#245f9e}.taxonomy-panel,.filter-panel{margin:12px 0 18px;padding:20px;border:1px solid #e6e8ec;border-radius:10px;background:#fff}.panel-head{justify-content:space-between}.panel-head h2{margin:0;font-size:17px}.panel-head p{margin:4px 0 0;color:#667085;font-size:13px}.text-btn,.actions button{border:0;background:transparent;color:#245f9e;font-weight:600;cursor:pointer}.project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px;margin-top:16px}.category{min-height:68px;padding:11px 13px;border:1px solid #d7dbe1;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.category strong,.category span{display:block}.category span{margin-top:3px;color:#667085;font-size:12px}.category.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13}.profession-panel{margin-top:18px;padding-top:16px;border-top:1px solid #e6e8ec}.profession-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.profession-row+.profession-row{margin-top:10px}.group-name{width:86px;color:#667085;font-size:12px;font-weight:700}.chip{padding:7px 11px;border:1px solid #d7dbe1;border-radius:999px;background:#fff;color:#39424d;cursor:pointer}.chip.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13;font-weight:700}.filter-panel{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px;padding:14px}.filter-panel label{display:grid;gap:6px;min-width:190px}.filter-panel label span{color:#667085;font-size:12px;font-weight:700}.custom-off-range{display:inline-flex;align-items:center;gap:8px;color:#667085;font-size:12px;font-weight:700}
.custom-off-range .control{width:210px;height:34px}.segmented{display:inline-flex;padding:2px;border:1px solid #dfe2e7;border-radius:8px;background:#fff}.segmented button{min-height:34px;padding:6px 13px;border:0;border-radius:6px;background:transparent;color:#515966;cursor:pointer}.segmented button.active{background:#fff1f2;color:#a90a13;font-weight:700}.count{margin-left:auto;color:#667085;font-size:13px}.batch-tools{min-height:44px;margin-bottom:8px}.batch-tools span{color:#667085;font-size:12px}.table-wrap{overflow:auto;border:1px solid #e6e8ec;border-radius:10px;background:#fff}table{width:100%;min-width:1280px;border-collapse:collapse;table-layout:fixed}th,td{padding:15px 14px;border-bottom:1px solid #e6e8ec;text-align:left;vertical-align:middle}th{height:48px;background:#fafafa;color:#5d6470;font-size:13px;white-space:nowrap}th:nth-child(2){width:260px}th:nth-child(3){width:205px}th:nth-child(4){width:175px}th:nth-child(5){width:205px}th:nth-child(6){width:170px}th:nth-child(7){width:175px}th:nth-child(8){width:95px}th:nth-child(9){width:280px}.check-cell{width:44px;padding-left:14px;padding-right:6px}tbody tr:hover{background:#fafbfd}tbody tr.archived{color:#7a818b;background:#f5f6f7}tbody tr.focused{background:#edf4fb;box-shadow:inset 0 0 0 2px #8fb2df}.material{display:flex;align-items:center;gap:12px}.thumb{width:112px;height:48px;display:flex;flex:none;flex-direction:column;justify-content:center;overflow:hidden;padding:7px 9px;border:0;border-radius:8px;color:#fff;cursor:pointer}.image-tools{display:flex;gap:12px;margin-top:8px}.thumb img{width:100%;height:100%;object-fit:cover}.thumb b{overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.thumb small{margin-top:2px;color:rgba(255,255,255,.85);font-size:9px}td>strong,td>small,td>em,.material strong,.material small{display:block}.material strong{line-height:1.45}.material small,td>small{margin-top:4px;color:#69717c;font-size:12px;line-height:1.45}.archived small{color:#858b94}td>em{margin-top:4px;color:#858990;font-size:11px;font-style:normal}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}.status:before{width:7px;height:7px;border-radius:50%;background:currentColor;content:""}.status.on{background:#eaf6f1;color:#147a62}.status.off{background:#e8ebee;color:#69717c}.actions{gap:8px;white-space:nowrap}.actions button{padding:3px 2px;font-size:14px}.actions .danger-text{color:#c9232d}.empty{padding:60px 20px;color:#667085;text-align:center}.dialog-intro{margin:-4px 0 18px;color:#667085}.form-section{margin-top:14px;padding:16px;border:1px solid #e6e8ec;border-radius:10px;background:#fafbfc}.form-section header{align-items:baseline;margin-bottom:14px}.form-section h3{margin:0;font-size:15px}.form-section header span,.form-grid small{color:#667085;font-size:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid>label{display:grid;gap:6px;font-weight:700}.form-grid .wide{grid-column:1/-1}.radio-row{display:flex;flex-wrap:wrap;gap:8px}.radio-row>label{padding:8px 10px;border:1px solid #cfd3d8;border-radius:8px;background:#fff;color:#667085;font-weight:650}.radio-row>label.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13}.destination-fields{margin-top:14px}.destination-summary{grid-column:1/-1;padding:11px 12px;border-radius:8px;background:#edf4fb;color:#294f80;font-size:13px}.upload{min-height:82px;display:flex;align-items:center;justify-content:center;gap:12px;border:1px dashed #bfc7d0;border-radius:8px;background:#fff;color:#245f9e;cursor:pointer}.upload img{width:120px;height:64px;object-fit:cover}.inline-radios{display:flex;gap:20px;font-weight:400}.notice{margin-top:16px;padding:12px;border-radius:8px;background:#fff6dc;color:#8a5a00}.copy-label{display:block;margin-top:16px}.copy-options{display:flex;gap:8px;margin-top:9px}.toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:12px;max-width:520px;padding:13px 15px;border-radius:8px;background:#e8f6f0;color:#164f3e;box-shadow:0 4px 8px rgba(24,32,43,.12)}.toast button{border:0;background:transparent;color:#155f4a;font-weight:700;cursor:pointer}.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}@media(max-width:900px){.page-head,.control-bar{align-items:stretch;flex-direction:column}.quick-search,.disclosure{width:100%;max-width:none}.project-grid{grid-template-columns:1fr 1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide,.destination-summary{grid-column:auto}.count{margin-left:0}}.form-grid small.fail{color:#a90a13}.thumb.popup,.upload.popup img{width:48px;height:72px}.thumb.float,.upload.float img{width:48px;height:48px}.thumb.splash,.upload.splash img{width:40px;height:72px}.upload.banner img{width:120px;height:64px}
</style>
