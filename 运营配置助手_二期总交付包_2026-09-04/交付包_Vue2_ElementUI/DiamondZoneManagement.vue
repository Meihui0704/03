<template>
  <section class="entry-legacy">
    <header class="page-head">
      <div><span class="version-note">新版工作台 · 信息分层视图</span><h1>首页入口管理</h1><p>统一管理金刚区和磁片区入口；先看位置，再处理入口和点击去向。</p></div>
      <button class="btn primary" type="button" @click="openEditor()">＋ 新增入口</button>
    </header>

    <section class="toolbar">
      <button class="btn category-trigger" type="button" @click="togglePanel('category')"><strong>项目分类</strong><span>{{ categorySummary }}</span><b>{{ categoryOpen ? '收起' : '展开' }}</b></button>
      <input v-model.trim="keyword" class="control" placeholder="搜索金刚区名称或 ID" aria-label="搜索首页入口">
      <button class="btn" :class="{ filterActive: hasAdvancedFilter }" type="button" @click="togglePanel('advanced')">筛选与排序 · {{ advancedOpen ? '收起' : '展开' }}</button>
    </section>

    <section v-show="categoryOpen" class="category-panel">
      <header><div><h2>项目分类</h2><p>按“项目 → 专业”逐级定位；没有子级时直接显示结果。</p></div><button class="text-btn" type="button" @click="categoryOpen = false">收起分类</button></header>
      <div class="category-grid"><button class="chip" :class="{ active: !filters.project }" type="button" @click="chooseProject('')">全部项目</button><button v-for="project in projects" :key="project.name" class="chip" :class="{ active: filters.project === project.name }" type="button" @click="chooseProject(project.name)">{{ project.name }}</button></div>
      <div v-if="filters.project" class="profession-area"><h3>专业与子级方向</h3><div class="category-grid"><button class="chip" :class="{ active: !filters.profession }" type="button" @click="filters.profession = ''">全部专业</button><button v-for="name in activeProjectProfessions" :key="name" class="chip" :class="{ active: filters.profession === name }" type="button" @click="filters.profession = filters.profession === name ? '' : name">{{ name }}</button></div></div>
      <p class="note">正式接入后，分类名称、层级和上下架状态统一由项目管理接口返回。</p>
    </section>

    <section v-show="advancedOpen" class="advanced-panel">
      <select v-model="filters.app" class="control"><option value="">全部应用</option><option>昭昭医考App</option><option>昭昭医考小程序</option></select>
      <select v-model="filters.page" class="control"><option value="">全部页面</option><option>首页</option><option>试卷详情页</option></select>
      <select v-model="filters.sort" class="control"><option value="new">最近修改优先</option><option value="old">最早修改优先</option></select>
      <button class="btn" type="button" @click="resetFilters">清空筛选</button>
    </section>

    <section class="status-row">
      <div class="segmented"><button v-for="item in positionOptions" :key="item.value" :class="{ active: filters.position === item.value }" type="button" @click="filters.position = item.value">{{ item.label }}</button></div>
      <div class="segmented"><button v-for="item in statusOptions" :key="item.value" :class="{ active: filters.status === item.value }" type="button" @click="setStatus(item.value)">{{ item.label }}</button></div>
      <div v-if="filters.status === 'OFF'" class="segmented"><button v-for="item in offRangeOptions" :key="item.value" :class="{ active: filters.offRange === item.value }" type="button" @click="filters.offRange = item.value">{{ item.label }}</button></div>
      <span class="count">{{ filteredRows.length }} 条</span>
    </section>

    <section class="batchbar">
      <button class="btn compact" type="button" @click="toggleAll">{{ allVisibleSelected ? '取消全选' : '全选当前结果' }}</button><span>{{ selectedIds.length ? `已选择 ${selectedIds.length} 条` : '未选择记录' }}</span>
      <button v-if="selectedIds.length" class="btn compact" type="button" @click="bulkToggle('ON')">校验后批量启用</button><button v-if="selectedIds.length" class="btn compact" type="button" @click="bulkToggle('OFF')">批量停用</button><button v-if="selectedIds.length" class="btn compact danger" type="button" @click="bulkDelete">删除已选</button>
    </section>

    <div class="table-wrap">
      <table><thead><tr><th><input type="checkbox" :checked="allVisibleSelected" aria-label="全选当前结果" @change="toggleAll"></th><th>入口</th><th>投放范围</th><th>点击后去向</th><th>有效期</th><th>最后修改</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.id" :class="{ off: row.status === 'OFF', focused: focusedId === row.id }">
            <td><input v-model="selectedIds" type="checkbox" :value="row.id" :aria-label="`选择 ${row.name}`"></td>
            <td><div class="entry-cell"><span class="entry-icon"><img v-if="row.iconUrl" :src="row.iconUrl" alt=""><template v-else>{{ row.icon || row.name.slice(0, 1) }}</template></span><span><strong>{{ row.name }}</strong><small>ID {{ row.id }}</small></span></div></td>
            <td><strong>{{ row.app }} · {{ row.position }}</strong><small>{{ row.project }} · {{ row.profession }}</small></td>
            <td><strong>{{ row.target || '尚未配置' }}</strong><small>{{ hasDestination(row) ? (row.content || '无需选择具体内容') : '未完成，不能启用' }}</small></td>
            <td><strong>{{ periodStart(row.period) }}</strong><small v-if="row.period !== '长期'">至 {{ periodEnd(row.period) }}</small></td>
            <td><strong>{{ row.updatedBy }}</strong><small>{{ row.updatedAt }}</small></td>
            <td><span class="status" :class="row.status === 'ON' ? 'on' : 'off'">{{ row.status === 'ON' ? '启用' : '已停用' }}</span></td>
            <td>
              <div class="actions">
                <button type="button" @click="openEditor(row)">编辑</button>
                <button type="button" @click="openPreview(row)">查看详情</button>
                <el-dropdown trigger="click" placement="bottom-end" @command="handleMore($event, row)">
                  <button class="more-trigger" type="button">更多 ▾</button>
                  <el-dropdown-menu slot="dropdown" class="entry-more-menu">
                    <el-dropdown-item command="destination">仅改去向</el-dropdown-item><el-dropdown-item command="copy">复制入口</el-dropdown-item><el-dropdown-item command="toggle">{{ row.status === 'ON' ? '停用' : '启用' }}</el-dropdown-item><el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredRows.length"><td colspan="8" class="empty">暂无匹配记录，请调整筛选条件。</td></tr>
        </tbody>
      </table>
    </div>

    <el-dialog :title="editingId ? '编辑入口' : '新增入口'" :visible.sync="editorVisible" width="820px" top="4vh" append-to-body :close-on-click-modal="false">
      <section class="step"><header><h2>入口样式与位置</h2><p>金刚区和磁片区在这里统一选择，不拆成两个管理页面。</p></header>
        <label class="field-label">显示应用</label><div class="radio-cards"><button v-for="name in ['昭昭医考App','昭昭医考小程序']" :key="name" class="radio-card" :class="{ active: form.app === name }" type="button" @click="form.app = name">{{ name }}</button></div>
        <label class="field-label">显示页面与位置</label><div class="radio-cards"><button v-for="name in ['金刚区','磁片区']" :key="name" class="radio-card" :class="{ active: form.position === name }" type="button" @click="form.position = name">首页 · {{ name }}</button></div>
        <label class="field-label">入口名称</label><input v-model.trim="form.name" class="control full" maxlength="8" placeholder="建议 2–6 个字">
        <label class="field-label">入口图标</label><div class="icon-editor"><span class="entry-icon large"><img v-if="form.iconUrl" :src="form.iconUrl" alt=""><template v-else>{{ form.name.slice(0, 1) || '图' }}</template></span><button class="btn" type="button" @click="$refs.iconInput.click()">选择 80×80 图片</button><input ref="iconInput" hidden type="file" accept="image/png,image/jpeg,image/gif" @change="readIcon"></div>
      </section>
      <section class="step"><header><h2>展示给谁</h2><p>可同时选择多个项目和专业；“全选”只作用于当前区域。</p></header>
        <div class="scope-box"><div class="scope-head"><strong>所属项目</strong><button class="text-btn" type="button" @click="toggleAllProjects">{{ allProjectsSelected ? '取消全选' : '全选项目' }}</button></div><label v-for="project in projects" :key="project.name" class="check-chip"><input v-model="form.projects" type="checkbox" :value="project.name">{{ project.name }}</label></div>
        <div class="scope-box"><div class="scope-head"><strong>所属专业</strong><button class="text-btn" type="button" @click="toggleAllProfessions">{{ allProfessionsSelected ? '取消全选' : '全选专业' }}</button></div><label v-for="name in allProfessions" :key="name" class="check-chip"><input v-model="form.professions" type="checkbox" :value="name">{{ name }}</label></div>
      </section>
      <section class="step"><header><h2>有效期</h2><p>长期入口无需反复续期；短期入口设置明确的开始和结束时间。</p></header>
        <div class="period-row"><label class="check-chip"><input v-model="form.periodType" type="radio" value="long">长期</label><label class="check-chip"><input v-model="form.periodType" type="radio" value="range">配置有效期</label><template v-if="form.periodType === 'range'"><input v-model="form.start" class="control" type="date"><span>至</span><input v-model="form.end" class="control" type="date"></template></div>
      </section>
      <template slot="footer"><el-button @click="editorVisible = false">取消</el-button><el-button @click="saveEntry(false)">仅保存基础信息</el-button><el-button type="primary" @click="saveEntry(true)">保存并配置去向 →</el-button></template>
    </el-dialog>

    <el-dialog title="配置点击去向" :visible.sync="destinationVisible" width="900px" top="4vh" append-to-body :close-on-click-modal="false">
      <div v-if="activeRow" class="context-strip"><strong>{{ activeRow.name }}</strong><span>{{ activeRow.position }} · {{ activeRow.project }} · {{ activeRow.profession }}</span></div>
      <section class="step"><header><h2>打开位置</h2><p>金刚区图标和磁片点击后都必须配置明确去向。</p></header><div class="radio-cards"><button v-for="item in modes" :key="item.value" class="radio-card" :class="{ active: destination.mode === item.value }" type="button" @click="changeMode(item.value)">{{ item.label }}</button></div></section>
      <section class="step"><header><h2>点击后去哪里</h2><p>只显示当前打开方式需要的字段。</p></header>
        <template v-if="destination.mode === 'APP_IN'">
          <label class="field-label">目标页面</label><select v-model="destination.page" class="control full" @change="destination.selected = null"><option value="">请选择目标页面</option><option v-for="page in targetPages" :key="page.code" :value="page.code">{{ page.name }}</option></select>
          <div v-if="selectedPage && selectedPage.requires" class="picker">
            <template v-if="destination.selected"><div class="picker-head"><div><h3>已选择具体内容</h3><p>同时保存名称和 ID。</p></div><button class="text-btn" type="button" @click="destination.selected = null">重新选择</button></div><div class="selected-content"><span><strong>{{ destination.selected.name }}</strong><small>ID {{ destination.selected.id }}</small></span>✓</div></template>
            <template v-else><div class="picker-head"><div><h3>选择具体内容</h3><p>项目、专业、科目和章节由真实内容接口联动返回。</p></div></div><div class="content-filters"><input v-model.trim="contentKeyword" class="control" placeholder="名称或 ID"><select class="control"><option>临床</option></select><select class="control"><option>临床执业医师</option><option>临床助理医师</option></select><select class="control"><option>全部科目</option><option>高频题库</option></select><select class="control"><option>全部章节</option><option>呼吸系统</option></select><button class="btn blue" type="button" @click="contentSearched = true">查询</button></div><div v-if="contentSearched" class="result-list"><label v-for="item in contentResults" :key="item.id"><input v-model="pendingContentId" type="radio" :value="item.id"><span><strong>{{ item.name }}</strong><small>ID {{ item.id }} · {{ item.project }} · {{ item.profession }}</small></span></label><button v-if="pendingContentId" class="btn" type="button" @click="selectContent">使用所选内容</button></div><p v-else class="empty small">点击查询加载可选内容</p></template>
          </div>
        </template>
        <template v-else-if="destination.mode === 'APP_OUT'"><label class="field-label">外部链接</label><input v-model.trim="destination.externalUrl" class="control full" placeholder="https://"></template>
        <div v-else class="two-columns"><label><span>小程序 AppID</span><input v-model.trim="destination.miniAppId" class="control"></label><label><span>页面路径</span><input v-model.trim="destination.miniPath" class="control" placeholder="pages/detail/index"></label></div>
        <div class="destination-summary"><span>点击结果</span><strong>{{ destinationSummary }}</strong></div>
      </section>
      <template slot="footer"><el-button @click="destinationVisible = false">取消</el-button><el-button type="primary" @click="saveDestination">保存去向</el-button></template>
    </el-dialog>

    <el-dialog title="入口详情与去向预览" :visible.sync="previewVisible" width="760px" append-to-body>
      <template v-if="activeRow"><div class="context-strip"><strong>{{ activeRow.name }}</strong><span>ID {{ activeRow.id }} · {{ activeRow.status === 'ON' ? '启用' : '已停用' }}</span></div>
        <section class="step"><header><h2>旧后台基础字段</h2><p>完整保留原有字段，但不在列表中全部平铺。</p></header><dl class="detail-grid"><div><dt>显示应用</dt><dd>{{ activeRow.app }}</dd></div><div><dt>显示页面</dt><dd>{{ activeRow.page }}</dd></div><div><dt>显示位置</dt><dd>{{ activeRow.position }}</dd></div><div><dt>入口名称</dt><dd>{{ activeRow.name }}</dd></div><div><dt>所属项目</dt><dd>{{ activeRow.project }}</dd></div><div><dt>所属专业</dt><dd>{{ activeRow.profession }}</dd></div><div><dt>创建人</dt><dd>{{ activeRow.createdBy || activeRow.updatedBy }}</dd></div><div><dt>创建时间</dt><dd>{{ activeRow.createdAt || activeRow.updatedAt }}</dd></div><div class="wide"><dt>有效期</dt><dd>{{ activeRow.period }}</dd></div></dl></section>
        <section class="step"><header><h2>{{ hasDestination(activeRow) ? '点击后将打开' : '该入口尚不能启用' }}</h2><p>{{ hasDestination(activeRow) ? '启用前请核对展示范围和点击目标。' : '请先补齐目标页面或具体内容。' }}</p></header><div class="destination-summary"><span>最终去向</span><strong>{{ destinationText(activeRow) }}</strong></div></section></template>
      <template slot="footer"><el-button @click="previewVisible = false">关闭</el-button><el-button v-if="activeRow && !hasDestination(activeRow)" type="primary" @click="previewVisible = false; openDestination(activeRow)">立即配置去向</el-button></template>
    </el-dialog>

    <el-dialog title="复制金刚区" :visible.sync="copyVisible" width="480px" append-to-body><p v-if="copySource">完整复制“{{ copySource.name }}”的展示范围和点击去向，副本默认停用。</p><div class="copy-options"><button v-for="count in [1,5,10]" :key="count" class="chip" :class="{ active: copyCount === count }" type="button" @click="copyCount = count">{{ count }} 条</button></div><div class="warning">复制后可在“今天停用”中查看，并可整批撤回。</div><template slot="footer"><el-button @click="copyVisible = false">取消</el-button><el-button type="primary" @click="copyEntries">确认复制</el-button></template></el-dialog>

    <transition name="toast"><div v-if="toast.visible" class="toast"><span>{{ toast.text }}</span><button v-if="toast.undo" type="button" @click="undoLast">撤回</button><button type="button" aria-label="关闭提示" @click="toast.visible = false">×</button></div></transition>
  </section>
