<template>
  <section class="catalog-page">
    <header class="page-head">
      <div>
        <div class="breadcrumb"><span>商品与营销</span><i class="el-icon-arrow-right" />{{ title }}</div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-description">{{ description }}</p>
      </div>
      <el-button v-if="clinicalOnly" @click="$router.push('/business-lines')">查看全部项目</el-button>
      <el-button v-else @click="$router.push('/clinical-products')">进入临床商品清单</el-button>
    </header>

    <template v-if="!clinicalOnly">
      <div class="scope-overview">
        <div><strong>13</strong><span>业务项目</span></div>
        <div><strong>{{ professionTotal }}</strong><span>专业与考试方向</span></div>
        <div><strong>{{ selectedProfessions.length }}</strong><span>当前已选</span></div>
      </div>
      <div class="workspace-panel">
        <ProfessionTree v-model="selectedProfessions" />
      </div>
      <div :class="['selection-dock', { visible: selectedProfessions.length }]">
        <div><span>已选范围</span><strong>{{ selectedProfessions.length }} 个专业</strong><small>{{ selectedProjects.join('、') }}</small></div>
        <div class="dock-actions">
          <el-button @click="go('coupon-tasks')">配置优惠券</el-button>
          <el-button @click="go('product-price')">商品批量调价</el-button>
          <el-button type="primary" @click="go('course-shelf')">商品课程上下架</el-button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="filter-panel">
        <div class="filter-row">
          <span class="filter-label">适用专业</span>
          <el-checkbox-group v-model="clinicalScope">
            <el-checkbox-button v-for="item in clinicalProfessionOptions" :key="item" :label="item">{{ item }}</el-checkbox-button>
          </el-checkbox-group>
        </div>
        <div class="filter-row product-filters">
          <span class="filter-label">查找商品</span>
          <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索商品名称" />
          <el-select v-model="ownerFilter" placeholder="全部归属"><el-option label="全部归属" value="ALL" /><el-option v-for="item in clinicalGroups" :key="item.owner" :label="item.ownerShort" :value="item.owner" /></el-select>
          <el-select v-model="statusFilter" placeholder="全部状态"><el-option label="全部状态" value="ALL" /><el-option label="已上架" value="ON" /><el-option label="已下架" value="OFF" /></el-select>
          <el-button @click="selectVisible">全选当前结果</el-button>
        </div>
      </div>

      <div v-if="selectedProducts.length" class="selected-line">
        <span>已选 <strong>{{ selectedProducts.length }}</strong> 个商品</span>
        <el-button type="text" @click="selectedProducts=[]">清空已选</el-button>
      </div>

      <div class="clinical-list">
        <section v-for="block in filteredClinicalGroups" :key="block.owner" class="owner-section">
          <header class="owner-head">
            <div><h2>{{ block.ownerLabel }}</h2><span>{{ block.categories.reduce((sum, item) => sum + item.products.length, 0) }} 个商品</span></div>
            <el-tag size="small" :type="ownerApplicable(block.owner) ? ownerTagType(block.owner) : 'info'">{{ ownerApplicable(block.owner) ? block.ownerShort : '当前专业不适用' }}</el-tag>
          </header>
          <div v-for="category in block.categories" :key="category.name" class="clinical-category">
            <div class="category-label">
              <strong>{{ category.name }}</strong><span>{{ category.products.length }} 个</span>
              <el-button type="text" size="small" @click="toggleClinicalCategory(category)">{{ category.products.every(item => selectedProducts.includes(item.id)) ? '取消整类' : '选择整类' }}</el-button>
            </div>
            <label v-for="product in category.products" :key="product.id" :class="['clinical-row', { selected: selectedProducts.includes(product.id), unavailable: !productApplicable(product) }]">
              <el-checkbox :value="selectedProducts.includes(product.id)" :aria-label="`选择${product.name}`" @change="toggleProduct(product.id, $event)" />
              <span class="course-name">{{ product.name }}</span>
              <span class="price">¥{{ product.price }}</span>
              <span :class="['state', product.status === 'ON' ? 'on' : 'off']">{{ product.status === 'ON' ? '已上架' : '已下架' }}</span>
            </label>
          </div>
        </section>
        <el-empty v-if="!filteredClinicalGroups.length" :image-size="72" description="没有找到匹配的临床商品" />
      </div>

      <ImpactSummary
        :impact="clinicalImpact"
        :selected-product-count="selectedProducts.length"
        :selected-profession-count="clinicalScope.length"
        action-text="后续操作"
        @clear-mismatch="clearClinicalMismatch"
      />

      <div :class="['selection-dock', { visible: selectedProducts.length }]">
        <div><span>已选商品</span><strong>{{ selectedProducts.length }} 个</strong><small>{{ clinicalScope.join('、') || '尚未选择专业' }}</small></div>
        <div class="dock-actions">
          <el-button @click="goClinical('coupon-tasks')">配置优惠券</el-button>
          <el-button @click="goClinical('product-price')">商品批量调价</el-button>
          <el-button type="primary" @click="goClinical('course-shelf')">商品课程上下架</el-button>
        </div>
      </div>
    </template>
  </section>
