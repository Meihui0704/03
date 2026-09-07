<template>
  <el-dialog
    :title="title || '完整查看'"
    :visible="visible"
    width="760px"
    append-to-body
    custom-class="asset-viewer-dialog"
    @close="$emit('update:visible', false)"
  >
    <div class="stage">
      <img v-if="src" :src="src" :alt="title || '完整图片'">
      <p v-else>暂无可查看的图片</p>
    </div>
    <template slot="footer">
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button type="primary" :disabled="!src" @click="$emit('download')">下载</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'AssetViewer',
  props: {
    visible: { type: Boolean, default: false },
    src: { type: String, default: '' },
    title: { type: String, default: '完整查看' }
  }
}
</script>

<style scoped>
.stage {
  display: grid;
  place-items: center;
  min-height: 360px;
  padding: 16px;
  border-radius: 10px;
  background: #11161d;
}
.stage img {
  max-width: 100%;
  max-height: min(70vh, 640px);
  object-fit: contain;
}
.stage p {
  color: #c5cbd3;
}
</style>
