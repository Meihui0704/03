<template>
  <section class="coupon-page">
    <section v-if="view === 'list'" class="coupon-list">
      <header class="page-head">
        <div>
          <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />App优惠券管理</div>
          <h1 class="page-title">App优惠券管理</h1>
          <p class="page-description">先检索已经生成的优惠券任务，再进去批量配置。使用中和已下架分开看，不必先选状态再查询。</p>
        </div>
        <el-button type="primary" @click="openCreate">新增优惠券</el-button>
      </header>

      <div class="status-row">
        <el-radio-group v-model="listStatus" @change="selectedIds = []">
          <el-radio-button label="ON">使用中 {{ onCount }}</el-radio-button>
          <el-radio-button label="OFF">已下架 {{ offCount }}</el-radio-button>
          <el-radio-button label="ALL">全部 {{ issued.length }}</el-radio-button>
        </el-radio-group>
        <el-input v-model.trim="listKeyword" clearable prefix-icon="el-icon-search" placeholder="搜索优惠券名称或任务 ID" />
        <span class="result-count">当前 {{ visibleIssued.length }} 条</span>
      </div>

      <el-table :data="visibleIssued" empty-text=" ">
        <el-table-column label="优惠券任务" min-width="240">
          <template slot-scope="s">
            <strong>{{ s.row.name }}</strong>
            <small class="task-id">任务 ID {{ s.row.id }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="优惠方式" width="160" />
        <el-table-column prop="scope" label="适用范围" min-width="180" />
        <el-table-column prop="period" label="有效期" width="200" />
        <el-table-column label="状态" width="110">
          <template slot-scope="s">
            <span class="status" :class="s.row.state === 'ON' ? 'on' : 'off'">{{ s.row.state === 'ON' ? '使用中' : '已下架' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="s">
            <el-button type="text" @click="openEdit(s.row)">配置</el-button>
            <el-button type="text" @click="copyIssued(s.row)">复制</el-button>
            <el-button type="text" @click="toggleIssued(s.row)">{{ s.row.state === 'ON' ? '下架' : '上架' }}</el-button>
            <el-button type="text" class="danger-text" @click="deleteIssued(s.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <p v-if="!visibleIssued.length" class="empty">{{ listEmptyText }}</p>
    </section>

    <section v-else class="coupon-workspace">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />App优惠券管理</div>
        <h1 class="page-title">App优惠券管理</h1>
        <p class="page-description">先选班型商品，再按项目和科室批量勾选专业，一次性生成实际生效的「商品 × 专业」优惠券。</p>
      </div>
      <div class="head-actions">
        <el-button @click="view = 'list'">返回任务列表</el-button>
        <el-button @click="$router.push('/business-lines')">从全部项目清单选择</el-button>
      </div>
    </header>

    <el-alert
      v-if="transfer.source"
      class="transfer-alert"
      type="success"
      show-icon
      :closable="false"
      :title="`已从${transfer.source}带入 ${productIds.length} 个商品、${professionIds.length} 个专业`"
    />

    <aside class="intro-banner" aria-label="当前改造说明">
      <p><strong>当前痛点</strong>人工给中级职称约 39 个专业逐条取名、勾选、分配优惠券，实测要 2–3 小时，专业数还会继续增加。</p>
      <p><strong>这次怎么做</strong>先从可搜索的商品列表选定班型，再按科室分组一键勾选专业，一次性生成全部优惠券。</p>
      <p><strong>演示任务</strong>勾选「2027年中级职称精英班」，再展开「中级职称」全选内科类——「中医内科」会标红，因为该商品不覆盖此专业。</p>
    </aside>

    <div class="workspace-grid">
      <div class="config-panel">
        <div class="panel-title">优惠券批量配置</div>

        <div class="field-row">
          <label class="field-label" for="coupon-name"><span class="req">*</span>优惠券名称</label>
          <el-input id="coupon-name" v-model.trim="form.name" maxlength="30" show-word-limit placeholder="例如：中级职称精英班暑期立减券" />
        </div>

        <div class="field-row">
          <div class="field-label"><span class="req">*</span>优惠方式</div>
          <div class="mode-toggle" role="radiogroup" aria-label="优惠方式">
            <button
              v-for="item in modes"
              :key="item.value"
              type="button"
              :class="['mode-btn', { active: form.type === item.value }]"
              :aria-pressed="form.type === item.value"
              @click="form.type = item.value"
            >{{ item.label }}</button>
          </div>
          <div class="rule-line">
            <template v-if="form.type === 'FULL'">
              <span>满</span>
              <el-input-number v-model="form.threshold" :min="0" :precision="2" controls-position="right" />
              <span>元减</span>
              <el-input-number v-model="form.amount" :min="0" :precision="2" controls-position="right" />
              <span>元</span>
            </template>
            <template v-else-if="form.type === 'DISCOUNT'">
              <span>打</span>
              <el-input-number v-model="form.discount" :min="1" :max="9.9" :step="0.1" :precision="1" controls-position="right" />
              <span>折（即优惠 {{ discountOff }}%）</span>
            </template>
            <template v-else>
              <span>无门槛直减</span>
              <el-input-number v-model="form.amount" :min="1" :precision="2" controls-position="right" />
              <span>元</span>
            </template>
          </div>
          <el-alert
            class="price-alert"
            :type="priceCheck.tone"
            :title="priceCheck.title"
            :closable="false"
            show-icon
          />
          <div v-if="pricePreviewRows.length" class="price-preview">
            <div class="price-preview-head">测算成交价<span>仅供参考</span></div>
            <ul>
              <li v-for="row in pricePreviewRows" :key="row.id" :class="row.tone">
                <strong>{{ row.name }}</strong>
                <span>{{ row.detail }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="field-row">
          <div class="field-label"><span class="req">*</span>所属课程（班型商品）</div>
          <div class="course-toolbar">
            <el-input v-model.trim="courseKeyword" clearable prefix-icon="el-icon-search" placeholder="搜索班型商品，如「精英班」「早鸟」…" />
            <el-button type="primary" @click="showAddCourse = !showAddCourse">＋ 新增商品</el-button>
          </div>
          <div v-if="showAddCourse" class="add-course">
            <el-input v-model.trim="newCourse.name" placeholder="商品名称，如「2027年中级职称冲刺押题班」" />
            <el-select v-model="newCourse.category" style="width:100%">
              <el-option v-for="item in middleCategories" :key="item" :label="item" :value="item" />
            </el-select>
            <p class="add-hint">新商品默认沿用中级职称 19 个专业覆盖范围，如需调整需技术侧另行配置。</p>
            <div class="add-actions">
              <el-button size="small" @click="cancelAddCourse">取消</el-button>
              <el-button size="small" type="primary" @click="addCourse">确定添加</el-button>
            </div>
          </div>
          <div class="course-list">
            <template v-for="group in groupedCourses">
              <div :key="group.key" class="course-group-header">{{ group.label }}（{{ group.total }}）</div>
              <button
                v-for="course in group.items"
                :key="course.id"
                type="button"
                :class="['course-row', { checked: productIds.includes(course.id) }]"
                @click="toggleCourse(course.id)"
              >
                <span class="box" :aria-hidden="true" />
                <span class="course-name">{{ course.name }}</span>
                <span class="course-tag">{{ course.price == null ? '未标价' : `售价 ${course.price} 元` }} · 覆盖 {{ course.scope.length }} 个专业</span>
                <span class="remove" title="移除该商品" @click.stop="removeCourse(course)">✕</span>
              </button>
            </template>
            <div v-if="!groupedCourses.length" class="course-empty">没有找到匹配的商品，换个关键词试试</div>
          </div>
          <div v-if="selectedCourses.length" class="selected-chips">
            <span v-for="course in selectedCourses" :key="course.id" class="chip" :class="{ unsafe: isUnsafeCourse(course), zero: isZeroCourse(course) }">
              {{ course.name }}
              <small>{{ coursePriceHint(course) }}</small>
              <button type="button" aria-label="取消该商品" @click="toggleCourse(course.id)">×</button>
            </span>
          </div>
          <p class="field-note">商品列表支持搜索定位和多选。优惠券实际作用于「已选课程 × 已选专业」的组合。</p>
        </div>

        <div class="field-row">
          <div class="field-label"><span class="req">*</span>所属专业（点击业务大类展开）</div>
          <div v-if="professionIds.length" class="quick-clear">
            <el-button v-if="impact.mismatched.length" size="small" @click="clearMismatch">✕ 清空不适用项（{{ impact.mismatched.length }}）</el-button>
            <el-button size="small" @click="clearProfessions">清空全部已选专业</el-button>
          </div>
          <p v-if="clickCompare" class="click-compare" v-html="clickCompare" />
          <div class="cat-list">
            <article v-for="category in taxonomy" :key="category.name" class="cat-card">
              <div class="cat-header" @click="toggleOpen(category.name)">
                <el-checkbox
                  :value="isCategoryAllSelected(category)"
                  :indeterminate="isCategoryIndeterminate(category)"
                  :aria-label="`选择${category.name}全部专业`"
                  @click.native.stop
                  @change="toggleCategory(category, $event)"
                />
                <strong>{{ category.name }}</strong>
                <span class="cat-count">（{{ categoryTotal(category) }}个）</span>
                <em v-if="categorySelected(category)">已选 {{ categorySelected(category) }}</em>
                <i :class="['el-icon-arrow-down', { open: isOpen(category.name) }]" />
              </div>
              <div v-show="isOpen(category.name)" class="cat-body">
                <p v-if="hasNamedGroups(category)" class="cat-new">支持按科室分组批量勾选（共 {{ categoryTotal(category) }} 个专业）</p>
                <div v-if="hasNamedGroups(category)" class="sub-tags">
                  <button
                    v-for="group in category.groups"
                    :key="group.name"
                    type="button"
                    :class="['sub-tag', { active: isGroupAllSelected(category, group) }]"
                    @click.stop="toggleGroup(category, group)"
                  >{{ group.name }}<small>（{{ group.items.length }}）</small></button>
                </div>
                <div v-for="group in category.groups" :key="group.name || category.name">
                  <div v-if="group.name" class="sub-head">{{ group.name }}</div>
                  <div class="chip-list">
                    <button
                      v-for="item in group.items"
                      :key="item"
                      type="button"
                      :class="['prof-chip', { checked: professionIds.includes(makeId(category.name, item)), mismatch: isMismatch(makeId(category.name, item)) }]"
                      @click.stop="toggleProfession(makeId(category.name, item), true)"
                    >
                      {{ item }}
                      <small v-if="isMismatch(makeId(category.name, item))">所选商品不覆盖该专业</small>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="field-row">
          <label class="field-label"><span class="req">*</span>生效时间</label>
          <el-date-picker v-model="form.startAt" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择生效时间" />
        </div>
        <div class="field-row">
          <label class="field-label"><span class="req">*</span>截止时间</label>
          <el-date-picker v-model="form.endAt" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择截止时间" />
          <p v-if="dateInvalid" class="date-warning">截止时间不能早于生效时间</p>
        </div>

        <el-button type="primary" class="save-btn" :loading="submitting" :disabled="unsafePricedCourses.length > 0" @click="submit">保存配置</el-button>
        <p class="save-note">已选 <b>{{ professionIds.length }}</b> 个专业，实际将生成 <b>{{ impact.combinationCount }}</b> 张优惠券。测算成交价仅供参考。</p>
      </div>

      <aside class="side-column">
        <p class="side-label">AI 变更摘要</p>
        <div class="ai-card" aria-live="polite">
          <div class="ai-eyebrow"><span class="dot" />AI 自动生成 · 最近 7 天</div>
          <div class="ai-text" v-html="aiSummary" />
        </div>
        <p class="side-label">变更记录</p>
        <div class="log-panel">
          <div v-for="(item, index) in logs" :key="`${item.time}-${index}`" :class="['log-item', item.tone]">
            <div class="log-time">{{ item.time }} · {{ item.user }}</div>
            <div class="log-text">{{ item.content }}</div>
            <div v-if="item.tag" class="log-tag">{{ item.tag }}</div>
          </div>
        </div>
      </aside>
    </div>

    <el-dialog :title="priceDialog.pendingSave ? '确认保存前请核对测算价' : '优惠后成交价提醒'" :visible.sync="priceDialog.visible" width="560px" append-to-body :close-on-click-modal="false">
      <el-alert
        v-if="zeroPricedCourses.length"
        type="warning"
        :closable="false"
        show-icon
        title="当前优惠减免后，测算成交价为 0 元。0 元等于免单，请确认是否故意做成免费。"
      />
      <p class="preview-caption">测算成交价（仅供参考），接入真实售价和后台规则后可能不同。</p>
      <ul class="preview-list">
        <li v-for="row in pricePreviewRows" :key="row.id" :class="row.tone">
          <strong>{{ row.name }}</strong>
          <span>{{ row.detail }}</span>
        </li>
      </ul>
      <p v-if="!pricePreviewRows.length" class="field-note">已选商品暂无售价，无法测算。</p>
      <template slot="footer">
        <el-button @click="priceDialog.visible = false">返回修改</el-button>
        <el-button v-if="priceDialog.pendingSave && !unsafePricedCourses.length" type="primary" @click="confirmPriceDialog">仍要保存</el-button>
        <el-button v-else type="primary" @click="priceDialog.visible = false">我知道了</el-button>
      </template>
    </el-dialog>
    </section>
  </section>
</template>

<script>
import { allOperationProducts, getImpact, professionProject, readTransfer, taxonomy, zzzcScope } from '../data/phase1Business'

const eliteName = '2027年中级职称精英班'
const issuedKey = 'coupon-tasks-demo-v1'
const seedIssued = () => ([
  { id: 101, name: '中级职称精英班暑期立减券', discount: '满0减980', scope: '19 个专业 · 1 个班型', period: '2026-07-20 至 07-31', state: 'ON' },
  { id: 102, name: '内科类阶段优惠券', discount: '8折', scope: '6 个专业 · 2 个班型', period: '2026-08-01 至 08-15', state: 'ON' },
  { id: 103, name: '冲刺班限时直减券', discount: '无门槛减200', scope: '10 个专业 · 1 个班型', period: '2026-06-01 至 06-10', state: 'OFF' }
])

export default {
  name: 'CouponConfig',
  data () {
    const transfer = readTransfer()
    const products = allOperationProducts.map(item => ({ ...item, scope: item.scope.slice() }))
    const transferredProducts = Array.isArray(transfer.products) ? transfer.products : []
    const defaultProduct = products.find(item => item.name === eliteName)
    let issued = seedIssued()
    try {
      const saved = JSON.parse(localStorage.getItem(issuedKey) || 'null')
      if (Array.isArray(saved) && saved.length) issued = saved
    } catch (error) { issued = seedIssued() }
    return {
      view: transfer.source ? 'config' : 'list',
      listKeyword: '',
      listStatus: 'ON',
      selectedIds: [],
      editingTaskId: null,
      issued,
      transfer,
      taxonomy,
      products,
      productIds: transferredProducts.length ? transferredProducts : (defaultProduct ? [defaultProduct.id] : []),
      professionIds: Array.isArray(transfer.professions) ? transfer.professions : [],
      courseKeyword: '',
      showAddCourse: false,
      middleCategories: ['刷题必买', '高端进阶', '高分密训', '基础夯实'],
      newCourse: { name: '', category: '刷题必买' },
      opened: ['中级职称'],
      tagClickCount: 0,
      manualClickCount: 0,
      modes: [
        { value: 'FULL', label: '满减' },
        { value: 'DISCOUNT', label: '按比例折扣' },
        { value: 'DIRECT', label: '自定义直减' }
      ],
      form: {
        name: '中级职称精英班暑期立减券',
        type: 'FULL',
        threshold: 0,
        amount: 980,
        discount: 8,
        startAt: '2026-07-20 09:00:00',
        endAt: '2026-07-31 23:59:59'
      },
      submitting: false,
      priceDialog: { visible: false, pendingSave: false },
      aiOverride: '',
      logs: [
        { time: '07-13 09:12', user: '运营-王倩', content: '修改「内科主治」优惠券金额：50 → 80', tone: 'warn', tag: '短时间重复修改' },
        { time: '07-12 16:40', user: '运营-陈昊', content: '新增「外科类」暑期优惠券配置，覆盖 10 个专业', tone: '', tag: '' },
        { time: '07-11 11:03', user: '运营-王倩', content: '修改「内科主治」优惠券金额：80 → 50', tone: '', tag: '' }
      ]
    }
  },
  computed: {
    onCount () { return this.issued.filter(item => item.state === 'ON').length },
    offCount () { return this.issued.filter(item => item.state === 'OFF').length },
    visibleIssued () {
      const query = this.listKeyword.toLowerCase()
      return this.issued.filter(item => {
        if (this.listStatus !== 'ALL' && item.state !== this.listStatus) return false
        if (query && !`${item.name} ${item.id} ${item.discount} ${item.scope}`.toLowerCase().includes(query)) return false
        return true
      })
    },
    listEmptyText () {
      if (this.listKeyword) return '没有匹配的优惠券任务，换个名称或 ID 试试。'
      if (this.listStatus === 'ON') return '当前没有使用中的优惠券。可切换到「已下架」查看停用任务。'
      if (this.listStatus === 'OFF') return '当前没有已下架的优惠券。使用中的任务在「使用中」里。'
      return '还没有优惠券任务，可点「新增优惠券」去批量配置。'
    },
    selectedCourses () { return this.products.filter(item => this.productIds.includes(item.id)) },
    catalogProducts () {
      return this.products
    },
    groupedCourses () {
      const term = this.courseKeyword.toLowerCase()
      const groups = []
      this.catalogProducts.forEach(item => {
        const label = item.project === '中级职称' ? item.category : `${item.project} · ${item.ownerLabel || item.category}`
        const key = `${item.project}::${label}`
        let group = groups.find(current => current.key === key)
        if (!group) {
          group = { key, label, total: 0, items: [] }
          groups.push(group)
        }
        group.total += 1
        if (!term || item.name.toLowerCase().includes(term)) group.items.push(item)
      })
      return groups.filter(group => group.items.length)
    },
    impact () { return getImpact(this.productIds, this.professionIds, this.products) },
    discountOff () { return Math.max(0, Math.round((10 - Number(this.form.discount || 0)) * 10) / 10) },
    discountSummary () {
      if (this.form.type === 'DISCOUNT') return `${this.form.discount}折`
      if (this.form.type === 'DIRECT') return `无门槛直减${this.form.amount}元`
      return `满${this.form.threshold}减${this.form.amount}`
    },
    dateInvalid () {
      return this.form.startAt && this.form.endAt && new Date(this.form.endAt).getTime() <= new Date(this.form.startAt).getTime()
    },
    zeroPricedCourses () {
      return this.selectedCourses.filter(item => this.payableAfterCoupon(item.price) === 0)
    },
    pricePreviewRows () {
      return this.selectedCourses.map(item => {
        const payable = this.payableAfterCoupon(item.price)
        if (payable === null) {
          return { id: item.id, name: item.name, tone: 'muted', detail: '暂无售价，无法测算（仅供参考）' }
        }
        if (payable < 0) {
          return { id: item.id, name: item.name, tone: 'bad', detail: `售价 ${item.price} 元 → 测算成交价 ${payable} 元（仅供参考）· 低于 0，不能保存` }
        }
        if (payable === 0) {
          return { id: item.id, name: item.name, tone: 'warn', detail: `售价 ${item.price} 元 → 测算成交价 0 元（仅供参考）· 将变为免费` }
        }
        return { id: item.id, name: item.name, tone: '', detail: `售价 ${item.price} 元 → 测算成交价 ${payable} 元（仅供参考）` }
      })
    },
    unpricedCourses () {
      return this.selectedCourses.filter(item => this.payableAfterCoupon(item.price) === null)
    },
    unsafePricedCourses () {
      return this.selectedCourses.filter(item => {
        const payable = this.payableAfterCoupon(item.price)
        return payable !== null && payable < 0
      })
    },
    priceFloorWarning () {
      if (!this.unsafePricedCourses.length) return ''
      const names = this.unsafePricedCourses.map(item => {
        const payable = this.payableAfterCoupon(item.price)
        return `「${item.name}」售价 ${item.price} 元，优惠后 ${payable} 元`
      }).join('；')
      return `优惠后总价不能低于 0 元，否则会亏本。请下调优惠：${names}`
    },
    priceCheck () {
      if (this.unsafePricedCourses.length) {
        return { tone: 'error', title: this.priceFloorWarning }
      }
      if (this.zeroPricedCourses.length) {
        const names = this.zeroPricedCourses.map(item => `「${item.name}」`).join('、')
        return { tone: 'warning', title: `${names} 优惠减免后测算成交价为 0 元（仅供参考）。0 元等于免单，保存前会再弹窗确认。` }
      }
      if (this.unpricedCourses.length) {
        const names = this.unpricedCourses.map(item => `「${item.name}」`).join('、')
        return {
          tone: 'warning',
          title: `${names} 暂无售价，无法确认优惠后是否低于 0 元。请勾选临床有标价商品（如「2026昭师进阶班」8330 元）验算，接入真实售价后会拦截亏本优惠。`
        }
      }
      if (this.selectedCourses.length) {
        const payables = this.selectedCourses.map(item => this.payableAfterCoupon(item.price)).filter(value => value !== null)
        const lowest = Math.min.apply(null, payables)
        return { tone: 'success', title: `优惠后成交价不能低于 0 元。当前最低测算成交价 ${lowest} 元（仅供参考）。` }
      }
      return { tone: 'info', title: '优惠后成交价不能低于 0 元。勾选有标价的商品后，会在这里实时验算。' }
    },
    clickCompare () {
      const n = this.professionIds.length
      const totalClicks = this.tagClickCount + this.manualClickCount
      if (!n || !totalClicks) return ''
      const saved = Math.max(n - totalClicks, 0)
      return `改造前（逐个勾选）：需点击 <b>${n}</b> 次　→　改造后（本次实际点击）：<b>${totalClicks}</b> 次　→　减少 <b>${saved}</b> 次重复操作`
    },
    aiSummary () {
      if (this.aiOverride) return this.aiOverride
      if (!this.productIds.length || !this.professionIds.length) {
        return '请选择专业、适用课程和优惠方式，这里会实时预览本次配置的覆盖范围。'
      }
      const cats = Array.from(new Set(this.professionIds.map(professionProject)))
      const flagged = this.professionIds.some(id => id.includes('内科主治(303)'))
      const flagText = flagged ? '其中 <b>1</b> 个专业的优惠券近 7 天内曾被频繁修改，建议留意是否重复操作。' : ''
      const mismatchText = this.impact.mismatched.length
        ? `<br>其中 <b>${this.impact.mismatched.length}</b> 个专业（${this.impact.mismatched.map(item => item.name).join('、')}）不在已选商品的覆盖范围内，不会生成优惠券。`
        : ''
      return `已选择 <b>${this.professionIds.length}</b> 个专业（跨 ${cats.length} 个业务大类：${cats.join('、')}） × <b>${this.productIds.length}</b> 个课程，实际将生成 <b>${this.impact.combinationCount}</b> 张「${this.discountSummary}」优惠券。${flagText}${mismatchText}`
    }
  },
  watch: {
    'zeroPricedCourses.length' (count, previous) {
      if (count > 0 && previous === 0 && !this.priceDialog.visible) {
        this.priceDialog = { visible: true, pendingSave: false }
      }
    }
  },
  methods: {
    persistIssued () { localStorage.setItem(issuedKey, JSON.stringify(this.issued)) },
    openCreate () {
      this.editingTaskId = null
      this.view = 'config'
    },
    openEdit (row) {
      this.editingTaskId = row.id
      this.form.name = row.name
      this.view = 'config'
    },
    copyIssued (row) {
      const id = Math.max.apply(null, this.issued.map(item => item.id)) + 1
      this.issued.unshift({ ...row, id, name: `${row.name}（复制）`, state: 'OFF' })
      this.persistIssued()
      this.listStatus = 'OFF'
      this.$message.success('已复制到「已下架」，可继续配置后上架')
    },
    toggleIssued (row) {
      const action = row.state === 'ON' ? '下架' : '上架'
      this.$confirm(`确认${action}「${row.name}」？这会改变它在 App 中是否可用。`, `确认${action}`, { type: 'warning', confirmButtonText: `确认${action}`, cancelButtonText: '取消' }).then(() => {
        row.state = row.state === 'ON' ? 'OFF' : 'ON'
        this.persistIssued()
        this.$message.success(`已${action}`)
      }).catch(() => {})
    },
    deleteIssued (row) {
      this.$confirm(`确认删除「${row.name}」？当前演示删除后可从任务列表消失，接入后台后按真实删除规则执行。`, '确认删除', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }).then(() => {
        this.issued = this.issued.filter(item => item.id !== row.id)
        this.persistIssued()
        this.$message.success('已删除')
      }).catch(() => {})
    },
    payableAfterCoupon (price) {
      if (price === null || price === undefined || price === '') return null
      const value = Number(price)
      if (!Number.isFinite(value)) return null
      if (this.form.type === 'DISCOUNT') {
        return Math.round(value * Number(this.form.discount || 0) * 10) / 100
      }
      const amount = Number(this.form.amount || 0)
      if (this.form.type === 'FULL' && Number(this.form.threshold) > 0 && value < Number(this.form.threshold)) {
        return value
      }
      return Math.round((value - amount) * 100) / 100
    },
    isUnsafeCourse (course) {
      const payable = this.payableAfterCoupon(course.price)
      return payable !== null && payable < 0
    },
    isZeroCourse (course) {
      return this.payableAfterCoupon(course.price) === 0
    },
    coursePriceHint (course) {
      const payable = this.payableAfterCoupon(course.price)
      if (payable === null) return '未标价，无法测算（仅供参考）'
      if (payable < 0) return `测算成交价 ${payable} 元（仅供参考）· 亏本`
      if (payable === 0) return '测算成交价 0 元（仅供参考）· 将免费'
      return `测算成交价 ${payable} 元（仅供参考）`
    },
    makeId (category, item) { return `${category}::${item}` },
    categoryIds (category) { return category.groups.reduce((ids, group) => ids.concat(group.items.map(item => this.makeId(category.name, item))), []) },
    categoryTotal (category) { return this.categoryIds(category).length },
    categorySelected (category) { return this.categoryIds(category).filter(id => this.professionIds.includes(id)).length },
    isCategoryAllSelected (category) { const ids = this.categoryIds(category); return ids.length > 0 && ids.every(id => this.professionIds.includes(id)) },
    isCategoryIndeterminate (category) { const count = this.categorySelected(category); return count > 0 && count < this.categoryIds(category).length },
    isGroupAllSelected (category, group) { return group.items.every(item => this.professionIds.includes(this.makeId(category.name, item))) },
    hasNamedGroups (category) { return category.groups.some(group => group.name) },
    isOpen (name) { return this.opened.includes(name) },
    isMismatch (id) { return this.professionIds.includes(id) && this.impact.mismatched.some(item => item.professionId === id) },
    toggleOpen (name) { this.opened = this.isOpen(name) ? this.opened.filter(item => item !== name) : this.opened.concat(name) },
    setProfessions (value) { this.professionIds = value },
    toggleCourse (id) {
      this.productIds = this.productIds.includes(id) ? this.productIds.filter(item => item !== id) : this.productIds.concat(id)
    },
    toggleProfession (id, manual) {
      if (manual) this.manualClickCount += 1
      this.setProfessions(this.professionIds.includes(id) ? this.professionIds.filter(item => item !== id) : this.professionIds.concat(id))
    },
    toggleCategory (category, checked) {
      this.tagClickCount += 1
      const ids = this.categoryIds(category)
      this.setProfessions(checked ? Array.from(new Set(this.professionIds.concat(ids))) : this.professionIds.filter(id => !ids.includes(id)))
    },
    toggleGroup (category, group) {
      this.tagClickCount += 1
      const ids = group.items.map(item => this.makeId(category.name, item))
      const all = ids.every(id => this.professionIds.includes(id))
      this.setProfessions(all ? this.professionIds.filter(id => !ids.includes(id)) : Array.from(new Set(this.professionIds.concat(ids))))
    },
    clearMismatch () {
      const ids = this.impact.mismatched.map(item => item.professionId)
      this.setProfessions(this.professionIds.filter(id => !ids.includes(id)))
    },
    clearProfessions () {
      this.tagClickCount = 0
      this.manualClickCount = 0
      this.setProfessions([])
    },
    addCourse () {
      if (!this.newCourse.name) return this.$message.warning('请填写商品名称')
      if (this.products.some(item => item.name === this.newCourse.name)) return this.$message.warning('该商品名称已存在，请换一个名称')
      const product = {
        id: `zzzc-new-${Date.now()}`,
        name: this.newCourse.name,
        project: '中级职称',
        category: this.newCourse.category,
        scope: zzzcScope.slice(),
        price: null,
        status: 'OFF',
        source: '中级职称课程库'
      }
      this.products.unshift(product)
      this.productIds = this.productIds.concat(product.id)
      this.cancelAddCourse()
      this.$message.success('商品已新增并自动选中')
    },
    cancelAddCourse () {
      this.showAddCourse = false
      this.newCourse = { name: '', category: '刷题必买' }
    },
    removeCourse (course) {
      this.$confirm(`确认从商品列表中移除「${course.name}」？此操作仅影响本次演示清单，不会影响真实后台数据。`, '移除商品', { type: 'warning', confirmButtonText: '确认移除', cancelButtonText: '取消' }).then(() => {
        this.products = this.products.filter(item => item.id !== course.id)
        this.productIds = this.productIds.filter(id => id !== course.id)
        this.$message.success('商品已移除')
      }).catch(() => {})
    },
    submit () {
      if (!this.form.name) return this.$message.warning('请填写优惠券名称')
      if (this.form.type === 'FULL' && Number(this.form.amount) > Number(this.form.threshold) && Number(this.form.threshold) > 0) {
        return this.$message.warning('满减金额应小于使用门槛')
      }
      if (this.unsafePricedCourses.length) {
        return this.$message.error(this.priceFloorWarning)
      }
      if (!this.productIds.length) return this.$message.warning('请先勾选至少一个适用课程')
      if (!this.professionIds.length) return this.$message.warning('请先勾选至少一个专业')
      if (!this.form.startAt || !this.form.endAt) return this.$message.warning('请填写生效时间和截止时间')
      if (this.dateInvalid) return this.$message.error('截止时间不能早于生效时间，请检查日期')
      if (!this.impact.combinationCount) return this.$message.error('已选专业均不在所选商品的覆盖范围内，无法生成优惠券')
      this.priceDialog = { visible: true, pendingSave: true }
    },
    confirmPriceDialog () {
      const shouldSave = this.priceDialog.pendingSave && !this.unsafePricedCourses.length
      this.priceDialog.visible = false
      this.priceDialog.pendingSave = false
      if (shouldSave) this.commitSave()
    },
    commitSave () {
      const cats = Array.from(new Set(this.professionIds.map(professionProject))).join('、')
      const courses = this.selectedCourses.map(item => item.name).join('、')
      this.submitting = true
      this.aiOverride = '正在生成摘要…'
      window.setTimeout(() => {
        this.logs.unshift({
          time: '07-16 09:32',
          user: '运营-美惠',
          content: `批量配置优惠券（${this.discountSummary}，有效期 ${this.form.startAt} 至 ${this.form.endAt}），涉及「${cats}」，适用课程：${courses}，共生成 ${this.impact.combinationCount} 张${this.impact.mismatched.length ? `（${this.impact.mismatched.length}个专业因不在覆盖范围内被跳过）` : ''}`,
          tone: 'new',
          tag: ''
        })
        this.aiOverride = `刚刚，<b>你</b> 一次性批量配置了「${cats}」的优惠券（${this.discountSummary}，有效期 ${this.form.startAt} 至 ${this.form.endAt}），适用课程：${courses}，共生成 <b>${this.impact.combinationCount}</b> 张，相比逐个专业逐个课程手动勾选，节省大量重复操作。此外，「内科主治」优惠券近 7 天内被修改 3 次，金额来回波动，建议核实是否为误操作。`
        this.submitting = false
        const period = `${this.form.startAt.slice(0, 10)} 至 ${this.form.endAt.slice(5, 10)}`
        const scope = `${this.professionIds.length} 个专业 · ${this.productIds.length} 个班型`
        if (this.editingTaskId) {
          const row = this.issued.find(item => item.id === this.editingTaskId)
          if (row) Object.assign(row, { name: this.form.name, discount: this.discountSummary, scope, period, state: 'ON' })
        } else {
          const id = Math.max.apply(null, [100].concat(this.issued.map(item => item.id))) + 1
          this.issued.unshift({ id, name: this.form.name, discount: this.discountSummary, scope, period, state: 'ON' })
          this.editingTaskId = id
        }
        this.persistIssued()
        this.$message.success(`已生成 ${this.impact.combinationCount} 张优惠券配置，可在任务列表检索`)
        this.listStatus = 'ON'
        this.view = 'list'
      }, 600)
    }
  }
}
</script>

<style scoped>
.coupon-page{max-width:1440px;margin:0 auto}
.coupon-list .status-row{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:22px 0 16px}
.coupon-list .status-row .el-input{width:320px}
.coupon-list .result-count{margin-left:auto;color:var(--muted);font-size:13px}
.coupon-list .task-id{display:block;margin-top:4px;color:var(--muted);font-size:12px;font-weight:400}
.coupon-list .status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}
.coupon-list .status:before{width:7px;height:7px;border-radius:50%;background:currentColor;content:""}
.coupon-list .status.on{background:#eaf6f1;color:#147a62}
.coupon-list .status.off{background:#e8ebee;color:#69717c}
.coupon-list .empty{padding:40px 20px;color:var(--muted);text-align:center}
.danger-text{color:#c9232d}
.head-actions{display:flex;flex-wrap:wrap;gap:8px}
.coupon-workspace{max-width:1180px;margin:0 auto}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}.breadcrumb span{color:#5f6876}.breadcrumb i{margin:0 7px}.transfer-alert{margin-top:16px}.intro-banner{margin:16px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:#fff}.intro-banner p{display:grid;grid-template-columns:78px 1fr;gap:10px;margin:0 0 6px;color:var(--muted);line-height:1.7}.intro-banner p:last-child{margin:8px 0 0;padding-top:8px;border-top:1px dashed var(--line);color:#166350}.intro-banner strong{color:var(--ink)}.workspace-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:18px;align-items:start}.config-panel,.log-panel{padding:22px 24px;border:1px solid var(--line);border-radius:10px;background:#fff}.panel-title{margin-bottom:18px;font-size:14px;font-weight:700}.field-row{margin-bottom:20px}.field-label{display:block;margin-bottom:8px;font-weight:600}.req{margin-right:3px;color:#c91420}.mode-toggle{display:flex;gap:8px;margin-bottom:10px}.mode-btn{flex:1;min-height:38px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--muted);font-weight:700;cursor:pointer}.mode-btn.active{border-color:var(--brand);background:var(--brand-soft);color:#a90a13}.rule-line{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:var(--muted)}.rule-line .el-input-number{width:120px}.course-toolbar{display:flex;gap:8px;margin-bottom:8px}.course-toolbar .el-input{flex:1}.add-course{display:flex;flex-direction:column;gap:8px;margin-bottom:8px;padding:12px;border:1px dashed #eba5aa;border-radius:8px;background:#fff8f8}.add-hint{margin:0;color:#a90a13;font-size:12px}.add-actions{display:flex;justify-content:flex-end;gap:8px}.course-list{max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:6px;background:#fff}.course-group-header{position:sticky;top:0;padding:6px 12px;border-bottom:1px solid var(--line);background:#fafafa;color:var(--muted);font-size:11px;font-weight:700}.course-row{display:flex;align-items:center;gap:9px;width:100%;padding:8px 12px;border:0;border-bottom:1px solid #f0f0f0;background:#fff;text-align:left;cursor:pointer}.course-row:last-child{border-bottom:0}.course-row:hover{background:#fafafa}.course-row.checked{background:var(--brand-soft)}.box{width:14px;height:14px;flex-shrink:0;border:1px solid #c5cbd3;border-radius:3px;background:#fff}.course-row.checked .box{border-color:var(--brand);background:var(--brand);box-shadow:inset 0 0 0 2px #fff}.course-name{flex:1}.course-tag{flex-shrink:0;padding:1px 7px;border-radius:8px;background:#f0f0f0;color:var(--muted);font-size:10px}.remove{display:none;width:18px;height:18px;border-radius:50%;background:#edeef0;color:var(--muted);font-size:11px;line-height:18px;text-align:center}.course-row:hover .remove{display:inline-block}.remove:hover{background:var(--brand);color:#fff}.course-empty{padding:16px;color:var(--muted);text-align:center}.selected-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.price-alert{margin-top:10px}
.price-preview{margin-top:10px;padding:10px 12px;border:1px dashed var(--line);border-radius:8px;background:#fafafa}
.price-preview-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--ink);font-size:12px;font-weight:700}
.price-preview-head span{padding:1px 6px;border-radius:4px;background:#fbf3e2;color:#8a6418;font-size:10px;font-weight:700}
.price-preview ul,.preview-list{margin:0;padding:0;list-style:none}
.price-preview li,.preview-list li{display:flex;flex-direction:column;gap:2px;padding:6px 0;border-top:1px dashed var(--line);font-size:12px;line-height:1.5}
.price-preview li:first-child,.preview-list li:first-child{border-top:0;padding-top:0}
.price-preview li.bad,.preview-list li.bad{color:#a90a13}
.price-preview li.warn,.preview-list li.warn{color:#8a6418}
.price-preview li.muted,.preview-list li.muted{color:var(--muted)}
.price-preview li span,.preview-list li span{font-weight:500}
.preview-caption{margin:10px 0 8px;color:var(--muted);font-size:12px;line-height:1.6}
.chip.zero{background:#fbf3e2;color:#8a6418}.chip{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:14px;background:var(--brand-soft);color:#a90a13;font-size:12px;font-weight:600}.chip.unsafe{background:#fff1f2;outline:1px solid #e6aeb2}.chip small{font-weight:500;opacity:.85}.chip button{padding:0;border:0;background:transparent;color:inherit;cursor:pointer}.field-note,.save-note{margin:6px 0 0;color:var(--muted);font-size:12px}.quick-clear{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}.click-compare{margin:0 0 8px;padding:8px 10px;border-radius:6px;background:#fafafa;color:var(--muted);font-size:12px;line-height:1.6}.click-compare >>> b{color:#166350}.cat-card{margin-bottom:8px;overflow:hidden;border:1px solid var(--line);border-radius:8px}.cat-header{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer}.cat-header:hover{background:#fafafa}.cat-count{color:var(--muted);font-size:12px}.cat-header em{margin-left:auto;margin-right:8px;color:#166350;font-size:11px;font-style:normal;font-weight:700}.el-icon-arrow-down{color:#8a919e;transition:transform .18s ease}.el-icon-arrow-down.open{transform:rotate(180deg)}.cat-body{padding:0 14px 12px;border-top:1px solid var(--line)}.cat-new{display:inline-block;margin:8px 0 6px;padding:2px 8px;border-radius:8px;background:#e4f2ec;color:#166350;font-size:11px;font-weight:700}.sub-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.sub-tag{padding:5px 11px;border:1px solid #1f8a6e;border-radius:14px;background:#fff;color:#166350;font-size:12px;font-weight:600;cursor:pointer}.sub-tag.active{background:#1f8a6e;color:#fff}.sub-tag small{margin-left:2px;font-weight:500;opacity:.8}.sub-head{margin:8px 0 4px;padding-top:5px;border-top:1px dashed var(--line);color:var(--muted);font-size:11px;font-weight:700}.chip-list{display:flex;flex-wrap:wrap;gap:6px;padding-top:4px}.prof-chip{display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:#fbfbfa;font-size:12px;cursor:pointer}.prof-chip.checked{border-color:#1f8a6e;background:#e4f2ec;color:#166350;font-weight:600}.prof-chip.mismatch{border-color:var(--brand);background:var(--brand-soft);color:#a90a13}.prof-chip small{color:#a90a13;font-size:10px;font-weight:700}.config-panel .el-date-editor{width:100%}.date-warning{margin:6px 0 0;color:#a90a13;font-size:12px}.save-btn{width:100%;margin-top:6px}.save-note{text-align:center}.side-label{margin:0 0 10px;color:var(--muted);font-size:12px;font-weight:700}.ai-card{margin-bottom:14px;padding:18px 20px;border-radius:10px;background:#1b3d37;color:#fff}.ai-eyebrow{display:flex;align-items:center;gap:6px;margin-bottom:9px;color:#8fd4bc;font-size:11px;font-weight:700}.dot{width:6px;height:6px;border-radius:50%;background:#8fd4bc;animation:pulse 1.6s ease-in-out infinite}.ai-text{font-size:13px;line-height:1.7}.ai-text >>> b{color:#8fd4bc}.log-item{padding:0 0 14px}.log-item+.log-item{border-top:1px solid var(--line);padding-top:14px}.log-time{color:var(--muted);font-size:11px}.log-text{margin-top:4px;font-size:13px;line-height:1.5}.log-item.new .log-text{color:#166350;font-weight:600}.log-tag{display:inline-block;margin-top:5px;padding:2px 7px;border-radius:5px;background:#fbf3e2;color:#b8862e;font-size:10px;font-weight:700}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}@media(prefers-reduced-motion:reduce){.dot{animation:none}.el-icon-arrow-down{transition:none}}@media(max-width:980px){.page-head,.course-toolbar{flex-direction:column;align-items:stretch}.workspace-grid{grid-template-columns:1fr}.intro-banner p{grid-template-columns:1fr}}
</style>
