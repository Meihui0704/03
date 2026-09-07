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
import ProjectManagement from '../views/ProjectManagement.vue'

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
    { path: '/', redirect: '/project-management' },
    { path: '/project-management', name: 'project-management', component: ProjectManagement },
    { path: '/advertising-material', component: AdvertisingMaterial },
    { path: '/diamond-zone', component: DiamondZoneManagement },
    { path: '/ai-tools', name: 'ai-tools', component: AiTools },
    modulePage('activity-list', '活动列表', '真实后台在「活动管理」下。本期审查演示尚未迁入活动模块；这里只标明入口位置，不会假装已经接好活动数据。'),
    modulePage('activity-categories', '活动分类管理', '真实后台在「活动管理」下。本期未迁入分类维护；接入时沿用原活动分类接口和 ID，不另建一套分类。'),
    { path: '/feedback', name: 'feedback', component: Feedback },
    { path: '/trial-course', name: 'trial-course', component: TrialCourse },
    modulePage('product-recommend', 'App商品推荐管理', '真实后台在「运营管理」下。本期未迁入推荐配置；接入后按原推荐规则读写，不在演示里编造推荐商品。'),
    { path: '/coupon-tasks', name: 'coupon-tasks', component: CouponConfig },
    { path: '/coupon-config', redirect: '/coupon-tasks' },
    { path: '/course-shelf', name: 'course-shelf', component: ProductOperation, props: { mode: 'shelf' } },
    { path: '/product-price', name: 'product-price', component: ProductOperation, props: { mode: 'price' } },
    { path: '/business-lines', name: 'business-lines', component: ProductCatalog, props: { clinicalOnly: false } },
    { path: '/clinical-products', name: 'clinical-products', component: ProductCatalog, props: { clinicalOnly: true } }
  ]
})
