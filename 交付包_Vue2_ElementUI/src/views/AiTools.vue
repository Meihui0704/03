<template>
  <section class="page">
    <header>
      <div>
        <h1 class="page-title">AI 工具集管理</h1>
        <p class="page-description">管理 App 中部固定展示的 6 个智能体入口。做 icon 是插入图片并自动裁成方图；也可放大查看和下载。</p>
      </div>
      <span>{{ visible.length }} / 6 个</span>
    </header>
    <div class="tools">
      <el-input v-model="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索工具名称或 ID" />
      <el-radio-group v-model="status">
        <el-radio-button label="ON">使用中</el-radio-button>
        <el-radio-button label="OFF">已停用</el-radio-button>
        <el-radio-button label="ALL">全部</el-radio-button>
      </el-radio-group>
    </div>
    <div class="list">
      <article v-for="item in visible" :key="item.id">
        <button class="icon" type="button" :aria-label="`放大查看 ${item.name} 图标`" @click="viewToolIcon(item)">
          <img v-if="item.iconUrl" :src="item.iconUrl" :alt="`${item.name} 图标`">
          <template v-else>{{ item.name[0] }}</template>
        </button>
        <div class="info">
          <strong>{{ item.name }}</strong>
          <span>工具 ID {{ item.id }} · 排序 {{ item.order }}</span>
          <p>{{ item.desc }}</p>
        </div>
        <el-tag :type="item.status === 'ON' ? 'success' : 'info'">{{ item.status === 'ON' ? '启用' : '已停用' }}</el-tag>
        <div class="actions">
          <el-button type="text" @click="openIconMaker(item)">做 icon</el-button>
          <el-button type="text" @click="viewToolIcon(item)">放大查看</el-button>
          <el-button type="text" @click="downloadToolIcon(item)">下载</el-button>
          <el-button type="text" @click="edit(item)">编辑</el-button>
          <el-button type="text" @click="toggle(item)">{{ item.status === 'ON' ? '停用' : '启用' }}</el-button>
          <el-button type="text" @click="manage(item)">运营配置</el-button>
        </div>
      </article>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialog" width="640px">
      <template v-if="panel === 'edit'">
        <el-form label-width="100px">
          <el-form-item label="名称"><el-input v-model="draft.name" /></el-form-item>
          <el-form-item label="简介"><el-input v-model="draft.desc" type="textarea" /></el-form-item>
          <el-form-item label="展示顺序"><el-input-number v-model="draft.order" :min="0" :max="5" /></el-form-item>
          <el-form-item label="免费次数"><el-input-number v-model="draft.free" :min="0" /></el-form-item>
        </el-form>
      </template>
      <template v-else>
        <div class="config">
          <button type="button" @click="panel = 'questions'"><strong>问题管理</strong><span>App 直接展示的推荐提问</span></button>
          <button type="button" @click="panel = 'marketing'"><strong>营销管理</strong><span>免费、会员、分享、白名单权益</span></button>
          <button type="button" disabled><strong>推荐管理</strong><span>暂未关联商品</span></button>
        </div>
        <div v-if="panel === 'questions'" class="sub">
          <div v-for="(q, i) in questions" :key="q"><span>{{ i + 1 }}. {{ q }}</span><el-button type="text" @click="questions.splice(i, 1)">删除</el-button></div>
          <el-input v-model="newQuestion" placeholder="新增推荐提问"><el-button slot="append" @click="addQuestion">添加</el-button></el-input>
        </div>
        <div v-if="panel === 'marketing'" class="sub">
          <el-radio-group v-model="marketing">
            <el-radio label="免费" /><el-radio label="会员" /><el-radio label="分享" /><el-radio label="白名单" />
          </el-radio-group>
          <el-date-picker v-model="marketingPeriod" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </div>
      </template>
      <span slot="footer"><el-button @click="dialog = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></span>
    </el-dialog>

    <el-dialog title="做 icon" :visible.sync="iconMakerVisible" width="520px" append-to-body>
      <p v-if="iconTarget" class="maker-meta">{{ iconTarget.name }} · 工具 ID {{ iconTarget.id }}。插入任意图片后，会自动居中裁成 80×80 方图（与金刚区入口同一规格）。</p>
      <div class="maker">
        <button class="icon-preview" type="button" :disabled="!iconDraft.url" @click="iconDraft.url && openAssetViewer({ src: iconDraft.url, title: iconTarget ? iconTarget.name : 'icon', filename: `${iconTarget ? iconTarget.name : 'icon'}.png` })">
          <img v-if="iconDraft.url" :src="iconDraft.url" alt="icon 预览">
          <span v-else>尚未插入图片</span>
        </button>
        <div>
          <el-button @click="$refs.iconFile.click()">插入图片</el-button>
          <p class="maker-file">{{ iconDraft.name || '支持 jpg / png / gif，过大过小都会自动调整' }}</p>
          <input ref="iconFile" hidden type="file" accept="image/png,image/jpeg,image/gif" @change="onIconFile">
        </div>
      </div>
      <template slot="footer">
        <el-button @click="iconMakerVisible = false">取消</el-button>
        <el-button :disabled="!iconDraft.url" @click="viewMakerIcon">放大查看</el-button>
        <el-button type="primary" :disabled="!iconDraft.url" @click="applyMakerIcon">应用到入口</el-button>
      </template>
    </el-dialog>

    <asset-viewer :visible.sync="assetViewer.visible" :src="assetViewer.src" :title="assetViewer.title" @download="downloadFromViewer" />
  </section>
