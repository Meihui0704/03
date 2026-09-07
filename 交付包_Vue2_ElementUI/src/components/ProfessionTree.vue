<template>
  <section class="profession-picker" aria-labelledby="profession-picker-title">
    <div class="picker-toolbar">
      <div>
        <h3 id="profession-picker-title">项目与专业范围</h3>
        <p>按项目展开选择；有科室分组的项目可整组勾选。</p>
      </div>
      <div class="toolbar-actions">
        <el-input v-model.trim="keyword" clearable prefix-icon="el-icon-search" placeholder="搜索项目或专业" aria-label="搜索项目或专业" />
        <el-button size="small" @click="expandAll">全部展开</el-button>
        <el-button size="small" @click="collapseAll">全部收起</el-button>
      </div>
    </div>

    <div v-if="value.length" class="selection-toolbar">
      <span>已选 <strong>{{ value.length }}</strong> 个专业，覆盖 <strong>{{ selectedCategoryCount }}</strong> 个项目</span>
      <div>
        <el-button v-if="mismatchIds.length" type="text" @click="clearMismatch">清除不适用项（{{ mismatchIds.length }}）</el-button>
        <el-button type="text" @click="clearAll">清空全部</el-button>
      </div>
    </div>

    <div class="category-list">
      <article v-for="category in filteredTaxonomy" :key="category.name" class="category-section">
        <div class="category-header" @click="toggleOpen(category.name)">
          <el-checkbox
            :value="isCategoryAllSelected(category)"
            :indeterminate="isCategoryIndeterminate(category)"
            :aria-label="`选择${category.name}全部专业`"
            @click.native.stop
            @change="toggleCategory(category, $event)"
          />
          <button type="button" class="category-title" :aria-expanded="isOpen(category.name)" @click.stop="toggleOpen(category.name)">
            <strong>{{ category.name }}</strong>
            <span>{{ categoryTotal(category) }} 个专业</span>
            <em v-if="categorySelected(category)">已选 {{ categorySelected(category) }}</em>
          </button>
          <i :class="['el-icon-arrow-down', { open: isOpen(category.name) }]" aria-hidden="true" />
        </div>

        <div v-show="isOpen(category.name)" class="category-body">
          <div v-for="group in category.groups" :key="group.name || category.name" class="profession-group">
            <div v-if="group.name" class="group-head">
              <span>{{ group.name }} · {{ group.items.length }}</span>
              <el-button type="text" size="small" @click="toggleGroup(category, group)">{{ isGroupAllSelected(category, group) ? '取消整组' : '选择整组' }}</el-button>
            </div>
            <el-checkbox-group :value="value" class="profession-options" @input="emitValue">
              <el-checkbox
                v-for="item in group.items"
                :key="item"
                :label="makeId(category.name, item)"
                :class="{ mismatch: isMismatch(makeId(category.name, item)) }"
              >
                <span>{{ item }}</span>
                <small v-if="isMismatch(makeId(category.name, item))">所选商品不覆盖</small>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </article>
    </div>

    <el-empty v-if="!filteredTaxonomy.length" :image-size="64" description="没有找到匹配的项目或专业" />
  </section>
</template>

<script>
import { taxonomy, professionName } from '../data/phase1Business'

