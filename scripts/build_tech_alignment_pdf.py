# -*- coding: utf-8 -*-
"""Generate a print-ready PDF using Adobe GB1 Song (Preview can substitute)."""
from __future__ import print_function

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "运营配置助手_技术对接说明.pdf")
OUT_ALIAS = os.path.join(ROOT, "运营配置助手_技术对接规则.pdf")

BLOCKS = [
    ("h1", "运营配置助手 · 与技术对齐规则"),
    ("meta", "版本：2026-09-08    整理：运营（美惠）    用途：对接会书面口径，不是再画一套页面"),
    ("box", "一句话：这是盖在原后台之上的运营工作台。不新建商品库、不改原 ID、不改原权限。演示页面形状已定，下面只写上线前必须和技术对齐的规则。干活在技术；字段是否仍在用听张旭；入口和任务形态听运营。"),
    ("h2", "1. 系统定位（先对齐这个，再谈接口）"),
    ("p", "正式链路：新版管理页面 → 原后台接口 → 原数据库 → App / 小程序 / PC。"),
    ("li", "不是外挂另一套业务数据。"),
    ("li", "不是把项目管理做成全部商品清单。项目管理 = 项目 → 专业 → 子级；清单和批量任务是另外两件事。"),
    ("li", "Hash 路由便于接入现有后台。登录、菜单权限、按钮权限沿用原体系。"),
    ("li", "名称只用于展示；读写一律用后台返回的真实 ID。"),
    ("h2", "2. 谁拍板什么"),
    ("p", "运营（美惠）：工作台入口位置、左侧名称、批量任务怎么操作（一屏填规则、按科室勾专业、一次生成）。"),
    ("p", "张旭 / 现网后台：哪些字段还在用、枚举和售价、试听内容从哪来。已停用的模块不要按旧图恢复。"),
    ("p", "技术：接口、拆请求、服务端校验、权限、搜索、撤回落库、分页、上传。"),
    ("p", "已确认例子：旧 App 免费体验课里的配置内容 / 关联小节长期不用。现网是商品页「配置头图免费试听 / 配置列表免费试听」。入口放在「App引流课管理」，名称按运营；字段按张旭。"),
    ("h2", "3. 全局写入规则（优惠券、上下架、调价必须同一套）"),
    ("h3", "3.1 一次保存 = 一批任务"),
    ("p", "运营在工作台点一次「保存」，语义是：同一规则，落到所有有效的「商品 x 专业」组合。后台如果只能逐条写，由适配层拆成 N 次请求，对运营仍是一次任务。"),
    ("li", "覆盖不到的专业：跳过，不生成脏数据，并在结果里标明跳过原因。"),
    ("li", "不要做成每个专业再走一遍向导。"),
    ("h3", "3.2 15 秒内撤回 = 整批作废"),
    ("li", "保存成功后 15 秒内允许撤回。"),
    ("li", "撤回必须是整批：已写出的「商品 x 专业」全部收回，禁止留下一半有券、一半没有。"),
    ("li", "撤回之后这次任务作废，运营重新选范围再保存，不在半成品上续写。"),
    ("li", "超过 15 秒：不能再靠这个撤回。之后只能走后台正常的下架、删除或再配一批，规则以后台为准。"),
    ("p", "写入中途失败（超时、部分接口失败、权限不足）：同样按整批作废处理，给运营明确失败原因，不要静默留下部分成功。撤回能力必须由服务端提供（操作单号 / 短时快照 / 可逆事务），不能只靠浏览器提示。"),
    ("h3", "3.3 幂等"),
    ("p", "同一任务短时间重复点击保存，不能发两批真实优惠券或调价。请给出任务号或幂等键约定。"),
    ("h2", "4. 价格与亏本（以后台为准）"),
    ("li", "前端测算成交价只是预览，文案为「仅供参考」。"),
    ("li", "成交价大于 0 或等于 0 都可以保存；低于 0 才拦截亏本。"),
    ("li", "满减门槛可以为 0（满 0 减 N 作为无门槛满减，允许配置）。"),
    ("li", "商品当前无售价：前端不能编价格（尤其是中级职称精英班等）。只能提示无法确认是否低于 0。"),
    ("li", "最终能否保存：必须用后台当时真实售价再算一遍。前端通过、后台不通过，以后台为准。"),
    ("h2", "5. 按模块：需要技术对齐的事项"),
    ("h3", "5.1 工程接入（全部已迁页面通用）"),
    ("li", "替换演示数据：去掉把浏览器本地存储当真源。列表、详情、写操作走原接口。"),
    ("li", "ID：项目、专业、子级、商品、广告、页面一律用后台 ID。演示 ID 不得写入生产。"),
    ("li", "权限：按钮接原权限指令。演示里固定操作人「美惠」不能当生产身份。"),
    ("li", "校验：必填、状态、冲突、有效期、图片，服务端再校验一次。"),
    ("li", "操作人：返回最后修改人、修改时间，便于追责。"),
    ("li", "枚举：广告形式、投放位置、打开环境等 code 以后台字典为准，前端不发明新枚举。"),
    ("h3", "5.2 项目管理"),
    ("li", "上架列表与已下架列表分开，不要混在一张默认长表。"),
    ("li", "所属项目为空的脏专业：放在「信息待补充」，不要猜填项目 ID。"),
    ("li", "子级排序连续；无真实子级 ID 的不要编。"),
    ("li", "删除 / 下架的服务端影响面（关联商品、广告）需技术说明，工作台只做确认。"),
    ("h3", "5.3 广告素材管理"),
    ("li", "去向选商品：正式必须从商品库搜索（名称或商品 ID），选中后保存真实商品 ID。原型手填作废。"),
    ("li", "图片走现有上传，存后台返回的地址，不存浏览器本地图。"),
    ("li", "像素、横竖、大小以后台上传接口为准。演示只拦明显方向错误。"),
    ("li", "列表需服务端分页和组合筛选。原轮播约数百条，禁止一次拉全量当真。"),
    ("li", "复制 1 / 5 / 10 条：新 ID 由后台生成，默认进入今日下架；15 秒整批撤回。"),
    ("li", "新记录默认下架，上架前走原冲突校验（同页轮播位、投放时间等）。"),
    ("h3", "5.4 金刚区管理（含磁片区，同一模块）"),
    ("li", "每个入口必须配置完整点击去向后才能启用。"),
    ("li", "需要落到商品时，同样走商品搜索 ID，不手填。"),
    ("li", "光荣榜业务含义已确认：App 刷题排行榜。正式 route code 由接口返回，前端不编路由名。"),
    ("li", "项目 / 专业树接入后与项目管理同一数据源。"),
    ("li", "15 秒整批撤回与广告同一策略。"),
    ("h3", "5.5 AI 工具集管理"),
    ("li", "App 中部 6 个智能体入口，不擅自增删入口数量，除非现网已变。"),
    ("li", "推荐管理现网未关联商品，不要在接入时编一批推荐商品。"),
    ("li", "图标、推荐提问、营销周期：读写原配置；图标上传走现有资源服务。"),
    ("h3", "5.6 意见反馈管理"),
    ("li", "工作台先按「未处理 / 已处理」粗分，列表仍保留待处理、处理中、已回复、已关闭四档，落库用原状态。"),
    ("li", "不要假设有启用 / 停用反馈入口的能力，除非现网本来就有。"),
    ("h3", "5.7 App 优惠券管理"),
    ("li", "列表是任务维度（一次配置生成多张「商品 x 专业」券），不要做成必须点进每一张券才能改。"),
    ("li", "一次保存拆成 N 条写请求；失败或 15 秒撤回 = 整批作废，重新来。"),
    ("li", "亏本拦截见第 4 节。无售价不编价。"),
    ("li", "生效时间、截止时间必填；截止不能早于生效。"),
    ("h3", "5.8 商品课程上下架 / 商品批量调价"),
    ("li", "同一班型、一批专业、同一规则，一屏完成，不要四步向导。"),
    ("li", "上下架：生效时间 + 截止时间都必填。上架 = 生效起可售、截止后停售。下架 = 生效起停售、截止结束本次下架窗口。是否自动恢复上架以后台为准。"),
    ("li", "调价：只要生效时间。"),
    ("li", "调价亏本、权限、15 秒整批撤回：与优惠券同一套写入策略。"),
    ("li", "从全部项目清单 / 临床商品清单带入已选范围，接入后用任务草稿或查询参数，不要依赖浏览器临时存储。"),
    ("h3", "5.9 App 引流课管理"),
    ("li", "对应商品编辑里仍在用的「配置头图免费试听」「配置列表免费试听」。"),
    ("li", "先选项目 + 专业，头图一条，列表可多条。"),
    ("li", "第一个下拉：该专业下已有商品，走商品接口。"),
    ("li", "第二个下拉：试听内容，选项必须等后台返回。禁止编造小节 ID。"),
    ("li", "旧体验课「配置内容 / 关联小节 / 精华体验课」不要接入。"),
    ("h3", "5.10 商品清单（全部项目清单 / 临床商品清单）"),
    ("li", "这是挑货入口，不是项目管理。"),
    ("li", "商品名称、售价、上下架状态、覆盖专业必须来自现网。"),
    ("li", "中级职称等无价商品保持无价，直到后台有价。"),
    ("h2", "6. 本期不要做、也不要编数据的页面"),
    ("li", "活动列表：只标明入口。接入时用原活动接口和 ID，不在演示里编活动。"),
    ("li", "活动分类管理：沿用原分类接口和 ID，不另建一套分类。"),
    ("li", "App 商品推荐管理：接入后按原推荐规则读写，不编推荐商品。"),
    ("p", "这三页在现网字段未经张旭确认前，保持占位。不要为了看起来齐做假功能。"),
    ("h2", "7. 建议技术会先确认的清单（可当作会议议程）"),
    ("li", "批量写：任务单号、拆条方式、部分失败是否一律整批回滚（运营要求：是）。"),
    ("li", "15 秒撤回：服务端如何实现、过期后如何拒绝、与广告现网是否已有同类能力。"),
    ("li", "幂等键：重复保存如何去重。"),
    ("li", "售价接口：何时返回空、亏本由哪个服务判定。"),
    ("li", "商品搜索接口：广告、金刚区、引流课共用还是各用各的。"),
    ("li", "引流课试听内容接口：字段名、与商品页现网是否同一套。"),
    ("li", "图片上传与像素校验现网规则原文。"),
    ("li", "光荣榜 / 刷题排行榜的 route code。"),
    ("li", "优惠券、调价、上下架的按钮权限点。"),
    ("li", "活动、推荐：现网是否仍用、接口是否还在；未确认则继续空着。"),
    ("h2", "8. 验收时什么叫合格"),
    ("li", "运营一次保存，后台出现的是完整一批，或完整没有；没有成功一部分、失败一部分还挂着。"),
    ("li", "15 秒内撤回后，App 侧看不到这批券 / 这批价。"),
    ("li", "无售价商品不会被前端写死一个编出来的价格。"),
    ("li", "广告去向能搜到真实商品 ID。"),
    ("li", "引流课第二个下拉要么有真数据，要么仍空，没有假小节。"),
    ("li", "原后台 ID、权限、App 展示结果与改版前一致，只是运营操作路径变短。"),
    ("meta", "以上为 2026-09-08 全站对齐口径。下面附录是更早的广告 / 金刚区字段与接口样板（V1）。"),
    ("h2", "附录 A. 接入边界（广告与金刚区样板）"),
    ("li", "前端目标环境：Vue 2 + Element UI + Vue CLI。"),
    ("li", "复用现有后台登录、菜单、路由、权限、数据库和文件上传能力。"),
    ("li", "Demo 静态数据只展示交互；项目、专业、页面、商品、试卷等选项全部由接口返回。"),
    ("li", "CSS 只作用于当前页面，避免覆盖现有后台全局样式。"),
    ("li", "所有写操作由后端再次校验，不以浏览器校验作为最终依据。"),
    ("h2", "附录 B. 通用枚举"),
    ("p", "status：ON / OFF = 使用中 / 已停用（广告页也可显示为上架 / 已下架）。"),
    ("p", "appCode：APP / MINI_PROGRAM / PC = 昭昭医考 App / 小程序 / 网校 PC 端。"),
    ("p", "openMode：APP_IN / APP_OUT / MINI = App 内打开 / 外部链接 / 小程序。"),
    ("p", "entryPosition：DIAMOND / TILE = 金刚区 / 磁片区。"),
    ("p", "adType：BANNER / POPUP / FLOATING / SPLASH = 轮播图 / 弹层 / 悬浮广告 / 开屏广告。正式 code 以后台字典为准。"),
    ("h2", "附录 C. 广告素材：输入字段"),
    ("p", "id：数字，编辑时必填，后端生成。"),
    ("p", "adType：枚举，必填。appCode：枚举，必填。pageCode：页面字典，必填。"),
    ("p", "positionCode：轮播图必填，图1、图2 等位置字典。"),
    ("p", "projectIds / professionIds：项目与随项目联动的专业，必填。"),
    ("p", "targetType：商品、普通页面、外部链接、无跳转。商品时 productType 必填，必须由真实商品类型接口返回。"),
    ("p", "targetId / targetUrl：条件必填。商品必须搜索后保存真实商品 ID，禁止手填。"),
    ("p", "imageUrl：上传接口返回，必填。startAt / endAt：投放有效期，必填。"),
    ("p", "sortNo：轮播图必填，同位置展示顺序。status：新增、复制默认 OFF。"),
    ("h3", "广告输出结果"),
    ("li", "保存：返回记录 ID、版本号、修改人、修改时间和最终状态。"),
    ("li", "复制：返回全部副本 ID；副本默认下架；15 秒内整批撤回。"),
    ("li", "上下架：返回变更后状态及冲突校验结果。"),
    ("li", "批量：返回成功 ID、失败 ID、失败原因。优惠券 / 调价按整批作废，不以部分成功为准。"),
    ("li", "撤回：用操作流水号恢复数据和操作前筛选上下文。有效期由后端返回 undoExpireAt。"),
    ("h2", "附录 D. 金刚区（含磁片区）：输入字段"),
    ("p", "id：编辑时后端生成。name：建议 2-6 字，最大长度以后端为准。"),
    ("p", "iconUrl：必填，建议 80x80，尺寸由上传接口校验。"),
    ("p", "appCode、pageCode、entryPosition、projectIds、professionIds、openMode：必填。专业必须属于已选项目。"),
    ("p", "targetPageCode / targetContentId：条件必填，商品、试卷、试题、活动等真实 ID。"),
    ("p", "externalUrl：外链时必填，只接受 https。miniAppId / miniPath：小程序时必填。"),
    ("p", "validityType：LONG_TERM / RANGE。RANGE 时 startAt / endAt 必填。去向不完整时禁止 ON。"),
    ("p", "光荣榜业务文案已确认：App 刷题排行榜。建议字典 HONOR。其他对象的正式 code 由技术提供。"),
    ("h3", "金刚区输出结果"),
    ("li", "保存基础信息：返回入口 ID、版本号和待配置项。"),
    ("li", "保存去向：返回标准化目标摘要，供列表和预览复用。"),
    ("li", "启用：返回冲突清单；无阻断冲突时返回 ON。"),
    ("li", "预览：返回完整字段、最终跳转目标、展示范围和有效期。"),
    ("h2", "附录 E. 冲突校验"),
    ("h3", "阻断保存或启用"),
    ("li", "必填缺失、图片上传失败或目标 ID 不存在。"),
    ("li", "结束时间早于或等于开始时间。"),
    ("li", "App 外打开但链接不是完整 https 地址。"),
    ("li", "小程序打开但缺少 AppID 或页面路径。"),
    ("li", "目标内容已删除、已停用或不属于所选项目 / 专业。"),
    ("li", "专业不属于所选项目。"),
    ("li", "同一应用、页面、位置、项目、专业及重叠有效期内，出现不允许并存的唯一位置记录。"),
    ("li", "轮播图同一投放范围、同一有效期内 sortNo 重复。"),
    ("h3", "允许保存草稿，但禁止启用"),
    ("li", "尚未配置点击去向、尚未上传合规图片或图标、目标不可用、有效期不完整。"),
    ("h3", "仅提示确认"),
    ("li", "同一素材投放到多个专业；同一目标被多个入口引用；批量跨项目或跨页面；修改正在前台使用的记录。"),
    ("p", "冲突唯一性最终由产品和技术确认。建议接口返回 BLOCK / WARN / PASS 及可读原因。"),
    ("h2", "附录 F. 建议接口（路径仅为示例，正式以后台为准）"),
    ("p", "GET /api/ops/dictionaries  应用、页面、位置、打开对象等字典"),
    ("p", "GET /api/ops/projects  项目与专业树"),
    ("p", "GET/POST/PUT /api/ops/ads  广告列表、新增、编辑；POST copy、batch-status"),
    ("p", "GET/POST/PUT /api/ops/entries  金刚区列表、新增、编辑；PUT destination"),
    ("p", "POST /api/ops/validate-conflicts  保存或启用前冲突校验"),
    ("p", "POST /api/ops/operations/{operationId}/undo  撤回"),
    ("p", "POST /api/files/images  图片 / 图标上传"),
    ("h2", "附录 G. 权限、审计与反馈"),
    ("li", "权限建议拆分：查看、新增、编辑、上下架、批量操作、删除。"),
    ("li", "写操作记录 operatorId、operatorName、operationId、before、after、createdAt。"),
    ("li", "删除是否物理删除由现有后台规范决定；前端显示明确警告。"),
    ("li", "成功：说明改了什么、影响几条、去哪里查看。"),
    ("li", "阻断：直接说明缺失字段或冲突对象，并提供返回修改入口。"),
    ("li", "删除确认框必须显示记录名称、ID 和影响数量。"),
    ("h2", "附录 H. 广告 / 金刚区仍待技术确认"),
    ("li", "正式项目 / 专业树接口及一级项目真实 code。"),
    ("li", "广告形式、显示页面、位置和商品类型的正式字典。"),
    ("li", "各打开对象所需的 targetId、路由参数和可用状态规则。"),
    ("li", "周考排行和 App 刷题排行榜是否为两个独立路由。"),
    ("li", "唯一位置和有效期重叠的最终冲突规则。"),
    ("li", "广告批量接口最大条数；优惠券与调价不采用部分成功。"),
    ("meta", "对应工程：交付包_Vue2_ElementUI。Markdown 原稿：运营配置助手_技术对接说明.md"),
]


