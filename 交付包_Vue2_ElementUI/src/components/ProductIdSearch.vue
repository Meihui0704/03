<template>
  <div class="product-id-search">
    <input
      v-model.trim="keyword"
      class="control"
      :placeholder="placeholder"
      :aria-label="placeholder"
    >
    <p v-if="picked" class="picked">已选 <strong>ID {{ picked.id }}</strong> {{ picked.name }}<button type="button" class="text-btn" @click="clear">重选</button></p>
    <ul v-else class="hits" role="listbox">
      <li v-for="item in hits" :key="item.id">
        <button type="button" @click="pick(item)">
          <strong>ID {{ item.id }}</strong>
          <span>{{ item.name }}</span>
          <small>{{ item.project }} · 覆盖 {{ (item.scope || []).length }} 个专业</small>
        </button>
      </li>
      <li v-if="keyword && !hits.length" class="empty">没有匹配的班型。可以换个常用名再搜；商品 ID 也能搜到。</li>
      <li v-else-if="!keyword" class="empty">输入班型名称搜索，和现在习惯一样。选定后会保存商品 ID。</li>
    </ul>
  </div>
</template>

<script>
import { allOperationProducts, matchesProductKeyword } from '../data/phase1Business'

export default {
  name: 'ProductIdSearch',
  props: {
    productId: { type: [String, Number], default: '' },
    productName: { type: String, default: '' },
    placeholder: { type: String, default: '搜索班型名称，如密训班' }
  },
  data () {
    return { keyword: '' }
  },
  computed: {
    picked () {
      const id = this.productId === 0 || this.productId ? String(this.productId) : ''
      if (!id) return null
      const found = allOperationProducts.find(item => String(item.id) === id)
      return { id, name: (found && found.name) || this.productName }
    },
    hits () {
      if (this.picked) return []
      const term = this.keyword.trim()
      if (!term) return []
      return allOperationProducts.filter(item => matchesProductKeyword(item, term)).slice(0, 12)
    }
  },
  methods: {
    pick (item) {
      this.keyword = ''
      this.$emit('select', { id: String(item.id), name: item.name })
    },
    clear () {
      this.keyword = ''
      this.$emit('select', { id: '', name: '' })
    }
  }
}
</script>

<style scoped>
.product-id-search{width:100%}
.picked{display:flex;align-items:center;gap:8px;margin:8px 0 0;padding:8px 10px;border:1px solid #cfe4da;border-radius:8px;background:#f3faf6;color:#166350;font-size:13px}
.picked strong{font-variant-numeric:tabular-nums}
.text-btn{margin-left:auto;border:0;background:transparent;color:#a90a13;font-weight:700;cursor:pointer}
.hits{margin:8px 0 0;padding:0;max-height:220px;overflow:auto;border:1px solid #e6e8ec;border-radius:8px;list-style:none;background:#fff}
.hits button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:8px 10px;border:0;border-bottom:1px solid #f0f2f4;background:#fff;text-align:left;cursor:pointer}
.hits button:hover{background:#fafafa}
.hits strong{font-size:12px;color:#5d6470}
.hits span{font-weight:600;color:#20242c}
.hits small{color:#8a919e;font-size:11px}
.empty{padding:10px 12px;color:#667085;font-size:12px;line-height:1.5}
.control{width:100%;min-height:40px;padding:8px 12px;border:1px solid #d7dbe1;border-radius:7px;font:inherit}
</style>