</template>

<script>
import ProfessionTree from '../components/ProfessionTree.vue'
import ImpactSummary from '../components/ImpactSummary.vue'
import { taxonomy, clinicalGroups, clinicalProducts, getImpact, saveTransfer } from '../data/phase1Business'

export default {
  name: 'ProductCatalog',
  components: { ProfessionTree, ImpactSummary },
  props: { clinicalOnly: Boolean },
  data () {
    return {
      taxonomy,
      clinicalGroups,
      selectedProfessions: [],
      clinicalScope: ['临床执业医师', '临床助理医师'],
      selectedProducts: [],
      keyword: '',
      ownerFilter: 'ALL',
      statusFilter: 'ALL'
    }
  },
  computed: {
    title () { return this.clinicalOnly ? '临床商品清单' : '全部项目清单' },
    description () { return this.clinicalOnly ? '按“共用 / 执业专属 / 助理专属”查看商品，并带入后续运营操作。' : '先从 13 个业务项目中确定操作范围，再进入优惠券、上下架或调价。' },
    professionTotal () { return this.taxonomy.reduce((total, category) => total + category.groups.reduce((sum, group) => sum + group.items.length, 0), 0) },
    selectedProjects () { return Array.from(new Set(this.selectedProfessions.map(id => id.split('::')[0]))) },
    clinicalProfessionOptions () { return ['临床执业医师', '临床助理医师'] },
    clinicalProfessionIds () { return this.clinicalScope.map(item => `临床::${item}`) },
    filteredClinicalGroups () {
      const term = this.keyword.toLowerCase()
      return this.clinicalGroups.map(block => ({
        ...block,
        categories: block.categories.map(category => ({
          ...category,
          products: category.products.filter(product =>
            (this.ownerFilter === 'ALL' || product.owner === this.ownerFilter) &&
            (this.statusFilter === 'ALL' || product.status === this.statusFilter) &&
            (!term || product.name.toLowerCase().includes(term))
          )
        })).filter(category => category.products.length)
      })).filter(block => block.categories.length)
    },
    visibleClinicalIds () { return this.filteredClinicalGroups.reduce((ids, block) => ids.concat(block.categories.reduce((items, category) => items.concat(category.products.map(item => item.id)), [])), []) },
    clinicalImpact () { return getImpact(this.selectedProducts, this.clinicalProfessionIds, clinicalProducts) }
  },
  watch: {
    clinicalScope (value) {
      if (!value.length) this.$message.warning('至少保留一个适用专业，后续操作才会生效')
    }
  },
  methods: {
    ownerTagType (owner) { return owner === 'shared' ? 'success' : owner === 'exec' ? '' : 'warning' },
    ownerApplicable (owner) { return owner === 'shared' ? this.clinicalScope.length > 0 : owner === 'exec' ? this.clinicalScope.includes('临床执业医师') : this.clinicalScope.includes('临床助理医师') },
    productApplicable (product) { return product.scope.some(item => this.clinicalScope.includes(item)) },
    toggleProduct (id, checked) { this.selectedProducts = checked ? Array.from(new Set(this.selectedProducts.concat(id))) : this.selectedProducts.filter(item => item !== id) },
    toggleClinicalCategory (category) {
      const ids = category.products.map(item => item.id)
      const all = ids.every(id => this.selectedProducts.includes(id))
      this.selectedProducts = all ? this.selectedProducts.filter(id => !ids.includes(id)) : Array.from(new Set(this.selectedProducts.concat(ids)))
    },
    selectVisible () { this.selectedProducts = Array.from(new Set(this.selectedProducts.concat(this.visibleClinicalIds))); this.$message.success(`已选择当前 ${this.visibleClinicalIds.length} 个结果`) },
    clearClinicalMismatch () {
      const mismatchNames = this.clinicalImpact.mismatched.map(item => item.name)
      this.clinicalScope = this.clinicalScope.filter(item => !mismatchNames.includes(item))
    },
    go (routeName) {
      if (!this.selectedProfessions.length) return this.$message.warning('请先选择至少一个专业')
      saveTransfer({ source: '全部项目清单', professions: this.selectedProfessions, products: [] })
      this.$router.push({ name: routeName })
    },
    goClinical (routeName) {
      if (!this.selectedProducts.length) return this.$message.warning('请先选择至少一个商品')
      if (!this.clinicalScope.length) return this.$message.warning('请先选择适用专业')
      if (!this.clinicalImpact.combinationCount) return this.$message.error('已选商品与专业没有可生效的组合，请调整后再继续')
      saveTransfer({ source: '临床商品清单', professions: this.clinicalProfessionIds, products: this.selectedProducts })
      this.$router.push({ name: routeName })
    }
  }
}
</script>

