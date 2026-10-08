<template>
  <div class="app-shell">
    <header class="topbar">
      <span class="logo">昭</span><strong>运营配置助手</strong><span class="crumb"><i class="el-icon-arrow-right" />{{ currentLabel }}</span>
      <span class="operator">当前操作人：美惠</span>
    </header>
    <div class="body">
      <aside>
        <p class="group-title">运营管理</p>
        <router-link v-for="item in operationMenus" :key="item.path" :to="item.path">{{ item.label }}</router-link>
        <p class="group-title">商品与营销</p>
        <router-link v-for="item in businessMenus" :key="item.path" :to="item.path">{{ item.label }}</router-link>
      </aside>
      <main><router-view :key="$route.fullPath" /></main>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    operationMenus: [
      { label: '广告素材管理', path: '/advertising-material' },
      { label: '金刚区管理', path: '/diamond-zone' },
      { label: 'AI工具集管理', path: '/ai-tools' },
      { label: '意见反馈管理', path: '/feedback' },
      { label: 'App免费体验课管理', path: '/trial-course' },
      { label: 'App优惠券管理', path: '/coupon-tasks' }
    ],
    businessMenus: [
      { label: '全部项目清单', path: '/business-lines' },
      { label: '临床商品清单', path: '/clinical-products' },
      { label: '商品课程上下架', path: '/course-shelf' },
      { label: '商品批量调价', path: '/product-price' }
    ]
  }),
  computed: {
    currentLabel () {
      const match = this.operationMenus.concat(this.businessMenus).find(item => item.path === this.$route.path)
      return match ? match.label : '运营管理'
    }
  }
}
</script>

<style scoped>
.app-shell{min-height:100%}.topbar{position:sticky;top:0;z-index:var(--z-sticky);height:60px;padding:0 24px;display:flex;align-items:center;gap:12px;background:#fff;border-bottom:1px solid var(--line)}.logo{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;color:#fff;background:var(--brand);font-weight:800}.crumb{display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:400}.crumb i{color:#aab0b9;font-size:11px}.operator{margin-left:auto;color:var(--muted);font-size:12px}.body{display:grid;grid-template-columns:224px minmax(0,1fr);min-height:calc(100vh - 60px)}aside{position:sticky;top:60px;height:calc(100vh - 60px);overflow:auto;padding:18px 14px;background:#fbfbfc;border-right:1px solid var(--line)}aside a{display:block;min-height:40px;padding:9px 12px;margin:2px 0;border-radius:7px;color:#596271;text-decoration:none;font-weight:600}aside a:hover{background:#f0f2f4;color:#303744}aside a.router-link-active{color:#a90a13;background:var(--brand-soft)}.group-title{margin:4px 12px 8px;color:#8a919e;font-size:12px;font-weight:700}.group-title:not(:first-child){margin-top:20px}main{min-width:0;padding:28px 32px 56px}@media(max-width:760px){.body{grid-template-columns:1fr}aside{display:none}main{padding:22px 16px}.crumb{display:none}}
</style>
