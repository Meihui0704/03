#!/usr/bin/env python3
"""Translate PPTX visible text to English without adding/removing shapes."""
from __future__ import annotations

import math
import re
import shutil
import zipfile
from html import escape, unescape
from pathlib import Path

SRC = Path("/Users/meihui/Downloads/202603昭昭.pptx")
DST = Path("/Users/meihui/Downloads/202603昭昭_EN.pptx")

CJK = re.compile(r"[\u4e00-\u9fff]")
P_BLOCK = re.compile(r"<a:p(?:\s[^>]*)?>.*?</a:p>(?![A-Za-z])", re.DOTALL)
T_EL = re.compile(r"<a:t((?:\s[^>]*)?)>(.*?)</a:t>(?![A-Za-z])", re.DOTALL)
CV_EL = re.compile(r"<c:v>([^<]*)</c:v>")


def norm(s: str) -> str:
    s = unescape(s).replace("\u3000", " ")
    return re.sub(r"[ \t\r\n]+", " ", s).strip()


# Professional, concise EN. Keys are whitespace-normalized Chinese.
MAP = {
    # Values / slogan
    "客户第一 诚信协作 担当卓越 知行合一": "Customer First    Integrity & Collaboration    Accountability & Excellence    Knowledge in Action",
    "以医学精神做教育": "Educating with the Spirit of Medicine",
    "铸造中国医学教育第一品牌": "Building China’s Leading Brand in Medical Education",
    "我们的目标": "Our Goals",
    "昭昭团队的使命": "Mission",
    "切实提高年轻医疗从业者的上岗能力，点滴而深远的改变中国基层医疗的未来。": "To strengthen young clinicians’ practice-readiness and, step by step, reshape the future of primary care in China.",
    "昭昭团队的愿景": "Vision",
    "成为中国医学教育领域卓越的、令人尊敬的公司。": "To be an outstanding, widely respected company in China’s medical education sector.",
    "昭昭团队的价值观": "Values",
    "教培经验": "Training Experience",
    "数十年医学行业的": "Decades of experience in medicine",
    "全国分校": "Campuses Nationwide",
    "深入到乡镇层面的分校": "Campuses reaching township level",
    "遍布全国医疗机构": "Across healthcare institutions nationwide",
    "覆盖学员": "Learners Reached",
    "辅导医考学员": "Coaching medical exam candidates",
    "顺利通过考试": "to pass successfully",
    "教辅图书": "Learning Publications",
    "自编教材满足市场需求": "In-house materials aligned with market needs",
    "深受学员认可": "Widely recognized by learners",
    "企业介绍": "Company Overview",
    "发展历程": "Milestones",
    "光辉起航": "A Strong Start",
    "公司在北京成立": "Company founded in Beijing",
    "学员数量达到1万": "Learners reached 10,000",
    "发展分校": "Campus expansion",
    "业务拓科": "Portfolio expansion",
    "年培训上岗医生达到6万": "60,000 physicians trained for practice annually",
    "全国分校260+": "260+ campuses nationwide",
    "市场占有率全国第一": "No. 1 national market share",
    "每年培训上岗医生10万+": "100,000+ physicians trained for practice each year",
    "图书全国销售第一": "No. 1 national book sales",
    "学员人数达到2万": "Learners reached 20,000",
    "昭昭老师首创“画图理解法”，在医学行业最早开启互联网直播教学和线上社群学习。": "Mr. Zhaozhao pioneered the Diagram-based Comprehension Method and was among the first in medical education to launch live-stream teaching and online learning communities.",
    "课程销售占有率实现全国第一。图书销售数量突破1万+，首批60+家分校建立。": "Course sales share ranked No. 1 nationwide. Book sales exceeded 10,000 copies; the first 60+ campuses were established.",
    "“七天六夜”、“四天三夜”等特色课程，": "Signature programs such as “7 Days / 6 Nights” and “4 Days / 3 Nights”;",
    "图书市场占有率全国第一。": "book market share ranked No. 1 nationwide.",
    "合作分校覆盖超150个城市，市场占有率独占鳌头。": "Partner campuses covered 150+ cities, with a leading market share.",
    "打造智能学习APP，年培训上岗医生达6万+人次。": "Launched an intelligent learning app; 60,000+ physicians trained for practice annually.",
    "分校数量260+，每年培训上岗医生数量达10万+，市场占有率稳居全国第一。": "260+ campuses; 100,000+ physicians trained for practice each year; market share remains No. 1 nationwide.",
    "行业地位": "Industry Position",
    "西医临床执业医师": "Clinical Licensed Physician (Western Medicine)",
    "[视频]": "[Video]",
    "昭昭老师": "Mr. Zhaozhao",
    "昭昭医学教育创始人": "Founder, Zhaozhao Medical Education",
    "昭昭老师，昭昭医考创始人，毕业于首都医科大学，国际学院留学生，拥有多年的考试教辅研究经验。中国医学考试培训青年人物，授课风格鲜明生动，轻松理解、简单易记、考情分析到位。在业界内的“昭昭画图记忆法”，获得广大考生的一致认可。": "Mr. Zhaozhao, founder of Zhaozhao Medical Exam Prep, is a graduate of Capital Medical University (international cohort) with years of exam-prep research. A recognized young figure in China’s medical exam training, he is known for a vivid, easy-to-grasp teaching style and precise exam-trend analysis. His “Zhaozhao Diagram Memory Method” is widely endorsed by candidates.",
    "画图记忆法": "Diagram Memory Method",
    "画图讲执考，备考不枯燥": "Teaching the licensing exam with diagrams—prep that stays engaging",
    "独一无二的教学方法→画图记忆法": "A distinctive pedagogy → Diagram Memory Method",
    "书+课+题库+服务": "Books + Courses + Question Bank + Services",
    "书": "Books",
    "课程配套教材年年更新": "Course-matched textbooks updated yearly",
    "700+万字，1000+幅图": "7M+ words, 1,000+ illustrations",
    "课": "Courses",
    "昭昭老师13年教学经验": "13 years of teaching by Mr. Zhaozhao",
    "画图教学浅显易懂": "Diagram-based teaching, clear and accessible",
    "题": "Questions",
    "精选50万题（研/临床/主治）": "500,000 curated items (postgraduate / clinical / attending)",
    "文字和视频解析+错题记录": "Text & video explanations + error log",
    "服务": "Services",
    "近10年服务经验沉淀": "Nearly 10 years of service expertise",
    "咨询答疑+学习计划": "Q&A support + study plans",
    "完整的解决方案": "An end-to-end solution",
    "中西医执业医师": "Integrated TCM–WM Licensed Physician",
    "乡村全科": "Rural General Practice",
    "西医考研": "WM Postgraduate Entrance Exam",
    "西医执业医师、主治医师、住陪": "WM Licensed Physician, Attending Physician & Residency Training",
    "版权书籍及业务板块": "Copyrighted Titles & Business Lines",
    "中医执业医师": "TCM Licensed Physician",
    "课程教材": "Course Textbooks",
    "700+万字": "7M+ words",
    "1000+幅图": "1,000+ illustrations",
    "《笔试重难点精析》": "Written Exam: Key Difficulties, In Depth",
    "《笔试核心考点背诵版》": "Written Exam: Core Points (Memorization Edition)",
    "《实践技能操作指南》": "Practical Skills: Procedure Guide",
    "《精选真题考点精析》": "Selected Past Papers: Point-by-Point Analysis",
    "昭昭手绘笔记": "Zhaozhao Hand-Drawn Notes",
    "全程精讲班": "Comprehensive Lecture Program",
    "课程体系——以执业医师为例（线上课程）": "Curriculum — Licensed Physician as an example (online courses)",
    "10+个班次": "10+ class tracks",
    "临床执业(助理）医师": "Clinical Licensed (Assistant) Physician",
    "课程体系线上结合线下": "Blended online + offline curriculum",
    "30万+道题目": "300,000+ questions",
    "1100+课时": "1,100+ class hours",
    "线下面授（每年线下周期30天）": "In-person teaching (30-day offline cycle each year)",
    "五天四夜考前押题": "5-Day / 4-Night Pre-Exam High-Yield Intensive",
    "2025保定分校五天四夜": "2025 Baoding Campus · 5-Day / 4-Night",
    "2025赣州分校五天四夜": "2025 Ganzhou Campus · 5-Day / 4-Night",
    "2025绥化分校五天四夜": "2025 Suihua Campus · 5-Day / 4-Night",
    "2025赤峰分校五天四夜": "2025 Chifeng Campus · 5-Day / 4-Night",
    "2025岳阳分校五天四夜": "2025 Yueyang Campus · 5-Day / 4-Night",
    "2025大理分校五天四夜": "2025 Dali Campus · 5-Day / 4-Night",
    "2023宝鸡分校八天七夜": "2023 Baoji Campus · 8-Day / 7-Night",
    "2023雅安分校八天七夜": "2023 Ya’an Campus · 8-Day / 7-Night",
    "2023荆门校八天七夜": "2023 Jingmen Campus · 8-Day / 7-Night",
    "2023张掖分校八天七夜": "2023 Zhangye Campus · 8-Day / 7-Night",
    "2023漳州分校八天七夜": "2023 Zhangzhou Campus · 8-Day / 7-Night",
    "2023凉山分校八天七夜": "2023 Liangshan Campus · 8-Day / 7-Night",
    "八天七夜知识串讲": "8-Day / 7-Night Knowledge Integration",
    "营销团队": "Marketing Team",
    "强大的": "A high-performing",
    "线下营销推广团队": "offline marketing & promotion team",
    "一线销售地毯式宣传，全面覆盖三甲医院，县医院、乡镇卫生室、村诊所等": "Frontline sales with blanket coverage: Grade-A tertiary hospitals, county hospitals, township clinics, and village practices",
    "学员第一，考试期间为学员提供免费休息车，给医生用户最好的服务体验": "Learners first: complimentary rest vehicles during exams for a best-in-class physician experience",
    "用户在各级医疗机构分布占比": "User Mix by Healthcare Institution Level",
    "医疗机构类别": "Institution type",
    "占比": "Share",
    "市级医院（或同级别医疗机构)": "Municipal hospitals (or equivalent)",
    "县级医院（或同级别医疗机构)": "County hospitals (or equivalent)",
    "村卫生所/私人诊所（或同级别医疗机构)": "Village clinics / private practices (or equivalent)",
    "其他不在以上分类的医疗结构": "Other healthcare facilities not listed above",
    "合计": "Total",
    "乡镇卫生院医院（或同级别医疗机构)": "Township health centers (or equivalent)",
    "县级及以下机构占比约80%，深度覆盖中国乡镇和农村地区医生和周边患者。": "About 80% are at county level or below—deep coverage of physicians and surrounding patients in China’s townships and rural areas.",
    "用户在各专业主要科室分布占比": "User Mix by Major Clinical Specialty",
    "用户主要分布在：": "Users are concentrated in:",
    "大内科、全科、大外科、其他无法分科科室、心内科、普通外科、妇产科、呼吸科、消化科、儿科、骨科": "General internal medicine, general practice, surgery, undifferentiated departments, cardiology, general surgery, OB/GYN, respiratory medicine, gastroenterology, pediatrics, and orthopedics",
    "以上科室占比超过84%": "These departments account for over 84%",
    "精准基层医师用户": "Precision Reach: Primary-Care Physicians",
    "海南": "Hainan",
    "黑龙江": "Heilongjiang",
    "吉林": "Jilin",
    "辽宁": "Liaoning",
    "河北": "Hebei",
    "山东": "Shandong",
    "福建": "Fujian",
    "江西": "Jiangxi",
    "安徽": "Anhui",
    "湖北": "Hubei",
    "湖南": "Hunan",
    "广东": "Guangdong",
    "广西": "Guangxi",
    "上海": "Shanghai",
    "河南": "Henan",
    "山西": "Shanxi",
    "内蒙古": "Inner Mongolia",
    "陕西": "Shaanxi",
    "宁夏": "Ningxia",
    "甘肃": "Gansu",
    "青海": "Qinghai",
    "四川": "Sichuan",
    "贵州": "Guizhou",
    "云南": "Yunnan",
    "西藏": "Tibet",
    "新疆": "Xinjiang",
    "江苏": "Jiangsu",
    "浙江": "Zhejiang",
    "北京": "Beijing",
    "基层医疗从业人员": "primary-care professionals",
    "学员所在医疗机构的类型占比（%）": "Share of learners’ institutions by type (%)",
    "APP强大功能，高效智能": "A Powerful, Intelligent App",
    "特色：基于医学知识图谱，挖掘知识薄弱点": "Feature: medical knowledge graph to pinpoint weak spots",
    "给学员：专属规划，推荐质优学习资源": "For learners: personalized plans and high-quality resources",
    "AI智学系统": "AI Adaptive Learning",
    "特色：2500+核心课切片，考点精细拆分": "Feature: 2,500+ core-lesson clips, finely split by exam points",
    "给学员：\"哪里不会点哪里\"的高效学习": "For learners: jump to what you don’t know—efficient study",
    "给学员：“哪里不会点哪里”的高效学习": "For learners: jump to what you don’t know—efficient study",
    "知识短视频": "Knowledge Micro-Videos",
    "特色：13年经验沉淀，视频+文字深度解析": "Feature: 13 years of expertise; in-depth video + text analysis",
    "给学员：\"做一题，会一类\"，深入理解考点逻辑": "For learners: master a class of items from one question—exam logic, in depth",
    "给学员：“做一题，会一类”，深入理解考点逻辑": "For learners: master a class of items from one question—exam logic, in depth",
    "智能题库": "Intelligent Question Bank",
    "特色：基于医学大模型，深度理解语义": "Feature: medical large model with deep semantic understanding",
    "给学员：7＊24小时专业问答与提炼": "For learners: 24/7 professional Q&A and key-point extraction",
    "小昭同学-医考大模型": "Xiao Zhao — Medical Exam LLM",
    "自主快学": "Self-Paced Fast Track",
    "题库特点": "Question Bank Highlights",
    "1.题目解析：有对应的文字和视频解析": "1. Explanations: matching text and video rationales",
    "2.科学分类：题库按科目类别、学科类别、年份、系统、组卷方式等特点分类。": "2. Structured taxonomy: by subject, discipline, year, system, and paper-assembly mode.",
    "3.数量多：有50万道题目。": "3. Scale: 500,000 questions.",
    "名师：文字+视频解析": "Master faculty: text + video explanations",
    "系统": "System",
    "年份": "Year",
    "甄题": "Curated Items",
    "周未考试": "Weekend Mock Exams",
    "冲刺密训": "Sprint Intensive",
    "技能模拟": "Skills Simulation",
    "自主组题": "Custom Paper Assembly",
    "其它辅助": "Other Tools",
    "排名": "Rankings",
    "知识点视频": "Knowledge-Point Videos",
    "视频-考题-口诀-百科模块化整合": "Modular mix: video · items · mnemonics · encyclopedia",
    "医考大模型-小昭同学": "Medical Exam LLM — Xiao Zhao",
    "超强总结": "High-density summaries",
    "7*24小时": "24/7",
    "专业问答": "Expert Q&A",
    "详细解析": "In-depth explanations",
    "专业试题解析": "Professional item analysis",
    "临床知识问答": "Clinical knowledge Q&A",
    "考点经验总结": "Exam-point playbooks",
    "教学变革": "Teaching Transformation",
    "告别依赖个人经验的“盲人摸象”": "Move beyond experience-only, piecemeal judgment",
    "通过数据大屏提供实时、全景的客观洞察": "Live, panoramic insight via data dashboards",
    "让教学决策从“事后补救”转向": "Shift teaching decisions from after-the-fact fixes to",
    "“过程干预”和“前瞻预测”": "in-process intervention and forward-looking prediction",
    "因材施教": "Instruction Tailored to Each Learner",
    "解决规模化教育与个性化需求的核心痛点": "Addressing the core tension between scale and personalization",
    "系统作为教学管理的“中枢神经”": "The system as the “central nervous system” of teaching operations",
    "精准识别每位学员的学习状态": "Precisely identify each learner’s study status",
    "从静态档案到动态学情": "From static records to live learning analytics",
    "为“精准教学”提供科学依据": "Evidence for precision teaching",
    "穿透式分析": "Drill-Down Analysis",
    "支持从“班级平均分”下钻至“学员个人详情”。一键查看具体答题情况，快速定位知识盲区，让辅导工作有的放矢。": "Drill from class average to individual learner detail. One click to item-level performance, rapid identification of knowledge gaps, and targeted coaching.",
    "数字化诊断": "Digital Diagnostics",
    "对学员测试情况进行深度量化分析，通过可视化图表清晰呈现各知识模块（如风湿病、心血管等）的得分差异。": "Deep quantitative analysis of assessments, with charts showing score gaps across modules (e.g., rheumatology, cardiovascular).",
    "数字化教学管理中台": "Digital Teaching Operations Platform",
    "从“经验驱动”到“数据驱动”，重构医学教育新生态": "From experience-driven to data-driven: rebuilding the medical education ecosystem",
    "教学决策的“智慧大脑”：全景洞察，精准干预": "The “intelligent brain” of teaching decisions: panoramic insight, precise intervention",
    "数据驾驶舱": "Data Cockpit",
    "功能支柱一：学情诊断": "Pillar 1: Learning Diagnostics",
    "测评数据可视化：精准定位薄弱点": "Assessment visualization: pinpoint weak spots",
    "精准干预": "Targeted Intervention",
    "自动识别并预警“未看课、未做题、未登录”等异常学员，支持时间范围筛选与周期对比，辅助开展针对性的督学回访，大幅提升管理效率。": "Auto-flag learners with no lessons, no items, or no login; filter by time and compare cycles to drive targeted academic follow-up and improve operational efficiency.",
    "可视化组卷": "Visual Paper Assembly",
    "试题信息（题干、正确率、难易度）可视化呈现，支持批量勾选与一键添加。无论是日常练习还是模拟考试，都能实现高效组卷与资料整理。": "Item metadata (stem, accuracy, difficulty) is visualized; batch-select and add in one click. Efficient assembly and materials prep for drills and mocks.",
    "精准筛选": "Precision Filters",
    "支持按ID、年份、考点、题型、难易系数等多维度标签检索，帮助教研人员从海量题库中秒级定位目标试题。": "Multi-tag search by ID, year, exam point, item type, and difficulty—faculty can locate target items in seconds.",
    "多维监控": "Multi-Dimensional Monitoring",
    "帮助班主任/管理员通过多维度数据（登录率、完课率、作业完成率）快速掌握班级整体“健康度”。": "Help class advisors/admins read class “health” via login rate, completion rate, and homework completion.",
    "功能支柱三：资源配置": "Pillar 3: Resource Allocation",
    "功能支柱二：全景督学": "Pillar 2: Panoramic Academic Supervision",
    "智能题库组卷：教研备考，高效赋能": "Smart bank assembly: empower faculty exam prep",
    "班级全景督学：异常状态，实时预警": "Class-wide supervision: real-time alerts on exceptions",
    "AI智学-水平测试": "AI Adaptive Learning — Proficiency Test",
    "可视化学习结果": "Visualized learning outcomes",
    "创新课→小昭医“声”音频课": "Innovation track → Xiao Zhao MedVoice audio course",
    "音频课特点": "Audio Course Highlights",
    "1.场景智能适配：开车自动播（驾驶模式）/ 昭昭老师按时唤醒你（定时启播）/ 睡前15分钟听（定时关闭）/ 洗漱健身也能学。": "1. Scene-aware playback: auto-play while driving (Drive Mode) / scheduled wake-up by Mr. Zhaozhao / 15-minute wind-down before sleep (auto-stop) / learn while commuting, washing, or working out.",
    "2.心/肺技能听诊：“医考听诊重灾区专项突破，保分冲刺必备。": "2. Cardiac/pulmonary auscultation: a high-risk exam skill—targeted breakthroughs for score protection in the final sprint.",
    "专业服务（10年经验+专业团队）": "Professional Services (10 years’ experience + specialist team)",
    "200万+精准用户": "2M+ precision users",
    "APP/官网174.2万": "App / website 1.742M",
    "微博36.4万": "Weibo 364K",
    "抖音52.7万": "Douyin 527K",
    "B站8万": "Bilibili 80K",
    "学员评价": "Learner Testimonials",
    "离开临床十几年": "Away from clinic for 10+ years",
    "顺利通过": "Passed successfully",
    "四年抗战": "A four-year campaign",
    "九年抗战": "A nine-year campaign",
    "72岁": "Age 72",
    "全国年龄最大考生": "Oldest candidate nationwide",
    "老年赤脚医生": "Veteran barefoot doctor",
    "来自学员真实评价，用真心换真心，帮助屡考不过的基层医生，顺利通过执业医师考试": "Real learner voices: genuine support that helps primary-care doctors who had repeatedly failed finally pass the licensing exam",
    "人生不留遗憾": "Leave no regrets",
    "昭昭医路相伴": "Zhaozhao walks the medical path with you",
    "学校合作模式": "Institution Partnership Model",
    "督学系统": "Academic Supervision System",
    "合作企业": "Corporate Partners",
    "合作协会": "Association Partners",
    "合作院校": "Academic Partners",
    "产教融合 合作共赢": "Industry–education integration, shared success",
    "各医学中心": "Medical Centers",
    "切实提高年轻医疗从业者的": "Strengthen young clinicians’",
    "上岗能力": "practice-readiness",
    "点滴而深远的改变": "and, step by step, reshape",
    "中国基层医疗的未来": "the future of primary care in China",
    "每一位年轻医者的成长，都是基层医疗力量的积累；": "Every young physician’s growth adds to the strength of primary care;",
    "每一次专业能力的提升，都在为万千家庭守护健康希望。": "every gain in professional capability safeguards hope for countless families.",
    "专业成长": "Professional Growth",
    "基层服务": "Primary-Care Service",
    "未来希望": "Hope for the Future",
    "切实提高年轻医疗从业者的上岗能力，点滴而深远的改变中国基层医疗未来!": "Strengthen young clinicians’ practice-readiness and, step by step, reshape the future of primary care in China.",
    "诚信铸就品质 创新引领未来": "Integrity Builds Quality    Innovation Leads the Future",
    "100万+": "1M+",
    "100W+": "1M+",
    "500W+": "5M+",
    "PARTNER COMPANY": "PARTNER COMPANY",
}

