<template>
  <section class="product-list">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />商品管理<i class="el-icon-arrow-right" />商品列表</div>
        <h1 class="page-title">商品列表</h1>
        <p class="page-description">价格是事实：填一次再保存，学员立刻看见。上下架只表示能不能卖；隐藏后前台先不露，链接或组合里仍可用。</p>
      </div>
      <span class="demo-badge">演示模式 · 不提交真实后台</span>
    </header>

    <div class="toolbar">
      <el-radio-group v-model="statusFilter">
        <el-radio-button label="on">上架 {{ onCount }}</el-radio-button>
        <el-radio-button label="off">下架 {{ offCount }}</el-radio-button>
        <el-radio-button label="all">全部 {{ rows.length }}</el-radio-button>
      </el-radio-group>
      <el-select v-model="categoryFilter" placeholder="商品分类">
        <el-option label="全部分类" value="all" />
        <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="projectFilter" placeholder="项目" @change="onListProjectChange">
        <el-option label="全部项目" value="all" />
        <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="professionFilter" placeholder="专业">
        <el-option label="全部专业" value="all" />
        <el-option v-for="item in listProfessionOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索商品名称、商品 ID 或网课 ID" />
      <el-button type="primary" @click="openEditor()">新增商品</el-button>
      <el-button @click="$router.push('/course-shelf')">批量上下架</el-button>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="data-table">
      <el-table :data="visible" row-key="id" empty-text=" ">
        <el-table-column prop="id" label="商品 ID" width="96" />
        <el-table-column label="商品名称" min-width="220">
          <template slot-scope="s"><strong>{{ s.row.name }}</strong></template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="80" />
        <el-table-column label="网课 ID" width="96">
          <template slot-scope="s">{{ s.row.courseId || '—' }}</template>
        </el-table-column>
        <el-table-column prop="profession" label="专业" min-width="120" />
        <el-table-column label="价格" width="88">
          <template slot-scope="s"><strong class="price-fact">{{ priceText(s.row.price) }}</strong></template>
        </el-table-column>
        <el-table-column label="状态" width="148">
          <template slot-scope="s">
            <span class="status" :class="s.row.status">{{ s.row.status === 'on' ? '上架' : '下架' }}</span>
            <span v-if="s.row.status === 'on' && s.row.shown === false" class="status hidden">隐藏</span>
          </template>
        </el-table-column>
        <el-table-column label="前台" width="88">
          <template slot-scope="s">
            <el-switch
              :value="s.row.shown !== false"
              :disabled="s.row.status !== 'on'"
              active-text=""
              inactive-text=""
              :aria-label="s.row.shown === false ? '改为显示' : '改为隐藏'"
              @change="value => toggleShown(s.row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template slot-scope="s">
            <el-button type="text" @click="openPrice(s.row)">改价</el-button>
            <el-button type="text" @click="toggleStatus(s.row)">{{ s.row.status === 'on' ? '下架' : '上架' }}</el-button>
            <el-button type="text" @click="openEditor(s.row)">编辑</el-button>
            <el-dropdown trigger="click" @command="cmd => onMore(cmd, s.row)">
              <el-button type="text">更多<i class="el-icon-arrow-down el-icon--right" /></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="copy">复制</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog :title="editingId ? '编辑商品' : '新增商品'" :visible.sync="editorVisible" width="800px" append-to-body :close-on-click-modal="false" custom-class="product-dialog">
      <p class="dialog-meta">{{ editingId ? `商品 ID ${editingId} · 改价请回列表一次写入再保存；上下架、显不显示也在列表` : '先定这是谁。保存后在列表改价、上下架、显不显示。' }}</p>

      <section class="field-block">
        <h3>这是谁</h3>
        <el-form label-width="120px">
          <el-form-item label="商品分类" required>
            <el-select v-model="form.category">
              <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.category === '课程'" label="关联网课包" required>
            <div class="pack-row">
              <el-select v-model="form.project" @change="onProjectChange">
                <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
              </el-select>
              <el-select v-model="form.profession">
                <el-option v-for="item in professionOptions" :key="item" :label="item" :value="item" />
              </el-select>
              <el-select v-model="form.packName">
                <el-option v-for="item in packOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </div>
            <p class="field-note">网课 ID {{ form.courseId || '保存后由课程库带出' }}。演示不改课程库本身。</p>
          </el-form-item>
          <el-form-item label="商品名称" required>
            <el-input v-model.trim="form.name" maxlength="40" show-word-limit placeholder="例如：2027临床进阶班（6本书）" />
          </el-form-item>
          <el-form-item v-if="form.category === '课程'" label="上课方式">
            <el-checkbox-group v-model="form.sellModes">
              <el-checkbox v-for="item in sellModes" :key="item" :label="item">{{ item }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="商品年份" required>
            <el-input-number v-model="form.year" :min="2020" :max="2035" controls-position="right" />
          </el-form-item>
          <el-form-item v-if="!editingId" label="首次价格">
            <el-input v-model.trim="form.price" placeholder="例如 9999" />
            <p class="field-note">一次填好，点保存才写入。以后改价也在列表里一次写入，不要用加减连点。</p>
          </el-form-item>
        </el-form>
      </section>

      <section class="field-block">
        <h3>图</h3>
        <el-form label-width="120px">
          <el-form-item label="商品主图" required>
            <div class="banner-row">
              <span v-if="form.cover" class="banner-chip" :title="form.cover">
                <span class="banner-name">{{ form.cover }}</span>
                <button type="button" aria-label="移除主图" @click="form.cover = ''">×</button>
              </span>
              <button type="button" class="banner-add" :aria-label="form.cover ? '更换主图' : '添加主图'" @click="pickCover">+</button>
            </div>
            <p class="field-note">主图只一张。已经有图时，点 + 会换掉。</p>
            <input ref="coverFile" class="file-input" type="file" accept="image/*" @change="onCover">
          </el-form-item>
          <el-form-item label="商品详情图">
            <div class="banner-row">
              <span v-for="(item, index) in form.details" :key="`${item}-${index}`" class="banner-chip" :title="item">
                <span class="banner-name">{{ item }}</span>
                <button type="button" aria-label="移除详情图" @click="form.details.splice(index, 1)">×</button>
              </span>
              <button v-if="form.details.length < 6" type="button" class="banner-add" aria-label="添加详情图" @click="pickDetail">+</button>
            </div>
            <input ref="detailFile" class="file-input" type="file" accept="image/*" @change="onDetail">
          </el-form-item>
        </el-form>
      </section>

      <section class="field-block last">
        <h3>App 相关商品</h3>
        <p class="field-hint">捆在一起才会在 App 显示。当前商品已自动在组里。</p>
        <el-button type="primary" size="small" @click="openPicker">添加相关商品</el-button>
        <el-table v-if="comboRows.length" :data="comboRows" class="inner-table">
          <el-table-column prop="id" label="商品 ID" width="96" />
          <el-table-column prop="name" label="商品名称" min-width="180" />
          <el-table-column prop="profession" label="专业" min-width="120" />
          <el-table-column label="价格" width="88"><template slot-scope="s">{{ priceText(s.row.price) }}</template></el-table-column>
          <el-table-column label="" width="80">
            <template slot-scope="s">
              <el-button v-if="s.row.id !== editingId" type="text" class="danger-text" @click="removeCombo(s.row.id)">移除</el-button>
              <span v-else class="self-tag">当前</span>
            </template>
          </el-table-column>
        </el-table>
        <p v-else class="empty inner">还没有相关商品。点添加勾同项目专业的课。</p>
      </section>

      <template slot="footer">
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="添加相关商品" :visible.sync="pickerVisible" width="860px" append-to-body :close-on-click-modal="false" custom-class="product-dialog">
      <p class="dialog-meta">当前商品会保持勾选。只有放进这一组，App 才会显示相关课。</p>
      <div class="picker-bar">
        <el-input v-model.trim="pickerKeyword" clearable placeholder="商品名称 / ID" />
        <el-select v-model="pickerProject" @change="onPickerProjectChange">
          <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="pickerProfession">
          <el-option v-for="item in pickerProfessionOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="pickerCategory">
          <el-option label="全部类型" value="all" />
          <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
        </el-select>
      </div>
      <p class="field-note picker-count">已勾 {{ pickerSelection.length }} 个</p>
      <el-table :data="pickerRows" row-key="id" class="inner-table">
        <el-table-column label="" width="52">
          <template slot-scope="s">
            <el-checkbox
              :value="pickerSelection.includes(s.row.id)"
              :aria-label="`选择${s.row.name}`"
              @change="togglePick(s.row.id, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="id" label="商品 ID" width="96" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="profession" label="专业" min-width="120" />
        <el-table-column prop="category" label="类型" width="80" />
        <el-table-column label="价格" width="88"><template slot-scope="s">{{ priceText(s.row.price) }}</template></el-table-column>
      </el-table>
      <p v-if="!pickerRows.length" class="empty inner">没有匹配商品。可换专业或清空名称。</p>
      <template slot="footer">
        <el-button @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPicker">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="改价" :visible.sync="priceVisible" width="440px" append-to-body :close-on-click-modal="false">
      <p v-if="priceTarget" class="dialog-meta">商品 ID {{ priceTarget.id }} · {{ priceTarget.name }}。当前价 {{ priceText(priceTarget.price) }}，这是学员现在看见的事实。</p>
      <el-form label-width="88px">
        <el-form-item label="改为" required>
          <el-input v-model.trim="priceDraft" placeholder="一次填好完整价格" @keyup.enter.native="savePrice" />
        </el-form-item>
      </el-form>
      <p class="field-note">接入后台后改价会立刻到前台。点保存才写入，避免加减连点让价格乱跳。</p>
      <template slot="footer">
        <el-button @click="priceVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrice">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="确认删除？" :visible.sync="confirmVisible" width="480px" append-to-body>
      <p v-if="pending" class="dialog-meta">商品 ID {{ pending.id }} · {{ pending.name }}。删除后从当前演示移除，可立即撤回。</p>
      <el-alert title="真实后台删除可能影响已上架售卖；当前演示不会提交后台。" type="warning" :closable="false" show-icon />
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
import { backendProducts, PRODUCT_CATEGORIES, SELL_MODES, PROJECTS, PROFESSIONS, COURSE_PACKS } from '../data/productList.js'

const copy = value => JSON.parse(JSON.stringify(value))
const STORAGE_KEY = 'product-list-demo-v4'
const OPERATOR = '美惠'

function nowStamp () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function blankForm () {
  return {
    name: '',
    category: '课程',
    project: '临床',
    profession: '临床助理医师',
    packName: '2027早鸟班',
    courseId: '',
    sellModes: ['直播', '录播'],
    year: 2027,
    cover: '',
    details: [],
    price: '',
    comboIds: []
  }
}

function parsePrice (value) {
  if (value === '' || value == null) return null
  const next = Number(value)
  if (!Number.isFinite(next) || next < 0) return NaN
  return Math.round(next * 100) / 100
}

export default {
  name: 'ProductList',
  data () {
    return {
      rows: [],
      categories: PRODUCT_CATEGORIES,
      sellModes: SELL_MODES,
      projects: PROJECTS,
      keyword: '',
      statusFilter: 'on',
      categoryFilter: 'all',
      projectFilter: 'all',
      professionFilter: 'all',
      editorVisible: false,
      editingId: null,
      form: blankForm(),
      pickerVisible: false,
      pickerKeyword: '',
      pickerProject: '临床',
      pickerProfession: '临床助理医师',
      pickerCategory: 'all',
      pickerSelection: [],
      priceVisible: false,
      priceTarget: null,
      priceDraft: '',
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
    professionOptions () { return PROFESSIONS[this.form.project] || [] },
    packOptions () { return COURSE_PACKS[this.form.project] || [] },
    listProfessionOptions () {
      if (this.projectFilter === 'all') return this.projects.reduce((list, project) => list.concat(PROFESSIONS[project] || []), [])
      return PROFESSIONS[this.projectFilter] || []
    },
    pickerProfessionOptions () { return PROFESSIONS[this.pickerProject] || [] },
    visible () {
      const query = this.keyword.toLowerCase()
      return this.rows.filter(item => {
        if (this.statusFilter !== 'all' && item.status !== this.statusFilter) return false
        if (this.categoryFilter !== 'all' && item.category !== this.categoryFilter) return false
        if (this.projectFilter !== 'all' && item.project !== this.projectFilter) return false
        if (this.professionFilter !== 'all' && item.profession !== this.professionFilter) return false
        if (query && !`${item.name} ${item.id} ${item.courseId || ''}`.toLowerCase().includes(query)) return false
        return true
      }).sort((a, b) => b.id - a.id)
    },
    emptyText () {
      if (this.keyword || this.categoryFilter !== 'all' || this.projectFilter !== 'all' || this.professionFilter !== 'all') return '没有匹配的商品，换个名称、ID 或分类试试。'
      if (this.statusFilter === 'on') return '当前没有上架商品。可切换到「下架」查看。'
      if (this.statusFilter === 'off') return '当前没有下架商品。'
      return '暂时没有商品。'
    },
    comboRows () {
      return (this.form.comboIds || []).map(id => this.rows.find(item => item.id === id)).filter(Boolean)
    },
    pickerRows () {
      const query = this.pickerKeyword.toLowerCase()
      return this.rows.filter(item => {
        if (item.project !== this.pickerProject) return false
        if (item.profession !== this.pickerProfession) return false
        if (this.pickerCategory !== 'all' && item.category !== this.pickerCategory) return false
        if (query && !`${item.name} ${item.id}`.toLowerCase().includes(query)) return false
        return true
      })
    }
  },
  created () { this.loadState() },
  methods: {
    loadState () {
      let fromLegacy = false
      try {
        const rawV4 = localStorage.getItem(STORAGE_KEY)
        const rawLegacy = localStorage.getItem('product-list-demo-v3')
        fromLegacy = !rawV4 && !!rawLegacy
        const saved = JSON.parse(rawV4 || rawLegacy)
        this.rows = saved.rows && saved.rows.length ? saved.rows : copy(backendProducts)
      } catch (error) {
        this.rows = copy(backendProducts)
      }
      this.rows.forEach(item => {
        if (item.shown == null) item.shown = true
      })
      if (fromLegacy) {
        const sample = this.rows.find(item => item.id === 4851)
        if (sample && sample.status === 'on') sample.shown = false
      }
    },
    persist () { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: this.rows })) },
    nextId () { return Math.max(...this.rows.map(row => Number(row.id) || 0), 5000) + 1 },
    priceText (value) { return value == null ? '—' : value },
    touch (item) { item.updatedBy = OPERATOR; item.updatedAt = nowStamp() },
    onListProjectChange () { this.professionFilter = 'all' },
    onProjectChange () {
      const professions = PROFESSIONS[this.form.project] || []
      const packs = COURSE_PACKS[this.form.project] || []
      this.form.profession = professions[0] || ''
      this.form.packName = packs[0] || ''
    },
    pickCover () {
      const input = this.$refs.coverFile
      if (input) input.click()
    },
    pickDetail () {
      const input = this.$refs.detailFile
      if (input) input.click()
    },
    onCover (event) {
      const file = event.target.files && event.target.files[0]
      if (file) this.form.cover = file.name
      event.target.value = ''
    },
    onDetail (event) {
      const file = event.target.files && event.target.files[0]
      if (file && this.form.details.length < 6) this.form.details.push(file.name)
      event.target.value = ''
    },
    openPrice (item) {
      this.priceTarget = item
      this.priceDraft = item.price == null ? '' : String(item.price)
      this.priceVisible = true
    },
    savePrice () {
      const item = this.priceTarget
      if (!item) return
      const next = parsePrice(this.priceDraft)
      if (next !== null && Number.isNaN(next)) return this.$message.warning('请填写 0 或以上的价格')
      if (item.price === next || (item.price == null && next === null)) {
        this.priceVisible = false
        return
      }
      const previous = item.price
      item.price = next
      this.touch(item)
      this.persist()
      this.priceVisible = false
      this.undoAction = () => {
        item.price = previous
        this.touch(item)
        this.persist()
      }
      this.showToast(`“${item.name}”价格已改为 ${this.priceText(next)}`, true)
    },
    openEditor (item) {
      this.editingId = item ? item.id : null
      if (!item) {
        this.form = blankForm()
        this.editorVisible = true
        return
      }
      const comboIds = copy(item.comboIds || [])
      if (!comboIds.includes(item.id)) comboIds.unshift(item.id)
      this.form = {
        name: item.name,
        category: item.category,
        project: item.project,
        profession: item.profession,
        packName: item.packName,
        courseId: item.courseId,
        sellModes: copy(item.sellModes || []),
        year: item.year,
        cover: item.cover || '',
        details: copy(item.details || []),
        price: item.price == null ? '' : String(item.price),
        comboIds
      }
      this.editorVisible = true
    },
    save () {
      if (!this.form.name) return this.$message.warning('请填写商品名称')
      if (this.form.category === '课程' && (!this.form.project || !this.form.profession || !this.form.packName)) {
        return this.$message.warning('课程需要关联网课包')
      }
      if (!this.form.cover) return this.$message.warning('请上传商品主图')
      const firstPrice = parsePrice(this.form.price)
      if (!this.editingId && firstPrice !== null && Number.isNaN(firstPrice)) return this.$message.warning('请填写 0 或以上的价格')
      let item = this.rows.find(row => row.id === this.editingId)
      const stamp = nowStamp()
      if (!item) {
        item = {
          id: this.nextId(),
          status: 'off',
          deliver: true,
          teacher: '昭昭老师',
          hours: 0,
          serviceMode: 'campus',
          includeBooks: false,
          physical: false,
          notice: '',
          stock: 0,
          autoShelf: false,
          shelfStart: stamp,
          shelfEnd: '',
          validUntil: '2028-11-30 00:00:00',
          comboIds: [],
          shown: false,
          createdAt: stamp,
          price: firstPrice
        }
        this.rows.unshift(item)
        this.editingId = item.id
      }
      const comboIds = copy(this.form.comboIds || [])
      if (!comboIds.includes(item.id)) comboIds.unshift(item.id)
      Object.assign(item, {
        name: this.form.name,
        category: this.form.category,
        project: this.form.project,
        profession: this.form.profession,
        packName: this.form.packName,
        courseId: this.form.courseId,
        sellModes: copy(this.form.sellModes),
        year: this.form.year,
        cover: this.form.cover,
        details: copy(this.form.details),
        comboIds
      })
      this.touch(item)
      this.persist()
      this.editorVisible = false
      this.statusFilter = item.status
      this.showToast(item.status === 'off' ? '商品已保存，已在「下架」里' : '商品已保存（仅当前演示）')
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
      const extra = item.status === 'on' && item.shown === false ? '，前台仍隐藏' : ''
      this.showToast(item.status === 'on' ? `“${item.name}”已上架${extra}` : `“${item.name}”已下架`, true)
    },
    toggleShown (item, value) {
      if (item.status !== 'on') {
        this.$message.warning('先上架，再决定前台显不显示')
        return
      }
      const next = !!value
      if ((item.shown !== false) === next) return
      const previous = item.shown !== false
      item.shown = next
      this.touch(item)
      this.persist()
      this.undoAction = () => {
        item.shown = previous
        this.touch(item)
        this.persist()
      }
      this.showToast(next ? `“${item.name}”已在前台显示` : `“${item.name}”已上架，前台先隐藏`, true)
    },
    onMore (command, item) {
      if (command === 'copy') this.copyRow(item)
      if (command === 'delete') this.askDelete(item)
    },
    copyRow (item) {
      const cloned = copy(item)
      cloned.id = this.nextId()
      cloned.name = item.name.includes('（复制）') ? item.name : `${item.name}（复制）`
      cloned.status = 'off'
      cloned.shown = false
      cloned.comboIds = []
      cloned.createdAt = nowStamp()
      this.touch(cloned)
      this.rows.unshift(cloned)
      this.persist()
      this.statusFilter = 'off'
      this.undoAction = () => {
        this.rows = this.rows.filter(row => row.id !== cloned.id)
        this.persist()
      }
      this.showToast(`已复制为商品 ID ${cloned.id}，已在「下架」里`, true)
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
    removeCombo (id) {
      if (id === this.editingId) return this.$message.warning('当前商品必须留在组里')
      this.form.comboIds = this.form.comboIds.filter(item => item !== id)
    },
    openPicker () {
      this.pickerProject = this.form.project
      this.pickerProfession = this.form.profession
      this.pickerSelection = (this.form.comboIds || []).slice()
      if (this.editingId && !this.pickerSelection.includes(this.editingId)) this.pickerSelection.unshift(this.editingId)
      this.pickerKeyword = ''
      this.pickerCategory = 'all'
      this.pickerVisible = true
    },
    onPickerProjectChange () {
      const professions = PROFESSIONS[this.pickerProject] || []
      this.pickerProfession = professions[0] || ''
    },
    togglePick (id, checked) {
      if (checked) {
        if (!this.pickerSelection.includes(id)) this.pickerSelection = this.pickerSelection.concat(id)
        return
      }
      if (id === this.editingId) {
        this.$message.warning('当前商品必须勾上')
        return
      }
      this.pickerSelection = this.pickerSelection.filter(item => item !== id)
    },
    confirmPicker () {
      if (!this.pickerSelection.length) return this.$message.warning('请勾选相关商品')
      if (this.editingId && !this.pickerSelection.includes(this.editingId)) {
        return this.$message.warning('请把当前商品一并勾上')
      }
      this.form.comboIds = Array.from(new Set(this.pickerSelection))
      this.pickerVisible = false
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
.product-list{max-width:1440px;margin:0 auto;color:var(--ink)}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:22px}
.breadcrumb{margin-bottom:9px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.demo-badge{padding:7px 10px;border-radius:999px;background:#eaf6f1;color:#147a62;font-size:12px;font-weight:700}
.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:0 0 16px;padding:14px;border:1px solid var(--line);border-radius:10px;background:#fff}
.toolbar .el-input{width:min(280px,100%)}
.toolbar .el-select{width:150px}
.result-count{margin-left:auto;color:#667085;font-size:12px}
.data-table{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.data-table ::v-deep .el-table:before{display:none}
.data-table ::v-deep .el-button--text{padding:5px 2px;color:#245f9e;font-weight:650}
.price-fact{font-variant-numeric:tabular-nums}
.inner-table{margin-top:12px}
.danger-text,.inner-table ::v-deep .danger-text{color:#c9232d}
.self-tag{color:#8a919e;font-size:12px}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.status:before{width:6px;height:6px;border-radius:50%;background:currentColor;content:""}
.status.on{background:#eaf6f1;color:#147a62}
.status.off{background:#e8ebee;color:#69717c}
.status.hidden{margin-left:6px;background:#f3eee4;color:#8a5a12}
.data-table ::v-deep .el-switch{height:22px}
.empty{padding:40px 20px;color:#667085;text-align:center}
.empty.inner{padding:18px 0}
.dialog-meta{margin:-5px 0 16px;color:#667085}
.field-block{margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.field-block.last{margin-bottom:0;padding-bottom:0;border-bottom:0}
.field-block h3{margin:0 0 6px;font-size:15px}
.field-hint,.field-note{margin:0 0 12px;color:#667085;line-height:1.6}
.field-note{margin:6px 0 0}
.pack-row{display:flex;flex-wrap:wrap;gap:8px}
.pack-row .el-select{width:180px}
.banner-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.banner-chip,.banner-add{min-height:72px;padding:10px 12px;border:1px dashed #d7dbe1;border-radius:8px;background:#fafbfc}
.banner-chip{display:inline-flex;align-items:center;gap:8px;max-width:220px}
.banner-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.banner-chip button{flex:none;border:0;background:transparent;color:#667085;cursor:pointer}
.banner-add{width:72px;color:#667085;font-size:22px;cursor:pointer}
.file-input{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.picker-bar{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px}
.picker-bar .el-input{width:220px}
.picker-count{margin:0 0 10px}
.undo-toast{position:fixed;right:22px;bottom:22px;z-index:var(--z-toast);display:flex;align-items:center;gap:13px;max-width:520px;padding:12px 14px;border-radius:8px;background:#20242b;color:#fff;box-shadow:0 4px 8px rgba(24,32,43,.2)}
.undo-toast button{padding:2px 0;border:0;background:transparent;color:#fff;font-weight:700;cursor:pointer}
.undo-toast button:first-of-type{padding-left:13px;border-left:1px solid #565b63}
.toast-enter-active,.toast-leave-active{transition:opacity .18s ease-out,transform .18s ease-out}
.toast-enter,.toast-leave-to{opacity:0;transform:translateY(6px)}
@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.toolbar{align-items:stretch;flex-direction:column}.toolbar .el-input,.toolbar .el-select,.result-count{width:100%;margin-left:0}.demo-badge{align-self:flex-start}}
@media(prefers-reduced-motion:reduce){.toast-enter-active,.toast-leave-active{transition:none}}
</style>
<style>
.el-dialog.product-dialog{max-width:calc(100vw - 24px);margin-top:6vh !important}
.el-dialog.product-dialog .el-dialog__body{max-height:min(68vh,720px);overflow:auto}
</style>