</template>

<script>
const projects = [
  { name: '临床', professions: ['临床执业医师', '临床助理医师'] },
  { name: '中医/中西医', professions: ['中医执业医师', '中医助理医师'] },
  { name: '护理', professions: ['护士执业'] },
  { name: '西医', professions: ['西医综合'] }
]
const defaults = [
  { id: 1201, name: '估分系统', icon: '估', app: '昭昭医考App', page: '首页', position: '金刚区', project: '临床', profession: '临床执业医师', target: '试卷详情页', content: '试卷 3784519', contentId: '3784519', status: 'ON', updatedBy: '美惠', updatedAt: '2026-09-02 13:28', period: '2026-09-02 至 2026-09-30' },
  { id: 1202, name: '冲刺书籍', icon: '书', app: '昭昭医考App', page: '首页', position: '磁片区', project: '中医/中西医', profession: '中医执业医师', target: '周考排行', content: '无需选择具体内容', contentId: '', status: 'ON', updatedBy: '张旭', updatedAt: '2026-09-02 12:40', period: '长期' },
  { id: 1203, name: '押题试卷', icon: '卷', app: '昭昭医考小程序', page: '首页', position: '金刚区', project: '临床', profession: '临床助理医师', target: '试卷详情页', content: '试卷 3784521', contentId: '3784521', status: 'OFF', offAt: '2026-09-02', updatedBy: '美惠', updatedAt: '2026-09-02 11:22', period: '长期' }
]
const targetPages = [{ code: 'PAPER_DETAIL', name: '试卷详情页', requires: true }, { code: 'QUESTION_DETAIL', name: '试题详情页', requires: true }, { code: 'PRODUCT_LIST', name: '商品列表页', requires: true }, { code: 'PRODUCT_DETAIL', name: '商品详情页', requires: true }, { code: 'ACTIVITY', name: '活动管理页', requires: true }, { code: 'MOCK', name: '模拟考试', requires: false }, { code: 'WEEK_RANK', name: '周考排行', requires: false }, { code: 'HONOR', name: 'App 刷题排行榜', requires: false }]
const contentPool = [{ id: '3784519', name: '试卷 3784519', project: '临床', profession: '临床执业医师' }, { id: '3784520', name: '试卷 3784520', project: '临床', profession: '临床执业医师' }, { id: '3784521', name: '试卷 3784521', project: '临床', profession: '临床助理医师' }]
const blankForm = () => ({ name: '', iconUrl: '', app: '昭昭医考App', position: '金刚区', projects: ['临床'], professions: ['临床执业医师'], periodType: 'long', start: '', end: '' })
const blankDestination = () => ({ mode: 'APP_IN', page: '', selected: null, externalUrl: '', miniAppId: '', miniPath: '' })