def to_ucs2_hex(text):
    parts = []
    for ch in text:
        code = ord(ch)
        if code > 0xFFFF:
            ch = "?"
            code = ord(ch)
        parts.append("%04X" % code)
    return "".join(parts)


def wrap(text, width):
    lines, buf, w = [], "", 0
    for ch in text:
        cw = 0.55 if ord(ch) < 128 else 1.0
        if w + cw > width and buf:
            lines.append(buf)
            buf, w = ch, cw
        else:
            buf += ch
            w += cw
    if buf:
        lines.append(buf)
    return lines or [""]


def layout():
    pages = []
    y = 800
    lines = []
    sizes = {"h1": 16, "h2": 13, "h3": 11.5, "p": 10, "li": 10, "meta": 9, "box": 10}
    widths = {"h1": 36, "h2": 42, "h3": 44, "p": 48, "li": 46, "meta": 50, "box": 46}
    gaps = {"h1": 10, "h2": 14, "h3": 10, "p": 5, "li": 3, "meta": 6, "box": 8}

    def new_page():
        nonlocal y, lines
        if lines:
            pages.append(lines)
        lines = []
        y = 800

    for kind, text in BLOCKS:
        size = sizes[kind]
        prefix = "· " if kind == "li" else ""
        leading = size + 3
        wrapped = wrap(prefix + text, widths[kind])
        block_h = gaps[kind] + leading * len(wrapped)
        floor = 120 if kind in ("h1", "h2") else 56
        if y - block_h < floor:
            new_page()
        y -= gaps[kind]
        for piece in wrapped:
            if y < 52:
                new_page()
            lines.append((kind, size, 48 if kind != "li" else 56, y, piece))
            y -= leading
    if lines:
        pages.append(lines)
    return pages


