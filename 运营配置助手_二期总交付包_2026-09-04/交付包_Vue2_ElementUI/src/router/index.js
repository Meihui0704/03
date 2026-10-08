import Vue from 'vue'
import Router from 'vue-router'
import AdvertisingMaterial from '../../AdvertisingMaterial.vue'
import DiamondZoneManagement from '../../DiamondZoneManagement.vue'
import ModuleWorkspace from '../views/ModuleWorkspace.vue'
import CouponConfig from '../views/CouponConfig.vue'
import ProductOperation from '../views/ProductOperation.vue'
import ProductCatalog from '../views/ProductCatalog.vue'
import AiTools from '../views/AiTools.vue'
import Feedback from '../views/Feedback.vue'
import TrialCourse from '../views/TrialCourse.vue'

Vue.use(Router)

const modulePage = (key, title, description) => ({
  path: `/${key}`,
  name: key,
  component: ModuleWorkspace,
  props: { moduleKey: key, title, description }
})

export default new Router({
  mode: 'hash',
  scrollBehavior () {
    return { x: 0, y: 0 }
  },
  routes: [
    { path: '/', redirect: '/coupon-tasks' },
    { path: '/advertising-material', component: AdvertisingMaterial },
    { path: '/diamond-zone', component: DiamondZoneManagement },
    { path: '/ai-tools', name: 'ai-tools', component: AiTools },
    { path: '/feedback', name: 'feedback', component: Feedback },
    { path: '/trial-course', name: 'trial-course', component: TrialCourse },
    { path: '/coupon-tasks', name: 'coupon-tasks', component: CouponConfig },
    { path: '/coupon-config', redirect: '/coupon-tasks' },
    { path: '/course-shelf', name: 'course-shelf', component: ProductOperation, props: { mode: 'shelf' } },
    { path: '/product-price', name: 'product-price', component: ProductOperation, props: { mode: 'price' } },
    { path: '/business-lines', name: 'business-lines', component: ProductCatalog, props: { clinicalOnly: false } },
    { path: '/clinical-products', name: 'clinical-products', component: ProductCatalog, props: { clinicalOnly: true } }
  ]
})
