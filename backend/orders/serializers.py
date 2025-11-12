from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer cho OrderItem"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_price',
            'quantity', 'subtotal', 'created_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at']


class OrderItemCreateSerializer(serializers.Serializer):
    """Serializer cho việc tạo OrderItem"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    """Serializer cho Order (read)"""
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user',
            'full_name', 'phone', 'email', 'address', 'district', 'city', 'note',
            'subtotal', 'shipping_fee', 'total',
            'status', 'status_display',
            'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display',
            'items',
            'created_at', 'updated_at', 'confirmed_at', 'delivered_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'subtotal', 'total',
            'created_at', 'updated_at', 'confirmed_at', 'delivered_at'
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Serializer cho việc tạo đơn hàng"""
    # Thông tin giao hàng
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=15)
    email = serializers.EmailField(required=False, allow_blank=True)
    address = serializers.CharField()
    district = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    
    # Thông tin thanh toán
    payment_method = serializers.ChoiceField(
        choices=['cod', 'vnpay', 'momo', 'banking'],
        default='cod'
    )
    
    # Danh sách sản phẩm
    items = OrderItemCreateSerializer(many=True)
    
    def validate_items(self, items):
        """Validate items"""
        if not items:
            raise serializers.ValidationError("Đơn hàng phải có ít nhất một sản phẩm")
        return items
    
    def validate(self, data):
        """Validate dữ liệu đơn hàng"""
        # Kiểm tra tồn kho cho từng sản phẩm
        for item in data['items']:
            try:
                product = Product.objects.get(id=item['product_id'], status='active')
                
                if product.stock < item['quantity']:
                    raise serializers.ValidationError(
                        f"Sản phẩm '{product.name}' chỉ còn {product.stock} {product.unit} trong kho"
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Sản phẩm với ID {item['product_id']} không tồn tại hoặc đã ngừng bán"
                )
        
        return data
    
    def create(self, validated_data):
        """Tạo đơn hàng mới"""
        from decimal import Decimal
        from django.db import transaction
        
        items_data = validated_data.pop('items')
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        
        with transaction.atomic():
            # Tính toán giá
            subtotal = Decimal('0')
            order_items = []
            
            for item_data in items_data:
                product = Product.objects.select_for_update().get(id=item_data['product_id'])
                
                # Kiểm tra lại tồn kho
                if product.stock < item_data['quantity']:
                    raise serializers.ValidationError(
                        f"Sản phẩm '{product.name}' không đủ số lượng trong kho"
                    )
                
                item_subtotal = product.price * item_data['quantity']
                subtotal += item_subtotal
                
                order_items.append({
                    'product': product,
                    'product_name': product.name,
                    'product_price': product.price,
                    'quantity': item_data['quantity'],
                    'subtotal': item_subtotal
                })
            
            # Tính phí vận chuyển (miễn phí nếu đơn hàng >= 500k)
            shipping_fee = Decimal('0') if subtotal >= Decimal('500000') else Decimal('30000')
            total = subtotal + shipping_fee
            
            # Tạo đơn hàng
            order = Order.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                phone=validated_data['phone'],
                email=validated_data.get('email', ''),
                address=validated_data['address'],
                district=validated_data.get('district', ''),
                city=validated_data.get('city', ''),
                note=validated_data.get('note', ''),
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                total=total,
                payment_method=validated_data.get('payment_method', 'cod'),
                payment_status='pending' if validated_data.get('payment_method', 'cod') != 'cod' else 'pending',
                status='pending'
            )
            
            # Tạo các OrderItem và cập nhật kho
            for item_data in order_items:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    product_name=item_data['product_name'],
                    product_price=item_data['product_price'],
                    quantity=item_data['quantity'],
                    subtotal=item_data['subtotal']
                )
                
                # Giảm số lượng tồn kho và tăng số lượng đã bán
                product = item_data['product']
                product.stock -= item_data['quantity']
                product.sold_count += item_data['quantity']
                product.save()
            
            return order


class OrderUpdateStatusSerializer(serializers.Serializer):
    """Serializer cho việc cập nhật trạng thái đơn hàng"""
    status = serializers.ChoiceField(
        choices=['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned']
    )
    
    def validate_status(self, value):
        """Validate trạng thái"""
        order = self.context.get('order')
        current_status = order.status
        
        # Định nghĩa các chuyển trạng thái hợp lệ
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipping', 'cancelled'],
            'shipping': ['delivered', 'returned'],
            'delivered': [],
            'cancelled': [],
            'returned': []
        }
        
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Không thể chuyển từ trạng thái '{current_status}' sang '{value}'"
            )
        
        return value
    
    def update(self, instance, validated_data):
        """Cập nhật trạng thái đơn hàng"""
        from django.utils import timezone
        from django.db import transaction
        
        new_status = validated_data['status']
        
        with transaction.atomic():
            instance.status = new_status
            
            # Cập nhật các timestamp tương ứng
            if new_status == 'confirmed':
                instance.confirmed_at = timezone.now()
            elif new_status == 'delivered':
                instance.delivered_at = timezone.now()
                instance.payment_status = 'paid'  # Đánh dấu đã thanh toán khi giao hàng thành công
            elif new_status == 'cancelled':
                # Hoàn lại số lượng tồn kho
                for item in instance.items.all():
                    product = item.product
                    product.stock += item.quantity
                    product.sold_count -= item.quantity
                    product.save()
            
            instance.save()
        
        return instance
