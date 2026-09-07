import { appCodeOf, adTypeMeta, STATUS_CODE } from '../domain/adEnums'
import { backendProjects, backendProfessions } from '../data/backendHierarchy'

const STORAGE_KEY = 'carousel-demo-v3'
const OPERATOR = { id: null, name: '美惠' }

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function canonicalProject (name) {
  return name === '中医/中西医' ? '中医／中西医' : name
}

function canonicalProfession (name) {
  return String(name || '').replace(/\//g, '／')
}

function matchProfession (project, profession) {
  const projectName = canonicalProject(project)
  const professionName = canonicalProfession(profession)
  return backendProfessions.find(item => canonicalProfession(item.name) === professionName && canonicalProject(item.project) === projectName)
    || backendProfessions.find(item => canonicalProfession(item.name) === professionName)
}

function matchProject (project) {
  const name = canonicalProject(project)
  const aliases = name === '中医／中西医' ? ['中医／中西医', '中医/中西医'] : [name]
  return backendProjects.find(item => item.status === 'on' && aliases.includes(canonicalProject(item.name)))
    || backendProjects.find(item => aliases.includes(canonicalProject(item.name)))
}

function attachIds (row) {
  const project = matchProject(row.project)
  const profession = matchProfession(row.project, row.profession)
  return {
    ...row,
    project: canonicalProject(row.project),
    profession: canonicalProfession(row.profession),
    projectId: row.projectId || (project ? project.id : null),
    professionId: row.professionId || (profession ? profession.id : null),
    adType: row.adType || '轮播图',
    adTypeCode: adTypeMeta(row.adType || '轮播图').code,
    appCode: row.appCode || appCodeOf(row.app),
    statusCode: STATUS_CODE[row.status] || row.statusCode || 'OFF',
    version: row.version || 1
  }
}

function nextId (rows) {
  return Math.max(1200, ...rows.map(row => Number(row.id) || 0)) + 1
}

function nowText () {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function loadDefaults (defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved) && saved.length) return saved.map(attachIds)
  } catch (error) { /* 演示本地缓存损坏时回退 */ }
  return defaults.map(item => attachIds({ ...item }))
}

export function createAdsApi (defaults) {
  let records = loadDefaults(defaults)
  let operation = null

  function persist () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }

  function beginOperation (type, view, extra = {}) {
    operation = {
      id: `op-${Date.now()}`,
      type,
      view: clone(view),
      before: clone(records),
      extra,
      undoExpireAt: Date.now() + 15000
    }
    return operation
  }

  return {
    list () {
      return { list: records.slice(), total: records.length }
    },
    toPayload (form) {
      const attached = attachIds(form)
      return {
        id: form.id || null,
        adType: attached.adType,
        adTypeCode: attached.adTypeCode,
        app: attached.app,
        appCode: attached.appCode,
        pageCode: attached.page,
        positionCode: attached.adType === '轮播图' ? attached.position : '—',
        projectIds: attached.projectId ? [attached.projectId] : [],
        professionIds: attached.professionId ? [attached.professionId] : [],
        project: attached.project,
        profession: attached.profession,
        projectId: attached.projectId,
        professionId: attached.professionId,
        targetType: attached.targetType || '商品',
        productType: attached.productType || '',
        targetId: attached.targetId || null,
        targetUrl: attached.targetType === '外部链接' ? attached.targetValue : '',
        imageUrl: attached.image || '',
        imageWidth: attached.imageWidth || 0,
        imageHeight: attached.imageHeight || 0,
        startAt: attached.start,
        endAt: attached.end,
        status: attached.statusCode,
        sortNo: attached.adType === '轮播图' ? Number(String(attached.position).replace(/\D/g, '')) || 1 : null
      }
    },
    save (form, view) {
      const op = beginOperation(form.id ? 'update' : 'create', view)
      const now = nowText()
      const payload = attachIds({
        ...form,
        position: form.adType === '轮播图' ? form.position : '—',
        link: form.targetType === '商品' ? form.productType : form.targetType,
        modifiedBy: OPERATOR.name,
        modifiedAt: now,
        offAt: form.status === 'off' ? now : '',
        color: form.color || '#c91420'
      })
      let id = form.id
      if (id) {
        const target = records.find(row => row.id === id)
        Object.assign(target, payload, { id, version: (target.version || 1) + 1 })
      } else {
        id = nextId(records)
        records.unshift({ ...payload, id, version: 1 })
      }
      persist()
      return { ok: true, id, operationId: op.id, undoExpireAt: op.undoExpireAt, list: records.slice() }
    },
    copy (source, count, view) {
      const op = beginOperation('copy', view)
      const now = nowText()
      const ids = []
      for (let index = 0; index < count; index++) {
        const id = nextId(records)
        ids.push(id)
        records.unshift(attachIds({
          ...source,
          id,
          product: `${source.product}（副本${index + 1}）`,
          status: 'off',
          statusCode: 'OFF',
          offAt: now,
          modifiedBy: OPERATOR.name,
          modifiedAt: now,
          version: 1
        }))
      }
      persist()
      return { ok: true, ids, operationId: op.id, undoExpireAt: op.undoExpireAt, list: records.slice() }
    },
    replace (id, patch, view) {
      const op = beginOperation('replace', view, { focusId: id })
      const target = records.find(row => row.id === id)
      if (target) Object.assign(target, patch)
      persist()
      return { ok: true, operationId: op.id, undoExpireAt: op.undoExpireAt, list: records.slice() }
    },
    remove (ids, view) {
      const op = beginOperation('delete', view)
      records = records.filter(row => !ids.includes(row.id))
      persist()
      return { ok: true, operationId: op.id, undoExpireAt: op.undoExpireAt, list: records.slice() }
    },
    undo (operationId) {
      if (!operation || operation.id !== operationId) return { ok: false, message: '没有可撤回的操作，或已超过 15 秒' }
      if (Date.now() > operation.undoExpireAt) {
        operation = null
        return { ok: false, message: '撤回已过期，需走后台恢复流程' }
      }
      records = clone(operation.before)
      const view = operation.view
      const focusId = operation.extra.focusId || null
      operation = null
      persist()
      return { ok: true, list: records.slice(), view, focusId }
    },
    clearOperation () {
      operation = null
    },
    currentOperation () {
      return operation
    }
  }
}

export { canonicalProject, canonicalProfession, matchProject, matchProfession }
