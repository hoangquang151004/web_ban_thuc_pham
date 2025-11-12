from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'product', 'rating',
        'is_verified_purchase', 'is_approved',
        'created_at'
    ]
    list_filter = [
        'rating', 'is_verified_purchase',
        'is_approved', 'created_at'
    ]
    search_fields = [
        'user__email', 'user__full_name',
        'product__name', 'comment'
    ]
    readonly_fields = [
        'created_at', 'updated_at',
        'is_verified_purchase'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('user', 'product', 'order', 'rating', 'comment')
        }),
        ('Hình ảnh', {
            'fields': ('images',)
        }),
        ('Trạng thái', {
            'fields': ('is_verified_purchase', 'is_approved', 'helpful_count')
        }),
        ('Phản hồi', {
            'fields': ('reply', 'reply_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
