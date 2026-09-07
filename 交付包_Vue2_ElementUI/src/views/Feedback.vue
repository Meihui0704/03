<template>
  <section class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">意见反馈管理</h1>
        <p class="page-description">先把未处理和已处理分开看，不必先选状态再查询。列表里仍保留待处理、处理中、已回复、已关闭四档，接入后按后台原状态落库。</p>
      </div>
    </header>

    <div class="status-row">
      <el-radio-group v-model="bucket" size="medium" @change="detailStatus = 'ALL'">
        <el-radio-button label="OPEN">未处理 {{ openCount }}</el-radio-button>
        <el-radio-button label="DONE">已处理 {{ doneCount }}</el-radio-button>
        <el-radio-button label="ALL">全部 {{ rows.length }}</el-radio-button>
      </el-radio-group>
      <el-radio-group v-if="bucket !== 'ALL'" v-model="detailStatus" size="small">
        <el-radio-button label="ALL">{{ bucket === 'OPEN' ? '未处理全部' : '已处理全部' }}</el-radio-button>
        <el-radio-button v-for="item in bucketStates" :key="item" :label="item">{{ item }}</el-radio-button>
      </el-radio-group>
      <span class="result-count">当前 {{ visible.length }} 条</span>
    </div>

    <div class="filters">
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索反馈内容或 ID" />
    </div>

    <el-table :data="visible" empty-text=" ">
      <el-table-column prop="id" label="反馈 ID" width="100" />
      <el-table-column prop="content" label="反馈内容" min-width="320" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="platform" label="平台" width="100" />
      <el-table-column prop="user" label="用户" width="130" />
      <el-table-column prop="time" label="反馈时间" width="170" />
      <el-table-column label="状态" width="110">
        <template slot-scope="s">
          <span class="status" :class="isOpenStatus(s.row.status) ? 'open' : 'done'">{{ s.row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template slot-scope="s">
          <el-button type="text" @click="open(s.row)">查看与回复</el-button>
        </template>
      </el-table-column>
    </el-table>
    <p v-if="!visible.length" class="empty">{{ emptyText }}</p>

    <el-dialog title="处理用户反馈" :visible.sync="dialog" width="620px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="反馈内容">{{ current.content }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ current.user }}</el-descriptions-item>
        <el-descriptions-item label="平台">{{ current.platform }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-width="90px" class="reply">
        <el-form-item label="处理状态">
          <el-select v-model="draftStatus">
            <el-option v-for="item in states" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="回复用户">
          <el-input v-model="reply" type="textarea" :rows="4" placeholder="输入回复内容" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">保存处理结果</el-button>
      </span>
    </el-dialog>
  </section>
</template>

<script>
const OPEN_STATES = ['待处理', '处理中']
const DONE_STATES = ['已回复', '已关闭']

export default {
  data () {
    return {
      keyword: '',
      bucket: 'OPEN',
      detailStatus: 'ALL',
      dialog: false,
      current: null,
      draftStatus: '待处理',
      reply: '',
      states: OPEN_STATES.concat(DONE_STATES),
      rows: [
        { id: 8052, type: '试题', platform: 'Android', user: '用户 6***8', content: '前几天做的题记录没了，笔记也没有找到。', time: '2026-09-02 21:35', status: '待处理', reply: '' },
        { id: 8051, type: '试题', platform: 'Android', user: '用户 7***0', content: '模拟考试估分结果无法正常显示。', time: '2026-09-02 14:56', status: '待处理', reply: '' },
        { id: 8050, type: '功能', platform: 'iOS', user: '用户 3***0', content: '试卷页面没有显示标题。', time: '2026-09-02 14:04', status: '处理中', reply: '已转技术核对标题字段。' },
        { id: 8048, type: '功能', platform: 'iOS', user: '用户 1***4', content: '课程目录滑动会卡住。', time: '2026-08-28 11:20', status: '已回复', reply: '已在 9.4 版本修复，请更新后重试。' },
        { id: 8046, type: '账号', platform: 'Android', user: '用户 9***2', content: '重复提交的登录问题。', time: '2026-08-21 09:08', status: '已关闭', reply: '重复工单，已与 8031 合并关闭。' }
      ]
    }
  },
  computed: {
    openCount () { return this.rows.filter(row => this.isOpenStatus(row.status)).length },
    doneCount () { return this.rows.filter(row => !this.isOpenStatus(row.status)).length },
    bucketStates () { return this.bucket === 'DONE' ? DONE_STATES : OPEN_STATES },
    visible () {
      const query = this.keyword.toLowerCase()
      return this.rows.filter(row => {
        if (this.bucket === 'OPEN' && !this.isOpenStatus(row.status)) return false
        if (this.bucket === 'DONE' && this.isOpenStatus(row.status)) return false
        if (this.detailStatus !== 'ALL' && row.status !== this.detailStatus) return false
        if (query && !`${row.content} ${row.id}`.toLowerCase().includes(query)) return false
        return true
      })
    },
    emptyText () {
      if (this.keyword) return '没有匹配的反馈，换个关键词试试。'
      if (this.bucket === 'OPEN') return '当前没有未处理反馈。可切换到「已处理」查看已回复或已关闭的记录。'
      if (this.bucket === 'DONE') return '当前没有已处理反馈。未处理的记录在「未处理」里。'
      return '暂时没有反馈记录。'
    }
  },
  methods: {
    isOpenStatus (status) { return OPEN_STATES.includes(status) },
    open (row) {
      this.current = row
      this.draftStatus = row.status
      this.reply = row.reply
      this.dialog = true
    },
    save () {
      if (this.draftStatus === '已回复' && !this.reply.trim()) {
        return this.$message.warning('状态为「已回复」时必须填写回复内容')
      }
      const wasOpen = this.isOpenStatus(this.current.status)
      const nextOpen = this.isOpenStatus(this.draftStatus)
      Object.assign(this.current, { status: this.draftStatus, reply: this.reply })
      this.dialog = false
      if (wasOpen && !nextOpen) this.$message.success('已移入「已处理」，可随时切过去查看')
      else if (!wasOpen && nextOpen) this.$message.success('已移回「未处理」')
      else this.$message.success('处理结果已保存')
    }
  }
}
</script>

<style scoped>
.page{max-width:1440px;margin:auto}
.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.status-row{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:22px 0 12px}
.result-count{margin-left:auto;color:var(--muted);font-size:13px}
.filters{display:flex;gap:12px;margin:0 0 16px}
.filters .el-input{width:360px}
.status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap}
.status:before{width:7px;height:7px;border-radius:50%;background:currentColor;content:""}
.status.open{background:#fff6dc;color:#8a5a00}
.status.done{background:#eaf6f1;color:#147a62}
.empty{padding:40px 20px;color:var(--muted);text-align:center}
.reply{margin-top:20px}
@media(max-width:900px){.result-count{margin-left:0}.filters .el-input{width:100%}}
</style>