def stream_for(page_lines):
    chunks = ["BT"]
    last_font = None
    for kind, size, x, y, text in page_lines:
        font = "F1"
        if last_font != (font, size):
            chunks.append("/%s %.1f Tf" % (font, size))
            last_font = (font, size)
        if kind == "h1":
            chunks.append("0.66 0.04 0.07 rg")
        elif kind in ("h2", "h3"):
            chunks.append("0.11 0.13 0.16 rg")
        elif kind == "meta":
            chunks.append("0.36 0.40 0.44 rg")
        else:
            chunks.append("0.11 0.13 0.16 rg")
        chunks.append("1 0 0 1 %.2f %.2f Tm" % (x, y))
        chunks.append("<%s> Tj" % to_ucs2_hex(text))
    chunks.append("ET")
    return "\n".join(chunks).encode("latin-1")


def build(pages):
    objs = []

    def add(body):
        objs.append(body)
        return len(objs)

    add(b"<< /Type /Catalog /Pages 2 0 R >>")
    page_ids = []
    content_ids = []
    # placeholders, filled later
    add(b"<< /Type /Pages /Kids [] /Count 0 >>")
    font = add(
        b"<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [4 0 R] >>"
    )
    add(
        b"<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light "
        b"/CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 2 >> "
        b"/FontDescriptor 5 0 R /DW 1000 >>"
    )
    add(
        b"<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 "
        b"/FontBBox [-25 -254 1023 880] /ItalicAngle 0 /Ascent 880 /Descent -120 "
        b"/CapHeight 626 /StemV 66 >>"
    )
    for page in pages:
        data = stream_for(page)
        cid = add(b"<< /Length %d >>\nstream\n" % len(data) + data + b"\nendstream")
        content_ids.append(cid)
        page_ids.append(None)
    # page objects after contents known — rebuild is simpler: construct all at once
    return None  # replaced below


