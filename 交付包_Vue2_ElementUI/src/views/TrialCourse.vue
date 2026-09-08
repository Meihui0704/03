<template>
  <section class="page">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>运营管理</span><i class="el-icon-arrow-right" />App引流课管理</div>
        <h1 class="page-title">App引流课管理</h1>
        <p class="page-description">按原「App免费体验课」后台来：先管引流课，再进配置内容，用关联小节去搜音视频绑定。不再使用「精华体验课」这个名字。</p>
      </div>
    </header>

    <aside class="intro-banner">
      <p>这里不是商品页那两个下拉。运营动作是：编辑/复制/禁用引流课 → 配置内容（福利一、福利二）→ 关联小节。添加小节时用音视频 ID 或名称查询已有素材，选中后绑定，不在这里新建商品。</p>
    </aside>

    <div class="filters">
      <el-select v-model="project" clearable placeholder="全部项目">
        <el-option label="中级职称" value="中级职称" />
        <el-option label="临床" value="临床" />
      </el-select>
      <el-radio-group v-model="status">
        <el-radio-button label="ON">使用中</el-radio-button>
        <el-radio-button label="OFF">已禁用</el-radio-button>
        <el-radio-button label="ALL">全部</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="visible">
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="project" label="项目" width="120" />
      <el-table-column prop="profession" label="专业" width="160" />
      <el-table-column label="状态" width="100">
        <template slot-scope="s">
          <el-tag :type="s.row.status === 'ON' ? 'success' : 'info'">{{ s.row.status === 'ON' ? '使用中' : '已禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320">
        <template slot-scope="s">
          <el-button type="text" @click="openContents(s.row)">配置内容</el-button>
          <el-button type="text" @click="edit(s.row)">编辑</el-button>
          <el-button type="text" @click="copyRow(s.row)">复制</el-button>
          <el-button type="text" @click="s.row.status = s.row.status === 'ON' ? 'OFF' : 'ON'">{{ s.row.status === 'ON' ? '禁用' : '启用' }}</el-button>
          <el-button type="text" class="danger" @click="removeRow(s.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="current ? '编辑引流课' : '新增引流课'" :visible.sync="editDialog" width="560px">
      <el-form label-width="88px">
        <el-form-item label="名称"><el-input v-model="draft.name" /></el-form-item>
        <el-form-item label="项目">
          <el-select v-model="draft.project">
            <el-option label="中级职称" value="中级职称" />
            <el-option label="临床" value="临床" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业"><el-input v-model="draft.profession" placeholder="与后台专业名称一致" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="配置内容" :visible.sync="contentDialog" width="1080px" class="wide-dialog">
      <el-table :data="current ? current.contents : []">
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="name" label="名称" width="100" />
        <el-table-column prop="project" label="项目" width="110" />
        <el-table-column prop="profession" label="专业" width="150" />
        <el-table-column label="关联小节ID/名称/vid" min-width="240">
          <template slot-scope="s">
            <div v-if="s.row.sectionId" class="section-cell">
              <span>{{ s.row.sectionId }}</span>
              <span>{{ s.row.sectionName }}</span>
              <small>{{ s.row.vid }}</small>
            </div>
            <span v-else class="muted">未关联</span>
          </template>
        </el-table-column>
        <el-table-column label="所属科目" width="110">
          <template>引流课</template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="修改" width="170" />
        <el-table-column label="操作" width="110">
          <template slot-scope="s">
            <el-button type="text" @click="openSectionPicker(s.row)">关联小节</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="添加小节" :visible.sync="sectionDialog" width="1180px" class="wide-dialog">
      <div class="section-filters">
        <el-input v-model.trim="sectionQuery.mediaId" clearable placeholder="音视频id" />
        <el-input v-model.trim="sectionQuery.keyword" clearable placeholder="音视频名称/vid" />
        <el-select v-model="sectionQuery.project" placeholder="项目">
          <el-option label="中级职称" value="中级职称" />
        </el-select>
        <el-select v-model="sectionQuery.profession" placeholder="专业">
          <el-option label="内分泌主治(309)" value="内分泌主治(309)" />
        </el-select>
        <el-select v-model="sectionQuery.pack" clearable placeholder="所属包">
          <el-option label="全部" value="" />
        </el-select>
        <el-select v-model="sectionQuery.outline" clearable placeholder="所属大纲">
          <el-option label="专业实践能力" value="专业实践能力" />
        </el-select>
        <el-select v-model="sectionQuery.subject" clearable placeholder="所属科目">
          <el-option label="矿盐和骨代谢性疾病" value="矿盐和骨代谢性疾病" />
        </el-select>
        <el-button type="primary" @click="searchSections">查询</el-button>
        <el-button @click="resetSectionQuery">重置</el-button>
      </div>
      <el-table :data="filteredMedia" @current-change="pickedMedia = $event">
        <el-table-column width="48">
          <template slot-scope="s">
            <el-radio v-model="pickedId" :label="s.row.id">&nbsp;</el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="音视频ID" width="100" />
        <el-table-column label="音视频名称" min-width="220">
          <template slot-scope="s">
            <div>{{ s.row.name }}</div>
            <small class="vid">{{ s.row.vid }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(分)" width="90" />
        <el-table-column prop="type" label="类型" width="72" />
        <el-table-column prop="project" label="项目" width="110" />
        <el-table-column prop="profession" label="专业" width="140" />
        <el-table-column prop="outline" label="所属大纲" width="130" />
        <el-table-column prop="subject" label="所属科目" min-width="160" />
      </el-table>
      <span slot="footer">
        <el-button @click="sectionDialog = false">取消</el-button>
        <el-button type="primary" @click="bindSection">确定关联</el-button>
      </span>
    </el-dialog>
  </section>
</template>

<script>
const seedContents = [
  { id: 106, name: '福利一', project: '中级职称', profession: '内分泌主治(309)', sectionId: 64607, sectionName: '发热 (上)', vid: '026b8dcd978dde0551995e09eefdaaa0_0', updatedAt: '2024-12-03 14:27:45' },
  { id: 107, name: '福利二', project: '中级职称', profession: '内分泌主治(309)', sectionId: 64608, sectionName: '原发性高血压 (中)', vid: '026b8dcd978dde0551995e09eefdaaa0_0', updatedAt: '2024-12-03 14:27:45' },
  { id: 108, name: '福利三', project: '中级职称', profession: '内分泌主治(309)', sectionId: '', sectionName: '', vid: '', updatedAt: '2024-12-03 14:27:45' },
  { id: 109, name: '福利四', project: '中级职称', profession: '内分泌主治(309)', sectionId: '', sectionName: '', vid: '', updatedAt: '2024-12-03 14:27:45' }
]

const mediaLibrary = [
  { id: 78119, name: '骨软化症', vid: '026b8dcd978dde0551995e09eefdaaa0_0', duration: 20.92, type: '视频', project: '中级职称', profession: '内分泌主治(309)', outline: '专业实践能力', subject: '矿盐和骨代谢性疾病' }
]

export default {
  name: 'TrialCourse',
  data () {
    return {
      project: '',
      status: 'ON',
      editDialog: false,
      contentDialog: false,
      sectionDialog: false,
      current: null,
      linking: null,
      pickedMedia: null,
      pickedId: '',
      draft: { name: '', project: '中级职称', profession: '' },
      sectionQuery: { mediaId: '', keyword: '', project: '中级职称', profession: '内分泌主治(309)', pack: '', outline: '', subject: '' },
      mediaLibrary,
      rows: [
        {
          name: '引流课',
          project: '中级职称',
          profession: '内分泌主治(309)',
          status: 'ON',
          contents: seedContents.map(item => ({ ...item }))
        }
      ]
    }
  },
  computed: {
    visible () {
      return this.rows.filter(row => {
        if (this.project && row.project !== this.project) return false
        if (this.status !== 'ALL' && row.status !== this.status) return false
        return true
      })
    },
    filteredMedia () {
      const id = this.sectionQuery.mediaId.trim()
      const keyword = this.sectionQuery.keyword.toLowerCase()
      return this.mediaLibrary.filter(item => {
        if (this.sectionQuery.project && item.project !== this.sectionQuery.project) return false
        if (this.sectionQuery.profession && item.profession !== this.sectionQuery.profession) return false
        if (this.sectionQuery.outline && item.outline !== this.sectionQuery.outline) return false
        if (this.sectionQuery.subject && item.subject !== this.sectionQuery.subject) return false
        if (id && String(item.id) !== id) return false
        if (keyword && !`${item.name} ${item.vid}`.toLowerCase().includes(keyword)) return false
        return true
      })
    }
  },
  methods: {
    edit (row) {
      this.current = row || null
      this.draft = row ? { name: row.name, project: row.project, profession: row.profession } : { name: '引流课', project: '中级职称', profession: '' }
      this.editDialog = true
    },
    saveEdit () {
      if (!this.draft.name || !this.draft.profession) return this.$message.warning('请填写名称和专业')
      if (this.current) Object.assign(this.current, this.draft)
      else this.rows.unshift({ ...this.draft, status: 'OFF', contents: [] })
      this.editDialog = false
      this.$message.success('引流课已保存')
    },
    copyRow (row) {
      this.rows.unshift({
        ...JSON.parse(JSON.stringify(row)),
        name: `${row.name}（副本）`,
        status: 'OFF'
      })
      this.$message.success('已复制，默认禁用，可再编辑')
    },
    removeRow (row) {
      this.$confirm(`删除「${row.name}」后，配置内容和已关联小节一并去掉。`, '确认删除', { type: 'warning' }).then(() => {
        this.rows = this.rows.filter(item => item !== row)
        this.$message.success('已删除')
      }).catch(() => {})
    },
    openContents (row) {
      this.current = row
      this.contentDialog = true
    },
    openSectionPicker (row) {
      this.linking = row
      this.pickedMedia = null
      this.pickedId = row.sectionId || ''
      this.sectionDialog = true
    },
    searchSections () { this.$message.success(`当前可关联 ${this.filteredMedia.length} 条已有音视频`) },
    resetSectionQuery () {
      this.sectionQuery = { mediaId: '', keyword: '', project: '中级职称', profession: '内分泌主治(309)', pack: '', outline: '', subject: '' }
    },
    bindSection () {
      const media = this.mediaLibrary.find(item => item.id === this.pickedId) || this.pickedMedia
      if (!media) return this.$message.warning('请先选中一条音视频')
      Object.assign(this.linking, {
        sectionId: media.id,
        sectionName: media.name,
        vid: media.vid,
        updatedAt: '刚刚'
      })
      this.sectionDialog = false
      this.$message.success(`已关联小节 ${media.id} ${media.name}`)
    }
  }
}
</script>

<style scoped>
.page{max-width:1440px;margin:0 auto}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}
.breadcrumb i{margin:0 7px}
.intro-banner{margin:16px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#166350;line-height:1.7}
.filters{display:flex;gap:12px;margin:0 0 16px}
.filters .el-select{width:220px}
.danger{color:#8f1018}
.section-cell{display:flex;flex-direction:column;gap:2px;line-height:1.4}
.section-cell small,.vid,.muted{color:var(--muted);font-size:12px;word-break:break-all}
.section-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.section-filters .el-input,.section-filters .el-select{width:160px}
</style>
