<template>
  <section class="project-management">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>基础资料</span><i class="el-icon-arrow-right" />项目管理</div>
        <h1 class="page-title">项目管理</h1>
        <p class="page-description">项目是地图，专业挂在项目下面，子级再往下分。先选方向，再看列表，不把所有专业摊在一张表里。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <nav class="section-tabs" aria-label="项目管理视图">
      <button v-for="item in views" :key="item.key" :class="{ active: view === item.key }" type="button" @click="view = item.key">
        {{ item.label }}<span v-if="item.count !== null">{{ item.count }}</span>
      </button>
    </nav>

    <template v-if="view === 'projects'">
      <div class="section-head"><div><h2>项目总览</h2><p>当前只展示正在使用的上架项目；已下架数据不进入日常工作列表。</p></div><el-button type="primary" @click="openProjectEditor()">新增项目</el-button></div>
      <div class="toolbar"><el-input v-model.trim="projectKeyword" clearable prefix-icon="el-icon-search" placeholder="搜索上架项目名称或 ID" @keyup.enter.native="noop" /><el-button @click="projectKeyword = ''">重置</el-button><span class="result-count">当前显示 {{ visibleProjects.length }} 个 / 共 {{ activeProjects.length }} 个上架项目</span></div>
      <div class="data-table"><el-table :data="visibleProjects" row-key="id">
        <el-table-column prop="id" label="项目 ID" width="110" />
        <el-table-column prop="name" label="项目名称" min-width="180"><template slot-scope="s"><strong>{{ s.row.name }}</strong></template></el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="110"><template><span class="status on">上架</span></template></el-table-column>
        <el-table-column label="数据提醒" min-width="170"><template slot-scope="s"><span v-if="s.row.duplicate" class="warning-text">存在同名历史 ID</span><span v-else class="muted">—</span></template></el-table-column>
        <el-table-column label="操作" width="210" fixed="right"><template slot-scope="s"><el-button type="text" @click="openProjectEditor(s.row)">编辑</el-button><el-button type="text" @click="askAction('项目', s.row, 'archive')">下架</el-button><el-button type="text" class="danger-text" @click="askAction('项目', s.row, 'delete')">删除</el-button></template></el-table-column>
      </el-table></div>
    </template>

    <template v-if="view === 'professions'">
      <div class="section-head">
        <div>
          <h2>专业管理</h2>
          <p>先从项目地图选方向，再看这个项目下的专业。子级是专业下面的细分，点开某一条再管。</p>
        </div>
        <div><el-button @click="uploadVisible = true">批量导入</el-button><el-button type="primary" @click="openProfessionEditor()">新增专业</el-button></div>
      </div>

      <section class="project-map" aria-label="项目地图">
        <header>
          <strong>项目地图</strong>
          <span>{{ professionProject ? `当前在「${professionProject}」` : '请先选一个项目，避免口腔、临床、中西医混在一张表里' }}</span>
        </header>
        <div class="map-grid">
          <button
            v-for="item in projectMap"
            :key="item.name"
            class="map-card"
            :class="{ active: professionProject === item.name }"
            type="button"
            @click="selectProfessionProject(item.name)"
          >
            <strong>{{ item.name }}</strong>
            <span>{{ item.on }} 条上架<template v-if="item.off"> · {{ item.off }} 条下架</template></span>
          </button>
        </div>
      </section>

      <div v-if="!professionProject" class="empty-guide">请先点一个项目。选中后再切上架 / 下架 / 全部；需要细分时，再点某一条专业的「子级管理」。</div>

      <template v-if="professionProject">
        <div class="toolbar profession-toolbar">
          <el-input v-model.trim="professionKeyword" clearable prefix-icon="el-icon-search" :placeholder="`在「${professionProject}」里搜索专业名称或 ID`" />
          <el-radio-group v-model="professionStatus">
            <el-radio-button label="on">上架 {{ projectProfessionCounts.on }}</el-radio-button>
            <el-radio-button label="off">下架 {{ projectProfessionCounts.off }}</el-radio-button>
            <el-radio-button label="all">全部 {{ projectProfessionCounts.all }}</el-radio-button>
          </el-radio-group>
          <span class="result-count">{{ professionProject }} · {{ visibleProfessions.length }} 条</span>
        </div>
        <div class="data-table">
          <el-table :data="visibleProfessions" row-key="id" max-height="610" empty-text="这个项目在当前状态下没有专业">
            <el-table-column prop="id" label="专业 ID" width="100" />
            <el-table-column prop="name" label="专业名称" min-width="210"><template slot-scope="s"><strong>{{ s.row.name }}</strong></template></el-table-column>
            <el-table-column prop="project" label="所属项目" min-width="140" />
            <el-table-column label="状态" width="110"><template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '上架' : '已下架' }}</span></template></el-table-column>
            <el-table-column label="说明" min-width="150"><template slot-scope="s"><span class="status" :class="s.row.life === '正在使用' ? 'on' : 'warn'">{{ s.row.life }}</span></template></el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template slot-scope="s">
                <el-button type="text" @click="openChildren(s.row)">子级管理</el-button>
                <el-button type="text" @click="openProfessionEditor(s.row)">编辑</el-button>
                <el-button type="text" @click="s.row.status === 'on' ? askAction('专业', s.row, 'archive') : restoreProfession(s.row)">{{ s.row.status === 'on' ? '下架' : '上架' }}</el-button>
                <el-button type="text" class="danger-text" @click="askAction('专业', s.row, 'delete')">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </template>

    <template v-if="view === 'quality'">
      <div class="section-head"><div><h2>信息待补充</h2><p>只收集上架数据中名称为空或所属项目为空的记录。已确认的层级不在这里改 ID。</p></div></div>
      <el-alert title="「大一～大四」已按确认放到中医/中西医 → 期末考试（中医）的学期子级。原表里所属项目为空的同名记录仍留在本页，不擅自改它们的专业 ID。" type="warning" :closable="false" show-icon />
      <div class="data-table spaced"><el-table :data="incompleteProfessions" row-key="id">
        <el-table-column prop="id" label="专业 ID" width="110" /><el-table-column prop="name" label="专业名称" min-width="180" /><el-table-column prop="project" label="所属项目" min-width="160" />
        <el-table-column label="缺少内容" min-width="180"><template slot-scope="s"><span class="status warn">{{ s.row.life }}</span></template></el-table-column>
        <el-table-column label="操作" width="140"><template slot-scope="s"><el-button type="text" @click="openProfessionEditor(s.row)">补充信息</el-button></template></el-table-column>
      </el-table></div>
    </template>

    <template v-if="view === 'history'">
      <div class="section-head"><div><h2>已下架</h2><p>只记录本工具今后新发生的下架；历史下架数据不补录。</p></div></div>
      <el-alert title="下架项会保留原始 ID，并可在这里编辑、重新上架或删除。" type="info" :closable="false" show-icon />
      <div class="toolbar spaced"><el-input v-model.trim="historyKeyword" clearable prefix-icon="el-icon-search" placeholder="搜索已下架名称或 ID" /><el-button @click="historyKeyword = ''">重置</el-button><span class="result-count">{{ visibleArchived.length }} 条</span></div>
      <div class="data-table"><el-table :data="visibleArchived" row-key="archiveKey" empty-text="暂无下架记录">
        <el-table-column prop="kind" label="类型" width="90" /><el-table-column prop="id" label="数据 ID" width="110" /><el-table-column prop="name" label="名称" min-width="190" /><el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="110"><template><span class="status off">已下架</span></template></el-table-column>
        <el-table-column label="操作" width="230"><template slot-scope="s"><el-button type="text" @click="editArchived(s.row)">编辑</el-button><el-button type="text" @click="restoreArchived(s.row)">重新上架</el-button><el-button type="text" class="danger-text" @click="askAction(s.row.kind, findEntity(s.row), 'delete')">删除</el-button></template></el-table-column>
      </el-table></div>
    </template>

    <el-dialog :title="projectEditingId ? '编辑项目' : '新增项目'" :visible.sync="projectEditorVisible" width="560px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">{{ projectEditingId ? `项目 ID ${projectEditingId} · 原始 ID 不会被修改` : '新增项目将生成演示 ID' }}</p>
      <el-form label-width="96px"><el-form-item label="项目名称" required><el-input v-model.trim="projectForm.name" /></el-form-item><el-form-item label="排序" required><el-input-number v-model="projectForm.sort" :min="1" controls-position="right" /></el-form-item><el-form-item label="状态" required><el-radio-group v-model="projectForm.status"><el-radio label="on">上架</el-radio><el-radio label="off">下架</el-radio></el-radio-group></el-form-item></el-form>
      <el-alert title="改为下架后，该项目会从日常列表移入“已下架”。" type="warning" :closable="false" />
      <template slot="footer"><el-button @click="projectEditorVisible = false">取消</el-button><el-button type="primary" @click="saveProject">保存</el-button></template>
    </el-dialog>

    <el-dialog :title="professionEditingId ? '编辑专业' : '新增专业'" :visible.sync="professionEditorVisible" width="620px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">{{ professionEditingId ? `专业 ID ${professionEditingId} · 原始 ID 不会被修改` : '新增专业将生成演示 ID' }}</p>
      <el-form label-width="110px"><el-form-item label="专业名称" required><el-input v-model.trim="professionForm.name" /></el-form-item><el-form-item label="所属项目" required><el-select v-model="professionForm.project" filterable><el-option v-for="name in professionProjects" :key="name" :label="name" :value="name" /></el-select></el-form-item><el-form-item label="拼音"><el-input v-model.trim="professionForm.pinyin" placeholder="可填写拼音首字母" /></el-form-item><el-form-item label="排序" required><el-input-number v-model="professionForm.sort" :min="1" controls-position="right" /></el-form-item><el-form-item label="状态" required><el-radio-group v-model="professionForm.status"><el-radio label="on">上架</el-radio><el-radio label="off">下架</el-radio></el-radio-group></el-form-item></el-form>
      <template slot="footer"><el-button @click="professionEditorVisible = false">取消</el-button><el-button type="primary" @click="saveProfession">保存</el-button></template>
    </el-dialog>

    <el-dialog :title="pending.action === 'delete' ? `确认删除「${pending.item ? pending.item.name : ''}」？` : `确认下架「${pending.item ? pending.item.name : ''}」？`" :visible.sync="confirmVisible" width="520px" append-to-body>
      <p v-if="pending.item" class="confirm-line">{{ pending.kind }} ID {{ pending.item.id }} · {{ pending.action === 'delete' ? '删除后将从当前演示移除' : '上架 → 已下架' }}</p>
      <el-alert :title="pending.action === 'delete' ? '真实后台删除可能影响关联数据；当前演示删除后可立即撤回。' : '确认后会移入“已下架”，并可在那里重新上架。'" type="warning" :closable="false" show-icon />
      <template slot="footer"><el-button @click="confirmVisible = false">取消</el-button><el-button type="primary" @click="executePending">确认{{ pending.action === 'delete' ? '删除' : '下架' }}</el-button></template>
    </el-dialog>

    <el-dialog title="批量导入专业" :visible.sync="uploadVisible" width="620px" append-to-body :close-on-click-modal="false">
      <p class="dialog-meta">依据现后台规则：单个所属项目、单一状态、.xls/.xlsx 文件。</p>
      <el-form label-width="110px"><el-form-item label="所属项目" required><el-select v-model="upload.project" filterable><el-option v-for="name in professionProjects" :key="name" :label="name" :value="name" /></el-select></el-form-item><el-form-item label="统一状态"><el-radio-group v-model="upload.status"><el-radio label="on">上架</el-radio><el-radio label="off">下架</el-radio></el-radio-group></el-form-item><el-form-item label="Excel 文件" required><el-upload action="#" accept=".xls,.xlsx" :auto-upload="false" :show-file-list="false" :on-change="onUploadChange"><el-button>选择 Excel</el-button></el-upload><span class="file-name">{{ upload.fileName || '尚未选择' }}</span></el-form-item></el-form>
      <el-alert title="选择后先检查格式、重复项和错误行；当前演示不会写入真实后台。" type="warning" :closable="false" />
      <template slot="footer"><el-button @click="uploadVisible = false">取消</el-button><el-button type="primary" @click="checkUpload">检查文件</el-button></template>
    </el-dialog>

    <el-drawer title="子级管理" :visible.sync="childVisible" size="720px" append-to-body :wrapper-closable="true">
      <div v-if="childParent" class="drawer-content"><div class="parent-context"><span>所属专业</span><strong>{{ childParent.name }}</strong><small>专业 ID {{ childParent.id }} · {{ childParent.project }}<template v-if="childParent.id === 349"> · 学期子级：大一到大四</template></small></div>
        <div class="child-tools"><el-radio-group v-model="childFilter" size="small"><el-radio-button label="ALL">全部 {{ childRows.length }}</el-radio-button><el-radio-button label="on">上架 {{ childOnCount }}</el-radio-button><el-radio-button label="off">已下架 {{ childRows.length - childOnCount }}</el-radio-button></el-radio-group><el-button type="primary" size="small" @click="openChildEditor()">新增子级</el-button></div>
        <el-alert v-if="childFilter !== 'ALL'" title="切换到“全部”后可调整子级顺序" type="info" :closable="false" show-icon class="child-filter-tip" />
        <el-table :data="visibleChildren" row-key="id" empty-text="暂无子级"><el-table-column label="子级 ID" width="110"><template slot-scope="s">{{ displayChildId(s.row.id) }}</template></el-table-column><el-table-column prop="name" label="子级名称" min-width="230" /><el-table-column label="排序" width="120"><template slot-scope="s"><strong class="sort-no">{{ s.row.sort }}</strong><el-button type="text" :disabled="childFilter !== 'ALL' || s.$index === 0" aria-label="上移" @click="moveChild(s.row, -1)">↑</el-button><el-button type="text" :disabled="childFilter !== 'ALL' || s.$index === visibleChildren.length - 1" aria-label="下移" @click="moveChild(s.row, 1)">↓</el-button></template></el-table-column><el-table-column label="状态" width="100"><template slot-scope="s"><span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '上架' : '已下架' }}</span></template></el-table-column><el-table-column label="操作" width="170"><template slot-scope="s"><el-button type="text" @click="openChildEditor(s.row)">编辑</el-button><el-button type="text" @click="toggleChild(s.row)">{{ s.row.status === 'on' ? '下架' : '上架' }}</el-button><el-button type="text" class="danger-text" @click="deleteChild(s.row)">删除</el-button></template></el-table-column></el-table>
      </div>
    </el-drawer>

    <el-dialog :title="childEditingId ? '编辑子级' : '新增子级'" :visible.sync="childEditorVisible" width="560px" append-to-body :close-on-click-modal="false">
      <p v-if="childParent" class="dialog-meta">所属专业：{{ childParent.name }} · 专业 ID {{ childParent.id }}</p>
      <el-form label-width="96px"><el-form-item label="子级名称" required><el-input v-model.trim="childForm.name" placeholder="例如：放射医学技术（士）[代码104]" /></el-form-item><el-form-item label="目标位置" required><el-input-number v-model="childForm.sort" :min="1" :max="Math.max(1, childRows.length + (childEditingId ? 0 : 1))" controls-position="right" /></el-form-item><el-form-item label="状态"><el-radio-group v-model="childForm.status"><el-radio label="on">上架</el-radio><el-radio label="off">下架</el-radio></el-radio-group></el-form-item></el-form>
      <el-alert title="保存后自动整理为连续顺序，不会出现重复序号。" type="info" :closable="false" />
      <template slot="footer"><el-button @click="childEditorVisible = false">取消</el-button><el-button type="primary" @click="saveChild">保存</el-button></template>
    </el-dialog>

    <transition name="toast"><div v-if="toast.visible" class="undo-toast"><span>{{ toast.text }}</span><button v-if="undoAction" type="button" @click="undoLast">撤回</button><button type="button" aria-label="关闭提示" @click="toast.visible = false">×</button></div></transition>
  </section>