</template>

<script>
import AssetViewer from '../components/AssetViewer.vue'
import assetPreview from '../mixins/assetPreview'

export default {
  name: 'AiTools',
  components: { AssetViewer },
  mixins: [assetPreview],
  data: () => ({
    keyword: '',
    status: 'ON',
    dialog: false,
    panel: 'edit',
    current: null,
    draft: {},
    newQuestion: '',
    questions: ['拍道题，帮我解', '帮我分析这道题', '帮我看看这个病理图', '这道笔试题怎么做？'],
    marketing: '免费',
    marketingPeriod: [],
    iconMakerVisible: false,
    iconTarget: null,
    iconDraft: { url: '', name: '' },
    rows: [
      ['医学知识问答', '面向医学知识场景的智能问答入口'],
      ['拍照解题', '拍摄医学试题后识别并辅助解析'],
      ['技能手册', '查看缝合、穿刺、急救等技能内容'],
      ['写简历', '辅助整理医学岗位求职简历'],
      ['找工作', '匹配医学岗位与招聘信息'],
      ['调剂查询', '查询医学考研调剂相关信息']
    ].map((x, i) => ({ id: [25, 24, 20, 18, 23, 19][i], order: i, name: x[0], desc: x[1], free: 3, status: 'ON', iconUrl: '' }))
  }),
  computed: {
    visible () {
      const q = this.keyword.toLowerCase()
      return this.rows.filter(x => (this.status === 'ALL' || x.status === this.status) && (!q || (x.name + x.id).toLowerCase().includes(q)))
    },
    dialogTitle () {
      return this.panel === 'edit' ? '编辑 AI 工具' : `${this.current ? this.current.name : ''} · 运营配置`
    }
  },
  methods: {
    toolIconSrc (item) {
      return item.iconUrl || this.letterIconDataUrl(item.name[0])
    },
    openIconMaker (item) {
      this.iconTarget = item
      this.iconDraft = { url: item.iconUrl || '', name: item.iconUrl ? '当前已有图标' : '' }
      this.iconMakerVisible = true
    },
    async onIconFile (event) {
      const file = event.target.files && event.target.files[0]
      event.target.value = ''
      if (!file) return
      try {
        this.iconDraft = { url: await this.fitImageFileToSquare(file, 80), name: `${file.name} · 已自动裁成 80×80` }
      } catch (error) {
        this.$message.error('图片读取失败，请换一张再试')
      }
    },
    viewMakerIcon () {
      if (!this.iconDraft.url) return
      this.openAssetViewer({ src: this.iconDraft.url, title: this.iconTarget ? this.iconTarget.name : 'icon', filename: `${this.iconTarget ? this.iconTarget.name : 'icon'}.png` })
    },
    applyMakerIcon () {
      if (!this.iconTarget || !this.iconDraft.url) return this.$message.warning('请先插入图片')
      this.iconTarget.iconUrl = this.iconDraft.url
      this.iconMakerVisible = false
      this.$message.success('图标已应用到当前演示入口')
    },
    viewToolIcon (item) {
      this.openAssetViewer({ src: this.toolIconSrc(item), title: `${item.name} 图标`, filename: `${item.name}.png` })
    },
    downloadToolIcon (item) {
      this.downloadAssetSrc(this.toolIconSrc(item), `${item.name}.png`)
    },
    edit (x) {
      this.current = x
      this.draft = { ...x }
      this.panel = 'edit'
      this.dialog = true
    },
    manage (x) {
      this.current = x
      this.panel = 'manage'
      this.dialog = true
    },
    toggle (x) {
      x.status = x.status === 'ON' ? 'OFF' : 'ON'
      this.$message.success('状态已更新')
    },
    addQuestion () {
      if (!this.newQuestion.trim()) return
      this.questions.push(this.newQuestion.trim())
      this.newQuestion = ''
    },
    save () {
      if (this.panel === 'edit') {
        const clash = this.rows.find(x => x !== this.current && x.order === this.draft.order)
        if (clash) return this.$message.warning('该排序已被占用')
        Object.assign(this.current, this.draft)
      }
      this.dialog = false
      this.$message.success('配置已保存')
    }
  }
}
</script>