CHART_MAP = {
    "销售额": "Share",
    "市级医院(或同级别医疗机构)": "Municipal hospitals (or equivalent)",
    "县级医院(或同级别医疗机构)": "County hospitals (or equivalent)",
    "乡镇卫生院医院(或同级别医疗机构)": "Township health centers (or equivalent)",
    "村卫生所/私人诊所(或同级别医疗机构）": "Village clinics / private practices (or equivalent)",
    "其他不在以上分类的医疗结构": "Other healthcare facilities not listed above",
    "系列 1": "Series 1",
    "大内科": "General IM",
    "全科": "GP",
    "大外科": "Surgery",
    "其他无法分科": "Undifferentiated",
    "心内科": "Cardiology",
    "普通外科": "General surgery",
    "妇产科": "OB/GYN",
    "呼吸科": "Respiratory",
    "消化科": "GI",
    "儿科": "Pediatrics",
    "骨科": "Orthopedics",
    "胸外科": "Thoracic surgery",
    "综合医院": "General hospitals",
    "私人诊所": "Private clinics",
    "其他": "Other",
    "整形外科医": "Plastic surgery",
    "骨科医院": "Orthopedic hospitals",
    "眼科医院": "Eye hospitals",
    "康复医院": "Rehab hospitals",
    "美容医院": "Aesthetic hospitals",
    "皮肤科医院": "Dermatology hospitals",
}