def write_pdf(path, pages):
    pieces = []

    def obj(n, payload):
        pieces.append((n, payload))

    obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    font_id, cid_id, desc_id = 3, 4, 5
    obj(
        font_id,
        b"<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [4 0 R] >>",
    )
    obj(
        cid_id,
        b"<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light "
        b"/CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 2 >> "
        b"/FontDescriptor 5 0 R /DW 1000 >>",
    )
    obj(
        desc_id,
        b"<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 "
        b"/FontBBox [-25 -254 1023 880] /ItalicAngle 0 /Ascent 880 /Descent -120 "
        b"/CapHeight 626 /StemV 66 >>",
    )
    content_ids = []
    page_obj_ids = []
    next_id = 6
    for page in pages:
        data = stream_for(page)
        cid = next_id
        next_id += 1
        obj(cid, b"<< /Length %d >>\nstream\n" % len(data) + data + b"\nendstream")
        content_ids.append(cid)
        page_obj_ids.append(next_id)
        next_id += 1
    kids = " ".join("%d 0 R" % i for i in page_obj_ids)
    obj(2, ("<< /Type /Pages /Kids [%s] /Count %d >>" % (kids, len(page_obj_ids))).encode("ascii"))
    for pid, cid in zip(page_obj_ids, content_ids):
        obj(
            pid,
            (
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                "/Resources << /Font << /F1 3 0 R >> >> /Contents %d 0 R >>" % cid
            ).encode("ascii"),
        )
    pieces.sort(key=lambda item: item[0])
    out = [b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    offsets = {0: 0}
    for n, payload in pieces:
        offsets[n] = sum(len(x) for x in out)
        if payload.startswith(b"<<") and b"stream\n" in payload:
            out.append(("%d 0 obj\n" % n).encode("ascii") + payload + b"\nendobj\n")
        else:
            out.append(("%d 0 obj\n" % n).encode("ascii") + payload + b"\nendobj\n")
    xref_pos = sum(len(x) for x in out)
    max_n = max(offsets)
    out.append(("xref\n0 %d\n" % (max_n + 1)).encode("ascii"))
    out.append(b"0000000000 65535 f \n")
    for i in range(1, max_n + 1):
        out.append(("%010d 00000 n \n" % offsets[i]).encode("ascii"))
    out.append(
        ("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (max_n + 1, xref_pos)).encode("ascii")
    )
    with open(path, "wb") as handle:
        handle.write(b"".join(out))


def main():
    pages = layout()
    write_pdf(OUT, pages)
    import shutil
    shutil.copyfile(OUT, OUT_ALIAS)
    print(OUT, "pages", len(pages))


if __name__ == "__main__":
    main()
