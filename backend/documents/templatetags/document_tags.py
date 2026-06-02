from django import template
from django.utils.safestring import mark_safe
import re

register = template.Library()

@register.filter
def get_item(dictionary, key):
    if not dictionary: return ""
    if not isinstance(dictionary, dict): return ""
    return dictionary.get(key, "")

@register.filter
def get_at(list_obj, index):
    try:
        return list_obj[int(index)]
    except (IndexError, TypeError, ValueError):
        return ""

@register.filter
def get_range(value):
    try:
        return range(int(value))
    except (TypeError, ValueError):
        return range(0)

@register.filter
def multiply(value, arg):
    try:
        return float(value) * float(arg)
    except (TypeError, ValueError):
        return 0

@register.filter
def add_str(arg1, arg2):
    return str(arg1) + str(arg2)

@register.filter
def get_char_field(values, field_name):
    if not isinstance(values, dict): return ""
    return values.get(field_name, "")

@register.filter
def get_item_at(value, index):
    if not value or index >= len(value):
        return ""
    return value[index]

@register.simple_tag
def get_dynamic_cell_val(values, field_name, row_index):
    if not isinstance(values, dict): return ""
    # Try array lookup first
    val = values.get(field_name, [])
    if isinstance(val, list) and row_index < len(val):
        return val[row_index]
    # Try indexed key lookup (e.g. date_0)
    indexed_key = f"{field_name}_{row_index}"
    return values.get(indexed_key, "")

@register.simple_tag
def resolve_pdf_content(content, values):
    if not content: return ""
    if not isinstance(values, dict):
        # If values is not a dict (e.g. SafeString error), just return content as is
        return content
        
    # 0. Sanitize (Replace smart quotes/chars that break encoding)
    sanitized = str(content)
    replacements = {
        '\u2018': "'", '\u2019': "'", 
        '\u201c': '"', '\u201d': '"',
        '\u2013': '-', '\u2014': '-'
    }
    for char, replacement in replacements.items():
        sanitized = sanitized.replace(char, replacement)
    
    # 1. Resolve {fields}
    def replace_field(match):
        field_name = match.group(1)
        val = values.get(field_name, "")
        return f'<b><u>{val}</u></b>' if val else "__________"
    
    resolved = re.sub(r'\{([^}]+)\}', replace_field, sanitized)
    
    # 2. Resolve **bold**
    resolved = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', resolved)
    
    # 3. Resolve __underline__
    resolved = re.sub(r'__([^_]+)__', r'<u>\1</u>', resolved)
    
    return mark_safe(resolved)

@register.simple_tag
def check_pdf_signature(section_or_content, values, form):
    content = ""
    if isinstance(section_or_content, dict):
        content = section_or_content.get('content', '').lower()
    else:
        content = str(section_or_content).lower()
        
    is_sig = any(kw in content for kw in ['signature', 'hand of', 'yours faithfully'])
    if not is_sig:
        return None
        
    is_adv = any(kw in content for kw in ['advocate', 'counsel', 'mediator'])
    is_cli = any(kw in content for kw in ['client', 'deponent', 'party', 'applicant'])
    
    if is_adv and form.advocate_signature_image:
        return form.advocate_signature_image.path
    if is_cli and form.client_signature_image:
        return form.client_signature_image.path
        
    return None

@register.simple_tag
def detect_sig_type(content):
    content = str(content).lower()
    if any(kw in content for kw in ['advocate', 'counsel', 'mediator']):
        return 'advocate'
    if any(kw in content for kw in ['client', 'deponent', 'party', 'applicant']):
        return 'client'
    return 'other'