<style scoped>
.page { max-width: 1280px; margin: auto; }
.page > header, .tools { display: flex; align-items: flex-end; justify-content: space-between; }
.page > header > span { color: var(--muted); }
.tools { justify-content: flex-start; gap: 12px; margin: 24px 0; }
.tools .el-input { width: 320px; }
.list { display: grid; grid-template-columns: repeat(2, minmax(360px, 1fr)); gap: 12px; }
.list article { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; padding: 18px; background: #fff; border-radius: 10px; }
.icon { width: 46px; height: 46px; padding: 0; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 9px; color: #a90a13; background: #fff1f2; font-size: 18px; font-weight: 800; cursor: pointer; }
.icon img { width: 100%; height: 100%; object-fit: cover; }
.info strong, .info span { display: block; }
.info span { color: var(--muted); font-size: 12px; }
.info p { margin: 12px 0; color: #596271; }
.actions { grid-column: 2 / 4; }
.config { display: grid; gap: 10px; }
.config button { padding: 15px; border: 1px solid var(--line); border-radius: 8px; background: #fff; text-align: left; }
.config strong, .config span { display: block; }
.config span { margin-top: 4px; color: var(--muted); }
.sub { display: grid; gap: 10px; margin-top: 16px; }
.sub > div { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; background: #f7f8fa; }
.maker-meta { margin: -4px 0 16px; color: #667085; }
.maker { display: grid; grid-template-columns: 80px 1fr; gap: 18px; align-items: center; }
.icon-preview { width: 80px; height: 80px; padding: 0; overflow: hidden; border: 1px dashed #d7dbe1; border-radius: 12px; background: #f7f8fa; cursor: pointer; }
.icon-preview img { width: 100%; height: 100%; object-fit: cover; }
.icon-preview span { display: block; padding: 8px; color: #667085; font-size: 11px; line-height: 1.4; }
.maker-file { margin: 10px 0 0; color: #667085; font-size: 12px; }
</style>
