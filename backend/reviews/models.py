from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Product
from orders.models import Order


class Review(models.Model):
    """Model đánh giá sản phẩm"""
    
    # Thông tin người đánh giá
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Người đánh giá'
    )
    
    # Sản phẩm được đánh giá
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Sản phẩm'
    )
    
    # Đơn hàng liên quan (để verify người mua)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='reviews',
        null=True,
        blank=True,
        verbose_name='Đơn hàng'
    )
    
    # Nội dung đánh giá
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Đánh giá (1-5 sao)'
    )
    
    comment = models.TextField(
        verbose_name='Nhận xét',
        help_text='Chia sẻ trải nghiệm của bạn về sản phẩm'
    )
    
    # Hình ảnh đánh giá (tùy chọn)
    images = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Hình ảnh đánh giá'
    )
    
    # Trạng thái
    is_verified_purchase = models.BooleanField(
        default=False,
        verbose_name='Đã xác minh mua hàng'
    )
    
    is_approved = models.BooleanField(
        default=True,
        verbose_name='Đã duyệt'
    )
    
    # Tương tác
    helpful_count = models.IntegerField(
        default=0,
        verbose_name='Số lượt hữu ích'
    )
    
    # Phản hồi từ shop
    reply = models.TextField(
        blank=True,
        verbose_name='Phản hồi từ shop'
    )
    
    reply_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Ngày phản hồi'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Ngày tạo'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật'
    )
    
    class Meta:
        db_table = 'reviews'
        verbose_name = 'Đánh giá'
        verbose_name_plural = 'Đánh giá'
        ordering = ['-created_at']
        unique_together = ['user', 'product', 'order']
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.rating}⭐)"
    
    def save(self, *args, **kwargs):
        # Auto-verify if has order
        if self.order and self.order.user == self.user:
            self.is_verified_purchase = True
        super().save(*args, **kwargs)
        
        # Update product rating
        self.update_product_rating()
    
    def update_product_rating(self):
        """Cập nhật rating trung bình của sản phẩm"""
        from django.db.models import Avg, Count
        
        stats = Review.objects.filter(
            product=self.product,
            is_approved=True
        ).aggregate(
            avg_rating=Avg('rating'),
            count=Count('id')
        )
        
        self.product.rating = round(stats['avg_rating'] or 0, 1)
        self.product.reviews_count = stats['count'] or 0
        self.product.save(update_fields=['rating', 'reviews_count'])