unmatched: list[str] = []


def translate_paragraph_xml(block: str) -> str:
    texts = T_EL.findall(block)
    if not texts:
        return block
    concat = "".join(unescape(t[1]) for t in texts)
    key = norm(concat)
    if not key:
        return block
    if key in MAP:
        en = MAP[key]
    elif CJK.search(concat):
        unmatched.append(key)
        return block
    else:
        return block

    idx = {"n": 0}

    def repl_t(m: re.Match) -> str:
        idx["n"] += 1
        attrs = m.group(1)
        if idx["n"] == 1:
            if "xml:space" not in attrs and (en[:1].isspace() or en[-1:].isspace()):
                attrs += ' xml:space="preserve"'
            return f"<a:t{attrs}>{escape(en)}</a:t>"
        return f"<a:t{attrs}></a:t>"

    return T_EL.sub(repl_t, block)


def translate_drawing_xml(raw: str) -> str:
    return P_BLOCK.sub(lambda m: translate_paragraph_xml(m.group(0)), raw)


# ---------------------------------------------------------------------------
# Auto-fit: size English text to each shape so pages stay comfortable.
# All numbers are EMUs (914400 per inch); font size sz is 1/100 pt; 1pt=12700 EMU.
# ---------------------------------------------------------------------------
EMU_PER_PT = 12700
SP_BLOCK = re.compile(r"<p:sp>.*?</p:sp>", re.DOTALL)
XFRM_EXT = re.compile(r"<a:off [^>]*/>\s*<a:ext cx=\"(\d+)\" cy=\"(\d+)\"/>")
BODYPR = re.compile(r"<a:bodyPr\b[^>]*?(?:/>|>.*?</a:bodyPr>)", re.DOTALL)
A_P = re.compile(r"<a:p>.*?</a:p>(?![A-Za-z])|<a:p\s[^>]*>.*?</a:p>(?![A-Za-z])", re.DOTALL)
A_R = re.compile(r"<a:r>.*?</a:r>", re.DOTALL)
SZ = re.compile(r"<a:rPr[^>]*\bsz=\"(\d+)\"")
END_SZ = re.compile(r"<a:endParaRPr[^>]*\bsz=\"(\d+)\"")
RUN_T = re.compile(r"<a:t(?:\s[^>]*)?>(.*?)</a:t>(?![A-Za-z])", re.DOTALL)

