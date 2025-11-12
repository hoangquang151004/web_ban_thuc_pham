from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline cho OrderItem trong Order admin"""
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'product_name', 'product_price', 'quantity', 'subtotal']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin cho Order"""
    list_display = [
        'order_number', 'user', 'full_name', 'phone',
        'total', 'status', 'payment_method', 'payment_status',
        'created_at'
    ]
    list_filter = ['status', 'payment_method', 'payment_status', 'created_at']
    search_fields = ['order_number', 'full_name', 'phone', 'email']
    readonly_fields = [
        'order_number', 'user', 'subtotal', 'shipping_fee', 'total',
        'created_at', 'updated_at', 'confirmed_at', 'delivered_at'
    ]
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Thông tin đơn hàng', {
            'fields': ('order_number', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Thông tin giao hàng', {
            'fields': ('full_name', 'phone', 'email', 'address', 'district', 'city', 'note')
        }),
        ('Thông tin thanh toán', {
            'fields': ('payment_method', 'payment_status', 'subtotal', 'shipping_fee', 'total')
        }),
        ('Thời gian', {
            'fields': ('confirmed_at', 'delivered_at')
        }),
    )
    
    def has_add_permission(self, request):
        return False


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin cho OrderItem"""
    list_display = ['order', 'product_name', 'product_price', 'quantity', 'subtotal']
    list_filter = ['order__status', 'created_at']
    search_fields = ['product_name', 'order__order_number']
    readonly_fields = ['order', 'product', 'product_name', 'product_price', 'quantity', 'subtotal']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
