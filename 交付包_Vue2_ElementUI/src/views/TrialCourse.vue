<template>
  <section class="trial-page">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />App引流课管理</div>
        <h1 class="page-title">App引流课管理</h1>
        <p class="page-description">从商品编辑挪到这里，按项目和专业配置头图、列表免费试听。不再使用「精华体验课」任务。</p>
      </div>
      <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
    </header>

    <aside class="intro-banner">
      <p>字段名与商品后台一致：<b>配置头图免费试听</b>、<b>配置列表免费试听</b>。第一个下拉先选已有商品；第二个下拉是试听内容，选项以后台返回为准，这里不编造小节 ID。</p>
    </aside>

    <div class="workspace-grid">
      <div class="config-panel">
        <section class="field-block">
          <div class="field-label">项目与专业</div>
          <p class="field-hint">对应商品页里写在试听前面的「临床 临床助理医师」。换专业会带出该专业已保存的配置。</p>
          <div class="scope-row">
            <el-select v-model="project" placeholder="请选择项目" @change="onProjectChange">
              <el-option v-for="item in projects" :key="item" :label="item" :value="item" />
            </el-select>
            <el-select v-model="profession" placeholder="请选择专业" filterable @change="loadCurrent">
              <el-option v-for="item in professionOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
        </section>

        <section class="field-block">
          <div class="field-label">配置头图免费试听</div>
          <p class="field-hint">头图只配一条。未选出试听内容时，保存后仍显示待对接。</p>
          <div class="trial-row">
            <span class="scope-chip">{{ project }} {{ profession }}</span>
            <el-select v-model="banner.productId" clearable filterable placeholder="请选择">
              <el-option v-for="item in productOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-select v-model="banner.trialId" clearable filterable placeholder="请选择" no-data-text="试听内容待对接">
              <el-option v-for="item in trialOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </div>
        </section>

        <section class="field-block last">
          <div class="field-label">配置列表免费试听</div>
          <p class="field-hint">可加多条，对应商品页右侧的 +。</p>
          <div v-for="(row, index) in listRows" :key="row.key" class="trial-row">
            <span class="scope-chip">{{ project }} {{ profession }}</span>
            <el-select v-model="row.productId" clearable filterable placeholder="请选择">
              <el-option v-for="item in productOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-select v-model="row.trialId" clearable filterable placeholder="请选择" no-data-text="试听内容待对接">
              <el-option v-for="item in trialOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button type="text" class="remove-row" :disabled="listRows.length === 1" @click="removeListRow(index)">删除</el-button>
          </div>
          <el-button type="text" class="add-row" @click="addListRow">+ 添加列表试听</el-button>
        </section>
      </div>

      <aside class="side-column">
        <p class="side-label">已配置专业</p>
        <el-table :data="savedRows" empty-text="还没有保存过引流课配置">
          <el-table-column prop="project" label="项目" width="88" />
          <el-table-column prop="profession" label="专业" min-width="120" />
          <el-table-column label="头图试听" min-width="160">
            <template slot-scope="s">{{ productName(s.row.banner.productId) || '未选' }}</template>
          </el-table-column>
          <el-table-column label="列表" width="72">
            <template slot-scope="s">{{ filledListCount(s.row.list) }} 条</template>
          </el-table-column>
          <el-table-column label="" width="64">
            <template slot-scope="s">
              <el-button type="text" @click="openSaved(s.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </aside>
    </div>
  </section>
</template>

<script>
import { allOperationProducts, taxonomy } from '../data/phase1Business'

const storageKey = 'lead-course-demo-v1'