export default {
  name: 'ProfessionTree',
  props: {
    value: { type: Array, default: () => [] },
    selectedProducts: { type: Array, default: () => [] }
  },
  data () {
    return {
      taxonomy,
      keyword: '',
      opened: ['中级职称']
    }
  },
  computed: {
    filteredTaxonomy () {
      const term = this.keyword.toLowerCase()
      if (!term) return this.taxonomy
      return this.taxonomy.map(category => ({
        ...category,
        groups: category.groups.map(group => ({
          ...group,
          items: group.items.filter(item => category.name.toLowerCase().includes(term) || item.toLowerCase().includes(term))
        })).filter(group => group.items.length)
      })).filter(category => category.groups.length)
    },
    selectedCategoryCount () {
      return new Set(this.value.map(id => id.split('::')[0])).size
    },
    mismatchIds () {
      if (!this.selectedProducts.length) return []
      return this.value.filter(id => !this.selectedProducts.some(product => !product.scope || product.scope.includes(professionName(id))))
    }
  },
  watch: {
    keyword (value) {
      if (value) this.opened = this.filteredTaxonomy.map(item => item.name)
    }
  },
  methods: {
    makeId (category, item) { return `${category}::${item}` },
    categoryIds (category) { return category.groups.reduce((ids, group) => ids.concat(group.items.map(item => this.makeId(category.name, item))), []) },
    categoryTotal (category) { return category.groups.reduce((sum, group) => sum + group.items.length, 0) },
    categorySelected (category) { const ids = this.categoryIds(category); return ids.filter(id => this.value.includes(id)).length },
    isCategoryAllSelected (category) { const ids = this.categoryIds(category); return ids.length > 0 && ids.every(id => this.value.includes(id)) },
    isCategoryIndeterminate (category) { const count = this.categorySelected(category); return count > 0 && count < this.categoryIds(category).length },
    isGroupAllSelected (category, group) { return group.items.every(item => this.value.includes(this.makeId(category.name, item))) },
    isMismatch (id) { return this.value.includes(id) && this.mismatchIds.includes(id) },
    isOpen (name) { return !!this.keyword || this.opened.includes(name) },
    toggleOpen (name) { this.opened = this.opened.includes(name) ? this.opened.filter(item => item !== name) : this.opened.concat(name) },
    expandAll () { this.opened = this.taxonomy.map(item => item.name) },
    collapseAll () { this.keyword = ''; this.opened = [] },
    emitValue (value) { this.$emit('input', value); this.$emit('change', value) },
    toggleCategory (category, checked) {
      const ids = this.categoryIds(category)
      const next = checked ? Array.from(new Set(this.value.concat(ids))) : this.value.filter(id => !ids.includes(id))
      this.emitValue(next)
    },
    toggleGroup (category, group) {
      const ids = group.items.map(item => this.makeId(category.name, item))
      const all = ids.every(id => this.value.includes(id))
      this.emitValue(all ? this.value.filter(id => !ids.includes(id)) : Array.from(new Set(this.value.concat(ids))))
    },
    clearMismatch () { this.emitValue(this.value.filter(id => !this.mismatchIds.includes(id))) },
    clearAll () { this.emitValue([]) }
  }
}
</script>

<style scoped>
.profession-picker{background:#fff}.picker-toolbar,.selection-toolbar,.category-header,.group-head{display:flex;align-items:center;justify-content:space-between}.picker-toolbar{gap:24px;padding-bottom:18px}.picker-toolbar h3{margin:0;font-size:17px}.picker-toolbar p{margin:4px 0 0;color:var(--muted)}.toolbar-actions{display:flex;align-items:center;gap:8px}.toolbar-actions .el-input{width:230px}.selection-toolbar{min-height:46px;padding:8px 14px;margin-bottom:12px;background:#f7f8fa;border-radius:8px;color:#4d5665}.selection-toolbar strong{color:var(--ink)}.category-list{border-top:1px solid var(--line)}.category-section{border-bottom:1px solid var(--line)}.category-header{min-height:58px;gap:12px;padding:0 14px;cursor:pointer}.category-header:hover{background:#fafbfc}.category-title{display:flex;align-items:center;gap:10px;flex:1;padding:0;border:0;background:none;text-align:left;cursor:pointer}.category-title strong{font-size:15px}.category-title span{color:var(--muted);font-size:12px}.category-title em{padding:2px 8px;border-radius:999px;background:var(--brand-soft);color:#a90a13;font-size:12px;font-style:normal}.el-icon-arrow-down{color:#8a919e;transition:transform .18s ease}.el-icon-arrow-down.open{transform:rotate(180deg)}.category-body{padding:4px 14px 18px 44px;background:#fcfcfd}.profession-group+.profession-group{margin-top:14px}.group-head{min-height:36px;color:#4d5665;font-weight:600}.profession-options{display:flex;flex-wrap:wrap;gap:8px}.profession-options .el-checkbox{display:flex;align-items:center;width:auto;min-height:36px;padding:7px 10px;margin:0;border:1px solid #dfe3e8;border-radius:7px;background:#fff}.profession-options .el-checkbox.is-checked{border-color:#f0a3aa;background:#fff5f5}.profession-options .el-checkbox.mismatch{border-color:#e6a23c;background:#fff8ea}.profession-options small{margin-left:6px;color:#a75b00;font-size:11px}.profession-picker ::v-deep .el-checkbox__label{display:flex;align-items:center;padding-left:7px;color:#303744}.profession-picker ::v-deep .el-checkbox.is-checked .el-checkbox__label{color:#8f1018}.profession-picker ::v-deep .el-button--text{color:#a90a13}@media(max-width:900px){.picker-toolbar{align-items:flex-start;flex-direction:column}.toolbar-actions{width:100%;flex-wrap:wrap}.toolbar-actions .el-input{width:100%}.category-body{padding-left:20px}}
</style>
