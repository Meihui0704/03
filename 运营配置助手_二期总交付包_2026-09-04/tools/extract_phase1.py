import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/meihui/Downloads/运营配置助手_demo最终版.html')
MODULES = {
    'coupon': '总版_优惠券配置.html',
    'shelf': '总版_商品课程上下架.html',
    'price': '总版_商品调价.html',
    'taxonomy': '总版_全部项目清单.html',
    'clinical': '总版_临床商品清单.html',
}

source = SOURCE.read_text(encoding='utf-8')
for key, filename in MODULES.items():
    match = re.search(rf'["\']?{key}["\']?\s*:\s*["\']([A-Za-z0-9+/=]+)["\']', source)
    if not match:
        raise RuntimeError(f'未找到一期模块：{key}')
    html = base64.b64decode(match.group(1)).decode('utf-8')
    html = html.replace('</body>', '<script src="总版外壳.js"></script></body>')
    (ROOT / filename).write_text(html, encoding='utf-8')
    print(f'generated {filename}')
