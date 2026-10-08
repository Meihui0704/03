<template>
  <section class="product-picker" aria-labelledby="product-picker-title">
    <div class="picker-head">
      <div>
        <h3 id="product-picker-title">商品课程</h3>
        <p>按班型名称查找，和现在习惯一样。选中后带商品 ID。中级职称这种多专业班型，才能看出一次勾选的优势。</p>
      </div>
      <el-button type="primary" plain icon="el-icon-plus" @click="addVisible = true">新增商品</el-button>
    </div>

    <div class="product-toolbar">
      <el-radio-group v-model="source" size="small">
        <el-radio-button label="ALL">全部（{{ products.length }}）</el-radio-button>
        <el-radio-button label="中级职称">中级职称（{{ middleCount }}）</el-radio-button>
        <el-radio-button label="临床">临床（{{ clinicalCount }}）</el-radio-button>
      </el-radio-group>
      <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索班型名称" aria-label="搜索班型名称" />
    </div>

    <div v-if="value.length" class="selected-bar">
      <span>已选 <strong>{{ value.length }}</strong> 个商品</span>
      <el-button type="text" @click="emitValue([])">清空已选</el-button>
    </div>

    <div class="product-list">
      <div v-for="group in groupedProducts" :key="group.key" class="product-group">
        <div class="group-title-row">
          <div><strong>{{ group.project }} · {{ group.category }}</strong><span>{{ group.items.length }} 个</span></div>
          <el-button type="text" size="small" @click="toggleGroup(group)">{{ group.items.every(item => value.includes(item.id)) ? '取消整组' : '选择整组' }}</el-button>
        </div>
        <label v-for="product in group.items" :key="product.id" :class="['product-row', { selected: value.includes(product.id) }]">
          <el-checkbox :value="value.includes(product.id)" :aria-label="`选择${product.name}`" @change="toggleProduct(product.id, $event)" />
          <span class="product-name"><small class="product-id">ID {{ product.id }}</small>{{ product.name }}</span>
          <span class="product-meta">{{ product.ownerLabel || `覆盖 ${product.scope.length} 个专业` }}</span>
          <span v-if="product.price !== null" class="product-price">¥{{ product.price }}</span>
          <span :class="['status-dot', product.status === 'ON' ? 'on' : 'off']">{{ product.status === 'ON' ? '已上架' : '已下架' }}</span>
          <el-button type="text" class="remove" aria-label="移除商品" @click.prevent.stop="removeProduct(product)">移除</el-button>
        </label>
      </div>
      <el-empty v-if="!groupedProducts.length" :image-size="64" description="没有找到匹配的商品" />
    </div>

    <el-dialog title="新增商品" :visible.sync="addVisible" width="520px" append-to-body @closed="resetAddForm">
      <el-form ref="addForm" :model="newProduct" :rules="addRules" label-width="90px">
        <el-form-item label="商品名称" prop="name"><el-input v-model.trim="newProduct.name" maxlength="50" show-word-limit /></el-form-item>
        <el-form-item label="商品分组" prop="category"><el-select v-model="newProduct.category" style="width:100%"><el-option v-for="item in middleCategories" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item label="商品价格"><el-input v-model.trim="newProduct.price" placeholder="一次填好价格" /></el-form-item>
        <el-alert type="info" :closable="false" show-icon title="新增商品默认覆盖 19 个中级职称专业，保存时仍会执行覆盖校验。" />
      </el-form>
      <span slot="footer"><el-button @click="addVisible=false">取消</el-button><el-button type="primary" @click="addProduct">确认新增</el-button></span>
    </el-dialog>
  </section>
</template>

<script>
import { allOperationProducts, matchesProductKeyword, zzzcScope } from '../data/phase1Business'