<style scoped>
.catalog-page{max-width:1440px;margin:0 auto;padding-bottom:92px}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}.breadcrumb{margin-bottom:10px;color:#8a919e;font-size:12px}.breadcrumb span{color:#5f6876}.breadcrumb i{margin:0 7px}.scope-overview{display:flex;gap:0;margin-bottom:16px;background:#fff;border-radius:10px}.scope-overview>div{display:flex;align-items:baseline;gap:8px;min-width:180px;padding:17px 22px}.scope-overview>div+div{border-left:1px solid var(--line)}.scope-overview strong{font-size:22px;font-variant-numeric:tabular-nums}.scope-overview span{color:var(--muted)}.workspace-panel,.filter-panel,.clinical-list{background:#fff;border-radius:10px}.workspace-panel{padding:22px}.filter-panel{padding:18px 20px;margin-bottom:14px}.filter-row{display:flex;align-items:center;gap:14px}.filter-row+.filter-row{margin-top:14px}.filter-label{width:72px;color:#4d5665;font-weight:600}.product-filters .el-input{width:340px}.product-filters .el-select{width:150px}.selected-line{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 18px;margin-bottom:12px;background:#fff7f7;border-radius:8px;color:#4d5665}.clinical-list{padding:0 20px;margin-bottom:16px}.owner-section+.owner-section{border-top:8px solid var(--canvas)}.owner-head{display:flex;align-items:center;justify-content:space-between;min-height:68px;border-bottom:1px solid var(--line)}.owner-head div{display:flex;align-items:baseline;gap:10px}.owner-head h2{margin:0;font-size:17px}.owner-head span{color:var(--muted);font-size:12px}.clinical-category{padding:14px 0}.clinical-category+.clinical-category{border-top:1px solid var(--line)}.category-label{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 10px}.category-label span{color:var(--muted);font-size:12px}.category-label .el-button{margin-left:auto}.clinical-row{display:flex;align-items:center;min-height:48px;gap:12px;padding:7px 10px;border-radius:7px;cursor:pointer}.clinical-row:hover{background:#f7f8fa}.clinical-row.selected{background:#fff5f5}.clinical-row.unavailable{opacity:.52}.course-name{flex:1}.price{width:90px;text-align:right;font-variant-numeric:tabular-nums}.state{width:64px;font-size:12px}.state:before{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;content:''}.state.on{color:var(--success)}.state.on:before{background:var(--success)}.state.off{color:#7a8492}.state.off:before{background:#9aa2ad}.selection-dock{position:fixed;right:32px;bottom:24px;left:calc(224px + 32px);z-index:var(--z-sticky,30);display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 18px;border:1px solid #dfe3e8;border-radius:10px;background:#fff;box-shadow:0 4px 8px rgba(32,36,43,.1);opacity:0;pointer-events:none;transform:translateY(12px);transition:opacity .18s ease,transform .18s ease}.selection-dock.visible{opacity:1;pointer-events:auto;transform:none}.selection-dock>div:first-child{display:flex;align-items:baseline;gap:10px}.selection-dock span,.selection-dock small{color:var(--muted)}.selection-dock small{max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dock-actions{display:flex;gap:8px}.catalog-page ::v-deep .el-button--text{color:#a90a13}@media(max-width:900px){.page-head{align-items:flex-start;flex-direction:column}.scope-overview{overflow:auto}.filter-row{align-items:flex-start;flex-direction:column}.filter-label{width:auto}.product-filters .el-input,.product-filters .el-select{width:100%}.selection-dock{right:12px;bottom:12px;left:12px;align-items:flex-start;flex-direction:column}.dock-actions{width:100%;overflow:auto}.selection-dock>div:first-child{align-items:flex-start;flex-direction:column;gap:2px}}
</style>