DEFAULT_SZ = 1800  # 18pt when a run has no explicit size
LINE_FACTOR = 1.2  # line height as a multiple of font size
LATIN_W = 0.50     # average Latin glyph width in em
SPACE_W = 0.28
CJK_W = 1.0
MIN_SCALE = 0.50
GRP_TAG = re.compile(r"<p:grpSp>|</p:grpSp>")


def _inset(bodypr: str, attr: str, default: int) -> int:
    m = re.search(rf'\b{attr}="(-?\d+)"', bodypr)
    return int(m.group(1)) if m else default


def _char_width(ch: str, font_emu: float) -> float:
    o = ord(ch)
    if 0x4E00 <= o <= 0x9FFF or 0x3000 <= o <= 0x303F or 0xFF00 <= o <= 0xFFEF:
        return CJK_W * font_emu
    if ch == " ":
        return SPACE_W * font_emu
    return LATIN_W * font_emu


def _para_metrics(par: str) -> tuple[float, int]:
    """Return (paragraph text width in EMU, dominant font size in 1/100 pt)."""
    width = 0.0
    max_sz = 0
    for run in A_R.findall(par):
        m = SZ.search(run)
        sz = int(m.group(1)) if m else DEFAULT_SZ
        max_sz = max(max_sz, sz)
        font_emu = sz / 100.0 * EMU_PER_PT
        for tm in RUN_T.findall(run):
            for ch in unescape(tm):
                width += _char_width(ch, font_emu)
    if max_sz == 0:
        m = END_SZ.search(par)
        max_sz = int(m.group(1)) if m else DEFAULT_SZ
    return width, max_sz


