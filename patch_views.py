import os

filepath = '/Users/diracai/Desktop/Projects DiracAI/AntLegal/LawFirmManagementApplicationApp/backend/documents/views.py'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    r"""new_title = re.sub(r'Page (\d+)', lambda m: f"Page {remap_page(int(m.group(1)))}", title)""",
    r"""new_title = re.sub(r'(?i)(page)\s*(\d+)', lambda m: f"{m.group(1)} {remap_page(int(m.group(2)))}", title)"""
)

content = content.replace(
    r"""if text and '[Picture Excerpt - Page' in text:
                                new_text = re.sub(r'\[Picture Excerpt - Page (\d+)\]', lambda m: f"[Picture Excerpt - Page {remap_page(int(m.group(1)))}]", text)""",
    r"""if text and re.search(r'\[Picture Excerpt\s*-\s*Page', text, re.IGNORECASE):
                                new_text = re.sub(r'(?i)(\[Picture Excerpt\s*-\s*Page)\s*(\d+)(\])', lambda m: f"{m.group(1)} {remap_page(int(m.group(2)))}{m.group(3)}", text)"""
)

with open(filepath, 'w') as f:
    f.write(content)