function blankListRow () {
  return { key: `row-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, productId: '', trialId: '' }
}

function loadSaved () {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export default {
  name: 'TrialCourse',
  data () {
    return {
      project: '临床',
      profession: '临床助理医师',
      banner: { productId: '', trialId: '' },
      listRows: [blankListRow()],
      savedRows: [],
      saving: false,
      trialOptions: []
    }
  },
  computed: {
    projects () { return taxonomy.map(item => item.name) },
    professionOptions () {
      const category = taxonomy.find(item => item.name === this.project)
      if (!category) return []
      return category.groups.reduce((list, group) => list.concat(group.items), [])
    },
    productOptions () {
      return allOperationProducts.filter(item => !item.scope || item.scope.includes(this.profession))
    }
  },
  created () {
    this.savedRows = loadSaved()
    this.ensureSeed()
    this.loadCurrent()
  },
  methods: {
    productName (id) {
      const hit = allOperationProducts.find(item => item.id === id)
      return hit ? hit.name : ''
    },
    filledListCount (list) {
      return (list || []).filter(item => item.productId).length
    },
    ensureSeed () {
      if (this.savedRows.length) return
      const featured = allOperationProducts.find(item => item.name === '2026昭师进阶班（技能免考）')
      this.savedRows = [{
        project: '临床',
        profession: '临床助理医师',
        banner: { productId: featured ? featured.id : '', trialId: '' },
        list: [blankListRow()]
      }]
      this.persist()
    },
    onProjectChange () {
      this.profession = this.professionOptions[0] || ''
      this.loadCurrent()
    },
    loadCurrent () {
      const found = this.savedRows.find(item => item.project === this.project && item.profession === this.profession)
      this.banner = found ? { productId: found.banner.productId || '', trialId: found.banner.trialId || '' } : { productId: '', trialId: '' }
      const list = found && found.list && found.list.length ? found.list : [blankListRow()]
      this.listRows = list.map(item => ({ ...blankListRow(), productId: item.productId || '', trialId: item.trialId || '' }))
    },
    openSaved (row) {
      this.project = row.project
      this.profession = row.profession
      this.loadCurrent()
    },
    addListRow () { this.listRows.push(blankListRow()) },
    removeListRow (index) { this.listRows.splice(index, 1) },
    persist () {
      window.localStorage.setItem(storageKey, JSON.stringify(this.savedRows))
    },
    save () {
      if (!this.project || !this.profession) return this.$message.warning('请先选择项目和专业')
      if (!this.banner.productId) return this.$message.warning('请先为头图免费试听选择商品')
      this.$confirm(
        `将保存「${this.project} ${this.profession}」的头图免费试听和 ${this.filledListCount(this.listRows)} 条列表试听。试听内容选项待对接，不写入未确认的小节 ID。`,
        '确认保存引流课',
        { confirmButtonText: '确认保存', cancelButtonText: '返回检查', type: 'warning' }
      ).then(() => {
        this.saving = true
        window.setTimeout(() => {
          const payload = {
            project: this.project,
            profession: this.profession,
            banner: { ...this.banner },
            list: this.listRows.map(item => ({ productId: item.productId, trialId: item.trialId }))
          }
          const index = this.savedRows.findIndex(item => item.project === this.project && item.profession === this.profession)
          if (index >= 0) this.savedRows.splice(index, 1, payload)
          else this.savedRows.unshift(payload)
          this.persist()
          this.saving = false
          this.$message.success('引流课配置已保存')
        }, 350)
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.trial-page{max-width:1280px;margin:0 auto}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}
.breadcrumb span{color:#5f6876}
.breadcrumb i{margin:0 7px}
.intro-banner{margin:16px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#166350;line-height:1.7}
.workspace-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:18px;align-items:start}
.config-panel,.side-column{border:1px solid var(--line);border-radius:10px;background:#fff}
.config-panel{padding:22px 24px}
.side-column{padding:16px}
.field-block{margin-bottom:26px;padding-bottom:20px;border-bottom:1px dashed var(--line)}
.field-block.last{margin-bottom:0;padding-bottom:0;border-bottom:0}
.field-label{margin-bottom:6px;font-weight:700}
.field-hint{margin:0 0 14px;color:var(--muted);font-size:12px;line-height:1.6}
.scope-row,.trial-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
.scope-row .el-select,.trial-row .el-select{flex:1;min-width:180px}
.scope-chip{flex:0 0 auto;padding:7px 10px;border-radius:8px;background:#f7f8fa;color:#303744;font-size:12px;white-space:nowrap}
.add-row{margin-top:8px;padding:0}
.remove-row{padding:0;color:#8f1018}
.side-label{margin:0 0 10px;color:var(--muted);font-size:12px;font-weight:700}
@media(max-width:980px){
  .page-head{align-items:flex-start;flex-direction:column}
  .workspace-grid{grid-template-columns:1fr}
}
</style>