def _compute_scale(sp: str) -> float | None:
    ext = XFRM_EXT.search(sp)
    if not ext:
        return None
    cx, cy = int(ext.group(1)), int(ext.group(2))
    bm = BODYPR.search(sp)
    bodypr = bm.group(0) if bm else ""
    wrap_none = 'wrap="none"' in bodypr
    l_ins = _inset(bodypr, "lIns", 91440)
    r_ins = _inset(bodypr, "rIns", 91440)
    t_ins = _inset(bodypr, "tIns", 45720)
    b_ins = _inset(bodypr, "bIns", 45720)
    avail_w = cx - l_ins - r_ins
    avail_h = cy - t_ins - b_ins
    if avail_w <= 0 or avail_h <= 0:
        return None

    total_h = 0.0
    max_w = 0.0
    has_text = False
    for par in A_P.findall(sp):
        width, sz = _para_metrics(par)
        line_h = sz / 100.0 * EMU_PER_PT * LINE_FACTOR
        if width <= 0:
            total_h += line_h  # blank line still occupies space
            continue
        has_text = True
        max_w = max(max_w, width)
        lines = 1 if wrap_none else max(1, math.ceil(width / avail_w - 1e-6))
        total_h += lines * line_h
    if not has_text:
        return None

    # Shrinking the font by s reduces both line width and line height, so the
    # total block height scales with s**2 -> needed vertical scale = sqrt(ratio).
    v_scale = math.sqrt(avail_h / total_h) if total_h > avail_h else 1.0
    # A forced single line (no wrap) is purely width-bound -> linear.
    h_scale = avail_w / max_w if (wrap_none and max_w > avail_w) else 1.0
    scale = min(1.0, v_scale, h_scale)
    return max(MIN_SCALE, scale)


