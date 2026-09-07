(function () {
  var menus = [
    { group: '运营配置', items: [
      ['广告素材管理', '运营配置助手_轮播图管理_V1.html'],
      ['金刚区管理', '运营配置助手_金刚区管理_V1.html'],
      ['AI 工具集管理', '运营配置助手_AI工具集管理_V1.html'],
      ['意见反馈管理', '运营配置助手_意见反馈管理_V1.html']
    ]},
    { group: '商品与营销', items: [
      ['优惠券配置', '总版_优惠券配置.html'],
      ['商品课程上下架', '总版_商品课程上下架.html'],
      ['商品调价', '总版_商品调价.html']
    ]},
    { group: '业务清单（本期新增）', items: [
      ['全部项目清单', '总版_全部项目清单.html'],
      ['临床商品清单', '总版_临床商品清单.html']
    ]}
  ]
  var current = decodeURIComponent(location.pathname.split('/').pop())
  var style = document.createElement('style')
  style.textContent = [
    ':root{--ops-brand:#c91420;--ops-ink:#20242b;--ops-muted:#667085;--ops-line:#e4e7eb;--ops-bg:#f6f7f9}',
    'html{padding-left:224px!important;padding-top:58px!important;background:var(--ops-bg)!important}',
    'body{min-height:calc(100vh - 58px)!important}',
    '.ops-top{position:fixed;z-index:9000;left:0;right:0;top:0;height:58px;padding:0 22px;display:flex;align-items:center;gap:12px;background:#fff;border-bottom:1px solid var(--ops-line);font:14px/1.5 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ops-ink)}',
    '.ops-mark{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;color:#fff;background:var(--ops-brand);font-weight:800}',
    '.ops-top-name{font-size:16px;font-weight:700}.ops-top-meta{color:var(--ops-muted)}.ops-user{margin-left:auto;color:var(--ops-muted);font-size:12px}',
    '.ops-side{position:fixed;z-index:8999;left:0;top:58px;bottom:0;width:224px;padding:16px 14px 28px;overflow:auto;background:#fbfbfc;border-right:1px solid var(--ops-line);font:14px/1.5 "PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
    '.ops-group{margin:15px 11px 7px;color:#7b8492;font-size:12px;font-weight:700}.ops-group:first-child{margin-top:2px}',
    '.ops-link{display:block;min-height:40px;padding:9px 11px;margin:2px 0;border-radius:7px;color:#5d6674;text-decoration:none;font-weight:600}.ops-link:hover{background:#eef1f4;color:#29313d}.ops-link.active{color:#a90a13;background:#fff1f2}',
    '.ops-new{display:inline-block;margin-left:6px;padding:1px 5px;border-radius:999px;color:#a90a13;background:#fff1f2;font-size:10px}',
    '@media(max-width:760px){html{padding-left:0!important}.ops-side{display:none}.ops-top-meta,.ops-user{display:none}}',
    '@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition-duration:.01ms!important}}'
  ].join('')
  document.head.appendChild(style)
  var top = document.createElement('header')
  top.className = 'ops-top'
  top.innerHTML = '<span class="ops-mark">昭</span><span class="ops-top-name">运营配置助手</span><span class="ops-top-meta">统一演示总版</span><span class="ops-user">当前操作人：美惠</span>'
  var side = document.createElement('aside')
  side.className = 'ops-side'
  side.innerHTML = menus.map(function (section) {
    return '<div class="ops-group">' + section.group + '</div>' + section.items.map(function (item) {
      var active = current === item[1] ? ' active' : ''
      var badge = section.group.indexOf('本期新增') > -1 ? '<span class="ops-new">新增</span>' : ''
      return '<a class="ops-link' + active + '" href="' + item[1] + '">' + item[0] + badge + '</a>'
    }).join('')
  }).join('')
  document.body.appendChild(top)
  document.body.appendChild(side)
})()