export default {
  name: 'ProductPicker',
  props: { value: { type: Array, default: () => [] } },
  data () {
    return {
      products: allOperationProducts.map(item => ({ ...item, scope: item.scope.slice() })),
      source: 'ALL',
      keyword: '',
      addVisible: false,
      middleCategories: ['刷题必买', '高端进阶', '高分密训', '基础夯实'],
      newProduct: { name: '', category: '刷题必买', price: '' },
      addRules: { name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }], category: [{ required: true, message: '请选择商品分组', trigger: 'change' }] }
    }
  },
  computed: {
    middleCount () { return this.products.filter(item => item.project === '中级职称').length },
    clinicalCount () { return this.products.filter(item => item.project === '临床').length },
    filteredProducts () {
      const term = this.keyword.toLowerCase()
      return this.products.filter(item => (this.source === 'ALL' || item.project === this.source) && matchesProductKeyword(item, term))
    },
    groupedProducts () {
      const groups = []
      this.filteredProducts.forEach(item => {
        const key = `${item.project}::${item.owner || ''}::${item.category}`
        let group = groups.find(current => current.key === key)
        if (!group) {
          group = { key, project: item.project, category: item.ownerLabel ? `${item.ownerLabel} · ${item.category}` : item.category, items: [] }
          groups.push(group)
        }
        group.items.push(item)
      })
      return groups
    }
  },
  methods: {
    emitValue (value) { this.$emit('input', value); this.$emit('change', value, this.products.filter(item => value.includes(item.id))) },
    toggleProduct (id, checked) { this.emitValue(checked ? Array.from(new Set(this.value.concat(id))) : this.value.filter(item => item !== id)) },
    toggleGroup (group) {
      const ids = group.items.map(item => item.id)
      const all = ids.every(id => this.value.includes(id))
      this.emitValue(all ? this.value.filter(id => !ids.includes(id)) : Array.from(new Set(this.value.concat(ids))))
    },
    addProduct () {
      this.$refs.addForm.validate(valid => {
        if (!valid) return
        if (this.products.some(item => item.name === this.newProduct.name)) return this.$message.warning('该商品名称已存在，请换一个名称')
        const price = this.newProduct.price === '' ? null : Number(this.newProduct.price)
        if (this.newProduct.price !== '' && (!Number.isFinite(price) || price < 0)) return this.$message.warning('请一次填好 0 或以上的价格')
        const product = {
          id: `zzzc-new-${Date.now()}`,
          name: this.newProduct.name,
          project: '中级职称',
          category: this.newProduct.category,
          scope: zzzcScope.slice(),
          price,
          status: 'OFF',
          source: '中级职称课程库'
        }
        this.products.unshift(product)
        this.emitValue(this.value.concat(product.id))
        this.addVisible = false
        this.$message.success('商品已新增并自动选中')
      })
    },
    removeProduct (product) {
      this.$confirm(`确认从当前商品清单移除「${product.name}」？`, '移除商品', { type: 'warning', confirmButtonText: '确认移除', cancelButtonText: '取消' }).then(() => {
        this.products = this.products.filter(item => item.id !== product.id)
        this.emitValue(this.value.filter(id => id !== product.id))
        this.$message.success('商品已移除')
      }).catch(() => {})
    },
    applyStatus (ids, status) {
      this.products = this.products.map(item => ids.includes(item.id) ? { ...item, status } : item)
      this.$emit('change', this.value, this.products.filter(item => this.value.includes(item.id)))
    },
    applyPrice (ids, calculator) {
      this.products = this.products.map(item => ids.includes(item.id) && typeof item.price === 'number' ? { ...item, price: calculator(item.price) } : item)
      this.$emit('change', this.value, this.products.filter(item => this.value.includes(item.id)))
    },
    resetAddForm () { this.newProduct = { name: '', category: '刷题必买', price: '' }; if (this.$refs.addForm) this.$refs.addForm.clearValidate() }
  }
}
</script>

<style scoped>
.picker-head,.product-toolbar,.selected-bar,.group-title-row,.product-row{display:flex;align-items:center}.picker-head{justify-content:space-between;gap:24px}.picker-head h3{margin:0;font-size:17px}.picker-head p{margin:4px 0 0;color:var(--muted)}.product-toolbar{justify-content:space-between;gap:16px;padding:18px 0 14px}.product-toolbar .el-input{width:260px}.selected-bar{justify-content:space-between;min-height:46px;padding:8px 14px;margin-bottom:12px;background:#f7f8fa;border-radius:8px;color:#4d5665}.product-list{max-height:520px;overflow:auto;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.product-group+.product-group{border-top:1px solid var(--line)}.group-title-row{justify-content:space-between;min-height:44px;padding:0 14px;background:#f7f8fa}.group-title-row strong{font-size:13px}.group-title-row span{margin-left:8px;color:var(--muted);font-size:12px}.product-row{min-height:50px;gap:12px;padding:8px 14px;border-top:1px solid #edf0f2;cursor:pointer}.product-row:hover{background:#fafbfc}.product-row.selected{background:#fff7f7}.product-name{flex:1;min-width:220px;color:#2a3038;display:flex;flex-direction:column;gap:2px}.product-id{color:#8a919e;font-size:11px;font-weight:700}.product-meta{width:120px;color:var(--muted);font-size:12px}.product-price{width:80px;text-align:right;font-variant-numeric:tabular-nums}.status-dot{width:64px;font-size:12px}.status-dot:before{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;content:''}.status-dot.on{color:var(--success)}.status-dot.on:before{background:var(--success)}.status-dot.off{color:#7a8492}.status-dot.off:before{background:#9aa2ad}.remove{color:#b4232c}.product-picker ::v-deep .el-button--text{color:#a90a13}@media(max-width:900px){.product-toolbar{align-items:stretch;flex-direction:column}.product-toolbar .el-input{width:100%}.product-row{align-items:flex-start;flex-wrap:wrap}.product-name{flex-basis:calc(100% - 40px)}.product-meta{margin-left:30px}}
</style>