export default {
  name: 'DiamondZoneManagement',
  data () { return { projects, targetPages, rows: [], keyword: '', categoryOpen: false, advancedOpen: false, filters: { project: '', profession: '', app: '', page: '', sort: 'new', position: 'ALL', status: 'ON', offRange: 'TODAY' }, selectedIds: [], positionOptions: [{ label: '全部位置', value: 'ALL' }, { label: '金刚区', value: '金刚区' }, { label: '磁片区', value: '磁片区' }], statusOptions: [{ label: '使用中', value: 'ON' }, { label: '已停用', value: 'OFF' }, { label: '全部状态', value: 'ALL' }], offRangeOptions: [{ label: '今天', value: 'TODAY' }, { label: '一周内', value: 'WEEK' }, { label: '一个月内', value: 'MONTH' }, { label: '全部', value: 'ALL' }], editorVisible: false, editingId: null, form: blankForm(), destinationVisible: false, destination: blankDestination(), activeRow: null, contentKeyword: '', contentSearched: false, pendingContentId: '', previewVisible: false, copyVisible: false, copySource: null, copyCount: 1, focusedId: null, undoState: null, toast: { visible: false, text: '', undo: false }, modes: [{ value: 'APP_IN', label: 'App 内打开' }, { value: 'APP_OUT', label: 'App 外打开' }, { value: 'MINI', label: '小程序' }] } },
  computed: {
    categorySummary () { return this.filters.project ? `${this.filters.project}${this.filters.profession ? ` · ${this.filters.profession}` : ''}` : '全部项目' },
    activeProjectProfessions () { return this.projects.find(item => item.name === this.filters.project)?.professions || [] },
    allProfessions () { return this.projects.reduce((all, project) => all.concat(project.professions), []) },
    allProjectsSelected () { return this.form.projects.length === this.projects.length },
    allProfessionsSelected () { return this.form.professions.length === this.allProfessions.length },
    hasAdvancedFilter () { return Boolean(this.filters.app || this.filters.page || this.filters.sort !== 'new') },
    filteredRows () { const query = this.keyword.toLowerCase(); return this.rows.filter(row => (this.filters.status === 'ALL' || row.status === this.filters.status) && (this.filters.position === 'ALL' || row.position === this.filters.position) && (!this.filters.project || row.project.includes(this.filters.project)) && (!this.filters.profession || row.profession.includes(this.filters.profession)) && (!this.filters.app || row.app === this.filters.app) && (!this.filters.page || row.page === this.filters.page) && (!query || `${row.name} ${row.id}`.toLowerCase().includes(query))).slice().sort((a, b) => this.filters.sort === 'old' ? a.id - b.id : b.id - a.id) },
    allVisibleSelected () { return this.filteredRows.length > 0 && this.filteredRows.every(row => this.selectedIds.includes(row.id)) },
    selectedPage () { return this.targetPages.find(page => page.code === this.destination.page) },
    contentResults () { const query = this.contentKeyword.toLowerCase(); return contentPool.filter(item => !query || `${item.name} ${item.id}`.toLowerCase().includes(query)) },
    destinationSummary () { if (this.destination.mode === 'APP_IN') return this.selectedPage ? `${this.selectedPage.name}${this.destination.selected ? ` · ${this.destination.selected.name}（ID ${this.destination.selected.id}）` : ''}` : '尚未选择目标页面'; if (this.destination.mode === 'APP_OUT') return this.destination.externalUrl || '尚未填写外部链接'; return this.destination.miniAppId && this.destination.miniPath ? `小程序 ${this.destination.miniAppId} · ${this.destination.miniPath}` : '尚未填写小程序信息' }
  },
  created () { this.loadRows() },
  methods: {
    loadRows () { try { const saved = JSON.parse(localStorage.getItem('diamond-zone-demo-v2')); this.rows = Array.isArray(saved) && saved.length ? saved : defaults.map(item => ({ ...item })) } catch (error) { this.rows = defaults.map(item => ({ ...item })) } },
    persist () { localStorage.setItem('diamond-zone-demo-v2', JSON.stringify(this.rows)) },
    togglePanel (name) { this.categoryOpen = name === 'category' ? !this.categoryOpen : false; this.advancedOpen = name === 'advanced' ? !this.advancedOpen : false },
    chooseProject (name) { this.filters.project = name; this.filters.profession = '' },
    setStatus (value) { this.filters.status = value; this.selectedIds = [] },
    resetFilters () { Object.assign(this.filters, { project: '', profession: '', app: '', page: '', sort: 'new', position: 'ALL' }); this.keyword = '' },
    toggleAll () { this.selectedIds = this.allVisibleSelected ? [] : this.filteredRows.map(row => row.id) },
    periodStart (period) { return period === '长期' ? '长期' : period.split(' 至 ')[0] },
    periodEnd (period) { return period.split(' 至 ')[1] || '—' },
    hasDestination (row) { if (!row || !row.target || row.target === '尚未配置') return false; if (row.destination?.mode === 'APP_OUT') return /^https:\/\//i.test(row.destination.externalUrl || ''); if (row.destination?.mode === 'MINI') return Boolean(row.destination.miniAppId && row.destination.miniPath); const page = this.targetPages.find(item => item.name === row.target); return !page?.requires || Boolean(row.contentId) },
    destinationText (row) { if (!this.hasDestination(row)) return '尚未配置完整去向'; if (row.destination?.mode === 'APP_OUT') return row.destination.externalUrl; if (row.destination?.mode === 'MINI') return `小程序 ${row.destination.miniAppId} · ${row.destination.miniPath}`; return `${row.target}${row.content && row.content !== '无需选择具体内容' ? ` · ${row.content}${row.contentId ? `（ID ${row.contentId}）` : ''}` : ''}` },
    openEditor (row) { this.editingId = row?.id || null; this.form = row ? { name: row.name, iconUrl: row.iconUrl || '', app: row.app, position: row.position, projects: row.project.split('、'), professions: row.profession.split('、'), periodType: row.period === '长期' ? 'long' : 'range', start: this.periodStart(row.period), end: this.periodEnd(row.period) } : blankForm(); this.editorVisible = true },
    readIcon (event) { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { this.form.iconUrl = e.target.result }; reader.readAsDataURL(file) },
    toggleAllProjects () { this.form.projects = this.allProjectsSelected ? [] : this.projects.map(item => item.name) },
    toggleAllProfessions () { this.form.professions = this.allProfessionsSelected ? [] : this.allProfessions.slice() },
    saveEntry (goNext) { if (!this.form.name) { this.$message.warning('请填写入口名称'); return } if (!this.form.projects.length || !this.form.professions.length) { this.$message.warning('请至少选择一个项目和专业'); return } if (this.form.periodType === 'range' && (!this.form.start || !this.form.end || this.form.end < this.form.start)) { this.$message.warning('请填写正确的有效期'); return } const now = this.nowText(); let row = this.rows.find(item => item.id === this.editingId); const base = { name: this.form.name, icon: this.form.name.slice(0, 1), iconUrl: this.form.iconUrl, app: this.form.app, page: '首页', position: this.form.position, project: this.form.projects.join('、'), profession: this.form.professions.join('、'), period: this.form.periodType === 'long' ? '长期' : `${this.form.start} 至 ${this.form.end}`, updatedBy: '美惠', updatedAt: now }; if (row) Object.assign(row, base); else { row = { ...base, id: Math.max(1200, ...this.rows.map(item => item.id + 1)), target: '尚未配置', content: '请配置具体内容', contentId: '', status: 'OFF', offAt: now }; this.rows.unshift(row) } this.persist(); this.editorVisible = false; this.focusRecord(row.id); if (goNext) { this.showToast('基础信息已保存，继续配置点击去向'); this.openDestination(row) } else this.showToast('入口基础信息已保存') },
    openDestination (row) { const saved = row.destination || {}; this.activeRow = row; this.destination = { mode: saved.mode || 'APP_IN', page: saved.page || this.targetPages.find(item => item.name === row.target)?.code || '', selected: row.contentId ? { id: row.contentId, name: row.content } : null, externalUrl: saved.externalUrl || '', miniAppId: saved.miniAppId || '', miniPath: saved.miniPath || '' }; this.contentKeyword = ''; this.contentSearched = false; this.pendingContentId = ''; this.destinationVisible = true },
    changeMode (mode) { this.destination = { ...blankDestination(), mode } },
    selectContent () { this.destination.selected = contentPool.find(item => item.id === this.pendingContentId) || null },
    saveDestination () { const page = this.selectedPage; if (this.destination.mode === 'APP_IN' && !page) { this.$message.warning('请先选择目标页面'); return } if (this.destination.mode === 'APP_IN' && page.requires && !this.destination.selected) { this.$message.warning('请选择具体内容'); return } if (this.destination.mode === 'APP_OUT' && !/^https:\/\//i.test(this.destination.externalUrl)) { this.$message.warning('请输入 https:// 开头的完整外部链接'); return } if (this.destination.mode === 'MINI' && (!this.destination.miniAppId || !this.destination.miniPath)) { this.$message.warning('请填写小程序 AppID 和页面路径'); return } const row = this.activeRow; row.destination = { mode: this.destination.mode, page: this.destination.page, externalUrl: this.destination.externalUrl, miniAppId: this.destination.miniAppId, miniPath: this.destination.miniPath }; row.target = this.destination.mode === 'APP_IN' ? page.name : this.destination.mode === 'APP_OUT' ? '外部链接' : '小程序'; row.content = this.destination.mode === 'APP_IN' ? (this.destination.selected ? this.destination.selected.name : '无需选择具体内容') : this.destination.mode === 'APP_OUT' ? this.destination.externalUrl : this.destination.miniPath; row.contentId = this.destination.selected?.id || ''; row.updatedAt = this.nowText(); this.persist(); this.destinationVisible = false; this.focusRecord(row.id); this.showToast('点击去向已保存，可使用“查看详情”复查') },
    openPreview (row) { this.activeRow = row; this.previewVisible = true },
    handleMore (command, row) { if (command === 'destination') this.openDestination(row); if (command === 'copy') this.openCopy(row); if (command === 'toggle') this.confirmToggle(row); if (command === 'delete') this.confirmDelete(row) },
    openCopy (row) { this.copySource = row; this.copyCount = 1; this.copyVisible = true },
    copyEntries () { const ids = []; for (let i = 0; i < this.copyCount; i++) { const id = Math.max(1200, ...this.rows.map(item => item.id + 1)); ids.push(id); this.rows.unshift({ ...this.copySource, id, name: `${this.copySource.name}（副本${i + 1}）`, status: 'OFF', offAt: this.today(), updatedBy: '美惠', updatedAt: this.nowText() }) } this.undoState = { type: 'copy', ids }; this.persist(); this.copyVisible = false; this.filters.status = 'OFF'; this.filters.offRange = 'TODAY'; this.focusRecord(ids[0]); this.showToast(`已复制 ${ids.length} 条，可在“今天停用”中查看。`, true) },
    confirmToggle (row) { if (row.status === 'OFF' && !this.hasDestination(row)) { this.$message.warning('该入口尚未配置完整去向，补齐后才能启用'); this.openDestination(row); return } const action = row.status === 'ON' ? '停用' : '启用'; this.$confirm(row.status === 'ON' ? '停用后前台不再显示此入口。' : '启用前将检查同页面、位置、专业和有效期冲突。', `确认${action}`, { confirmButtonText: `确认${action}`, cancelButtonText: '取消', type: 'warning' }).then(() => { const before = { ...row }; row.status = row.status === 'ON' ? 'OFF' : 'ON'; row.offAt = row.status === 'OFF' ? this.today() : ''; row.updatedBy = '美惠'; row.updatedAt = this.nowText(); this.undoState = { type: 'replace', row: before }; this.persist(); this.showToast(`已${action}`, true) }).catch(() => {}) },
    confirmDelete (row) { this.$confirm(`删除“${row.name}”后可在页面提示中撤回。`, '确认删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => { this.undoState = { type: 'delete', rows: [{ ...row }] }; this.rows = this.rows.filter(item => item.id !== row.id); this.persist(); this.showToast('已删除 1 条。', true) }).catch(() => {}) },
    bulkToggle (status) { const chosen = this.rows.filter(row => this.selectedIds.includes(row.id)); if (status === 'ON' && chosen.some(row => !this.hasDestination(row))) { this.$message.warning('所选入口中有未配置完整去向的记录，不能批量启用'); return } this.$confirm(`将处理已选择的 ${chosen.length} 条记录；启用前逐条检查冲突。`, status === 'ON' ? '确认批量启用' : '确认批量停用', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }).then(() => { this.undoState = { type: 'bulkReplace', rows: chosen.map(row => ({ ...row })) }; chosen.forEach(row => { row.status = status; row.offAt = status === 'OFF' ? this.today() : ''; row.updatedAt = this.nowText() }); this.selectedIds = []; this.persist(); this.showToast('批量操作完成', true) }).catch(() => {}) },
    bulkDelete () { const chosen = this.rows.filter(row => this.selectedIds.includes(row.id)); this.$confirm(`将删除已选择的 ${chosen.length} 条记录。`, '批量删除警告', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => { this.undoState = { type: 'delete', rows: chosen.map(row => ({ ...row })) }; this.rows = this.rows.filter(row => !this.selectedIds.includes(row.id)); this.selectedIds = []; this.persist(); this.showToast(`已删除 ${chosen.length} 条。`, true) }).catch(() => {}) },
    undoLast () { const action = this.undoState; if (!action) return; if (action.type === 'copy') this.rows = this.rows.filter(row => !action.ids.includes(row.id)); if (action.type === 'delete') this.rows.unshift(...action.rows); if (action.type === 'replace') { const row = this.rows.find(item => item.id === action.row.id); if (row) Object.assign(row, action.row) } if (action.type === 'bulkReplace') action.rows.forEach(before => { const row = this.rows.find(item => item.id === before.id); if (row) Object.assign(row, before) }); this.undoState = null; this.persist(); this.toast.visible = false; this.$message.success('已撤回上一项操作') },
    focusRecord (id) { this.focusedId = id; window.setTimeout(() => { if (this.focusedId === id) this.focusedId = null }, 3200) },
    today () { return new Date().toISOString().slice(0, 10) },
    nowText () { return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') },
    showToast (text, undo = false) { this.toast = { visible: true, text, undo }; window.clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => { this.toast.visible = false }, undo ? 15000 : 5000) }
  }
}
</script>

<style scoped>
.entry-legacy{color:#20242c}.page-head,.toolbar,.category-panel header,.status-row,.batchbar,.actions,.step header,.scope-head,.picker-head,.context-strip{display:flex;align-items:center;gap:12px}.page-head{justify-content:space-between;align-items:flex-end;margin-bottom:26px}.version-note{display:inline-flex;margin-bottom:8px;padding:4px 8px;border-radius:6px;background:#fff0f1;color:#8f111a;font-size:12px;font-weight:700}.page-head h1{margin:0;font-size:26px;line-height:1.25}.page-head p{margin:7px 0 0;color:#667085}.btn,.control,.chip,.radio-card{font:inherit}.btn{min-height:40px;padding:8px 14px;border:1px solid #d7dbe1;border-radius:7px;background:#fff;color:#303844;font-weight:600;cursor:pointer}.btn.primary{border-color:#c91420;background:#c91420;color:#fff}.btn.blue{border-color:#245f9e;background:#245f9e;color:#fff}.btn.compact{min-height:34px;padding:6px 11px;font-size:13px}.btn.danger{border-color:#e6aeb2;color:#c9232d}.toolbar{flex-wrap:wrap}.toolbar .control{min-width:250px;flex:1;max-width:420px}.control{height:40px;padding:0 12px;border:1px solid #cbd2da;border-radius:7px;background:#fff;color:#20242c}.control.full{width:100%}.category-trigger{min-width:230px;display:grid;grid-template-columns:auto 1fr auto;text-align:left}.category-trigger span{overflow:hidden;margin-left:8px;color:#667085;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.category-trigger b{color:#245f9e;font-size:12px}.filterActive{border-color:#8fb2df;background:#edf4fb;color:#245f9e}.category-panel,.advanced-panel{margin-top:12px;padding:20px;border:1px solid #e6e8ec;border-radius:10px;background:#fff}.category-panel header{justify-content:space-between}.category-panel h2,.step h2{margin:0;font-size:17px}.category-panel p,.step p,.picker-head p{margin:4px 0 0;color:#667085;font-size:13px}.text-btn,.actions button,.more-trigger{border:0;background:transparent;color:#245f9e;font-size:14px;font-weight:600;cursor:pointer}.category-grid{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.chip{padding:8px 14px;border:1px solid #cfd5dc;border-radius:999px;background:#fff;color:#39424d;cursor:pointer}.chip.active{border-color:#e78c92;background:#fff1f2;color:#a90a13;font-weight:700}.profession-area{margin-top:18px;padding-top:16px;border-top:1px solid #e6e8ec}.profession-area h3{margin:0;font-size:15px}.note{color:#667085;font-size:12px}.advanced-panel{display:flex;flex-wrap:wrap;gap:12px;padding:14px}.advanced-panel .control{min-width:190px}.status-row{flex-wrap:wrap;margin:22px 0 12px;padding-top:18px;border-top:1px solid #e6e8ec}.segmented{display:inline-flex;padding:2px;border:1px solid #dfe2e7;border-radius:8px;background:#fff}.segmented button{min-height:34px;padding:6px 13px;border:0;border-radius:6px;background:transparent;color:#515966;font-size:14px;cursor:pointer}.segmented button.active{background:#fff1f2;color:#a90a13;font-weight:700}.count{margin-left:auto;color:#667085}.batchbar{min-height:44px;margin-bottom:8px}.batchbar span{color:#667085;font-size:12px}.table-wrap{overflow:auto;border:1px solid #e6e8ec;border-radius:10px;background:#fff}table{width:100%;min-width:1160px;border-collapse:collapse;table-layout:fixed}th,td{padding:15px 16px;border-bottom:1px solid #e6e8ec;text-align:left;vertical-align:middle}th{height:48px;background:#fafafa;color:#5d6470;font-size:13px;white-space:nowrap}th:first-child{width:48px}th:nth-child(2){width:190px}th:nth-child(3){width:235px}th:nth-child(4){width:225px}th:nth-child(5){width:180px}th:nth-child(6){width:155px}th:nth-child(7){width:95px}th:nth-child(8){width:210px}tbody tr:hover{background:#fafbfd}tbody tr.off{color:#7a818b;background:#f5f6f7}tbody tr.focused{background:#edf4fb;box-shadow:inset 0 0 0 2px #8fb2df}.entry-cell{display:flex;align-items:center;gap:12px}.entry-icon{width:40px;height:40px;display:grid;place-items:center;overflow:hidden;border-radius:9px;background:#ffe7e9;color:#a90a13;font-weight:800}.entry-icon.large{width:96px;height:96px;font-size:30px}.entry-icon img{width:100%;height:100%;object-fit:cover}td strong,td small,.entry-cell strong,.entry-cell small{display:block}.entry-cell strong{font-size:14px}.entry-cell small,td small{margin-top:4px;color:#69717c;font-size:12px}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}.status:before{width:7px;height:7px;border-radius:50%;background:currentColor;content:""}.status.on{background:#eaf6f1;color:#147a62}.status.off{background:#e8ebee;color:#69717c}.actions{gap:8px;white-space:nowrap}.more-trigger{padding:3px 2px}.empty{padding:60px 20px;color:#667085;text-align:center}.empty.small{padding:28px}.step{padding:20px 0}.step+.step{border-top:1px solid #e6e8ec}.step header{align-items:baseline;margin-bottom:14px}.field-label{display:block;margin:14px 0 7px;font-weight:700}.radio-cards{display:flex;flex-wrap:wrap;gap:10px}.radio-card{padding:12px 16px;border:1px solid #cfd5dc;border-radius:9px;background:#fff;cursor:pointer}.radio-card.active{border-color:#e78c92;background:#fff1f2;color:#a90a13;font-weight:700}.icon-editor{display:flex;align-items:center;gap:16px}.scope-box,.picker{margin-top:10px;padding:14px;border:1px solid #edf0f3;border-radius:10px;background:#fafbfc}.scope-head,.picker-head{justify-content:space-between;margin-bottom:10px}.check-chip{display:inline-flex;align-items:center;gap:6px;margin:4px 6px 4px 0;padding:8px 11px;border:1px solid #d2d8df;border-radius:8px;background:#fff}.period-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}.context-strip{justify-content:flex-start;padding:12px 14px;border-radius:8px;background:#edf4fb}.context-strip span{color:#536274}.content-filters{display:grid;grid-template-columns:1.3fr repeat(4,1fr) auto;gap:8px}.result-list{max-height:280px;margin-top:14px;overflow:auto}.result-list label{display:flex;gap:10px;padding:12px;border-top:1px solid #e6e8ec}.result-list small{display:block;color:#667085}.selected-content{display:flex;align-items:center;justify-content:space-between;padding:13px;border-radius:8px;background:#eaf6f1;color:#176e57}.selected-content small{display:block}.destination-summary{display:flex;gap:12px;margin-top:15px;padding:13px;border-radius:8px;background:#edf4fb;color:#173b60}.destination-summary span{color:#526477}.two-columns,.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.two-columns label{display:grid;gap:6px;font-weight:700}.detail-grid{margin:0}.detail-grid div{padding:8px 0}.detail-grid .wide{grid-column:1/-1}.detail-grid dt{color:#667085;font-size:12px}.detail-grid dd{margin:4px 0 0;font-weight:600}.copy-options{display:flex;gap:8px;margin-top:16px}.warning{margin-top:16px;padding:12px;border-radius:8px;background:#fff6dc;color:#8a5a00}.toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:12px;max-width:520px;padding:13px 15px;border-radius:8px;background:#e8f6f0;color:#164f3e;box-shadow:0 4px 8px rgba(24,32,43,.12)}.toast button{border:0;background:transparent;color:#155f4a;font-weight:700;cursor:pointer}.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}@media(max-width:900px){.page-head,.toolbar{align-items:stretch;flex-direction:column}.toolbar .control,.category-trigger{width:100%;max-width:none}.content-filters,.two-columns,.detail-grid{grid-template-columns:1fr}.detail-grid .wide{grid-column:auto}.count{margin-left:0}}@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>

<style>
.entry-more-menu .el-dropdown-menu__item{font-size:14px!important}.entry-more-menu .el-dropdown-menu__item:last-child{color:#c9232d}
</style>
