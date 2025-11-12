from django.db import models
from django.conf import settings
from products.models import Product
from django.core.validators import MinValueValidator
from decimal import Decimal


class Order(models.Model):
    """Model đơn hàng"""
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipping', 'Đang giao hàng'),
        ('delivered', 'Đã giao hàng'),
        ('cancelled', 'Đã hủy'),
        ('returned', 'Đã trả hàng'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cod', 'Thanh toán khi nhận hàng'),
        ('vnpay', 'VNPay'),
        ('momo', 'Momo'),
        ('banking', 'Chuyển khoản ngân hàng'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Chờ thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('failed', 'Thanh toán thất bại'),
        ('refunded', 'Đã hoàn tiền'),
    ]
    
    # Thông tin người dùng
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        null=True,
        blank=True,
        verbose_name='Người dùng'
    )
    
    # Mã đơn hàng
    order_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Mã đơn hàng'
    )
    
    # Thông tin giao hàng
    full_name = models.CharField(max_length=255, verbose_name='Họ và tên')
    phone = models.CharField(max_length=15, verbose_name='Số điện thoại')
    email = models.EmailField(blank=True, verbose_name='Email')
    address = models.TextField(verbose_name='Địa chỉ')
    district = models.CharField(max_length=100, blank=True, verbose_name='Quận/Huyện')
    city = models.CharField(max_length=100, blank=True, verbose_name='Tỉnh/Thành phố')
    note = models.TextField(blank=True, verbose_name='Ghi chú')
    
    # Thông tin giá
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name='Tạm tính'
    )
    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name='Phí vận chuyển'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name='Tổng tiền'
    )
    
    # Trạng thái đơn hàng
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái'
    )
    
    # Thanh toán
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='cod',
        verbose_name='Phương thức thanh toán'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        verbose_name='Trạng thái thanh toán'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Ngày cập nhật')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày xác nhận')
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày giao hàng')
    
    class Meta:
        db_table = 'orders'
        verbose_name = 'Đơn hàng'
        verbose_name_plural = 'Đơn hàng'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"Đơn hàng #{self.order_number}"
    
    def save(self, *args, **kwargs):
        # Tự động tạo mã đơn hàng nếu chưa có
        if not self.order_number:
            import datetime
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            self.order_number = f"ORD{timestamp}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Model chi tiết đơn hàng"""
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Đơn hàng'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Sản phẩm'
    )
    product_name = models.CharField(
        max_length=255,
        verbose_name='Tên sản phẩm (snapshot)'
    )
    product_price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name='Giá sản phẩm (snapshot)'
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Số lượng'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        verbose_name='Thành tiền'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    
    class Meta:
        db_table = 'order_items'
        verbose_name = 'Chi tiết đơn hàng'
        verbose_name_plural = 'Chi tiết đơn hàng'
        ordering = ['id']
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Tự động tính subtotal
        self.subtotal = Decimal(self.product_price) * self.quantity
        super().save(*args, **kwargs)
