from django import template

register = template.Library()

@register.filter(name='split')
def split(value, arg):
    """
    Splits a string by the given delimiter and returns a list.
    Usage: {{ value|split:'delimiter' }}
    """
    return value.split(arg)