def _rewrite_bodypr(bodypr: str, autofit: str) -> str:
    if "<a:spAutoFit/>" in bodypr:
        return bodypr.replace("<a:spAutoFit/>", autofit)
    if "<a:noAutofit/>" in bodypr:
        return bodypr.replace("<a:noAutofit/>", autofit)
    if re.search(r"<a:normAutofit[^>]*/>", bodypr):
        return re.sub(r"<a:normAutofit[^>]*/>", autofit, bodypr)
    if "<a:normAutofit>" in bodypr:  # rare, with children
        return re.sub(r"<a:normAutofit>.*?</a:normAutofit>", autofit, bodypr, flags=re.DOTALL)
    # no autofit element present -> insert right after the opening tag
    if bodypr.endswith("/>"):
        return bodypr[:-2] + ">" + autofit + "</a:bodyPr>"
    open_end = bodypr.index(">") + 1
    return bodypr[:open_end] + autofit + bodypr[open_end:]


def _autofit_for_scale(scale: float) -> str:
    if scale >= 0.995:
        return "<a:normAutofit/>"
    pct = int(round(scale * 100)) * 1000
    ln = 10000 if scale < 0.85 else 0
    if ln:
        return f'<a:normAutofit fontScale="{pct}" lnSpcReduction="{ln}"/>'
    return f'<a:normAutofit fontScale="{pct}"/>'


