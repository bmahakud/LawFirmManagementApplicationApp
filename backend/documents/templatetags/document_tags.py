from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter
def get_range(value):
    return range(int(value))

@register.filter
def l_get_range(value):
    # For columns
    return range(len(value))

@register.filter
def add_str(arg1, arg2):
    return str(arg1) + str(arg2)