</template>

<script>
import { backendProjects, backendProfessions, defaultChildren } from '../data/backendHierarchy'

const copy = value => JSON.parse(JSON.stringify(value))

export default {
  name: 'ProjectManagement',
  data () {
    return {
      view: 'projects', projects: [], professions: [], archived: [], children: {},
      projectKeyword: '', professionKeyword: '', professionProject: '', professionStatus: 'on', historyKeyword: '',
      projectEditorVisible: false, projectEditingId: null, projectForm: { name: '', sort: 1, status: 'on' },
      professionEditorVisible: false, professionEditingId: null, professionForm: { name: '', project: '', pinyin: '', sort: 1, status: 'on' },
      confirmVisible: false, pending: { kind: '项目', action: 'archive', item: null },
      uploadVisible: false, upload: { project: '', status: 'on', fileName: '' },
      childVisible: false, childParent: null, childFilter: 'ALL', childEditorVisible: false, childEditingId: null, childForm: { name: '', sort: 1, status: 'on' },
      undoAction: null, toast: { visible: false, text: '' }, toastTimer: null
    }
  },
  computed: {
    activeProjects () { return this.projects.filter(item => item.status === 'on').sort((a, b) => a.sort - b.sort || a.id - b.id) },
    visibleProjects () { const q = this.projectKeyword.toLowerCase(); return this.activeProjects.filter(item => !q || `${item.id} ${item.name}`.toLowerCase().includes(q)) },
    activeProfessions () { return this.professions.filter(item => item.status === 'on') },
    incompleteProfessions () { return this.activeProfessions.filter(item => item.life.includes('为空')) },
    visibleProfessions () {
      if (!this.professionProject) return []
      const q = this.professionKeyword.toLowerCase()
      return this.professions.filter(item => {
        if (item.project !== this.professionProject) return false
        if (this.professionStatus !== 'all' && item.status !== this.professionStatus) return false
        if (item.life && item.life.includes('为空')) return false
        return !q || `${item.id} ${item.name}`.toLowerCase().includes(q)
      }).sort((a, b) => a.sort - b.sort || a.id - b.id)
    },
    professionProjects () { return Array.from(new Set(this.professions.map(item => item.project).filter(item => item && item !== '—'))).sort((a, b) => a.localeCompare(b, 'zh-CN')) },
    projectMap () {
      const names = Array.from(new Set(this.activeProjects.map(item => item.name).concat(this.professionProjects)))
      return names.filter(name => name && name !== '—' && name !== '公共预防').map(name => {
        const rows = this.professions.filter(item => item.project === name && !(item.life || '').includes('为空'))
        const project = this.activeProjects.find(item => item.name === name)
        return {
          name,
          sort: project ? project.sort : 99,
          on: rows.filter(item => item.status === 'on').length,
          off: rows.filter(item => item.status === 'off').length
        }
      }).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh-CN'))
    },
    projectProfessionCounts () {
      const rows = this.professions.filter(item => item.project === this.professionProject && !(item.life || '').includes('为空'))
      return { on: rows.filter(item => item.status === 'on').length, off: rows.filter(item => item.status === 'off').length, all: rows.length }
    },
    visibleArchived () { const q = this.historyKeyword.toLowerCase(); return this.archived.filter(item => !q || `${item.kind} ${item.id} ${item.name}`.toLowerCase().includes(q)).map(item => ({ ...item, archiveKey: `${item.kind}-${item.id}` })) },
    views () { return [{ key: 'projects', label: '项目总览', count: this.activeProjects.length }, { key: 'professions', label: '专业管理', count: this.activeProfessions.length }, { key: 'quality', label: '信息待补充', count: this.incompleteProfessions.length }, { key: 'history', label: '已下架', count: this.archived.length }] },
    childRows () { return this.childParent ? (this.children[this.childParent.id] || []) : [] },
    visibleChildren () { return this.childRows.filter(item => this.childFilter === 'ALL' || item.status === this.childFilter).sort((a, b) => a.sort - b.sort || a.id - b.id) },
    childOnCount () { return this.childRows.filter(item => item.status === 'on').length }
  },
  created () { this.loadState() },
  methods: {
    noop () {},
    loadState () { try { const saved = JSON.parse(localStorage.getItem('project-management-demo-v1')); this.projects = saved.projects || copy(backendProjects); this.professions = saved.professions || copy(backendProfessions); this.archived = saved.archived || []; this.children = saved.children || copy(defaultChildren) } catch (error) { this.projects = copy(backendProjects); this.professions = copy(backendProfessions); this.archived = []; this.children = copy(defaultChildren) } Object.keys(defaultChildren).forEach(id => { if (!this.children[id] || !this.children[id].length) this.$set(this.children, id, copy(defaultChildren[id])) }) },
    displayChildId (id) { return typeof id === 'number' ? id : '待对接' },
    persist () { localStorage.setItem('project-management-demo-v1', JSON.stringify({ projects: this.projects, professions: this.professions, archived: this.archived, children: this.children })) },
    openProjectEditor (item) { this.projectEditingId = item ? item.id : null; this.projectForm = item ? { name: item.name, sort: item.sort, status: item.status } : { name: '', sort: this.activeProjects.length + 1, status: 'on' }; this.projectEditorVisible = true },
    saveProject () { if (!this.projectForm.name || !this.projectForm.sort) return this.$message.warning('请完整填写项目名称和排序'); if (this.projectForm.name === '公共预防') return this.$message.warning('“公共预防”已停用，请使用“公卫预防”'); let item = this.projects.find(row => row.id === this.projectEditingId); if (item) Object.assign(item, this.projectForm); else { item = { ...this.projectForm, id: Math.max(1000, ...this.projects.map(row => row.id + 1)) }; this.projects.push(item) } this.syncArchive('项目', item); this.persist(); this.projectEditorVisible = false; this.showToast(item.status === 'off' ? '项目已保存并移入“已下架”' : '项目已保存（仅当前演示）') },
    selectProfessionProject (name) { this.professionProject = this.professionProject === name ? '' : name; this.professionKeyword = '' },
    restoreProfession (item) { item.status = 'on'; this.syncArchive('专业', item); this.persist(); this.showToast(`“${item.name}”已重新上架（仅当前演示）`) },
    openProfessionEditor (item) { this.professionEditingId = item ? item.id : null; this.professionForm = item ? { name: item.name === '—' ? '' : item.name, project: item.project === '—' ? '' : item.project, pinyin: item.pinyin || '', sort: item.sort, status: item.status } : { name: '', project: this.professionProject || '', pinyin: '', sort: this.activeProfessions.length + 1, status: 'on' }; this.professionEditorVisible = true },
    saveProfession () { if (!this.professionForm.name || !this.professionForm.project || !this.professionForm.sort) return this.$message.warning('请完整填写专业名称、所属项目和排序'); let item = this.professions.find(row => row.id === this.professionEditingId); const values = { ...this.professionForm, year: '未标年份', life: '正在使用' }; if (item) Object.assign(item, values); else { item = { ...values, id: Math.max(1000, ...this.professions.map(row => row.id + 1)) }; this.professions.push(item) } this.syncArchive('专业', item); this.persist(); this.professionEditorVisible = false; this.showToast(item.status === 'off' ? '专业已保存并移入“已下架”' : '专业已保存（仅当前演示）') },
    syncArchive (kind, item) { const index = this.archived.findIndex(row => row.kind === kind && row.id === item.id); if (item.status === 'off') { const record = { kind, id: item.id, name: item.name, sort: item.sort }; if (index < 0) this.archived.push(record); else this.$set(this.archived, index, record) } else if (index >= 0) this.archived.splice(index, 1) },
    askAction (kind, item, action) { this.pending = { kind, item, action }; this.confirmVisible = true },
    executePending () { const { kind, item, action } = this.pending; if (!item) return; this.confirmVisible = false; if (action === 'archive') { item.status = 'off'; this.syncArchive(kind, item); this.persist(); if (kind === '专业') this.professionStatus = 'off'; this.showToast(kind === '专业' ? `“${item.name}”已下架，已切到当前项目的下架列表` : `“${item.name}”已下架，可在“已下架”查看`); return } const list = kind === '项目' ? this.projects : this.professions; const index = list.findIndex(row => row.id === item.id); const removed = copy(item); const archiveIndex = this.archived.findIndex(row => row.kind === kind && row.id === item.id); const removedArchive = archiveIndex >= 0 ? copy(this.archived[archiveIndex]) : null; if (index >= 0) list.splice(index, 1); if (archiveIndex >= 0) this.archived.splice(archiveIndex, 1); this.persist(); this.undoAction = () => { list.splice(Math.min(index, list.length), 0, removed); if (removedArchive) this.archived.splice(Math.min(archiveIndex, this.archived.length), 0, removedArchive); this.persist() }; this.showToast(`“${item.name}”已删除`, true) },
    findEntity (record) { return (record.kind === '项目' ? this.projects : this.professions).find(item => item.id === record.id) },
    editArchived (record) { const item = this.findEntity(record); record.kind === '项目' ? this.openProjectEditor(item) : this.openProfessionEditor(item) },
    restoreArchived (record) { const item = this.findEntity(record); if (!item) return; item.status = 'on'; this.syncArchive(record.kind, item); this.persist(); this.showToast(`“${item.name}”已重新上架（仅当前演示）`) },
    onUploadChange (file) { this.upload.fileName = file.name || '' },
    checkUpload () { if (!this.upload.project || !this.upload.fileName) return this.$message.warning('请先选择所属项目和 Excel 文件'); if (!/\.xlsx?$/i.test(this.upload.fileName)) return this.$message.error('只支持 .xls 或 .xlsx 文件'); this.uploadVisible = false; this.showToast(`已读取 ${this.upload.fileName}，下一步将展示校验结果`) },
    openChildren (item) { this.childParent = item; this.childFilter = 'ALL'; if (!this.children[item.id]) this.$set(this.children, item.id, []); this.childVisible = true },
    normalizeChildren () { this.childRows.sort((a, b) => a.sort - b.sort || a.id - b.id).forEach((item, index) => { item.sort = index + 1 }) },
    openChildEditor (item) { this.childEditingId = item ? item.id : null; this.childForm = item ? { name: item.name, sort: item.sort, status: item.status } : { name: '', sort: this.childRows.length + 1, status: 'on' }; this.childEditorVisible = true },
    saveChild () { if (!this.childForm.name || !this.childForm.sort) return this.$message.warning('请完整填写子级名称和目标位置'); let item = this.childRows.find(row => row.id === this.childEditingId); if (item) this.childRows.splice(this.childRows.indexOf(item), 1); else { const numericIds = Object.values(this.children).reduce((all, rows) => all.concat(rows.map(row => row.id)), []).filter(id => typeof id === 'number'); item = { id: Math.max(999, ...numericIds.map(id => id + 1)) } } Object.assign(item, this.childForm); this.childRows.splice(Math.min(this.childForm.sort - 1, this.childRows.length), 0, item); this.normalizeChildren(); this.persist(); this.childEditorVisible = false; this.showToast(this.childEditingId ? '子级已保存，排序已自动整理' : '子级已新增，其他排序已顺延') },
    moveChild (item, delta) { this.normalizeChildren(); const index = this.childRows.findIndex(row => row.id === item.id); const target = index + delta; if (index < 0 || target < 0 || target >= this.childRows.length) return; const other = this.childRows[target]; this.$set(this.childRows, index, other); this.$set(this.childRows, target, item); this.normalizeChildren(); this.persist(); this.showToast('顺序已调整（仅当前演示）') },
    toggleChild (item) { item.status = item.status === 'on' ? 'off' : 'on'; this.persist(); this.showToast(`子级已${item.status === 'on' ? '上架' : '下架'}（仅当前演示）`) },
    deleteChild (item) { const index = this.childRows.findIndex(row => row.id === item.id); const removed = copy(item); this.childRows.splice(index, 1); this.normalizeChildren(); this.persist(); this.undoAction = () => { this.childRows.splice(Math.min(index, this.childRows.length), 0, removed); this.normalizeChildren(); this.persist() }; this.showToast('子级已删除，排序已自动补齐', true) },
    undoLast () { if (!this.undoAction) return; this.undoAction(); this.undoAction = null; this.toast.visible = false; this.$message.success('已撤回删除操作') },
    showToast (text, undo = false) { this.toast = { visible: true, text }; if (!undo) this.undoAction = null; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { this.toast.visible = false; if (!undo) this.undoAction = null }, undo ? 12000 : 4000) }
  }
}
</script>