scale_hist: list[float] = []


def _process_sp(sp: str, grouped: bool = False) -> str:
    if "<p:txBody>" not in sp and "<p:txBody " not in sp:
        return sp
    # Shapes inside a group use group-local coordinates, so box-vs-font math is
    # unreliable; just enable shrink-to-fit and let PowerPoint size it on open.
    if grouped:
        autofit = "<a:normAutofit/>"
    else:
        scale = _compute_scale(sp)
        if scale is None:
            autofit = "<a:normAutofit/>"
        else:
            scale_hist.append(scale)
            autofit = _autofit_for_scale(scale)
    bm = BODYPR.search(sp)
    if not bm:
        return sp
    new_bodypr = _rewrite_bodypr(bm.group(0), autofit)
    return sp[: bm.start()] + new_bodypr + sp[bm.end():]


def _group_spans(raw: str) -> list[tuple[int, int]]:
    """Top-level <p:grpSp> extents, so we can tell if a shape is grouped."""
    spans: list[tuple[int, int]] = []
    stack: list[int] = []
    for m in GRP_TAG.finditer(raw):
        if m.group(0) == "<p:grpSp>":
            stack.append(m.start())
        elif stack:
            start = stack.pop()
            if not stack:
                spans.append((start, m.end()))
    return spans


def apply_autofit(raw: str) -> str:
    spans = _group_spans(raw)

    def in_group(pos: int) -> bool:
        return any(s <= pos < e for s, e in spans)

    # Shape text frames: fit English to the box (grouped shapes -> plain autofit).
    raw = SP_BLOCK.sub(lambda m: _process_sp(m.group(0), in_group(m.start())), raw)

    # Remaining bodyPr (e.g. table cells): enable shrink-to-fit, let PPT recompute.
    def fix_remaining(m: re.Match) -> str:
        b = m.group(0)
        if "<a:normAutofit" in b:
            return b
        if "<a:spAutoFit/>" in b or "<a:noAutofit/>" in b:
            return _rewrite_bodypr(b, "<a:normAutofit/>")
        return b

    return BODYPR.sub(fix_remaining, raw)


def translate_chart_xml(raw: str) -> str:
    def repl(m: re.Match) -> str:
        val = unescape(m.group(1))
        if val in CHART_MAP:
            return f"<c:v>{escape(CHART_MAP[val])}</c:v>"
        if CJK.search(val):
            unmatched.append("CHART:" + val)
        return m.group(0)

    return CV_EL.sub(repl, raw)


# ---------------------------------------------------------------------------
# Move the master footer slogan onto each slide as an editable text box, so it
# no longer lives on the (non-editable) master where the longer English wraps
# and collides. Removed from masters to avoid duplication. Nothing else touched.
# ---------------------------------------------------------------------------
# True  -> delete the master footer slogan everywhere (clean bottom strip).
# False -> move it onto each slide as an editable text box.
REMOVE_FOOTER = True
FOOTER_MARKER = "Strengthen young clinicians"
MASTER_RE = re.compile(r"ppt/slideMasters/slideMaster\d+\.xml$")
SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml$")
FOOTER_SP_RE = re.compile(
    r"<p:sp>(?:(?!</p:sp>).)*?" + FOOTER_MARKER + r"(?:(?!</p:sp>).)*?</p:sp>",
    re.DOTALL,
)


def _slide_to_master(z: zipfile.ZipFile) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for name in z.namelist():
        m = SLIDE_RE.match(name)
        if not m:
            continue
        srels = f"ppt/slides/_rels/slide{m.group(1)}.xml.rels"
        lay = re.search(r'Target="([^"]*slideLayout\d+\.xml)"', z.read(srels).decode("utf-8"))
        if not lay:
            continue
        layname = lay.group(1).split("/")[-1]
        lrels = f"ppt/slideLayouts/_rels/{layname}.rels"
        mas = re.search(r'Target="([^"]*slideMaster\d+\.xml)"', z.read(lrels).decode("utf-8"))
        if not mas:
            continue
        mapping[name] = "ppt/slideMasters/" + mas.group(1).split("/")[-1]
    return mapping


def _prep_footer_sp(sp: str, uid: int) -> str:
    # Drop macro metadata that references a master-only relationship (r:id).
    sp = re.sub(r"<p:custDataLst>.*?</p:custDataLst>", "", sp, flags=re.DOTALL)
    # Give it a unique shape id on the slide.
    sp = re.sub(r'(<p:cNvPr )id="\d+"', rf'\g<1>id="{uid}"', sp, count=1)
    # Shrink-to-fit so the longer English never overflows / collides.
    sp = sp.replace("<a:noAutofit/>", "<a:normAutofit/>")
    if "<a:normAutofit" not in sp:
        sp = sp.replace("<a:bodyPr", "<a:bodyPr", 1)  # no-op guard
    # Prefer English language tagging for spellcheck.
    sp = sp.replace('lang="zh-CN" altLang="en-US"', 'lang="en-US" altLang="zh-CN"')
    return sp


def move_footer_to_slides(path: Path) -> None:
    with zipfile.ZipFile(path, "r") as z:
        names = z.infolist()
        raw = {i.filename: z.read(i.filename) for i in names}
        master_footer: dict[str, str] = {}
        for fname, data in raw.items():
            if MASTER_RE.match(fname):
                txt = data.decode("utf-8")
                fm = FOOTER_SP_RE.search(txt)
                if fm:
                    master_footer[fname] = fm.group(0)
        s2m = _slide_to_master(z)

    moved = 0
    for fname in list(raw.keys()):
        if MASTER_RE.match(fname) and fname in master_footer:
            txt = raw[fname].decode("utf-8")
            raw[fname] = txt.replace(master_footer[fname], "", 1).encode("utf-8")
        elif SLIDE_RE.match(fname) and not REMOVE_FOOTER:
            master = s2m.get(fname)
            if master and master in master_footer:
                sn = int(SLIDE_RE.match(fname).group(1))
                sp = _prep_footer_sp(master_footer[master], uid=90000 + sn)
                txt = raw[fname].decode("utf-8")
                raw[fname] = txt.replace("</p:spTree>", sp + "</p:spTree>", 1).encode("utf-8")
                moved += 1

    tmp = path.with_suffix(".pptx.tmp")
    with zipfile.ZipFile(path, "r") as zin, zipfile.ZipFile(
        tmp, "w", compression=zipfile.ZIP_DEFLATED
    ) as zout:
        for info in zin.infolist():
            out = zipfile.ZipInfo(filename=info.filename, date_time=info.date_time)
            out.compress_type = info.compress_type
            out.external_attr = info.external_attr
            zout.writestr(out, raw[info.filename])
    tmp.replace(path)
    action = "footer removed from deck" if REMOVE_FOOTER else "footer moved onto slides"
    print(f"{action}: moved={moved} | masters cleaned: {len(master_footer)}")


def should_process(name: str) -> bool:
    if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
        return True
    if name.startswith("ppt/slideMasters/") and name.endswith(".xml"):
        return True
    if name == "ppt/slideLayouts/slideLayout32.xml":
        return True
    if name.startswith("ppt/charts/chart") and name.endswith(".xml"):
        return True
    return False


MAP = {norm(k): v for k, v in MAP.items()}


def main() -> None:
    if DST.exists():
        DST.unlink()
    shutil.copy2(SRC, DST)

    tmp = DST.with_suffix(".pptx.tmp")
    if tmp.exists():
        tmp.unlink()

    changed = 0
    with zipfile.ZipFile(DST, "r") as zin, zipfile.ZipFile(
        tmp, "w", compression=zipfile.ZIP_DEFLATED
    ) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if should_process(info.filename):
                raw = data.decode("utf-8")
                if "/charts/" in info.filename:
                    new = translate_chart_xml(raw)
                else:
                    new = translate_drawing_xml(raw)
                    if info.filename.startswith("ppt/slides/slide"):
                        new = apply_autofit(new)
                if new != raw:
                    data = new.encode("utf-8")
                    changed += 1
            out = zipfile.ZipInfo(filename=info.filename, date_time=info.date_time)
            out.compress_type = info.compress_type
            out.external_attr = info.external_attr
            zout.writestr(out, data)

    tmp.replace(DST)
    print("xml files rewritten:", changed)

    move_footer_to_slides(DST)

    print("output:", DST, "size_mb:", round(DST.stat().st_size / 1024 / 1024, 1))
    skip_prefix = ("单击此处", "编辑母版", "第二级", "第三级", "第四级", "第五级", "二级", "三级")
    uniq = sorted({u for u in unmatched if not u.startswith(skip_prefix)})
    print("unmatched Chinese paragraphs:", len(uniq))
    for u in uniq:
        print(" -", u[:200])

    if scale_hist:
        buckets = {"100%": 0, "85-99%": 0, "70-84%": 0, "55-69%": 0, "<55%": 0}
        for s in scale_hist:
            if s >= 0.995:
                buckets["100%"] += 1
            elif s >= 0.85:
                buckets["85-99%"] += 1
            elif s >= 0.70:
                buckets["70-84%"] += 1
            elif s >= 0.55:
                buckets["55-69%"] += 1
            else:
                buckets["<55%"] += 1
        print("autofit shapes:", len(scale_hist), "scale buckets:", buckets)


if __name__ == "__main__":
    main()