<style scoped>
.project-management{max-width:1440px;margin:0 auto;color:var(--ink)}.page-head,.section-head,.toolbar,.child-tools,.parent-context{display:flex;align-items:center;gap:12px}.page-head{justify-content:space-between;margin-bottom:22px}.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}.breadcrumb span{color:#5f6876}.breadcrumb i{margin:0 7px}.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}.section-tabs{display:flex;gap:2px;margin-bottom:22px;border-bottom:1px solid var(--line)}.section-tabs button{position:relative;min-height:44px;padding:9px 15px;border:0;background:transparent;color:#667085;font-weight:700;cursor:pointer}.section-tabs button.active{color:#a90a13}.section-tabs button.active:after{position:absolute;right:12px;bottom:-1px;left:12px;height:2px;background:var(--brand);content:""}.section-tabs span{display:inline-grid;min-width:20px;height:20px;margin-left:7px;place-items:center;border-radius:999px;background:#eef0f3;color:#667085;font-size:11px}.section-tabs button.active span{background:#fff0f1;color:#a90a13}.section-head{justify-content:space-between;align-items:flex-end;margin-bottom:16px}.section-head h2{margin:0;font-size:21px}.section-head p{margin:5px 0 0;color:#667085}.toolbar{flex-wrap:wrap;margin:14px 0;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}.toolbar .el-input{width:min(380px,100%)}.profession-toolbar .result-count,.result-count{margin-left:auto;color:#667085;font-size:12px}.project-map{margin:4px 0 16px;padding:16px 18px 18px;border:1px solid var(--line);border-radius:10px;background:#fff}.project-map header{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}.project-map header span{color:#667085;font-size:13px}.map-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:8px}.map-card{min-height:68px;padding:11px 12px;border:1px solid #d7dbe1;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.map-card strong,.map-card span{display:block}.map-card span{margin-top:4px;color:#667085;font-size:12px}.map-card.active{border-color:#e6aeb2;background:#fff1f2;color:#a90a13}.map-card.active span{color:#a90a13}.empty-guide{padding:42px 20px;border:1px dashed #d7dbe1;border-radius:10px;background:#fafbfc;color:#667085;text-align:center}.path-label{padding:7px 11px;border-radius:999px;background:#fff0f1;color:#a90a13;font-size:13px;font-weight:700}.hint-line{margin:-4px 0 12px;color:#8a5a00;font-size:13px}.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}.data-table.spaced,.toolbar.spaced{margin-top:14px}.data-table ::v-deep .el-table:before{display:none}.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}.data-table ::v-deep .danger-text{color:#c9232d}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}.status.on{background:#eaf6f1;color:#147a62}.status.off{background:#e8ebee;color:#69717c}.status.warn{background:#fff6dc;color:#8a5a00}.warning-text{color:#8a5a00;font-size:12px;font-weight:700}.muted{color:#8a919e}.dialog-meta{margin:-5px 0 20px;color:#667085}.confirm-line{margin:-2px 0 16px;color:#4f5966}.file-name{margin-left:10px;color:#667085;font-size:12px}.drawer-content{padding:0 22px 28px}.parent-context{align-items:baseline;flex-wrap:wrap;margin-bottom:18px;padding:13px 14px;border-radius:8px;background:#edf4fb}.parent-context span,.parent-context small{color:#526477}.child-tools{justify-content:space-between;margin-bottom:14px}.sort-no{display:inline-block;min-width:22px}.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}@media(max-width:900px){.page-head,.section-head{align-items:flex-start;flex-direction:column}.section-tabs{overflow:auto}.section-tabs button{flex:none}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.profession-toolbar .el-select{width:100%}.profession-toolbar .result-count,.result-count{margin-left:0}.demo-badge{align-self:flex-start}}@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
